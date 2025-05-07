const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

/**
 * Schema do Usuário
 */
const UserSchema = new Schema({
  nome: {
    type: String,
    required: [true, 'O nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, informe um email válido']
  },
  cpf: {
    type: String,
    trim: true,
    match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Por favor, informe um CPF válido no formato XXX.XXX.XXX-XX']
  },
  telefone: {
    type: String,
    trim: true
  },
  senha: {
    type: String,
    required: [true, 'A senha é obrigatória'],
    minlength: [6, 'A senha deve ter no mínimo 6 caracteres']
  },
  tipo_perfil: {
    type: String,
    required: [true, 'O tipo de perfil é obrigatório'],
    enum: {
      values: ['Super Admin', 'Admin Prefeitura', 'Gestor TFD', 'Secretario Saude', 'Motorista', 'Administrativo', 'Paciente'],
      message: 'Tipo de perfil inválido'
    }
  },
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: function() {
      // Somente Super Admin pode não ter prefeitura
      return this.tipo_perfil !== 'Super Admin';
    }
  },
  ativo: {
    type: Boolean,
    default: true
  },
  foto: {
    type: String,
    default: null
  },
  permissoes: [{
    type: String
  }],
  refresh_token: {
    type: String,
    default: null
  },
  token_reset_senha: {
    type: String,
    default: null
  },
  expiracao_token_reset_senha: {
    type: Date,
    default: null
  },
  ultimo_login: {
    type: Date,
    default: null
  },
  bloqueado_ate: {
    type: Date,
    default: null
  },
  tentativas_login: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

/**
 * Hash da senha antes de salvar
 */
UserSchema.pre('save', async function(next) {
  // Somente faz o hash da senha se ela foi modificada ou é nova
  if (!this.isModified('senha')) return next();
  
  try {
    // Gerar um salt
    const salt = await bcrypt.genSalt(10);
    // Hash da senha com o salt
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Método para comparar senhas
 * @param {string} senhaFornecida - Senha fornecida para comparação
 * @returns {boolean} - Resultado da comparação
 */
UserSchema.methods.verificarSenha = async function(senhaFornecida) {
  try {
    return await bcrypt.compare(senhaFornecida, this.senha);
  } catch (error) {
    throw new Error('Erro ao verificar senha');
  }
};

/**
 * Método para verificar se o usuário possui uma permissão específica
 * @param {string} permissao - Permissão a ser verificada
 * @returns {boolean} - Se o usuário possui a permissão
 */
UserSchema.methods.temPermissao = function(permissao) {
  return this.permissoes.includes(permissao);
};

/**
 * Método para obter todas as permissões
 * @returns {Array} - Array de permissões
 */
UserSchema.methods.obterPermissoes = function() {
  // Permissões padrão para todos os usuários
  let permissoesPadrao = ['dashboard_view'];
  
  // Permissões baseadas no tipo de perfil
  let permissoesTipo = [];
  
  switch (this.tipo_perfil) {
    case 'Super Admin':
      permissoesTipo = [
        'users_view', 'users_create', 'users_edit', 'users_delete',
        'prefeituras_view', 'prefeituras_create', 'prefeituras_edit', 'prefeituras_delete',
        'gerar_relatorio_usuarios', 'gerar_relatorio_prefeituras', 'gerar_relatorio_logs',
        'logs_view', 'admin_painel'
      ];
      break;
    case 'Admin Prefeitura':
      permissoesTipo = [
        'users_view', 'users_create', 'users_edit',
        'prefeitura_view', 'prefeitura_edit',
        'gerar_relatorio_usuarios',
        'admin_painel'
      ];
      break;
    case 'Gestor TFD':
      permissoesTipo = [
        'users_view',
        'viagens_view', 'viagens_create', 'viagens_edit',
        'pacientes_view', 'pacientes_create', 'pacientes_edit',
        'gerar_relatorio_viagens', 'gerar_relatorio_pacientes',
        'gestor_painel'
      ];
      break;
    case 'Secretario Saude':
      permissoesTipo = [
        'viagens_view', 'viagens_approve',
        'pacientes_view',
        'gerar_relatorio_viagens',
        'secretario_painel'
      ];
      break;
    case 'Motorista':
      permissoesTipo = [
        'viagens_view', 'viagens_update_status',
        'motorista_painel'
      ];
      break;
    case 'Administrativo':
      permissoesTipo = [
        'viagens_view', 'viagens_edit',
        'pacientes_view', 'pacientes_edit',
        'administrativo_painel'
      ];
      break;
    case 'Paciente':
      permissoesTipo = [
        'minhas_viagens_view',
        'meus_dados_view', 'meus_dados_edit',
        'paciente_painel'
      ];
      break;
  }
  
  // Unir permissões padrão, permissões do tipo e permissões adicionais do usuário
  return [...new Set([...permissoesPadrao, ...permissoesTipo, ...this.permissoes])];
};

/**
 * Método para verificar se o usuário está bloqueado
 * @returns {boolean} - Se o usuário está bloqueado
 */
UserSchema.methods.estaBloqueado = function() {
  if (!this.bloqueado_ate) return false;
  return new Date() < this.bloqueado_ate;
};

/**
 * Método para bloquear o usuário por tentativas de login
 * @param {number} minutos - Minutos de bloqueio
 */
UserSchema.methods.bloquearPorTentativas = async function(minutos = 15) {
  this.tentativas_login += 1;
  
  // Bloquear após 5 tentativas
  if (this.tentativas_login >= 5) {
    const bloqueadoAte = new Date();
    bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + minutos);
    this.bloqueado_ate = bloqueadoAte;
    this.tentativas_login = 0;
  }
  
  await this.save();
};

/**
 * Método para desbloquear o usuário
 */
UserSchema.methods.desbloquear = async function() {
  this.bloqueado_ate = null;
  this.tentativas_login = 0;
  await this.save();
};

/**
 * Método para gerar token de redefinição de senha
 */
UserSchema.methods.gerarTokenResetSenha = async function() {
  // Gerar token aleatório
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Configurar expiração (24 horas)
  const expiracao = new Date();
  expiracao.setHours(expiracao.getHours() + 24);
  
  // Salvar token e expiração
  this.token_reset_senha = token;
  this.expiracao_token_reset_senha = expiracao;
  
  await this.save();
  return token;
};

/**
 * Verificar se o token de redefinição de senha é válido
 * @param {string} token - Token a ser verificado
 * @returns {boolean} - Se o token é válido
 */
UserSchema.methods.verificarTokenResetSenha = function(token) {
  return (
    this.token_reset_senha === token &&
    this.expiracao_token_reset_senha > new Date()
  );
};

/**
 * Método estático para buscar usuário pelo token de redefinição de senha
 * @param {string} token - Token de redefinição de senha
 * @returns {Object} - Usuário encontrado ou null
 */
UserSchema.statics.buscarPorTokenResetSenha = async function(token) {
  return this.findOne({
    token_reset_senha: token,
    expiracao_token_reset_senha: { $gt: new Date() }
  });
};

module.exports = mongoose.model('User', UserSchema); 