const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');
const { verificarToken, verificarPermissao } = require('../middlewares/auth.middleware');

/**
 * Rotas para gerenciamento de documentos
 */

// Listagem e filtros
router.get('/', verificarToken, documentoController.listarDocumentos);

// Obter documento por ID
router.get('/:id', verificarToken, documentoController.obterDocumentoPorId);

// Listar documentos por referência (paciente/acompanhante)
router.get('/referencia/:tipo_ref/:ref_id', verificarToken, documentoController.listarDocumentosPorReferencia);

// Listar documentos a vencer
router.get('/vencimento/proximos', verificarToken, documentoController.listarDocumentosAVencer);

// Criar novo documento (com upload)
router.post('/', verificarToken, documentoController.uploadDocumento, documentoController.criarDocumento);

// Aprovar documento
router.put('/:id/aprovar', verificarToken, verificarPermissao(['admin', 'gestor']), documentoController.aprovarDocumento);

// Rejeitar documento
router.put('/:id/rejeitar', verificarToken, verificarPermissao(['admin', 'gestor']), documentoController.rejeitarDocumento);

// Arquivar documento
router.put('/:id/arquivar', verificarToken, verificarPermissao(['admin', 'gestor']), documentoController.arquivarDocumento);

// Remover documento
router.delete('/:id', verificarToken, verificarPermissao(['admin', 'gestor']), documentoController.removerDocumento);

// Download do arquivo
router.get('/:id/download', verificarToken, documentoController.downloadDocumento);

module.exports = router; 