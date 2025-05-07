const express = require('express');
const router = express.Router();
const solicitacaoTFDController = require('../controllers/solicitacao-tfd.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const permissionMiddleware = require('../middlewares/permission.middleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para listar e buscar solicitações
router.get('/', permissionMiddleware(['visualizar_solicitacoes']), solicitacaoTFDController.listarSolicitacoes);
router.get('/:id', permissionMiddleware(['visualizar_solicitacoes']), solicitacaoTFDController.buscarSolicitacaoPorId);

// Rota para criar nova solicitação
router.post('/', permissionMiddleware(['criar_solicitacoes']), solicitacaoTFDController.criarSolicitacao);

// Rota para atualizar solicitação
router.put('/:id', permissionMiddleware(['editar_solicitacoes']), solicitacaoTFDController.atualizarSolicitacao);

// Rota para alterar status da solicitação
router.patch('/:id/status', permissionMiddleware(['gerenciar_status_solicitacoes']), solicitacaoTFDController.alterarStatus);

// Rota para adicionar comentário
router.post('/:id/comentarios', permissionMiddleware(['comentar_solicitacoes']), solicitacaoTFDController.adicionarComentario);

// Rota para cancelar solicitação
router.patch('/:id/cancelar', permissionMiddleware(['cancelar_solicitacoes']), solicitacaoTFDController.cancelarSolicitacao);

// Rota para deletar solicitação (apenas admin)
router.delete('/:id', permissionMiddleware(['excluir_solicitacoes']), solicitacaoTFDController.deletarSolicitacao);

// Rota para estatísticas
router.get('/estatisticas', permissionMiddleware(['visualizar_estatisticas']), solicitacaoTFDController.estatisticasSolicitacoesTFD);

module.exports = router; 