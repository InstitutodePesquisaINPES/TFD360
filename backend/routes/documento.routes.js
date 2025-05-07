const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

/**
 * Rotas para gerenciamento de documentos
 */

// Listagem e filtros
router.get('/', autenticar, documentoController.listarDocumentos);

// Obter documento por ID
router.get('/:id', autenticar, documentoController.obterDocumentoPorId);

// Listar documentos por referência (paciente/acompanhante)
router.get('/referencia/:tipo_ref/:ref_id', autenticar, documentoController.listarDocumentosPorReferencia);

// Listar documentos a vencer
router.get('/vencimento/proximos', autenticar, documentoController.listarDocumentosAVencer);

// Criar novo documento (com upload)
router.post('/', autenticar, documentoController.uploadDocumento, documentoController.criarDocumento);

// Aprovar documento
router.put('/:id/aprovar', autenticar, autorizar(['admin', 'gestor']), documentoController.aprovarDocumento);

// Rejeitar documento
router.put('/:id/rejeitar', autenticar, autorizar(['admin', 'gestor']), documentoController.rejeitarDocumento);

// Arquivar documento
router.put('/:id/arquivar', autenticar, autorizar(['admin', 'gestor']), documentoController.arquivarDocumento);

// Remover documento
router.delete('/:id', autenticar, autorizar(['admin', 'gestor']), documentoController.removerDocumento);

// Download do arquivo
router.get('/:id/download', autenticar, documentoController.downloadDocumento);

module.exports = router; 