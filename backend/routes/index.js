const express = require('express');
const router = express.Router();

// Importação das rotas
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const prefeituraRoutes = require('./prefeitura.routes');
const relatorioRoutes = require('./relatorio.routes');
const agendamentoRelatorioRoutes = require('./agendamento-relatorio.routes');
const documentoRoutes = require('./documento.routes');
const frotaRoutes = require('./frota.routes');

// Definição das rotas base
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/prefeituras', prefeituraRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/agendamento-relatorios', agendamentoRelatorioRoutes);
router.use('/documentos', documentoRoutes);
router.use('/frota', frotaRoutes);

module.exports = router; 