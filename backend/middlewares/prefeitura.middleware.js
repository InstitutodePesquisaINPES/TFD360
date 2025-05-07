const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware para verificar se o usuário tem acesso à prefeitura
 * @param {Request} req - Objeto de requisição
 * @param {Response} res - Objeto de resposta
 * @param {Function} next - Próxima função de middleware
 */
const checkPrefeituraAccess = (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.usuario) {
      throw new ForbiddenError('Usuário não autenticado');
    }
    
    // Verificar se o usuário tem uma prefeitura associada
    if (!req.usuario.prefeitura_id) {
      throw new ForbiddenError('Usuário não possui uma prefeitura associada');
    }
    
    // Se estamos aqui, o usuário tem uma prefeitura associada
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar se o ID da prefeitura na rota corresponde ao do usuário
 * @param {Request} req - Objeto de requisição
 * @param {Response} res - Objeto de resposta
 * @param {Function} next - Próxima função de middleware
 */
const checkPrefeituraMatch = (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.usuario) {
      throw new ForbiddenError('Usuário não autenticado');
    }
    
    // Se o usuário for administrador do sistema, permitir acesso a qualquer prefeitura
    if (req.usuario.tipo_perfil === 'admin_sistema') {
      return next();
    }
    
    // Verificar se o ID da prefeitura na rota corresponde ao do usuário
    const prefeituraIdRota = req.params.prefeitura_id;
    if (prefeituraIdRota && prefeituraIdRota !== req.usuario.prefeitura_id.toString()) {
      throw new ForbiddenError('Acesso negado a esta prefeitura');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar se o usuário é da mesma prefeitura do recurso
 * @param {string} modelName - Nome do modelo para buscar o recurso
 * @param {string} paramName - Nome do parâmetro na URL (padrão: 'id')
 * @param {string} prefeituraField - Nome do campo de prefeitura no modelo (padrão: 'prefeitura')
 * @returns {Function} Middleware
 */
const checkResourcePrefeitura = (modelName, paramName = 'id', prefeituraField = 'prefeitura') => {
  return async (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.usuario) {
        throw new ForbiddenError('Usuário não autenticado');
      }
      
      // Se o usuário for administrador do sistema, permitir acesso a qualquer recurso
      if (req.usuario.tipo_perfil === 'admin_sistema') {
        return next();
      }
      
      // Obter o ID do recurso
      const resourceId = req.params[paramName];
      if (!resourceId) {
        return next(); // Se não há ID na rota, passar para o próximo middleware
      }
      
      // Carregar o modelo dinamicamente
      const Model = require(`../models/${modelName}`);
      
      // Buscar o recurso
      const resource = await Model.findById(resourceId);
      if (!resource) {
        // Se o recurso não existe, deixar o controlador lidar com isso
        return next();
      }
      
      // Verificar se a prefeitura do recurso corresponde à do usuário
      if (!resource[prefeituraField] || 
          resource[prefeituraField].toString() !== req.usuario.prefeitura_id.toString()) {
        throw new ForbiddenError('Acesso negado a este recurso');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkPrefeituraAccess,
  checkPrefeituraMatch,
  checkResourcePrefeitura
}; 