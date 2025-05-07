const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema da Prefeitura
 */
const PrefeituraSchema = new Schema({
  nome: {
    type: String,
    required: [true, 'O nome da prefeitura é obrigatório'],
    trim: true
  },
  cnpj: {
    type: String,
    required: [true, 'O CNPJ é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Por favor, informe um CNPJ válido no formato XX.XXX.XXX/XXXX-XX']
  },
  cidade: {
    type: String,
    required: [true, 'A cidade é obrigatória'],
    trim: true
  },
  estado: {
    type: String,
    required: [true, 'O estado é obrigatório'],
    trim: true,
    minlength: 2,
    maxlength: 2,
    uppercase: true
  },
  endereco: {
    logradouro: {
      type: String,
      trim: true
    },
    numero: {
      type: String,
      trim: true
    },
    complemento: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
      trim: true
    },
    cep: {
      type: String,
      trim: true,
      match: [/^\d{5}-\d{3}$/, 'Por favor, informe um CEP válido no formato XXXXX-XXX']
    }
  },
  telefone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String,
    default: null
  },
  data_validade_contrato: {
    type: Date,
    required: [true, 'A data de validade do contrato é obrigatória']
  },
  limite_usuarios: {
    type: Number,
    default: 10,
    min: [1, 'Limite de usuários deve ser pelo menos 1']
  },
  status: {
    type: String,
    enum: {
      values: ['ativa', 'expirada', 'suspensa'],
      message: 'Status inválido'
    },
    default: 'ativa'
  },
  configuracoes: {
    cor_primaria: {
      type: String,
      default: '#4F46E5' // Indigo-600
    },
    cor_secundaria: {
      type: String,
      default: '#1E40AF' // Blue-800
    },
    mostrar_logo_login: {
      type: Boolean,
      default: true
    }
  },
  secretario_saude: {
    nome: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    cargo: {
      type: String,
      trim: true
    }
  },
  observacoes: {
    type: String,
    trim: true
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

/**
 * Método para verificar se a prefeitura está ativa
 * @returns {boolean} - Se a prefeitura está ativa
 */
PrefeituraSchema.methods.estaAtiva = function() {
  return this.status === 'ativa';
};

/**
 * Método para verificar se o contrato da prefeitura está válido
 * @returns {boolean} - Se o contrato está válido
 */
PrefeituraSchema.methods.contratoValido = function() {
  const hoje = new Date();
  return this.data_validade_contrato > hoje;
};

/**
 * Método para verificar se o contrato está próximo do vencimento
 * @param {number} diasAlerta - Dias para alertar antes do vencimento
 * @returns {boolean} - Se o contrato está próximo do vencimento
 */
PrefeituraSchema.methods.contratoProximoVencimento = function(diasAlerta = 30) {
  const hoje = new Date();
  const diasRestantes = Math.ceil((this.data_validade_contrato - hoje) / (1000 * 60 * 60 * 24));
  return diasRestantes > 0 && diasRestantes <= diasAlerta;
};

/**
 * Método para renovar contrato
 * @param {Date} novaData - Nova data de validade
 * @param {number} novoLimite - Novo limite de usuários (opcional)
 */
PrefeituraSchema.methods.renovarContrato = async function(novaData, novoLimite = null) {
  this.data_validade_contrato = novaData;
  this.status = 'ativa';
  
  if (novoLimite !== null) {
    this.limite_usuarios = novoLimite;
  }
  
  await this.save();
};

/**
 * Método para ativar a prefeitura
 */
PrefeituraSchema.methods.ativar = async function() {
  this.status = 'ativa';
  await this.save();
};

/**
 * Método para suspender a prefeitura
 */
PrefeituraSchema.methods.suspender = async function() {
  this.status = 'suspensa';
  await this.save();
};

/**
 * Método para atualizar status baseado na data de validade
 */
PrefeituraSchema.methods.atualizarStatus = async function() {
  const hoje = new Date();
  if (this.data_validade_contrato < hoje && this.status === 'ativa') {
    this.status = 'expirada';
    await this.save();
  }
};

/**
 * Método para verificar se atingiu o limite de usuários
 * @param {number} usuariosAtuais - Número atual de usuários
 * @returns {boolean} - Se atingiu o limite
 */
PrefeituraSchema.methods.atingiuLimiteUsuarios = function(usuariosAtuais) {
  return usuariosAtuais >= this.limite_usuarios;
};

/**
 * Método estático para buscar todas as prefeituras ativas
 */
PrefeituraSchema.statics.buscarAtivas = function() {
  return this.find({ status: 'ativa' });
};

/**
 * Método estático para buscar prefeituras com contrato próximo do vencimento
 * @param {number} diasAlerta - Dias para alertar antes do vencimento
 */
PrefeituraSchema.statics.buscarProximasVencimento = function(diasAlerta = 30) {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + diasAlerta);
  
  return this.find({
    status: 'ativa',
    data_validade_contrato: {
      $gt: hoje,
      $lte: limite
    }
  });
};

module.exports = mongoose.model('Prefeitura', PrefeituraSchema); 