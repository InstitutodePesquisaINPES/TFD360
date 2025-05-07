const ViagemInstitucional = require('../models/viagem-institucional.model');
const Servidor = require('../models/servidor.model');
const Veiculo = require('../models/veiculo.model');
const Motorista = require('../models/motorista.model');
const { createError } = require('../utils/error.util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

/**
 * Controlador para Viagens Institucionais
 * Permite gerenciar viagens administrativas da prefeitura
 */
class ViagemInstitucionalController {
  /**
   * Lista viagens institucionais com filtros
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async listarViagens(req, res, next) {
    try {
      const {
        data_inicio, 
        data_fim, 
        status, 
        veiculo, 
        motorista, 
        departamento,
        tipo_viagem
      } = req.query;
      
      // Construir filtro base
      let filtro = {
        prefeitura: req.usuario.prefeitura
      };
      
      // Filtrar por data
      if (data_inicio || data_fim) {
        filtro.data_viagem = {};
        
        if (data_inicio) {
          const dataInicio = new Date(data_inicio);
          dataInicio.setHours(0, 0, 0, 0);
          filtro.data_viagem.$gte = dataInicio;
        }
        
        if (data_fim) {
          const dataFim = new Date(data_fim);
          dataFim.setHours(23, 59, 59, 999);
          filtro.data_viagem.$lte = dataFim;
        }
      }
      
      // Filtrar por status
      if (status) {
        if (Array.isArray(status)) {
          filtro.status = { $in: status };
        } else {
          filtro.status = status;
        }
      }
      
      // Filtrar por veículo
      if (veiculo) {
        filtro.veiculo = veiculo;
      }
      
      // Filtrar por motorista
      if (motorista) {
        filtro.motorista = motorista;
      }
      
      // Filtrar por departamento
      if (departamento) {
        filtro.departamento = departamento;
      }
      
      // Filtrar por tipo de viagem
      if (tipo_viagem) {
        filtro.tipo_viagem = tipo_viagem;
      }
      
      // Executar consulta com paginação
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Buscar viagens com populate
      const viagens = await ViagemInstitucional.find(filtro)
        .sort({ data_viagem: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('veiculo', 'placa modelo marca')
        .populate('motorista', 'nome cpf cnh telefone')
        .populate('departamento', 'nome sigla')
        .populate('autorizador', 'nome cargo');
      
      // Contar total de registros para paginação
      const total = await ViagemInstitucional.countDocuments(filtro);
      
      res.status(200).json({
        data: viagens,
        paginacao: {
          total,
          pagina_atual: page,
          total_paginas: Math.ceil(total / limit),
          registros_por_pagina: limit
        }
      });
    } catch (err) {
      next(createError(500, 'Erro ao listar viagens institucionais: ' + err.message));
    }
  }
  
  /**
   * Busca uma viagem institucional por ID
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async obterViagemPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem com todos os detalhes
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      })
        .populate('veiculo', 'placa modelo marca ano capacidade_passageiros')
        .populate('motorista', 'nome cpf cnh telefone email')
        .populate('departamento', 'nome sigla')
        .populate('autorizador', 'nome cargo email')
        .populate('passageiros.servidor', 'nome cargo cpf email telefone')
        .populate('usuario_cadastro', 'nome email')
        .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      res.status(200).json(viagem);
    } catch (err) {
      next(createError(500, 'Erro ao buscar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Cria uma nova viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async criarViagem(req, res, next) {
    try {
      const dadosViagem = {
        ...req.body,
        prefeitura: req.usuario.prefeitura,
        usuario_cadastro: req.usuario._id,
        usuario_ultima_atualizacao: req.usuario._id
      };
      
      // Verificar disponibilidade de veículo e motorista
      const disponibilidade = await ViagemInstitucional.verificarDisponibilidade(dadosViagem);
      
      if (!disponibilidade.disponivel) {
        return next(createError(400, disponibilidade.mensagem));
      }
      
      // Criar viagem
      const viagem = new ViagemInstitucional(dadosViagem);
      await viagem.save();
      
      res.status(201).json({
        mensagem: 'Viagem institucional criada com sucesso',
        viagem: viagem
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return next(createError(400, 'Erro de validação: ' + err.message));
      }
      next(createError(500, 'Erro ao criar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Atualiza uma viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async atualizarViagem(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem existente
      const viagemExistente = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagemExistente) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      // Verificar se a viagem pode ser atualizada
      if (['concluida', 'cancelada'].includes(viagemExistente.status)) {
        return next(createError(400, `Não é possível atualizar uma viagem ${viagemExistente.status}`));
      }
      
      // Se estiver alterando veículo ou motorista, verificar disponibilidade
      if (
        (req.body.veiculo && req.body.veiculo.toString() !== viagemExistente.veiculo.toString()) ||
        (req.body.motorista && req.body.motorista.toString() !== viagemExistente.motorista.toString()) ||
        (req.body.data_viagem && new Date(req.body.data_viagem).toDateString() !== new Date(viagemExistente.data_viagem).toDateString())
      ) {
        const dadosParaVerificar = {
          data_viagem: req.body.data_viagem || viagemExistente.data_viagem,
          veiculo: req.body.veiculo || viagemExistente.veiculo,
          motorista: req.body.motorista || viagemExistente.motorista
        };
        
        const disponibilidade = await ViagemInstitucional.verificarDisponibilidade(dadosParaVerificar, id);
        
        if (!disponibilidade.disponivel) {
          return next(createError(400, disponibilidade.mensagem));
        }
      }
      
      // Preparar dados para atualização
      const dadosAtualizacao = {
        ...req.body,
        usuario_ultima_atualizacao: req.usuario._id
      };
      
      // Remover campos que não devem ser atualizados diretamente
      delete dadosAtualizacao.passageiros;
      delete dadosAtualizacao.documentos;
      delete dadosAtualizacao.prefeitura;
      delete dadosAtualizacao.usuario_cadastro;
      delete dadosAtualizacao.created_at;
      delete dadosAtualizacao.updated_at;
      
      // Atualizar viagem
      const viagemAtualizada = await ViagemInstitucional.findByIdAndUpdate(
        id,
        { $set: dadosAtualizacao },
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        mensagem: 'Viagem institucional atualizada com sucesso',
        viagem: viagemAtualizada
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return next(createError(400, 'Erro de validação: ' + err.message));
      }
      next(createError(500, 'Erro ao atualizar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Cancela uma viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async cancelarViagem(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo_cancelamento } = req.body;
      
      // Validar dados de entrada
      if (!motivo_cancelamento) {
        return next(createError(400, 'Motivo do cancelamento é obrigatório'));
      }
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem existente
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        // Usar método do modelo para cancelar
        await viagem.cancelar(motivo_cancelamento);
        
        res.status(200).json({
          mensagem: 'Viagem institucional cancelada com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao cancelar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Autoriza uma viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async autorizarViagem(req, res, next) {
    try {
      const { id } = req.params;
      const { observacao } = req.body;
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem existente
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        // Usar método do modelo para autorizar
        await viagem.autorizar(req.usuario._id, observacao);
        
        res.status(200).json({
          mensagem: 'Viagem institucional autorizada com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao autorizar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Inicia uma viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async iniciarViagem(req, res, next) {
    try {
      const { id } = req.params;
      const { km_inicial, observacao } = req.body;
      
      // Validar dados
      if (!km_inicial || isNaN(km_inicial) || km_inicial < 0) {
        return next(createError(400, 'Quilometragem inicial deve ser um número válido maior que zero'));
      }
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem existente
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        // Usar método do modelo para iniciar viagem
        await viagem.iniciarViagem(km_inicial, observacao);
        
        res.status(200).json({
          mensagem: 'Viagem institucional iniciada com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao iniciar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Finaliza uma viagem institucional
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async finalizarViagem(req, res, next) {
    try {
      const { id } = req.params;
      const { km_final, consumo_combustivel, observacao } = req.body;
      
      // Validar dados
      if (!km_final || isNaN(km_final) || km_final <= 0) {
        return next(createError(400, 'Quilometragem final deve ser um número válido maior que zero'));
      }
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Buscar viagem existente
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        // Usar método do modelo para finalizar viagem
        await viagem.finalizarViagem(km_final, consumo_combustivel, observacao);
        
        res.status(200).json({
          mensagem: 'Viagem institucional finalizada com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao finalizar viagem institucional: ' + err.message));
    }
  }
  
  /**
   * Adiciona passageiro à viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async adicionarPassageiro(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Validar dados
      if (!req.body.servidor || !ObjectId.isValid(req.body.servidor)) {
        return next(createError(400, 'ID do servidor é obrigatório'));
      }
      
      // Verificar se o servidor existe
      const servidor = await Servidor.findOne({
        _id: req.body.servidor,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!servidor) {
        return next(createError(404, 'Servidor não encontrado'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        await viagem.adicionarPassageiro(req.body);
        
        res.status(200).json({
          mensagem: 'Passageiro adicionado com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao adicionar passageiro: ' + err.message));
    }
  }
  
  /**
   * Remove passageiro da viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async removerPassageiro(req, res, next) {
    try {
      const { id, servidorId } = req.params;
      
      // Validar IDs
      if (!ObjectId.isValid(id) || !ObjectId.isValid(servidorId)) {
        return next(createError(400, 'IDs inválidos'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        await viagem.removerPassageiro(servidorId);
        
        res.status(200).json({
          mensagem: 'Passageiro removido com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao remover passageiro: ' + err.message));
    }
  }
  
  /**
   * Registra presença de passageiro na viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async registrarPresencaPassageiro(req, res, next) {
    try {
      const { id, servidorId } = req.params;
      const { presente } = req.body;
      
      // Validar IDs
      if (!ObjectId.isValid(id) || !ObjectId.isValid(servidorId)) {
        return next(createError(400, 'IDs inválidos'));
      }
      
      // Validar dados
      if (presente === undefined) {
        return next(createError(400, 'Status de presença é obrigatório'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        const passageiro = await viagem.registrarPresencaPassageiro(servidorId, presente);
        
        res.status(200).json({
          mensagem: `Presença ${presente ? 'confirmada' : 'desmarcada'} com sucesso`,
          passageiro
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao registrar presença: ' + err.message));
    }
  }
  
  /**
   * Adiciona documento à viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async adicionarDocumento(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!ObjectId.isValid(id)) {
        return next(createError(400, 'ID da viagem inválido'));
      }
      
      // Validar dados
      if (!req.body.descricao) {
        return next(createError(400, 'Descrição do documento é obrigatória'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        await viagem.adicionarDocumento(req.body);
        
        res.status(200).json({
          mensagem: 'Documento adicionado com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao adicionar documento: ' + err.message));
    }
  }
  
  /**
   * Remove documento da viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async removerDocumento(req, res, next) {
    try {
      const { id, documentoId } = req.params;
      
      // Validar IDs
      if (!ObjectId.isValid(id) || !ObjectId.isValid(documentoId)) {
        return next(createError(400, 'IDs inválidos'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        await viagem.removerDocumento(documentoId);
        
        res.status(200).json({
          mensagem: 'Documento removido com sucesso',
          viagem
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao remover documento: ' + err.message));
    }
  }
  
  /**
   * Registra entrega de documento
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async registrarEntregaDocumento(req, res, next) {
    try {
      const { id, documentoId } = req.params;
      const { assinatura } = req.body;
      
      // Validar IDs
      if (!ObjectId.isValid(id) || !ObjectId.isValid(documentoId)) {
        return next(createError(400, 'IDs inválidos'));
      }
      
      // Validar dados
      if (!assinatura) {
        return next(createError(400, 'Assinatura de recebimento é obrigatória'));
      }
      
      // Buscar viagem
      const viagem = await ViagemInstitucional.findOne({
        _id: id,
        prefeitura: req.usuario.prefeitura
      });
      
      if (!viagem) {
        return next(createError(404, 'Viagem institucional não encontrada'));
      }
      
      try {
        const documento = await viagem.registrarEntregaDocumento(documentoId, assinatura);
        
        res.status(200).json({
          mensagem: 'Entrega de documento registrada com sucesso',
          documento
        });
      } catch (erro) {
        return next(createError(400, erro.message));
      }
    } catch (err) {
      next(createError(500, 'Erro ao registrar entrega de documento: ' + err.message));
    }
  }
  
  /**
   * Verifica disponibilidade de veículo e motorista para uma data
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async verificarDisponibilidade(req, res, next) {
    try {
      const { data_viagem, veiculo, motorista, viagem_id } = req.body;
      
      // Validar dados obrigatórios
      if (!data_viagem) {
        return next(createError(400, 'Data da viagem é obrigatória'));
      }
      
      if (!veiculo || !ObjectId.isValid(veiculo)) {
        return next(createError(400, 'Veículo é obrigatório'));
      }
      
      if (!motorista || !ObjectId.isValid(motorista)) {
        return next(createError(400, 'Motorista é obrigatório'));
      }
      
      // Verificar disponibilidade
      const disponibilidade = await ViagemInstitucional.verificarDisponibilidade({
        data_viagem,
        veiculo,
        motorista
      }, viagem_id);
      
      res.status(200).json(disponibilidade);
    } catch (err) {
      next(createError(500, 'Erro ao verificar disponibilidade: ' + err.message));
    }
  }
}

module.exports = new ViagemInstitucionalController(); 