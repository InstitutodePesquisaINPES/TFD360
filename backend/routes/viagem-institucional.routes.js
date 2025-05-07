const express = require('express');
const router = express.Router();
const viagemInstitucionalController = require('../controllers/viagem-institucional.controller');
const auth = require('../middlewares/auth.middleware');
const { verificarPermissao } = require('../middlewares/permissao.middleware');

/**
 * Rotas para Viagens Institucionais
 * Permite gerenciar viagens administrativas da prefeitura
 */

// Middleware comum para todas as rotas
router.use(auth);

/**
 * @route   GET /api/viagens-institucionais
 * @desc    Lista todas as viagens institucionais com filtros
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente, motorista)
 */
router.get(
  '/',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente', 'motorista']),
  viagemInstitucionalController.listarViagens
);

/**
 * @route   GET /api/viagens-institucionais/:id
 * @desc    Retorna uma viagem institucional específica
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente, motorista)
 */
router.get(
  '/:id',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente', 'motorista']),
  viagemInstitucionalController.obterViagemPorId
);

/**
 * @route   POST /api/viagens-institucionais
 * @desc    Cria uma nova viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.post(
  '/',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.criarViagem
);

/**
 * @route   PUT /api/viagens-institucionais/:id
 * @desc    Atualiza uma viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.put(
  '/:id',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.atualizarViagem
);

/**
 * @route   POST /api/viagens-institucionais/:id/cancelar
 * @desc    Cancela uma viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura)
 */
router.post(
  '/:id/cancelar',
  verificarPermissao(['admin', 'gestor_prefeitura']),
  viagemInstitucionalController.cancelarViagem
);

/**
 * @route   POST /api/viagens-institucionais/:id/autorizar
 * @desc    Autoriza uma viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura)
 */
router.post(
  '/:id/autorizar',
  verificarPermissao(['admin', 'gestor_prefeitura']),
  viagemInstitucionalController.autorizarViagem
);

/**
 * @route   POST /api/viagens-institucionais/:id/iniciar
 * @desc    Inicia uma viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura, motorista)
 */
router.post(
  '/:id/iniciar',
  verificarPermissao(['admin', 'gestor_prefeitura', 'motorista']),
  viagemInstitucionalController.iniciarViagem
);

/**
 * @route   POST /api/viagens-institucionais/:id/finalizar
 * @desc    Finaliza uma viagem institucional
 * @access  Privado (Perfis: admin, gestor_prefeitura, motorista)
 */
router.post(
  '/:id/finalizar',
  verificarPermissao(['admin', 'gestor_prefeitura', 'motorista']),
  viagemInstitucionalController.finalizarViagem
);

/**
 * @route   POST /api/viagens-institucionais/:id/passageiros
 * @desc    Adiciona um passageiro à viagem
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.post(
  '/:id/passageiros',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.adicionarPassageiro
);

/**
 * @route   DELETE /api/viagens-institucionais/:id/passageiros/:servidorId
 * @desc    Remove um passageiro da viagem
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.delete(
  '/:id/passageiros/:servidorId',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.removerPassageiro
);

/**
 * @route   PUT /api/viagens-institucionais/:id/passageiros/:servidorId/presenca
 * @desc    Registra presença de passageiro na viagem
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente, motorista)
 */
router.put(
  '/:id/passageiros/:servidorId/presenca',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente', 'motorista']),
  viagemInstitucionalController.registrarPresencaPassageiro
);

/**
 * @route   POST /api/viagens-institucionais/:id/documentos
 * @desc    Adiciona um documento à viagem
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.post(
  '/:id/documentos',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.adicionarDocumento
);

/**
 * @route   DELETE /api/viagens-institucionais/:id/documentos/:documentoId
 * @desc    Remove um documento da viagem
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.delete(
  '/:id/documentos/:documentoId',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.removerDocumento
);

/**
 * @route   PUT /api/viagens-institucionais/:id/documentos/:documentoId/entrega
 * @desc    Registra entrega de documento
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente, motorista)
 */
router.put(
  '/:id/documentos/:documentoId/entrega',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente', 'motorista']),
  viagemInstitucionalController.registrarEntregaDocumento
);

/**
 * @route   POST /api/viagens-institucionais/verificar-disponibilidade
 * @desc    Verifica disponibilidade de veículo e motorista para uma data
 * @access  Privado (Perfis: admin, gestor_prefeitura, atendente)
 */
router.post(
  '/verificar-disponibilidade',
  verificarPermissao(['admin', 'gestor_prefeitura', 'atendente']),
  viagemInstitucionalController.verificarDisponibilidade
);

module.exports = router; 