const Motorista = require('../models/motorista.model');
const Ocorrencia = require('../models/ocorrencia.model');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { APIError } = require('../utils/errors');

/**
 * Controlador para gerenciamento de motoristas
 */
class MotoristaController {
  /**
   * Lista todos os motoristas da prefeitura
   */
  async listarMotoristas(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      const filtros = { prefeitura: prefeitura_id };
      
      // Aplicar filtros adicionais se fornecidos
      if (req.query.status) {
        filtros.status = req.query.status;
      }
      
      if (req.query.categoria_cnh) {
        filtros.categoria_cnh = req.query.categoria_cnh;
      }
      
      // Filtro para CNH vencida ou vencendo
      if (req.query.cnh_vencida === 'true') {
        filtros.validade_cnh = { $lt: new Date() };
      } else if (req.query.cnh_vencendo === 'true') {
        const hoje = new Date();
        const trintaDias = new Date();
        trintaDias.setDate(hoje.getDate() + 30);
        
        filtros.validade_cnh = { $gte: hoje, $lt: trintaDias };
      }
      
      // Ordenação
      let ordenacao = { nome: 1 };
      if (req.query.ordenar_por) {
        ordenacao = { [req.query.ordenar_por]: req.query.ordem === 'desc' ? -1 : 1 };
      }
      
      const motoristas = await Motorista.find(filtros)
        .sort(ordenacao)
        .populate('usuario_cadastro', 'nome email')
        .populate('usuario_ultima_atualizacao', 'nome email');
      
      return res.status(200).json({
        success: true,
        quantidade: motoristas.length,
        motoristas
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtém detalhes de um motorista específico
   */
  async obterMotorista(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      })
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Carregar ocorrências recentes
      const ocorrencias = await Ocorrencia.find({
        motorista: motorista._id
      })
      .sort({ data: -1 })
      .limit(5);
      
      // Carregar viagens recentes (assumindo que existe model de Viagem)
      let viagensRecentes = [];
      try {
        const Viagem = mongoose.model('Viagem');
        viagensRecentes = await Viagem.find({
          motorista: motorista._id
        })
        .sort({ data_viagem: -1 })
        .limit(5)
        .select('data_viagem destino status veiculo');
      } catch (err) {
        console.log('Modelo Viagem não disponível ou erro ao carregar viagens');
      }
      
      return res.status(200).json({
        success: true,
        motorista,
        ocorrencias,
        viagensRecentes
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cadastra um novo motorista
   */
  async cadastrarMotorista(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      // Verificar se já existe motorista com o mesmo CPF
      const motoristaExistente = await Motorista.findOne({
        cpf: req.body.cpf.replace(/\D/g, ''),
        prefeitura: prefeitura_id
      });
      
      if (motoristaExistente) {
        throw new APIError('Já existe um motorista cadastrado com este CPF', 400);
      }
      
      // Processar upload de imagem se existir
      let foto_url = null;
      if (req.file) {
        // Salvar caminho relativo da imagem
        foto_url = `/uploads/motoristas/${req.file.filename}`;
      }
      
      // Verificar se a CNH está válida
      const hoje = new Date();
      const validade_cnh = new Date(req.body.validade_cnh);
      
      let status = req.body.status || 'ativo';
      if (validade_cnh < hoje) {
        status = 'cnh_vencida';
      }
      
      const novoMotorista = new Motorista({
        ...req.body,
        cpf: req.body.cpf.replace(/\D/g, ''),  // Remover formatação do CPF
        prefeitura: prefeitura_id,
        usuario_cadastro: usuario_id,
        usuario_ultima_atualizacao: usuario_id,
        foto_url,
        status
      });
      
      await novoMotorista.save();
      
      return res.status(201).json({
        success: true,
        mensagem: 'Motorista cadastrado com sucesso',
        motorista: novoMotorista
      });
    } catch (error) {
      // Se ocorreu erro e foi feito upload de arquivo, remover
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao remover arquivo após falha no cadastro:', err);
        });
      }
      next(error);
    }
  }
  
  /**
   * Atualiza informações de um motorista
   */
  async atualizarMotorista(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Verificar se está atualizando o CPF e se já existe
      if (req.body.cpf && req.body.cpf.replace(/\D/g, '') !== motorista.cpf) {
        const cpfExistente = await Motorista.findOne({
          cpf: req.body.cpf.replace(/\D/g, ''),
          prefeitura: prefeitura_id,
          _id: { $ne: id }
        });
        
        if (cpfExistente) {
          throw new APIError('Já existe outro motorista cadastrado com este CPF', 400);
        }
      }
      
      // Processar upload de imagem se existir
      let foto_url = motorista.foto_url;
      if (req.file) {
        // Remover foto anterior se existir
        if (motorista.foto_url) {
          const fotoAnteriorPath = path.join(__dirname, '..', 'public', motorista.foto_url);
          fs.unlink(fotoAnteriorPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Erro ao remover foto anterior:', err);
            }
          });
        }
        
        // Salvar caminho relativo da nova imagem
        foto_url = `/uploads/motoristas/${req.file.filename}`;
      }
      
      // Verificar status da CNH
      let status = req.body.status || motorista.status;
      
      if (req.body.validade_cnh) {
        const hoje = new Date();
        const validade_cnh = new Date(req.body.validade_cnh);
        
        if (validade_cnh < hoje) {
          status = 'cnh_vencida';
        } else if (status === 'cnh_vencida') {
          // Se a CNH foi renovada, restaurar status anterior ou definir como ativo
          status = 'ativo';
        }
      }
      
      // Atualizar motorista
      const dadosAtualizados = {
        ...req.body,
        usuario_ultima_atualizacao: usuario_id,
        foto_url,
        status
      };
      
      if (req.body.cpf) {
        dadosAtualizados.cpf = req.body.cpf.replace(/\D/g, '');
      }
      
      const motoristaAtualizado = await Motorista.findByIdAndUpdate(
        id,
        { $set: dadosAtualizados },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        mensagem: 'Motorista atualizado com sucesso',
        motorista: motoristaAtualizado
      });
    } catch (error) {
      // Se ocorreu erro e foi feito upload de arquivo, remover
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao remover arquivo após falha na atualização:', err);
        });
      }
      next(error);
    }
  }
  
  /**
   * Altera o status de um motorista
   */
  async alterarStatusMotorista(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      const { status, motivo_inatividade, data_inicio_inatividade, data_fim_inatividade } = req.body;
      
      if (!status || !['ativo', 'ferias', 'licenca', 'inativo'].includes(status)) {
        throw new APIError('Status inválido', 400);
      }
      
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Verificar se CNH está vencida
      const hoje = new Date();
      if (motorista.validade_cnh < hoje) {
        return res.status(400).json({
          success: false,
          mensagem: 'Não é possível alterar o status para ativo enquanto a CNH estiver vencida'
        });
      }
      
      // Atualizar motorista
      const atualizacoes = {
        status,
        usuario_ultima_atualizacao: usuario_id
      };
      
      // Se for inativação, registrar motivo e datas
      if (status !== 'ativo') {
        if (!motivo_inatividade) {
          throw new APIError('Motivo da inatividade é obrigatório', 400);
        }
        
        atualizacoes.motivo_inatividade = motivo_inatividade;
        
        if (data_inicio_inatividade) {
          atualizacoes.data_inicio_inatividade = data_inicio_inatividade;
        } else {
          atualizacoes.data_inicio_inatividade = new Date();
        }
        
        if (data_fim_inatividade) {
          atualizacoes.data_fim_inatividade = data_fim_inatividade;
        }
        
        // Adicionar observação
        atualizacoes.observacoes = (motorista.observacoes || '') + 
          `\n[${new Date().toLocaleString()}] Motorista alterado para ${status}: ${motivo_inatividade}`;
      } else {
        // Se está reativando, limpar dados de inatividade
        atualizacoes.motivo_inatividade = null;
        atualizacoes.data_inicio_inatividade = null;
        atualizacoes.data_fim_inatividade = null;
        
        // Adicionar observação
        atualizacoes.observacoes = (motorista.observacoes || '') + 
          `\n[${new Date().toLocaleString()}] Motorista reativado`;
      }
      
      const motoristaAtualizado = await Motorista.findByIdAndUpdate(
        id,
        { $set: atualizacoes },
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        mensagem: `Status do motorista alterado para ${status} com sucesso`,
        motorista: motoristaAtualizado
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Registra ocorrência para o motorista
   */
  async registrarOcorrencia(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Criar registro de ocorrência
      const novaOcorrencia = new Ocorrencia({
        motorista: id,
        prefeitura: prefeitura_id,
        tipo_ocorrencia: req.body.tipo_ocorrencia,
        descricao: req.body.descricao,
        data: req.body.data || new Date(),
        gravidade: req.body.gravidade || 'media',
        viagem: req.body.viagem,
        local: req.body.local,
        medidas_tomadas: req.body.medidas_tomadas,
        usuario_registro: usuario_id
      });
      
      await novaOcorrencia.save();
      
      // Se for ocorrência grave, adicionar observação no motorista
      if (req.body.gravidade === 'grave') {
        const observacao = `\n[${new Date().toLocaleString()}] Ocorrência grave registrada: ${req.body.descricao}`;
        
        await Motorista.findByIdAndUpdate(
          id,
          { 
            $set: { 
              observacoes: (motorista.observacoes || '') + observacao,
              usuario_ultima_atualizacao: usuario_id
            } 
          }
        );
      }
      
      return res.status(201).json({
        success: true,
        mensagem: 'Ocorrência registrada com sucesso',
        ocorrencia: novaOcorrencia
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lista o histórico de ocorrências de um motorista
   */
  async listarOcorrencias(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      
      // Verificar se o motorista existe e pertence à prefeitura
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Buscar ocorrências
      let filtro = { motorista: id };
      
      // Filtrar por tipo de ocorrência
      if (req.query.tipo_ocorrencia) {
        filtro.tipo_ocorrencia = req.query.tipo_ocorrencia;
      }
      
      // Filtrar por gravidade
      if (req.query.gravidade) {
        filtro.gravidade = req.query.gravidade;
      }
      
      // Filtrar por período
      if (req.query.data_inicio && req.query.data_fim) {
        filtro.data = {
          $gte: new Date(req.query.data_inicio),
          $lte: new Date(req.query.data_fim)
        };
      } else if (req.query.data_inicio) {
        filtro.data = { $gte: new Date(req.query.data_inicio) };
      } else if (req.query.data_fim) {
        filtro.data = { $lte: new Date(req.query.data_fim) };
      }
      
      // Paginação
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Buscar total de registros
      const total = await Ocorrencia.countDocuments(filtro);
      
      // Buscar ocorrências com paginação
      const ocorrencias = await Ocorrencia.find(filtro)
        .sort({ data: -1 })
        .skip(skip)
        .limit(limit)
        .populate('usuario_registro', 'nome email')
        .populate('viagem', 'destino data_viagem');
      
      return res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        ocorrencias
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Exclui um motorista (soft delete ou desativa)
   */
  async excluirMotorista(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      // Verificar se motorista está em uso em viagens ativas
      try {
        const Viagem = mongoose.model('Viagem');
        const viagensAtivas = await Viagem.countDocuments({
          motorista: id,
          status: { $in: ['agendada', 'confirmada', 'em_andamento'] }
        });
        
        if (viagensAtivas > 0) {
          throw new APIError('Não é possível excluir o motorista, pois ele está vinculado a viagens ativas', 400);
        }
      } catch (err) {
        if (!(err instanceof APIError)) {
          console.log('Modelo Viagem não disponível ou erro ao verificar viagens');
        } else {
          throw err;
        }
      }
      
      // Atualizar para inativo ao invés de excluir definitivamente
      const motoristaAtualizado = await Motorista.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status: 'inativo',
            motivo_inatividade: 'Exclusão solicitada pelo usuário',
            data_inicio_inatividade: new Date(),
            observacoes: (motorista.observacoes || '') + 
              `\n[${new Date().toLocaleString()}] Motorista marcado como excluído pelo usuário ${req.usuario.nome}.`,
            usuario_ultima_atualizacao: usuario_id
          } 
        },
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        mensagem: 'Motorista desativado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lista motoristas disponíveis para uma data específica
   */
  async listarMotoristasDisponiveis(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      const { data, categoria_cnh } = req.query;
      
      if (!data) {
        throw new APIError('Data é obrigatória para verificar disponibilidade', 400);
      }
      
      // Filtros básicos
      const filtros = {
        prefeitura: prefeitura_id,
        status: 'ativo',
        validade_cnh: { $gt: new Date() }  // CNH válida
      };
      
      // Filtrar por categoria de CNH
      if (categoria_cnh) {
        filtros.categoria_cnh = categoria_cnh;
      }
      
      // Buscar motoristas que se encaixam nos critérios iniciais
      const motoristas = await Motorista.find(filtros)
        .select('nome cpf telefone categoria_cnh validade_cnh');
      
      // Verificar disponibilidade individual por data
      const dataConsulta = new Date(data);
      const motoristasDisponiveis = [];
      
      for (const motorista of motoristas) {
        const disponivel = await motorista.verificarDisponibilidade(dataConsulta);
        if (disponivel) {
          motoristasDisponiveis.push(motorista);
        }
      }
      
      return res.status(200).json({
        success: true,
        quantidade: motoristasDisponiveis.length,
        motoristas: motoristasDisponiveis
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verifica CNHs que estão próximas do vencimento
   */
  async verificarCNHsVencendo(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      
      // Definir período para alertas (padrão: 30 dias)
      const diasAlerta = parseInt(req.query.dias_alerta) || 30;
      
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + diasAlerta);
      
      // Motoristas com CNH vencendo
      const motoristas = await Motorista.find({
        prefeitura: prefeitura_id,
        status: 'ativo',
        validade_cnh: { $gte: hoje, $lte: dataLimite }
      })
      .select('nome cpf numero_cnh categoria_cnh validade_cnh telefone email')
      .sort({ validade_cnh: 1 });
      
      return res.status(200).json({
        success: true,
        dias_alerta: diasAlerta,
        quantidade: motoristas.length,
        motoristas
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lista as estatísticas de viagens por motorista
   */
  async estatisticasMotorista(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      
      // Verificar se o motorista existe e pertence à prefeitura
      const motorista = await Motorista.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!motorista) {
        throw new APIError('Motorista não encontrado', 404);
      }
      
      let estatisticas = {
        total_viagens: 0,
        viagens_por_mes: [],
        ocorrencias_por_tipo: [],
        viagens_por_destino: []
      };
      
      try {
        const Viagem = mongoose.model('Viagem');
        
        // Total de viagens
        const totalViagens = await Viagem.countDocuments({
          motorista: id
        });
        
        // Contagem de viagens por mês (últimos 6 meses)
        const hoje = new Date();
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(hoje.getMonth() - 6);
        
        const viagensPorMes = await Viagem.aggregate([
          {
            $match: {
              motorista: mongoose.Types.ObjectId(id),
              data_viagem: { $gte: seisMesesAtras }
            }
          },
          {
            $group: {
              _id: {
                ano: { $year: '$data_viagem' },
                mes: { $month: '$data_viagem' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.ano': 1, '_id.mes': 1 }
          }
        ]);
        
        // Formatando dados de viagens por mês
        const mesesFormatados = viagensPorMes.map(item => ({
          mes: `${item._id.mes.toString().padStart(2, '0')}/${item._id.ano}`,
          quantidade: item.count
        }));
        
        // Contagem de viagens por destino
        const viagensPorDestino = await Viagem.aggregate([
          {
            $match: {
              motorista: mongoose.Types.ObjectId(id)
            }
          },
          {
            $group: {
              _id: '$destino',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          },
          {
            $limit: 5
          }
        ]);
        
        // Formatando dados de viagens por destino
        const destinosFormatados = viagensPorDestino.map(item => ({
          destino: item._id,
          quantidade: item.count
        }));
        
        estatisticas.total_viagens = totalViagens;
        estatisticas.viagens_por_mes = mesesFormatados;
        estatisticas.viagens_por_destino = destinosFormatados;
      } catch (err) {
        console.log('Modelo Viagem não disponível ou erro ao calcular estatísticas:', err);
      }
      
      // Contagem de ocorrências por tipo
      const ocorrenciasPorTipo = await Ocorrencia.aggregate([
        {
          $match: {
            motorista: mongoose.Types.ObjectId(id)
          }
        },
        {
          $group: {
            _id: '$tipo_ocorrencia',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Formatando dados de ocorrências por tipo
      const ocorrenciasFormatadas = ocorrenciasPorTipo.map(item => ({
        tipo: item._id,
        quantidade: item.count
      }));
      
      estatisticas.ocorrencias_por_tipo = ocorrenciasFormatadas;
      
      return res.status(200).json({
        success: true,
        estatisticas
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MotoristaController(); 