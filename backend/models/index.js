const User = require('./user.model');
const Prefeitura = require('./prefeitura.model');
const Session = require('./session.model');
const { sequelize } = require('../config/database');

// Removidas associações do Sequelize pois os modelos são Mongoose

// Exportar os modelos
module.exports = {
  User,
  Prefeitura,
  Session,
  sequelize
}; 