const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

/**
 * Rota para login de usuário
 * @route POST /api/auth/login
 * @group Autenticação - Operações de autenticação
 * @param {string} email.body.required - Email do usuário
 * @param {string} senha.body.required - Senha do usuário
 * @returns {object} 200 - Token de acesso, token de atualização e dados do usuário
 * @returns {Error} 401 - Credenciais inválidas
 */
router.post('/login', authController.login);

/**
 * Rota para atualizar token (refresh token)
 * @route POST /api/auth/refresh
 * @group Autenticação - Operações de autenticação
 * @param {string} refreshToken.body.required - Token de atualização
 * @returns {object} 200 - Novo token de acesso e token de atualização
 * @returns {Error} 401 - Token inválido ou expirado
 */
router.post('/refresh', authController.refreshToken);

/**
 * Rota para logout
 * @route POST /api/auth/logout
 * @group Autenticação - Operações de autenticação
 * @param {string} refreshToken.body.required - Token de atualização a ser invalidado
 * @returns {object} 200 - Mensagem de sucesso
 */
router.post('/logout', authController.logout);

/**
 * Rota para obter informações do usuário autenticado
 * @route GET /api/auth/me
 * @group Autenticação - Operações de autenticação
 * @returns {object} 200 - Dados do usuário
 * @returns {Error} 401 - Não autenticado
 */
router.get('/me', verificarToken, authController.userInfo);

module.exports = router;