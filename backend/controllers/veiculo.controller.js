const Veiculo = require('../models/veiculo.model');
const Manutencao = require('../models/manutencao.model');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { APIError } = require('../utils/errors');

/**
 * Controlador para gerenciamento de veículos da frota
 */
class VeiculoController {
  /**
   * Lista todos os veículos da prefeitura
   */
  async listarVeiculos(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      const filtros = { prefeitura: prefeitura_id };
      
      // Aplicar filtros adicionais se fornecidos
      if (req.query.status_operacional) {
        filtros.status_operacional = req.query.status_operacional;
      }
      
      if (req.query.tipo) {
        filtros.tipo = req.query.tipo;
      }
      
      if (req.query.ativo === 'true') {
        filtros.ativo = true;
      } else if (req.query.ativo === 'false') {
        filtros.ativo = false;
      }
      
      // Filtro para capacidade mínima
      if (req.query.capacidade_minima) {
        filtros.capacidade_passageiros = { $gte: parseInt(req.query.capacidade_minima) };
      }
      
      // Verificar veículos com documentação vencida
      if (req.query.documentacao_vencida === 'true') {
        const hoje = new Date();
        filtros.$or = [
          { data_licenciamento: { $lt: hoje } },
          { 'documentos.data_vencimento': { $lt: hoje } }
        ];
      }
      
      // Ordenação
      let ordenacao = { updated_at: -1 };
      if (req.query.ordenar_por) {
        ordenacao = { [req.query.ordenar_por]: req.query.ordem === 'desc' ? -1 : 1 };
      }
      
      const veiculos = await Veiculo.find(filtros)
        .sort(ordenacao)
        .populate('usuario_cadastro', 'nome email')
        .populate('usuario_ultima_atualizacao', 'nome email');
      
      return res.status(200).json({
        success: true,
        quantidade: veiculos.length,
        veiculos
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtém detalhes de um veículo específico
   */
  async obterVeiculo(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      })
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Carregar manutenções recentes
      const manutencoes = await Manutencao.find({
        veiculo: veiculo._id
      })
      .sort({ data: -1 })
      .limit(5);
      
      // Carregar viagens recentes (assumindo que existe model de Viagem)
      let viagensRecentes = [];
      try {
        const Viagem = mongoose.model('Viagem');
        viagensRecentes = await Viagem.find({
          veiculo: veiculo._id
        })
        .sort({ data_viagem: -1 })
        .limit(5)
        .select('data_viagem destino status quilometragem_inicial quilometragem_final');
      } catch (err) {
        console.log('Modelo Viagem não disponível ou erro ao carregar viagens');
      }
      
      return res.status(200).json({
        success: true,
        veiculo,
        manutencoes,
        viagensRecentes
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cadastra um novo veículo
   */
  async cadastrarVeiculo(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      // Verificar se já existe veículo com a mesma placa
      const veiculoExistente = await Veiculo.findOne({
        placa: req.body.placa.toUpperCase(),
        prefeitura: prefeitura_id
      });
      
      if (veiculoExistente) {
        throw new APIError('Já existe um veículo cadastrado com esta placa', 400);
      }
      
      // Processar upload de imagem se existir
      let foto_url = null;
      if (req.file) {
        // Salvar caminho relativo da imagem
        foto_url = `/uploads/veiculos/${req.file.filename}`;
      }
      
      const novoVeiculo = new Veiculo({
        ...req.body,
        placa: req.body.placa.toUpperCase(),
        prefeitura: prefeitura_id,
        usuario_cadastro: usuario_id,
        usuario_ultima_atualizacao: usuario_id,
        foto_url
      });
      
      await novoVeiculo.save();
      
      return res.status(201).json({
        success: true,
        mensagem: 'Veículo cadastrado com sucesso',
        veiculo: novoVeiculo
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
   * Atualiza informações de um veículo
   */
  async atualizarVeiculo(req, res, next) {
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
      
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Verificar se está atualizando a placa e se já existe
      if (req.body.placa && req.body.placa !== veiculo.placa) {
        const placaExistente = await Veiculo.findOne({
          placa: req.body.placa.toUpperCase(),
          prefeitura: prefeitura_id,
          _id: { $ne: id }
        });
        
        if (placaExistente) {
          throw new APIError('Já existe outro veículo cadastrado com esta placa', 400);
        }
      }
      
      // Processar upload de imagem se existir
      let foto_url = veiculo.foto_url;
      if (req.file) {
        // Remover foto anterior se existir
        if (veiculo.foto_url) {
          const fotoAnteriorPath = path.join(__dirname, '..', 'public', veiculo.foto_url);
          fs.unlink(fotoAnteriorPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Erro ao remover foto anterior:', err);
            }
          });
        }
        
        // Salvar caminho relativo da nova imagem
        foto_url = `/uploads/veiculos/${req.file.filename}`;
      }
      
      // Atualizar veículo
      const dadosAtualizados = {
        ...req.body,
        usuario_ultima_atualizacao: usuario_id,
        foto_url
      };
      
      if (req.body.placa) {
        dadosAtualizados.placa = req.body.placa.toUpperCase();
      }
      
      // Se estiver atualizando quilometragem, verificar se precisa alertar para manutenção
      if (req.body.quilometragem_atual && veiculo.proxima_manutencao_km) {
        if (parseInt(req.body.quilometragem_atual) >= veiculo.proxima_manutencao_km) {
          // Adicionar observação de alerta
          dadosAtualizados.observacoes = (veiculo.observacoes || '') + 
            `\n[${new Date().toLocaleString()}] ALERTA: Veículo atingiu quilometragem para manutenção.`;
        }
      }
      
      const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
        id,
        { $set: dadosAtualizados },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        mensagem: 'Veículo atualizado com sucesso',
        veiculo: veiculoAtualizado
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
   * Altera o status operacional de um veículo
   */
  async alterarStatusVeiculo(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      const { status_operacional, observacao } = req.body;
      
      if (!status_operacional || !['disponivel', 'em_viagem', 'em_manutencao', 'inativo'].includes(status_operacional)) {
        throw new APIError('Status operacional inválido', 400);
      }
      
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Usar método do modelo para atualizar status
      const veiculoAtualizado = await veiculo.atualizarStatus(status_operacional, observacao);
      
      return res.status(200).json({
        success: true,
        mensagem: 'Status do veículo atualizado com sucesso',
        veiculo: veiculoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Registra manutenção para o veículo
   */
  async registrarManutencao(req, res, next) {
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
      
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Criar registro de manutenção
      const novaManutencao = new Manutencao({
        veiculo: id,
        prefeitura: prefeitura_id,
        tipo_manutencao: req.body.tipo_manutencao,
        descricao: req.body.descricao,
        data: req.body.data,
        km_registrado: req.body.km_registrado,
        proxima_manutencao_km: req.body.proxima_manutencao_km,
        custo: req.body.custo,
        local: req.body.local,
        usuario_registro: usuario_id
      });
      
      await novaManutencao.save();
      
      // Atualizar dados do veículo
      const atualizacoes = {
        data_ultima_manutencao: req.body.data,
        usuario_ultima_atualizacao: usuario_id
      };
      
      // Atualizar quilometragem se maior que a atual
      if (req.body.km_registrado && (!veiculo.quilometragem_atual || req.body.km_registrado > veiculo.quilometragem_atual)) {
        atualizacoes.quilometragem_atual = req.body.km_registrado;
      }
      
      // Atualizar próxima manutenção programada
      if (req.body.proxima_manutencao_km) {
        atualizacoes.proxima_manutencao_km = req.body.proxima_manutencao_km;
      }
      
      // Se for tipo "revisao_periodica", atualizar data da última revisão
      if (req.body.tipo_manutencao === 'revisao_periodica') {
        atualizacoes.data_ultima_revisao = req.body.data;
      }
      
      // Se definiu tipo "manutencao_corretiva" e o veículo não está em manutenção, alterar status
      if (req.body.tipo_manutencao === 'manutencao_corretiva' && veiculo.status_operacional !== 'em_manutencao') {
        atualizacoes.status_operacional = 'em_manutencao';
        
        // Adicionar observação
        atualizacoes.observacoes = (veiculo.observacoes || '') + 
          `\n[${new Date().toLocaleString()}] Veículo entrou em manutenção corretiva: ${req.body.descricao}`;
      }
      
      // Se foi conclusão de manutenção, alterar status para disponível
      if (req.body.tipo_manutencao === 'conclusao_manutencao' && veiculo.status_operacional === 'em_manutencao') {
        atualizacoes.status_operacional = 'disponivel';
        
        // Adicionar observação
        atualizacoes.observacoes = (veiculo.observacoes || '') + 
          `\n[${new Date().toLocaleString()}] Manutenção concluída: ${req.body.descricao}`;
      }
      
      const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
        id,
        { $set: atualizacoes },
        { new: true }
      );
      
      return res.status(201).json({
        success: true,
        mensagem: 'Manutenção registrada com sucesso',
        manutencao: novaManutencao,
        veiculo: veiculoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lista o histórico de manutenções de um veículo
   */
  async listarManutencoes(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id } = req.usuario;
      
      // Verificar se o veículo existe e pertence à prefeitura
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Buscar manutenções
      let filtro = { veiculo: id };
      
      // Filtrar por tipo de manutenção
      if (req.query.tipo_manutencao) {
        filtro.tipo_manutencao = req.query.tipo_manutencao;
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
      const total = await Manutencao.countDocuments(filtro);
      
      // Buscar manutenções com paginação
      const manutencoes = await Manutencao.find(filtro)
        .sort({ data: -1 })
        .skip(skip)
        .limit(limit)
        .populate('usuario_registro', 'nome email');
      
      return res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        manutencoes
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Exclui um veículo (soft delete ou desativa)
   */
  async excluirVeiculo(req, res, next) {
    try {
      const { id } = req.params;
      const { prefeitura_id, _id: usuario_id } = req.usuario;
      
      const veiculo = await Veiculo.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!veiculo) {
        throw new APIError('Veículo não encontrado', 404);
      }
      
      // Verificar se veículo está em uso em viagens ativas
      try {
        const Viagem = mongoose.model('Viagem');
        const viagensAtivas = await Viagem.countDocuments({
          veiculo: id,
          status: { $in: ['agendada', 'confirmada', 'em_andamento'] }
        });
        
        if (viagensAtivas > 0) {
          throw new APIError('Não é possível excluir o veículo, pois ele está vinculado a viagens ativas', 400);
        }
      } catch (err) {
        if (!(err instanceof APIError)) {
          console.log('Modelo Viagem não disponível ou erro ao verificar viagens');
        } else {
          throw err;
        }
      }
      
      // Atualizar para inativo ao invés de excluir definitivamente
      veiculo.ativo = false;
      veiculo.status_operacional = 'inativo';
      veiculo.observacoes = (veiculo.observacoes || '') + 
        `\n[${new Date().toLocaleString()}] Veículo desativado pelo usuário ${req.usuario.nome}.`;
      veiculo.usuario_ultima_atualizacao = usuario_id;
      
      await veiculo.save();
      
      return res.status(200).json({
        success: true,
        mensagem: 'Veículo desativado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Lista veículos disponíveis para uma data específica
   */
  async listarVeiculosDisponiveis(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      const { data, capacidade_minima, tipo } = req.query;
      
      if (!data) {
        throw new APIError('Data é obrigatória para verificar disponibilidade', 400);
      }
      
      // Filtros básicos
      const filtros = {
        prefeitura: prefeitura_id,
        ativo: true,
        status_operacional: 'disponivel'
      };
      
      // Filtrar por capacidade mínima
      if (capacidade_minima) {
        filtros.capacidade_passageiros = { $gte: parseInt(capacidade_minima) };
      }
      
      // Filtrar por tipo de veículo
      if (tipo) {
        filtros.tipo = tipo;
      }
      
      // Buscar veículos que se encaixam nos critérios iniciais
      const veiculos = await Veiculo.find(filtros)
        .select('placa marca modelo tipo capacidade_passageiros quilometragem_atual');
      
      // Verificar disponibilidade individual por data
      const dataConsulta = new Date(data);
      const veiculosDisponiveis = [];
      
      for (const veiculo of veiculos) {
        const disponivel = await veiculo.verificarDisponibilidade(dataConsulta);
        if (disponivel) {
          veiculosDisponiveis.push(veiculo);
        }
      }
      
      return res.status(200).json({
        success: true,
        quantidade: veiculosDisponiveis.length,
        veiculos: veiculosDisponiveis
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verifica documentos que estão próximos do vencimento
   */
  async verificarDocumentosVencendo(req, res, next) {
    try {
      const { prefeitura_id } = req.usuario;
      
      // Definir período para alertas (padrão: 30 dias)
      const diasAlerta = parseInt(req.query.dias_alerta) || 30;
      
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + diasAlerta);
      
      // Veículos com licenciamento vencendo
      const veiculosLicenciamento = await Veiculo.find({
        prefeitura: prefeitura_id,
        ativo: true,
        data_licenciamento: { $gte: hoje, $lte: dataLimite }
      })
      .select('placa marca modelo data_licenciamento')
      .sort({ data_licenciamento: 1 });
      
      // Veículos com IPVA vencendo
      const veiculosIPVA = await Veiculo.find({
        prefeitura: prefeitura_id,
        ativo: true,
        'documentos.tipo': 'ipva',
        'documentos.data_vencimento': { $gte: hoje, $lte: dataLimite }
      })
      .select('placa marca modelo documentos')
      .sort({ 'documentos.data_vencimento': 1 });
      
      // Veículos com seguro vencendo
      const veiculosSeguro = await Veiculo.find({
        prefeitura: prefeitura_id,
        ativo: true,
        'documentos.tipo': 'seguro',
        'documentos.data_vencimento': { $gte: hoje, $lte: dataLimite }
      })
      .select('placa marca modelo documentos')
      .sort({ 'documentos.data_vencimento': 1 });
      
      return res.status(200).json({
        success: true,
        dias_alerta: diasAlerta,
        veiculos_licenciamento: veiculosLicenciamento,
        veiculos_ipva: veiculosIPVA,
        veiculos_seguro: veiculosSeguro
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VeiculoController(); 