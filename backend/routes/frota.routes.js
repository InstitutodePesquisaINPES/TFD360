const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const veiculoController = require('../controllers/veiculo.controller');
const motoristaController = require('../controllers/motorista.controller');
const { authMiddleware, checkPermission } = require('../middlewares/auth.middleware');
const { checkPrefeituraAccess } = require('../middlewares/prefeitura.middleware');
const upload = require('../middlewares/upload.middleware');

// Middleware para todas as rotas
router.use(authMiddleware);
router.use(checkPrefeituraAccess);

/**
 * Rotas para Veículos
 */

// Listar veículos
router.get(
  '/veiculos',
  checkPermission('listar_veiculos'),
  veiculoController.listarVeiculos
);

// Obter um veículo específico
router.get(
  '/veiculos/:id',
  checkPermission('visualizar_veiculo'),
  veiculoController.obterVeiculo
);

// Cadastrar veículo
router.post(
  '/veiculos',
  checkPermission('cadastrar_veiculo'),
  upload.single('foto'),
  [
    check('placa', 'Placa é obrigatória').notEmpty(),
    check('marca', 'Marca é obrigatória').notEmpty(),
    check('modelo', 'Modelo é obrigatório').notEmpty(),
    check('tipo', 'Tipo de veículo é obrigatório').isIn(['carro', 'van', 'micro_onibus', 'onibus', 'ambulancia', 'outro']),
    check('capacidade_passageiros', 'Capacidade de passageiros é obrigatória').isInt({ min: 1 }),
    check('quilometragem_atual', 'Quilometragem deve ser numérica').optional().isNumeric()
  ],
  veiculoController.cadastrarVeiculo
);

// Atualizar veículo
router.put(
  '/veiculos/:id',
  checkPermission('editar_veiculo'),
  upload.single('foto'),
  veiculoController.atualizarVeiculo
);

// Alterar status operacional de veículo
router.patch(
  '/veiculos/:id/status',
  checkPermission('editar_veiculo'),
  veiculoController.alterarStatusVeiculo
);

// Registrar manutenção
router.post(
  '/veiculos/:id/manutencoes',
  checkPermission('registrar_manutencao'),
  [
    check('tipo_manutencao', 'Tipo de manutenção é obrigatório').notEmpty(),
    check('data', 'Data da manutenção é obrigatória').isISO8601(),
    check('km_registrado', 'Quilometragem registrada é obrigatória').isNumeric(),
    check('descricao', 'Descrição da manutenção é obrigatória').notEmpty()
  ],
  veiculoController.registrarManutencao
);

// Listar manutenções de um veículo
router.get(
  '/veiculos/:id/manutencoes',
  checkPermission('listar_manutencoes'),
  veiculoController.listarManutencoes
);

// Excluir veículo (desativar)
router.delete(
  '/veiculos/:id',
  checkPermission('excluir_veiculo'),
  veiculoController.excluirVeiculo
);

// Listar veículos disponíveis por data
router.get(
  '/veiculos/disponiveis',
  checkPermission('listar_veiculos'),
  veiculoController.listarVeiculosDisponiveis
);

// Verificar documentação prestes a vencer
router.get(
  '/veiculos/alertas/documentos-vencendo',
  checkPermission('listar_veiculos'),
  veiculoController.verificarDocumentosVencendo
);

/**
 * Rotas para Motoristas
 */

// Listar motoristas
router.get(
  '/motoristas',
  checkPermission('listar_motoristas'),
  motoristaController.listarMotoristas
);

// Obter um motorista específico
router.get(
  '/motoristas/:id',
  checkPermission('visualizar_motorista'),
  motoristaController.obterMotorista
);

// Cadastrar motorista
router.post(
  '/motoristas',
  checkPermission('cadastrar_motorista'),
  upload.single('foto'),
  [
    check('nome', 'Nome é obrigatório').notEmpty(),
    check('cpf', 'CPF é obrigatório').notEmpty(),
    check('data_nascimento', 'Data de nascimento é obrigatória').isISO8601(),
    check('telefone', 'Telefone é obrigatório').notEmpty(),
    check('numero_cnh', 'Número da CNH é obrigatório').notEmpty(),
    check('categoria_cnh', 'Categoria da CNH é obrigatória').isIn(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']),
    check('validade_cnh', 'Validade da CNH é obrigatória').isISO8601()
  ],
  motoristaController.cadastrarMotorista
);

// Atualizar motorista
router.put(
  '/motoristas/:id',
  checkPermission('editar_motorista'),
  upload.single('foto'),
  motoristaController.atualizarMotorista
);

// Alterar status de motorista
router.patch(
  '/motoristas/:id/status',
  checkPermission('editar_motorista'),
  [
    check('status', 'Status é obrigatório').isIn(['ativo', 'ferias', 'licenca', 'inativo']),
    check('motivo_inatividade', 'Motivo da inatividade é obrigatório quando status não é ativo').if((value, { req }) => req.body.status !== 'ativo').notEmpty()
  ],
  motoristaController.alterarStatusMotorista
);

// Registrar ocorrência
router.post(
  '/motoristas/:id/ocorrencias',
  checkPermission('registrar_ocorrencia'),
  [
    check('tipo_ocorrencia', 'Tipo de ocorrência é obrigatório').notEmpty(),
    check('descricao', 'Descrição da ocorrência é obrigatória').notEmpty(),
    check('gravidade', 'Gravidade inválida').optional().isIn(['baixa', 'media', 'alta', 'critica'])
  ],
  motoristaController.registrarOcorrencia
);

// Listar ocorrências de um motorista
router.get(
  '/motoristas/:id/ocorrencias',
  checkPermission('listar_ocorrencias'),
  motoristaController.listarOcorrencias
);

// Excluir motorista (desativar)
router.delete(
  '/motoristas/:id',
  checkPermission('excluir_motorista'),
  motoristaController.excluirMotorista
);

// Listar motoristas disponíveis por data
router.get(
  '/motoristas/disponiveis',
  checkPermission('listar_motoristas'),
  motoristaController.listarMotoristasDisponiveis
);

// Verificar CNHs prestes a vencer
router.get(
  '/motoristas/alertas/cnhs-vencendo',
  checkPermission('listar_motoristas'),
  motoristaController.verificarCNHsVencendo
);

// Obter estatísticas de um motorista
router.get(
  '/motoristas/:id/estatisticas',
  checkPermission('visualizar_motorista'),
  motoristaController.estatisticasMotorista
);

module.exports = router; 