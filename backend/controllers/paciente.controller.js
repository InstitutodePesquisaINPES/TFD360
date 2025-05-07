const pacienteService = require('../services/paciente.service');
const { validarObjetoId, tratarErro } = require('../utils/error.utils');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Controller para gerenciamento de pacientes
 */

/**
 * Lista pacientes com filtros e paginação
 */
const listarPacientes = async (req, res) => {
  try {
    // Garantir que o usuário só veja pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Extrair parâmetros de query
    const { 
      page = 1, 
      limit = 10, 
      nome, 
      cpf, 
      cartao_sus, 
      status, 
      cid,
      documentacao_completa,
      sort_by,
      sort_order
    } = req.query;
    
    // Construir objeto de filtros
    const filtros = {
      prefeitura_id,
      nome,
      cpf,
      cartao_sus,
      status,
      cid,
      documentacao_completa,
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
    const resultado = await pacienteService.listarPacientes(
      filtros,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém um paciente pelo ID
 */
const obterPacientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só veja pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    const paciente = await pacienteService.obterPacientePorId(id, prefeitura_id);
    
    return res.status(200).json(paciente);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Cria um novo paciente
 */
const criarPaciente = async (req, res) => {
  try {
    const dadosPaciente = req.body;
    
    // Garantir que o paciente seja criado na prefeitura do usuário
    dadosPaciente.prefeitura = req.usuario.prefeitura;
    
    // Chamar serviço para criar paciente
    const paciente = await pacienteService.criarPaciente(
      dadosPaciente,
      req.usuario.id
    );
    
    return res.status(201).json({
      mensagem: 'Paciente criado com sucesso',
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Atualiza um paciente existente
 */
const atualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para atualizar paciente
    const paciente = await pacienteService.atualizarPaciente(
      id,
      dadosAtualizacao,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Paciente atualizado com sucesso',
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Adiciona uma condição médica a um paciente
 */
const adicionarCondicaoMedica = async (req, res) => {
  try {
    const { id } = req.params;
    const condicaoMedica = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para adicionar condição médica
    const paciente = await pacienteService.adicionarCondicaoMedica(
      id,
      condicaoMedica,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Condição médica adicionada com sucesso',
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Altera o status de um paciente
 */
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo } = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para alterar status
    const paciente = await pacienteService.alterarStatus(
      id,
      status,
      motivo,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: `Paciente ${status === 'ativo' ? 'ativado' : status === 'inativo' ? 'inativado' : 'bloqueado'} com sucesso`,
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Vincula um acompanhante a um paciente
 */
const vincularAcompanhante = async (req, res) => {
  try {
    const { id, acompanhanteId } = req.params;
    
    // Validar IDs
    validarObjetoId(id, 'ID de paciente inválido');
    validarObjetoId(acompanhanteId, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para vincular acompanhante
    const paciente = await pacienteService.vincularAcompanhante(
      id,
      acompanhanteId,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Acompanhante vinculado com sucesso',
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Remove um acompanhante de um paciente
 */
const removerAcompanhante = async (req, res) => {
  try {
    const { id, acompanhanteId } = req.params;
    
    // Validar IDs
    validarObjetoId(id, 'ID de paciente inválido');
    validarObjetoId(acompanhanteId, 'ID de acompanhante inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para remover acompanhante
    const paciente = await pacienteService.removerAcompanhante(
      id,
      acompanhanteId,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Acompanhante removido com sucesso',
      paciente
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Gera a ficha completa do paciente
 */
const gerarFichaPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só veja pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para gerar ficha
    const ficha = await pacienteService.gerarFichaPaciente(id, prefeitura_id);
    
    return res.status(200).json(ficha);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Middleware para upload de foto do paciente
 */
const uploadFoto = upload.single('foto');

/**
 * Processa upload de foto do paciente
 */
const processarUploadFoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de paciente inválido');
    
    // Garantir que o usuário só atualize pacientes da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Verificar se há arquivo
    if (!req.file) {
      return res.status(400).json({ 
        erro: 'Nenhum arquivo enviado'
      });
    }
    
    // Chamar serviço para processar upload
    const resultado = await pacienteService.uploadFotoPaciente(
      req.file,
      id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Foto do paciente atualizada com sucesso',
      foto_url: resultado.foto_url
    });
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
    const disponivel = await pacienteService.verificarCPFDisponivel(cpf, id || null);
    
    return res.status(200).json({ disponivel });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

module.exports = {
  listarPacientes,
  obterPacientePorId,
  criarPaciente,
  atualizarPaciente,
  adicionarCondicaoMedica,
  alterarStatus,
  vincularAcompanhante,
  removerAcompanhante,
  gerarFichaPaciente,
  uploadFoto,
  processarUploadFoto,
  verificarCPFDisponivel
}; 