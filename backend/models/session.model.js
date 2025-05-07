const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de Sessão
 * Armazena tokens de atualização (refresh tokens) para autenticação persistente
 */
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  device_info: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Método para verificar se o token ainda é válido
Session.prototype.isValid = function() {
  return this.is_valid && new Date(this.expires_at) > new Date();
};

// Método para invalidar o token
Session.prototype.invalidate = async function() {
  this.is_valid = false;
  return this.save();
};

module.exports = Session; 