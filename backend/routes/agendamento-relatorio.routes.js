const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const agendamentoRelatorioController = require('../controllers/agendamento-relatorio.controller');

/**
 * @swagger
 * /api/agendamento-relatorios:
 *   get:
 *     tags: [Agendamento de Relatórios]
 *     summary: Lista todos os agendamentos de relatórios
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth.verificarToken, agendamentoRelatorioController.listarAgendamentos);

/**
 * @swagger
 * /api/agendamento-relatorios/{id}:
 *   get:
 *     tags: [Agendamento de Relatórios]
 *     summary: Obtém um agendamento de relatório pelo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth.verificarToken, agendamentoRelatorioController.obterPorId);

/**
 * @swagger
 * /api/agendamento-relatorios:
 *   post:
 *     tags: [Agendamento de Relatórios]
 *     summary: Cria um novo agendamento de relatório
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth.verificarToken, agendamentoRelatorioController.criarAgendamento);

/**
 * @swagger
 * /api/agendamento-relatorios/{id}:
 *   put:
 *     tags: [Agendamento de Relatórios]
 *     summary: Atualiza um agendamento de relatório
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth.verificarToken, agendamentoRelatorioController.atualizarAgendamento);

/**
 * @swagger
 * /api/agendamento-relatorios/{id}/status:
 *   patch:
 *     tags: [Agendamento de Relatórios]
 *     summary: Ativa/desativa um agendamento de relatório
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/status', auth.verificarToken, agendamentoRelatorioController.alterarStatus);

/**
 * @swagger
 * /api/agendamento-relatorios/{id}:
 *   delete:
 *     tags: [Agendamento de Relatórios]
 *     summary: Remove um agendamento de relatório
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth.verificarToken, agendamentoRelatorioController.removerAgendamento);

/**
 * @swagger
 * /api/agendamento-relatorios/{id}/executar:
 *   post:
 *     tags: [Agendamento de Relatórios]
 *     summary: Executa um agendamento de relatório manualmente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/executar', auth.verificarToken, agendamentoRelatorioController.executarAgendamento);

/**
 * @swagger
 * /api/agendamento-relatorios/processar-pendentes:
 *   post:
 *     tags: [Agendamento de Relatórios]
 *     summary: Processa todos os agendamentos pendentes
 *     description: Apenas administradores podem acessar este endpoint
 *     security:
 *       - bearerAuth: []
 */
router.post('/processar-pendentes', auth.verificarToken, auth.verificarAdmin, agendamentoRelatorioController.processarPendentes);

module.exports = router; 