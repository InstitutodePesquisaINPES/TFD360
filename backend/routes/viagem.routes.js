const express = require('express');
const router = express.Router();
const viagemController = require('../controllers/viagem.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Viagens
 *   description: API para gerenciamento de viagens e transporte de pacientes
 */

/**
 * @swagger
 * /api/viagens:
 *   get:
 *     summary: Listar todas as viagens
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de viagens
 *       401:
 *         description: Não autorizado
 */
router.get('/', autenticar, viagemController.listar);

/**
 * @swagger
 * /api/viagens/{id}:
 *   get:
 *     summary: Obter detalhes de uma viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes da viagem
 *       404:
 *         description: Viagem não encontrada
 */
router.get('/:id', autenticar, viagemController.obterPorId);

/**
 * @swagger
 * /api/viagens:
 *   post:
 *     summary: Criar nova viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origem
 *               - destino
 *               - data_saida
 *               - horario_saida
 *             properties:
 *               origem:
 *                 type: string
 *               destino:
 *                 type: string
 *               data_saida:
 *                 type: string
 *                 format: date
 *               horario_saida:
 *                 type: string
 *               data_retorno:
 *                 type: string
 *                 format: date
 *               horario_retorno:
 *                 type: string
 *               motorista:
 *                 type: string
 *               veiculo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Viagem criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', autenticar, autorizar(['admin', 'coordenador']), viagemController.criar);

/**
 * @swagger
 * /api/viagens/{id}:
 *   put:
 *     summary: Atualizar viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Viagem atualizada com sucesso
 *       404:
 *         description: Viagem não encontrada
 */
router.put('/:id', autenticar, autorizar(['admin', 'coordenador']), viagemController.atualizar);

/**
 * @swagger
 * /api/viagens/{id}:
 *   delete:
 *     summary: Excluir viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Viagem excluída com sucesso
 *       404:
 *         description: Viagem não encontrada
 */
router.delete('/:id', autenticar, autorizar(['admin', 'coordenador']), viagemController.excluir);

/**
 * @swagger
 * /api/viagens/{id}/status:
 *   patch:
 *     summary: Alterar status da viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [agendada, em_andamento, concluida, cancelada]
 *               motivo_cancelamento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status da viagem alterado com sucesso
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Viagem não encontrada
 */
router.patch('/:id/status', autenticar, autorizar(['admin', 'coordenador']), viagemController.alterarStatus);

/**
 * @swagger
 * /api/viagens/pacientes-disponiveis:
 *   get:
 *     summary: Listar pacientes disponíveis para adicionar à viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: viagemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pacientes disponíveis
 *       400:
 *         description: ID da viagem é obrigatório
 *       404:
 *         description: Viagem não encontrada
 */
router.get('/pacientes-disponiveis', autenticar, viagemController.listarPacientesDisponiveis);

/**
 * @swagger
 * /api/viagens/{id}/pacientes:
 *   post:
 *     summary: Adicionar pacientes à viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacientes
 *             properties:
 *               pacientes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Pacientes adicionados à viagem
 *       400:
 *         description: Lista de pacientes inválida
 *       404:
 *         description: Viagem não encontrada
 */
router.post('/:id/pacientes', autenticar, autorizar(['admin', 'coordenador']), viagemController.adicionarPacientes);

/**
 * @swagger
 * /api/viagens/{id}/pacientes/{pacienteId}:
 *   delete:
 *     summary: Remover paciente da viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente removido da viagem
 *       404:
 *         description: Viagem ou paciente não encontrado
 */
router.delete('/:id/pacientes/:pacienteId', autenticar, autorizar(['admin', 'coordenador']), viagemController.removerPaciente);

/**
 * @swagger
 * /api/viagens/{id}/pacientes/{pacienteId}/status:
 *   patch:
 *     summary: Atualizar status do paciente na viagem
 *     tags: [Viagens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmado, cancelado, ausente]
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status do paciente atualizado
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Viagem ou paciente não encontrado
 */
router.patch('/:id/pacientes/:pacienteId/status', autenticar, autorizar(['admin', 'coordenador', 'motorista']), viagemController.atualizarStatusPaciente);

module.exports = router; 