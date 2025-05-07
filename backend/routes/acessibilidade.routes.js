/**
 * Rotas de API para acessibilidade
 * 
 * Este arquivo define as rotas relacionadas à acessibilidade, incluindo:
 * - Gestão de relatórios de acessibilidade
 * - Configurações personalizadas para usuários
 * - Verificação de páginas para problemas de acessibilidade
 */

const express = require('express');
const router = express.Router();
const acessibilidadeController = require('../controllers/acessibilidade.controller');
const { autenticar, autorizar } = require('../middlewares/auth');

/**
 * @route   POST /api/acessibilidade/relatorios
 * @desc    Registra um novo relatório de acessibilidade
 * @access  Privado
 */
router.post('/relatorios', 
  autenticar, 
  acessibilidadeController.registrarRelatorio
);

/**
 * @route   GET /api/acessibilidade/relatorios
 * @desc    Lista relatórios de acessibilidade com filtros e paginação
 * @access  Privado (Admin/Gestor)
 */
router.get('/relatorios', 
  autenticar, 
  autorizar(['admin', 'gestor']), 
  acessibilidadeController.listarRelatorios
);

/**
 * @route   GET /api/acessibilidade/relatorios/:id
 * @desc    Obtém um relatório de acessibilidade específico por ID
 * @access  Privado (Admin/Gestor)
 */
router.get('/relatorios/:id', 
  autenticar, 
  autorizar(['admin', 'gestor']), 
  acessibilidadeController.obterRelatorioPorId
);

/**
 * @route   GET /api/acessibilidade/estatisticas
 * @desc    Obtém estatísticas gerais de acessibilidade
 * @access  Privado (Admin/Gestor)
 */
router.get('/estatisticas', 
  autenticar, 
  autorizar(['admin', 'gestor']), 
  acessibilidadeController.obterEstatisticas
);

/**
 * @route   POST /api/acessibilidade/configuracoes
 * @desc    Salva configurações de acessibilidade personalizadas para o usuário atual
 * @access  Privado
 */
router.post('/configuracoes', 
  autenticar, 
  acessibilidadeController.salvarConfiguracoes
);

/**
 * @route   GET /api/acessibilidade/configuracoes
 * @desc    Obtém as configurações de acessibilidade do usuário atual
 * @access  Privado
 */
router.get('/configuracoes', 
  autenticar, 
  acessibilidadeController.obterConfiguracoes
);

/**
 * @route   POST /api/acessibilidade/verificar
 * @desc    Executa verificação de acessibilidade em uma página específica
 * @access  Privado (Admin/Gestor)
 */
router.post('/verificar', 
  autenticar, 
  autorizar(['admin', 'gestor']), 
  acessibilidadeController.verificarPagina
);

module.exports = router; 