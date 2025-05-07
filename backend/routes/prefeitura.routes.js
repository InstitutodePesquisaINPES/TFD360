const express = require('express');
const router = express.Router();
const prefeituraController = require('../controllers/prefeitura.controller');
const { verificarToken, verificarSuperAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração de armazenamento para upload de logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar o diretório de logos se não existir
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const logosDir = path.join(uploadsDir, 'logos');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir);
    }
    
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome de arquivo único baseado em timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + extension);
  }
});

// Filtro para permitir apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Apenas arquivos de imagem são permitidos (jpeg, jpg, png, gif, svg)'));
};

// Inicializar o multer para upload de logos
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Rota para listar todas as prefeituras
 * @route GET /api/prefeituras
 * @group Prefeituras - Operações com prefeituras
 * @param {number} pagina.query - Número da página
 * @param {number} limite.query - Limite de itens por página
 * @param {string} status.query - Filtrar por status (ativa, expirada, suspensa)
 * @param {string} termo.query - Termo de busca
 * @returns {object} 200 - Lista de prefeituras
 * @returns {Error} 401 - Não autorizado
 */
router.get('/', verificarToken, verificarSuperAdmin, prefeituraController.listarPrefeituras);

/**
 * Rota para buscar uma prefeitura pelo ID
 * @route GET /api/prefeituras/:id
 * @group Prefeituras - Operações com prefeituras
 * @param {string} id.path.required - ID da prefeitura
 * @returns {object} 200 - Dados da prefeitura
 * @returns {Error} 404 - Prefeitura não encontrada
 */
router.get('/:id', verificarToken, verificarSuperAdmin, prefeituraController.buscarPrefeitura);

/**
 * Rota para criar uma nova prefeitura
 * @route POST /api/prefeituras
 * @group Prefeituras - Operações com prefeituras
 * @param {file} logo.formData - Logo da prefeitura
 * @param {string} nome.formData.required - Nome da prefeitura
 * @param {string} cnpj.formData.required - CNPJ da prefeitura
 * @param {string} cidade.formData.required - Cidade da prefeitura
 * @param {string} estado.formData.required - Estado da prefeitura (sigla)
 * @param {string} data_validade_contrato.formData.required - Data de validade do contrato
 * @param {number} limite_usuarios.formData - Limite de usuários (default: 10)
 * @returns {object} 201 - Prefeitura criada
 * @returns {Error} 400 - Dados inválidos
 */
router.post('/', verificarToken, verificarSuperAdmin, upload.single('logo'), prefeituraController.criarPrefeitura);

/**
 * Rota para atualizar uma prefeitura
 * @route PUT /api/prefeituras/:id
 * @group Prefeituras - Operações com prefeituras
 * @param {string} id.path.required - ID da prefeitura
 * @param {file} logo.formData - Logo da prefeitura
 * @param {string} nome.formData - Nome da prefeitura
 * @param {string} cnpj.formData - CNPJ da prefeitura
 * @param {string} cidade.formData - Cidade da prefeitura
 * @param {string} estado.formData - Estado da prefeitura (sigla)
 * @param {string} data_validade_contrato.formData - Data de validade do contrato
 * @param {number} limite_usuarios.formData - Limite de usuários
 * @returns {object} 200 - Prefeitura atualizada
 * @returns {Error} 404 - Prefeitura não encontrada
 */
router.put('/:id', verificarToken, verificarSuperAdmin, upload.single('logo'), prefeituraController.atualizarPrefeitura);

/**
 * Rota para atualizar o status de uma prefeitura
 * @route PATCH /api/prefeituras/:id/status
 * @group Prefeituras - Operações com prefeituras
 * @param {string} id.path.required - ID da prefeitura
 * @param {string} status.body.required - Novo status (ativa, expirada, suspensa)
 * @returns {object} 200 - Status atualizado
 * @returns {Error} 404 - Prefeitura não encontrada
 */
router.patch('/:id/status', verificarToken, verificarSuperAdmin, prefeituraController.alterarStatusPrefeitura);

/**
 * Rota para remover uma prefeitura
 * @route DELETE /api/prefeituras/:id
 * @group Prefeituras - Operações com prefeituras
 * @param {string} id.path.required - ID da prefeitura
 * @returns {object} 200 - Prefeitura removida
 * @returns {Error} 404 - Prefeitura não encontrada
 */
router.delete('/:id', verificarToken, verificarSuperAdmin, prefeituraController.removerPrefeitura);

/**
 * Rota para obter estatísticas das prefeituras
 * @route GET /api/prefeituras/estatisticas
 * @group Prefeituras - Operações com prefeituras
 * @returns {object} 200 - Estatísticas das prefeituras
 */
router.get('/estatisticas', verificarToken, verificarSuperAdmin, prefeituraController.estatisticasPrefeituras);

/**
 * Rota para listar os módulos disponíveis
 * @route GET /api/prefeituras/modulos
 * @group Prefeituras - Operações com prefeituras
 * @returns {object} 200 - Lista de módulos
 */
router.get('/modulos', verificarToken, prefeituraController.listarModulos);

/**
 * Rota para atualizar os módulos ativos de uma prefeitura
 * @route PATCH /api/prefeituras/:id/modulos
 * @group Prefeituras - Operações com prefeituras
 * @param {string} id.path.required - ID da prefeitura
 * @param {array} modulos.body.required - Lista de IDs dos módulos ativos
 * @returns {object} 200 - Módulos atualizados
 * @returns {Error} 404 - Prefeitura não encontrada
 */
router.patch('/:id/modulos', verificarToken, verificarSuperAdmin, prefeituraController.atualizarModulos);

module.exports = router; 