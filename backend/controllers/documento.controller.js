const documentoService = require('../services/documento.service');
const { validarObjetoId, tratarErro } = require('../utils/error.utils');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const fs = require('fs');
const path = require('path');

/**
 * Controller para gerenciamento de documentos
 */

/**
 * Lista documentos com filtros e paginação
 */
const listarDocumentos = async (req, res) => {
  try {
    // Garantir que o usuário só veja documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Extrair parâmetros de query
    const { 
      page = 1, 
      limit = 10, 
      ref_id, 
      tipo_ref, 
      tipo_documento, 
      status,
      data_inicio,
      data_fim,
      vencidos,
      a_vencer_em_dias,
      sort_by,
      sort_order
    } = req.query;
    
    // Construir objeto de filtros
    const filtros = {
      prefeitura_id,
      ref_id,
      tipo_ref,
      tipo_documento,
      status,
      data_inicio,
      data_fim,
      vencidos,
      a_vencer_em_dias,
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
    const resultado = await documentoService.listarDocumentos(
      filtros,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém um documento pelo ID
 */
const obterDocumentoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Garantir que o usuário só veja documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    const documento = await documentoService.obterDocumentoPorId(id, prefeitura_id);
    
    return res.status(200).json(documento);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Middleware para upload de documento
 */
const uploadDocumento = upload.single('arquivo');

/**
 * Cria um novo documento
 */
const criarDocumento = async (req, res) => {
  try {
    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ 
        erro: 'Nenhum arquivo enviado'
      });
    }
    
    // Extrair dados do form
    const dadosDocumento = req.body;
    
    // Garantir que o documento seja associado à prefeitura do usuário
    dadosDocumento.prefeitura = req.usuario.prefeitura;
    
    // Chamar serviço para criar documento
    const documento = await documentoService.criarDocumento(
      dadosDocumento,
      req.file,
      req.usuario.id
    );
    
    return res.status(201).json({
      mensagem: 'Documento enviado com sucesso',
      documento
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Aprova um documento
 */
const aprovarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Garantir que o usuário só aprove documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para aprovar documento
    const documento = await documentoService.aprovarDocumento(
      id,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Documento aprovado com sucesso',
      documento
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Rejeita um documento
 */
const rejeitarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Verificar motivo
    if (!motivo) {
      return res.status(400).json({ 
        erro: 'Motivo da rejeição é obrigatório'
      });
    }
    
    // Garantir que o usuário só rejeite documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para rejeitar documento
    const documento = await documentoService.rejeitarDocumento(
      id,
      motivo,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Documento rejeitado com sucesso',
      documento
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Arquiva um documento
 */
const arquivarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Garantir que o usuário só arquive documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para arquivar documento
    const documento = await documentoService.arquivarDocumento(
      id,
      req.usuario.id,
      prefeitura_id
    );
    
    return res.status(200).json({
      mensagem: 'Documento arquivado com sucesso',
      documento
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Remove um documento
 */
const removerDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Garantir que o usuário só remova documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para remover documento
    await documentoService.removerDocumento(id, prefeitura_id);
    
    return res.status(200).json({
      mensagem: 'Documento removido com sucesso'
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Download de um documento
 */
const downloadDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de documento inválido');
    
    // Garantir que o usuário só acesse documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Obter informações do arquivo
    const arquivo = await documentoService.obterArquivoDocumento(id, prefeitura_id);
    
    // Configurar headers para download
    res.setHeader('Content-Type', `application/${arquivo.formato}`);
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome_original}"`);
    
    // Enviar o arquivo como stream
    const fileStream = fs.createReadStream(arquivo.caminho);
    fileStream.pipe(res);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Lista documentos de um paciente ou acompanhante
 */
const listarDocumentosPorReferencia = async (req, res) => {
  try {
    const { ref_id, tipo_ref } = req.params;
    
    // Validar ID
    validarObjetoId(ref_id, 'ID de referência inválido');
    
    // Validar tipo de referência
    if (!['paciente', 'acompanhante'].includes(tipo_ref)) {
      return res.status(400).json({ 
        erro: 'Tipo de referência inválido, deve ser paciente ou acompanhante'
      });
    }
    
    // Garantir que o usuário só veja documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para listar documentos
    const documentos = await documentoService.listarDocumentosPorReferencia(
      ref_id,
      tipo_ref,
      prefeitura_id
    );
    
    return res.status(200).json(documentos);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Lista documentos a vencer em X dias
 */
const listarDocumentosAVencer = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    // Garantir que o usuário só veja documentos da sua prefeitura
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para listar documentos a vencer
    const documentos = await documentoService.listarDocumentosAVencer(
      prefeitura_id,
      parseInt(dias)
    );
    
    return res.status(200).json(documentos);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

module.exports = {
  listarDocumentos,
  obterDocumentoPorId,
  uploadDocumento,
  criarDocumento,
  aprovarDocumento,
  rejeitarDocumento,
  arquivarDocumento,
  removerDocumento,
  downloadDocumento,
  listarDocumentosPorReferencia,
  listarDocumentosAVencer
}; 