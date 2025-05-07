const express = require('express');
const router = express.Router();
const monitoramentoController = require('../controllers/monitoramento.controller');
const { validarJWT, verificarPermissoes } = require('../middlewares/autenticacao');

/**
 * Rotas para o monitoramento da frota
 * Base URL: /api/monitoramento
 */

// Rotas públicas (sem autenticação)
// Nenhuma rota pública neste recurso

// Rotas protegidas (requerem autenticação)
router.use(validarJWT);

/**
 * @route GET /api/monitoramento/frota
 * @desc Obter localizações atuais de todos os veículos da frota
 * @access Privado (Admin, Gerente de Frota, Coordenador)
 */
router.get('/frota', 
  verificarPermissoes(['admin', 'gerente_frota', 'coordenador']), 
  monitoramentoController.obterLocalizacoesFrota
);

/**
 * @route GET /api/monitoramento/veiculos/:veiculoId
 * @desc Obter última localização de um veículo específico
 * @access Privado (Admin, Gerente de Frota, Coordenador, Motorista)
 */
router.get('/veiculos/:veiculoId', 
  verificarPermissoes(['admin', 'gerente_frota', 'coordenador', 'motorista']), 
  monitoramentoController.obterUltimaLocalizacao
);

/**
 * @route GET /api/monitoramento/veiculos/:veiculoId/historico
 * @desc Obter histórico de localizações de um veículo
 * @access Privado (Admin, Gerente de Frota, Coordenador)
 */
router.get('/veiculos/:veiculoId/historico', 
  verificarPermissoes(['admin', 'gerente_frota', 'coordenador']), 
  monitoramentoController.obterHistoricoLocalizacoes
);

/**
 * @route POST /api/monitoramento/veiculos/:veiculoId
 * @desc Registrar nova localização para um veículo
 * @access Privado (Admin, Gerente de Frota, Motorista)
 */
router.post('/veiculos/:veiculoId', 
  verificarPermissoes(['admin', 'gerente_frota', 'motorista']), 
  monitoramentoController.registrarLocalizacao
);

/**
 * @route GET /api/monitoramento/viagens/:viagemId
 * @desc Obter localizações dos veículos de uma viagem específica
 * @access Privado (Admin, Gerente de Frota, Coordenador, Motorista)
 */
router.get('/viagens/:viagemId', 
  verificarPermissoes(['admin', 'gerente_frota', 'coordenador', 'motorista']), 
  monitoramentoController.obterLocalizacoesViagem
);

/**
 * @route GET /api/monitoramento/calcular-tempo
 * @desc Calcular tempo estimado de chegada entre dois pontos
 * @access Privado (Admin, Gerente de Frota, Coordenador, Motorista)
 */
router.get('/calcular-tempo', 
  verificarPermissoes(['admin', 'gerente_frota', 'coordenador', 'motorista']), 
  monitoramentoController.calcularTempoEstimado
);

module.exports = router; 