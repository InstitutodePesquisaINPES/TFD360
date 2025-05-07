const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao, verificarSuperAdmin, verificarAdmin } = require('../middlewares/auth.middleware');
const authConfig = require('../config/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/user.controller');

// Configuração de armazenamento para upload de fotos de usuários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar o diretório de fotos se não existir
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const fotosDir = path.join(uploadsDir, 'usuarios');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    
    if (!fs.existsSync(fotosDir)) {
      fs.mkdirSync(fotosDir);
    }
    
    cb(null, fotosDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome de arquivo único baseado em timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'foto-' + uniqueSuffix + extension);
  }
});

// Filtro para permitir apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Apenas arquivos de imagem são permitidos (jpeg, jpg, png, gif)'));
};

// Inicializar o multer para upload de fotos
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Rota para listar todos os tipos de perfil disponíveis
 * @route GET /api/users/perfis
 * @group Usuários - Operações com usuários
 * @returns {object} 200 - Lista de perfis
 */
router.get('/perfis', verificarToken, verificarPermissao, (req, res) => {
  const perfis = Object.entries(authConfig.roles).map(([key, value]) => ({
    id: value,
    nome: key
  }));
  
  res.json(perfis);
});

/**
 * Rota para listar todas as permissões disponíveis
 * @route GET /api/users/permissoes
 * @group Usuários - Operações com usuários
 * @returns {object} 200 - Lista de permissões
 */
router.get('/permissoes', verificarToken, verificarPermissao, (req, res) => {
  // Obter todas as permissões de todos os perfis
  const todasPermissoes = Object.values(authConfig.permissions).flat();
  
  // Remover duplicatas
  const permissoesUnicas = [...new Set(todasPermissoes)];
  
  // Formatar para retorno
  const permissoes = permissoesUnicas.map(p => ({
    id: p,
    nome: p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
  
  res.json(permissoes);
});

/**
 * Rota para listar todos os usuários
 * @route GET /api/users
 * @group Usuários - Operações com usuários
 * @param {number} pagina.query - Número da página
 * @param {number} limite.query - Limite de itens por página
 * @param {string} termo.query - Termo de busca
 * @param {string} tipo_perfil.query - Filtrar por tipo de perfil
 * @param {string} prefeitura_id.query - Filtrar por prefeitura
 * @returns {object} 200 - Lista de usuários
 * @returns {Error} 401 - Não autorizado
 */
router.get('/', verificarToken, verificarPermissao, userController.listarUsuarios);

/**
 * Rota para buscar um usuário pelo ID
 * @route GET /api/users/:id
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @returns {object} 200 - Dados do usuário
 * @returns {Error} 404 - Usuário não encontrado
 */
router.get('/:id', verificarToken, verificarPermissao, userController.buscarUsuario);

/**
 * Rota para criar um novo usuário
 * @route POST /api/users
 * @group Usuários - Operações com usuários
 * @param {file} foto.formData - Foto do usuário
 * @param {string} nome.formData.required - Nome do usuário
 * @param {string} email.formData.required - Email do usuário
 * @param {string} cpf.formData.required - CPF do usuário
 * @param {string} telefone.formData - Telefone do usuário
 * @param {string} senha.formData.required - Senha do usuário
 * @param {string} tipo_perfil.formData.required - Tipo de perfil
 * @param {string} prefeitura_id.formData - ID da prefeitura (obrigatório exceto para Super Admin)
 * @returns {object} 201 - Usuário criado
 * @returns {Error} 400 - Dados inválidos
 */
router.post('/', verificarToken, verificarPermissao, upload.single('foto'), userController.criarUsuario);

/**
 * Rota para atualizar um usuário
 * @route PUT /api/users/:id
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @param {file} foto.formData - Foto do usuário
 * @param {string} nome.formData - Nome do usuário
 * @param {string} email.formData - Email do usuário
 * @param {string} cpf.formData - CPF do usuário
 * @param {string} telefone.formData - Telefone do usuário
 * @param {string} tipo_perfil.formData - Tipo de perfil
 * @returns {object} 200 - Usuário atualizado
 * @returns {Error} 404 - Usuário não encontrado
 */
router.put('/:id', verificarToken, verificarPermissao, upload.single('foto'), userController.atualizarUsuario);

/**
 * Rota para alterar a senha de um usuário
 * @route PATCH /api/users/:id/senha
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @param {string} senha_atual.body.required - Senha atual (obrigatório se o usuário estiver alterando a própria senha)
 * @param {string} nova_senha.body.required - Nova senha
 * @returns {object} 200 - Senha alterada
 * @returns {Error} 400 - Senha atual incorreta
 * @returns {Error} 404 - Usuário não encontrado
 */
router.patch('/:id/senha', verificarToken, userController.alterarSenha);

/**
 * Rota para ativar/desativar um usuário
 * @route PATCH /api/users/:id/status
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @param {boolean} ativo.body.required - Status do usuário (true para ativo, false para inativo)
 * @returns {object} 200 - Status alterado
 * @returns {Error} 404 - Usuário não encontrado
 */
router.patch('/:id/status', verificarToken, verificarPermissao, userController.alterarStatus);

/**
 * Rota para atualizar permissões adicionais de um usuário
 * @route PATCH /api/users/:id/permissoes
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @param {array} permissoes.body.required - Lista de permissões adicionais
 * @returns {object} 200 - Permissões atualizadas
 * @returns {Error} 404 - Usuário não encontrado
 */
router.patch('/:id/permissoes', verificarToken, verificarPermissao, (req, res) => {
  // Todo: implementar controller para atualizar permissões
  res.json({ message: 'Atualizar permissões - Implementação pendente', id: req.params.id, permissoes: req.body.permissoes });
});

/**
 * Rota para remover um usuário
 * @route DELETE /api/users/:id
 * @group Usuários - Operações com usuários
 * @param {string} id.path.required - ID do usuário
 * @returns {object} 200 - Usuário removido
 * @returns {Error} 404 - Usuário não encontrado
 */
router.delete('/:id', verificarToken, verificarPermissao, userController.removerUsuario);

module.exports = router; 