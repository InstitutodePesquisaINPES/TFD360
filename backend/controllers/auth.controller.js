const jwt = require('jsonwebtoken');
const { User, Session, Prefeitura } = require('../models');
const authConfig = require('../config/auth');
const bcrypt = require('bcrypt');
const LogAcesso = require('../models/logAcesso.model');

/**
 * Gerar tokens de acesso e atualização
 * @param {object} user - Usuário autenticado
 * @param {string} userAgent - User-Agent do cliente
 * @param {string} ipAddress - Endereço IP do cliente
 */
const generateTokens = async (user, userAgent, ipAddress) => {
  // Calcular data de expiração do refresh token
  const refreshExpires = new Date();
  refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 dias

  // Gerar token de acesso (JWT)
  const accessToken = jwt.sign(
    { id: user._id, tipo_perfil: user.tipo_perfil },
    authConfig.secret,
    { expiresIn: authConfig.expiresIn }
  );

  // Gerar token de atualização (Refresh Token)
  const refreshToken = jwt.sign(
    { id: user._id, tipo_perfil: user.tipo_perfil },
    authConfig.refreshSecret || authConfig.secret,
    { expiresIn: authConfig.refreshExpiresIn }
  );

  // Armazenar o refresh token no banco de dados
  await Session.create({
    user_id: user._id,
    refresh_token: refreshToken,
    expires_at: refreshExpires,
    user_agent: userAgent,
    ip_address: ipAddress,
    device_info: {
      userAgent,
      ipAddress
    },
    last_used_at: new Date()
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: authConfig.expiresIn
  };
};

/**
 * Controller para login de usuário
 */
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar o usuário pelo email (adaptado para Mongoose)
    const user = await User.findOne({ email }).populate('prefeitura');

    // Verificar se o usuário existe
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({
        error: true,
        message: 'Usuário inativo ou bloqueado'
      });
    }

    // Verificar se a senha está correta
    const senhaCorreta = await user.verificarSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        error: true,
        message: 'Credenciais inválidas'
      });
    }

    // Se o usuário estiver associado a uma prefeitura, verificar se está ativa
    if (user.prefeitura) {
      if (!user.prefeitura.estaAtiva()) {
        return res.status(401).json({
          error: true,
          message: 'A prefeitura associada está inativa ou com contrato expirado'
        });
      }
    }

    // Atualizar data do último login
    user.ultimo_login = new Date();
    await user.save();

    // Registrar log de acesso
    await LogAcesso.create({
      usuario_id: user._id,
      prefeitura_id: user.prefeitura ? user.prefeitura._id : null,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      acao: 'login'
    });

    // Gerar tokens de acesso e atualização
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const tokens = await generateTokens(user, userAgent, ipAddress);

    // Preparar dados do usuário para retorno
    const userData = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      tipo_perfil: user.tipo_perfil,
      foto: user.foto,
      prefeitura: user.prefeitura ? {
        id: user.prefeitura._id,
        nome: user.prefeitura.nome,
        logo: user.prefeitura.logo
      } : null,
      permissoes: user.obterPermissoes()
    };

    // Retornar tokens e dados do usuário
    return res.json({
      user: userData,
      ...tokens
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao processar login',
      details: error.message
    });
  }
};

/**
 * Controller para atualizar o token (refresh token)
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: true,
        message: 'Refresh token não fornecido'
      });
    }

    // Verificar se o refresh token existe e é válido no banco de dados (adaptado para Mongoose)
    const session = await Session.findOne({
      refresh_token: refreshToken,
      is_valid: true
    });

    if (!session) {
      return res.status(401).json({
        error: true,
        message: 'Refresh token inválido ou expirado'
      });
    }

    // Verificar se o token já expirou
    if (new Date(session.expires_at) < new Date()) {
      session.is_valid = false;
      await session.save();
      return res.status(401).json({
        error: true,
        message: 'Refresh token expirado'
      });
    }

    // Buscar o usuário associado ao token (adaptado para Mongoose)
    const user = await User.findById(session.user_id).populate('prefeitura');

    if (!user || !user.ativo) {
      session.is_valid = false;
      await session.save();
      return res.status(401).json({
        error: true,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Se o usuário estiver associado a uma prefeitura, verificar se está ativa
    if (user.prefeitura) {
      if (!user.prefeitura.estaAtiva()) {
        session.is_valid = false;
        await session.save();
        return res.status(401).json({
          error: true,
          message: 'A prefeitura associada está inativa ou com contrato expirado'
        });
      }
    }

    // Invalidar o refresh token atual
    session.is_valid = false;
    await session.save();

    // Gerar novos tokens
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const tokens = await generateTokens(user, userAgent, ipAddress);

    // Retornar os novos tokens
    return res.json(tokens);
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao processar refresh token',
      details: error.message
    });
  }
};

/**
 * Controller para logout de usuário
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: true,
        message: 'Refresh token não fornecido'
      });
    }

    // Invalidar o refresh token (adaptado para Mongoose)
    await Session.updateMany(
      { refresh_token: refreshToken },
      { is_valid: false }
    );

    // Registrar log de logout
    await LogAcesso.create({
      usuario_id: req.userId,
      prefeitura_id: req.userPrefeituraId,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      acao: 'logout'
    });

    return res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao processar logout',
      details: error.message
    });
  }
};

/**
 * Controller para obter informações do usuário autenticado
 */
const userInfo = async (req, res) => {
  try {
    // O middleware de autenticação já adicionou o usuário à requisição
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }

    // Preparar dados do usuário para retorno
    const userData = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone,
      tipo_perfil: user.tipo_perfil,
      foto: user.foto,
      prefeitura: user.prefeitura ? {
        id: user.prefeitura._id,
        nome: user.prefeitura.nome,
        logo: user.prefeitura.logo
      } : null,
      permissoes: user.obterPermissoes(),
      ultimo_login: user.ultimo_login
    };

    return res.json(userData);
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao buscar informações do usuário',
      details: error.message
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  userInfo
}; 