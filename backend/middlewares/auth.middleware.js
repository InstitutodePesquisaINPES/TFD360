const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { User, Prefeitura } = require('../models');

/**
 * Middleware para verificar token JWT
 * Adiciona dados do usuário autenticado à requisição se o token for válido
 */
exports.verificarToken = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }
    
    // Verificar formato do token (Bearer <token>)
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ message: 'Erro no formato do token' });
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ message: 'Token com formato inválido' });
    }
    
    // Verificar e decodificar o token
    jwt.verify(token, authConfig.secret, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expirado' });
        }
        
        return res.status(401).json({ message: 'Token inválido' });
      }
      
      // Buscar usuário no banco de dados
      const userId = decoded.id;
      const user = await User.findById(userId).populate('prefeitura');
      
      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      if (!user.ativo) {
        return res.status(401).json({ message: 'Usuário inativo ou bloqueado' });
      }
      
      // Verificar se o usuário está bloqueado
      if (user.estaBloqueado()) {
        return res.status(401).json({ 
          message: 'Usuário bloqueado temporariamente. Tente novamente mais tarde.',
          bloqueadoAte: user.bloqueado_ate
        });
      }
      
      // Verificar se a prefeitura está ativa (para usuários não Super Admin)
      if (user.tipo_perfil !== 'Super Admin' && user.prefeitura) {
        const prefeitura = user.prefeitura;
        
        if (!prefeitura.estaAtiva()) {
          return res.status(401).json({ message: 'Prefeitura inativa' });
        }
        
        if (!prefeitura.contratoValido()) {
          return res.status(401).json({ message: 'Contrato da prefeitura expirado' });
        }
      }
      
      // Adicionar dados do usuário à requisição
      req.userId = user._id;
      req.userTipo = user.tipo_perfil;
      req.userPermissions = user.obterPermissoes();
      req.userPrefeituraId = user.prefeitura ? user.prefeitura._id : null;
      req.user = user;
      
      return next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Middleware para verificar permissões
 * @param {string|string[]} permissoes - Permissão ou array de permissões necessárias
 */
exports.verificarPermissao = (permissoes) => {
  return (req, res, next) => {
    // Verificar se o middleware de autenticação foi executado antes
    if (!req.userId || !req.userPermissions) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    // Converter para array se for uma string única
    const permissoesRequeridas = Array.isArray(permissoes) ? permissoes : [permissoes];
    
    // Super Admin tem todas as permissões
    if (req.userTipo === 'Super Admin') {
      return next();
    }
    
    // Verificar se o usuário tem pelo menos uma das permissões requeridas
    const temPermissao = permissoesRequeridas.some(perm => 
      req.userPermissions.includes(perm)
    );
    
    if (!temPermissao) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem permissão para realizar esta ação',
        permissoesRequeridas
      });
    }
    
    return next();
  };
};

/**
 * Middleware para verificar se o usuário é Super Admin
 */
exports.verificarSuperAdmin = (req, res, next) => {
  // Verificar se o middleware de autenticação foi executado antes
  if (!req.userId || !req.userTipo) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  if (req.userTipo !== 'Super Admin') {
    return res.status(403).json({ message: 'Acesso restrito a Super Admin' });
  }
  
  return next();
};

/**
 * Middleware para verificar se o usuário é Admin da Prefeitura ou Super Admin
 */
exports.verificarAdmin = (req, res, next) => {
  // Verificar se o middleware de autenticação foi executado antes
  if (!req.userId || !req.userTipo) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  if (req.userTipo !== 'Super Admin' && req.userTipo !== 'Admin Prefeitura') {
    return res.status(403).json({ message: 'Acesso restrito a usuários Admin' });
  }
  
  return next();
};

/**
 * Middleware para verificar se o usuário pertence à mesma prefeitura do recurso
 * Requer que o ID da prefeitura do recurso esteja em req.params.prefeituraId
 */
exports.verificarMesmaPrefeitura = (req, res, next) => {
  // Verificar se o middleware de autenticação foi executado antes
  if (!req.userId || !req.userPrefeituraId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  // Super Admin pode acessar qualquer prefeitura
  if (req.userTipo === 'Super Admin') {
    return next();
  }
  
  const prefeituraIdRecurso = req.params.prefeituraId || req.body.prefeituraId;
  
  if (!prefeituraIdRecurso) {
    return res.status(400).json({ message: 'ID da prefeitura não fornecido' });
  }
  
  // Verificar se o usuário pertence à mesma prefeitura do recurso
  if (req.userPrefeituraId.toString() !== prefeituraIdRecurso.toString()) {
    return res.status(403).json({ message: 'Acesso negado. Você não pode acessar recursos de outra prefeitura' });
  }
  
  return next();
}; 