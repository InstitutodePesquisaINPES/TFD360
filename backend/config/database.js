const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tfd360',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'admin',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o MySQL estabelecida com sucesso.');
    return true;
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados MySQL:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection }; 