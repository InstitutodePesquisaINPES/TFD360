const AgendamentoRelatorio = require('../models/agendamento-relatorio.model');
const { StatusCodes } = require('http-status-codes');
const relatorioService = require('../services/relatorio.service');
const agendamentoRelatorioService = require('../services/agendamento-relatorio.service');
const { validarObjetoId } = require('../utils/validacao.utils');
const { tratarErro } = require('../utils/error.utils');

/**
 * Lista todos os agendamentos de relatórios com paginação e filtros
 */
const listarAgendamentos = async (req, res) => {
  try {
    // Extrai filtros e opções de paginação da requisição
    const filtros = {
      tipo_relatorio: req.query.tipo,
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined,
      usuario_id: req.query.usuario_id
    };
    
    const opcoesPaginacao = {
      pagina: parseInt(req.query.page, 10) || 1,
      limite: parseInt(req.query.limit, 10) || 10
    };
    
    const resultado = await agendamentoRelatorioService.listarAgendamentos(
      filtros, 
      opcoesPaginacao
    );
    
    return res.json(resultado);
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Obtém um agendamento de relatório pelo ID
 */
const obterAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validarObjetoId(id)) {
      return res.status(400).json({ mensagem: 'ID de agendamento inválido' });
    }
    
    const agendamento = await agendamentoRelatorioService.obterAgendamentoPorId(id);
    return res.json(agendamento);
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Cria um novo agendamento de relatório
 */
const criarAgendamento = async (req, res) => {
  try {
    const dadosAgendamento = req.body;
    const usuario_id = req.usuario.id;
    
    const novoAgendamento = await agendamentoRelatorioService.criarAgendamento(
      dadosAgendamento,
      usuario_id
    );
    
    return res.status(201).json({
      mensagem: 'Agendamento de relatório criado com sucesso',
      agendamento: novoAgendamento
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Atualiza um agendamento de relatório existente
 */
const atualizarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validarObjetoId(id)) {
      return res.status(400).json({ mensagem: 'ID de agendamento inválido' });
    }
    
    const dadosAtualizacao = req.body;
    const agendamentoAtualizado = await agendamentoRelatorioService.atualizarAgendamento(
      id,
      dadosAtualizacao
    );
    
    return res.status(200).json({
      mensagem: 'Agendamento de relatório atualizado com sucesso',
      agendamento: agendamentoAtualizado
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Altera o status (ativo/inativo) de um agendamento
 */
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validarObjetoId(id)) {
      return res.status(400).json({ mensagem: 'ID de agendamento inválido' });
    }
    
    const { ativo } = req.body;
    
    if (ativo === undefined) {
      return res.status(400).json({ mensagem: 'O campo "ativo" é obrigatório' });
    }
    
    const agendamento = await agendamentoRelatorioService.alterarStatus(id, ativo);
    
    return res.status(200).json({
      mensagem: `Agendamento de relatório ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      agendamento
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Remove um agendamento de relatório
 */
const removerAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validarObjetoId(id)) {
      return res.status(400).json({ mensagem: 'ID de agendamento inválido' });
    }
    
    await agendamentoRelatorioService.removerAgendamento(id);
    
    return res.status(200).json({
      mensagem: 'Agendamento de relatório removido com sucesso'
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Executa um agendamento de relatório manualmente
 */
const executarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validarObjetoId(id)) {
      return res.status(400).json({ mensagem: 'ID de agendamento inválido' });
    }
    
    const resultado = await agendamentoRelatorioService.executarAgendamento(id);
    
    return res.status(200).json({
      mensagem: 'Relatório gerado e enviado com sucesso',
      resultado
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

/**
 * Processa todos os agendamentos pendentes (para ser usado via cron job)
 */
const processarPendentes = async (req, res) => {
  try {
    const resultados = await agendamentoRelatorioService.processarAgendamentosPendentes();
    
    return res.status(200).json({
      mensagem: `Processados ${resultados.length} agendamentos pendentes`,
      resultados
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};

module.exports = {
  listarAgendamentos,
  obterAgendamento,
  criarAgendamento,
  atualizarAgendamento,
  alterarStatus,
  removerAgendamento,
  executarAgendamento,
  processarPendentes,
  
  // Manter as funções antigas para compatibilidade com testes
  listar: listarAgendamentos,
  obterPorId: obterAgendamento,
  criar: criarAgendamento,
  atualizar: atualizarAgendamento,
  remover: removerAgendamento,
  executar: executarAgendamento
}; 