const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorio.controller');
const { verificarToken, verificarPermissao } = require('../middlewares/auth.middleware');

// Middleware para verificar autenticação em todas as rotas
router.use(verificarToken);

/**
 * @route GET /api/relatorios/usuarios
 * @desc Gera relatório de usuários do sistema
 * @access Privado (requer permissão: gerar_relatorio_usuarios)
 * @query {string} formato - Formato do relatório (pdf, excel, csv) [opcional, padrão: pdf]
 * @query {string} dataInicio - Data inicial (YYYY-MM-DD) [opcional]
 * @query {string} dataFim - Data final (YYYY-MM-DD) [opcional]
 * @query {string} prefeituraId - ID da prefeitura [opcional, obrigatório se não for Super Admin]
 * @query {string} tipoUsuario - Tipo de usuário [opcional]
 */
router.get('/usuarios', 
  verificarPermissao('gerar_relatorio_usuarios'),
  relatorioController.gerarRelatorioUsuarios
);

/**
 * @route GET /api/relatorios/prefeituras
 * @desc Gera relatório de prefeituras cadastradas
 * @access Privado (requer permissão: gerar_relatorio_prefeituras)
 * @query {string} formato - Formato do relatório (pdf, excel, csv) [opcional, padrão: pdf]
 * @query {string} dataInicio - Data inicial (YYYY-MM-DD) [opcional]
 * @query {string} dataFim - Data final (YYYY-MM-DD) [opcional]
 * @query {string} status - Status da prefeitura [opcional]
 */
router.get('/prefeituras', 
  verificarPermissao('gerar_relatorio_prefeituras'),
  relatorioController.gerarRelatorioPrefeituras
);

/**
 * @route GET /api/relatorios/acessos
 * @desc Gera relatório de logs de acesso
 * @access Privado (requer permissão: gerar_relatorio_logs)
 * @query {string} formato - Formato do relatório (pdf, excel, csv) [opcional, padrão: pdf]
 * @query {string} dataInicio - Data inicial (YYYY-MM-DD) [opcional]
 * @query {string} dataFim - Data final (YYYY-MM-DD) [opcional]
 * @query {string} prefeituraId - ID da prefeitura [opcional, obrigatório se não for Super Admin]
 * @query {string} usuarioId - ID do usuário [opcional]
 */
router.get('/acessos', 
  verificarPermissao('gerar_relatorio_logs'),
  relatorioController.gerarRelatorioLogs
);

/**
 * @route GET /api/relatorios/solicitacoes-tfd
 * @desc Gera relatório de solicitações TFD
 * @access Privado (requer permissão: gerar_relatorio_solicitacoes_tfd)
 * @query {string} formato - Formato do relatório (pdf, excel, csv) [opcional, padrão: pdf]
 * @query {string} dataInicio - Data inicial (YYYY-MM-DD) [opcional]
 * @query {string} dataFim - Data final (YYYY-MM-DD) [opcional]
 * @query {string} prefeituraId - ID da prefeitura [opcional, obrigatório se não for Super Admin]
 * @query {string} status - Status da solicitação [opcional]
 * @query {string} tipoAtendimento - Tipo de atendimento [opcional]
 */
router.get('/solicitacoes-tfd', 
  verificarPermissao('gerar_relatorio_solicitacoes_tfd'),
  relatorioController.gerarRelatorioSolicitacoesTFD
);

/**
 * @route GET /api/relatorios/paciente-solicitacoes
 * @desc Gera relatório de solicitações TFD por paciente
 * @access Privado (requer permissão: gerar_relatorio_solicitacoes_tfd)
 * @query {string} formato - Formato do relatório (pdf, excel, csv) [opcional, padrão: pdf]
 * @query {string} pacienteId - ID do paciente [obrigatório]
 * @query {string} dataInicio - Data inicial (YYYY-MM-DD) [opcional]
 * @query {string} dataFim - Data final (YYYY-MM-DD) [opcional]
 * @query {string} status - Status da solicitação [opcional]
 * @query {string} tipoAtendimento - Tipo de atendimento [opcional]
 */
router.get('/paciente-solicitacoes', 
  verificarPermissao('gerar_relatorio_solicitacoes_tfd'),
  relatorioController.gerarRelatorioSolicitacoesPorPaciente
);

module.exports = router; 