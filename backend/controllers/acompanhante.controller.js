const acompanhanteService = require('../services/acompanhante.service');
const { validarObjetoId, tratarErro } = require('../utils/error.utils');
const mongoose = require('mongoose');

/**
 * Controller para gerenciamento de acompanhantes
 */

/**
 * Lista acompanhantes com filtros e paginação
 */
const listarAcompanhantes = async (req, res) => {
  try {
    // Garantir que o usuário só veja acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Extrair parâmetros de query
    const { 
      page = 1, 
      limit = 10, 
      nome, 
      cpf, 
      status, 
      paciente_id,
      relacao_paciente,
      sort_by,
      sort_order
    } = req.query;
    
    // Construir objeto de filtros
    const filtros = {
      prefeitura_id,
      nome,
      cpf,
      status,
      paciente_id,
      relacao_paciente,
      sort_by,
      sort_order
    };
    
    // Limpar campos vazios
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined || filtros[key] === '') {
        delete filtros[key];
      }
    });
    
    // Chamar serviço com paginação
    const resultado = await acompanhanteService.listarAcompanhantes(
      filtros,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém um acompanhante pelo ID
 */
const obterAcompanhantePorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só veja acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    const acompanhante = await acompanhanteService.obterAcompanhantePorId(id, prefeitura_id);
    
    return res.status(200).json(acompanhante);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Cria um novo acompanhante
 */
const criarAcompanhante = async (req, res) => {
  try {
    const dadosAcompanhante = req.body;
    
    // Garantir que o acompanhante seja criado na prefeitura do usuário
    dadosAcompanhante.prefeitura = req.usuario.prefeitura;
    
    // Chamar serviço para criar acompanhante
    const acompanhante = await acompanhanteService.criarAcompanhante(
      dadosAcompanhante,
      req.usuario.id
    );
    
    return res.status(201).json({
      mensagem: 'Acompanhante criado com sucesso',
      acompanhante
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Atualiza um acompanhante existente
 */
const atualizarAcompanhante = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só atualize acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para atualizar acompanhante
    const acompanhante = await acompanhanteService.atualizarAcompanhante(
      id,
      dadosAtualizacao,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Acompanhante atualizado com sucesso',
      acompanhante
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Altera o status de um acompanhante
 */
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo } = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só atualize acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para alterar status
    const acompanhante = await acompanhanteService.alterarStatus(
      id,
      status,
      motivo,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: `Acompanhante ${status === 'ativo' ? 'ativado' : status === 'inativo' ? 'inativado' : 'bloqueado'} com sucesso`,
      acompanhante
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Remove um acompanhante
 */
const removerAcompanhante = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só remova acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para remover acompanhante
    await acompanhanteService.removerAcompanhante(
      id,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Acompanhante removido com sucesso'
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Busca acompanhantes por paciente
 */
const buscarAcompanhantesPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    // Validar ID
    validarObjetoId(pacienteId, 'ID de paciente inválido');
    
    // Garantir que o usuário só veja acompanhantes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para buscar acompanhantes
    const acompanhantes = await acompanhanteService.buscarAcompanhantesPorPaciente(
      pacienteId,
      prefeitura_id
    );
    
    return res.status(200).json(acompanhantes);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Verifica disponibilidade de CPF
 */
const verificarCPFDisponivel = async (req, res) => {
  try {
    const { cpf } = req.query;
    const { id } = req.params; // Opcional para casos de edição
    
    if (!cpf) {
      return res.status(400).json({ 
        erro: 'CPF não informado'
      });
    }
    
    // Chamar serviço para verificar CPF
    const disponivel = await acompanhanteService.verificarCPFDisponivel(cpf, id || null);
    
    return res.status(200).json({ disponivel });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

module.exports = {
  listarAcompanhantes,
  obterAcompanhantePorId,
  criarAcompanhante,
  atualizarAcompanhante,
  alterarStatus,
  removerAcompanhante,
  buscarAcompanhantesPorPaciente,
  verificarCPFDisponivel
}; 