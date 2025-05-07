const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Acompanhante
 */
const AcompanhanteSchema = new Schema({
  // Dados pessoais
  nome: {
    type: String,
    required: [true, 'Nome do acompanhante é obrigatório'],
    trim: true
  },
  data_nascimento: {
    type: Date,
    required: [true, 'Data de nascimento é obrigatória'],
    validate: {
      validator: function(data) {
        return data <= new Date();
      },
      message: 'Data de nascimento não pode ser futura'
    }
  },
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    trim: true,
    validate: {
      validator: function(cpf) {
        // Validação básica de CPF
        return /^\d{11}$/.test(cpf.replace(/[^\d]/g, ''));
      },
      message: 'CPF inválido'
    }
  },
  rg: {
    type: String,
    required: [true, 'RG é obrigatório'],
    trim: true
  },
  sexo: {
    type: String,
    enum: {
      values: ['masculino', 'feminino', 'outro'],
      message: 'Sexo deve ser: masculino, feminino ou outro'
    },
    required: [true, 'Sexo é obrigatório']
  },
  
  // Contato
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Email inválido'
    }
  },
  
  // Endereço (pode ser o mesmo do paciente)
  endereco_mesmo_paciente: {
    type: Boolean,
    default: true
  },
  cep: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    }
  },
  logradouro: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    }
  },
  numero: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    }
  },
  complemento: {
    type: String,
    trim: true
  },
  bairro: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    }
  },
  cidade: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    }
  },
  estado: {
    type: String,
    trim: true,
    required: function() {
      return !this.endereco_mesmo_paciente;
    },
    minlength: [2, 'Utilize a sigla do estado com 2 caracteres'],
    maxlength: [2, 'Utilize a sigla do estado com 2 caracteres']
  },
  
  // Relação com o paciente
  relacao_paciente: {
    type: String,
    enum: {
      values: ['conjuge', 'pai', 'mae', 'filho', 'filha', 'irmao', 'irma', 'outro'],
      message: 'Relação com o paciente inválida'
    },
    required: [true, 'Relação com o paciente é obrigatória']
  },
  descricao_relacao: {
    type: String,
    trim: true,
    required: function() {
      return this.relacao_paciente === 'outro';
    }
  },
  
  // Informações adicionais
  cartao_sus: {
    type: String,
    trim: true
  },
  necessidades_especiais: {
    possui: {
      type: Boolean,
      default: false
    },
    descricao: {
      type: String,
      trim: true
    }
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Relações com outros modelos
  pacientes: [{
    type: Schema.Types.ObjectId,
    ref: 'Paciente'
  }],
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória']
  },
  
  // Status e gerenciamento
  status: {
    type: String,
    enum: {
      values: ['ativo', 'inativo', 'bloqueado'],
      message: 'Status inválido'
    },
    default: 'ativo'
  },
  motivo_bloqueio: {
    type: String,
    trim: true
  },
  documentacao_completa: {
    type: Boolean,
    default: false
  },
  documentacao_pendente: {
    type: [String],
    default: []
  },
  
  // Campos de sistema
  usuario_cadastro: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário de cadastro é obrigatório']
  },
  usuario_ultima_atualizacao: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
AcompanhanteSchema.index({ cpf: 1 });
AcompanhanteSchema.index({ nome: 'text' });
AcompanhanteSchema.index({ status: 1 });
AcompanhanteSchema.index({ prefeitura: 1 });
AcompanhanteSchema.index({ pacientes: 1 });

// Campos virtuais
AcompanhanteSchema.virtual('idade').get(function() {
  if (!this.data_nascimento) return null;
  
  const hoje = new Date();
  const nascimento = new Date(this.data_nascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  // Ajustar idade se ainda não fez aniversário este ano
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
});

AcompanhanteSchema.virtual('endereco_completo').get(function() {
  if (this.endereco_mesmo_paciente || !this.logradouro) return '';
  
  let endereco = `${this.logradouro}, ${this.numero}`;
  if (this.complemento) endereco += `, ${this.complemento}`;
  endereco += ` - ${this.bairro}, ${this.cidade}/${this.estado}`;
  if (this.cep) endereco += ` - CEP: ${this.cep}`;
  
  return endereco;
});

// Relacionamentos virtuais
AcompanhanteSchema.virtual('solicitacoes_tfd', {
  ref: 'SolicitacaoTFD',
  localField: '_id',
  foreignField: 'acompanhante',
  options: { sort: { data_solicitacao: -1 } }
});

AcompanhanteSchema.virtual('documentos', {
  ref: 'Documento',
  localField: '_id',
  foreignField: 'ref_id',
  match: { tipo_ref: 'acompanhante', status: { $ne: 'arquivado' } },
  options: { sort: { updated_at: -1 } }
});

/**
 * Verifica se o acompanhante possui todos os documentos necessários
 */
AcompanhanteSchema.methods.possuiTodosDocumentos = async function() {
  try {
    const Documento = mongoose.model('Documento');
    
    // Lista de documentos necessários para acompanhantes
    const documentosNecessarios = [
      'rg_cpf'
    ];
    
    // Buscar documentos ativos do acompanhante
    const documentos = await Documento.find({
      ref_id: this._id,
      tipo_ref: 'acompanhante',
      status: 'ativo'
    });
    
    // Verificar documentos existentes
    const tiposDocumentos = documentos.map(doc => doc.tipo_documento);
    const docsCompletos = documentosNecessarios.every(docNecessario => 
      tiposDocumentos.includes(docNecessario)
    );
    
    // Atualizar status
    this.documentacao_completa = docsCompletos;
    
    // Lista de documentos pendentes
    if (!docsCompletos) {
      this.documentacao_pendente = documentosNecessarios.filter(docNecessario => 
        !tiposDocumentos.includes(docNecessario)
      );
    } else {
      this.documentacao_pendente = [];
    }
    
    await this.save();
    return docsCompletos;
  } catch (error) {
    console.error('Erro ao verificar documentos:', error);
    return false;
  }
};

/**
 * Adiciona um paciente ao acompanhante
 */
AcompanhanteSchema.methods.adicionarPaciente = function(pacienteId) {
  if (!this.pacientes) {
    this.pacientes = [];
  }
  
  if (!this.pacientes.includes(pacienteId)) {
    this.pacientes.push(pacienteId);
  }
  
  return this;
};

/**
 * Remove um paciente do acompanhante
 */
AcompanhanteSchema.methods.removerPaciente = function(pacienteId) {
  if (this.pacientes && this.pacientes.length > 0) {
    this.pacientes = this.pacientes.filter(id => id.toString() !== pacienteId.toString());
  }
  
  return this;
};

/**
 * Bloqueia o acompanhante
 */
AcompanhanteSchema.methods.bloquear = function(motivo, usuarioId) {
  this.status = 'bloqueado';
  this.motivo_bloqueio = motivo;
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

/**
 * Reativa o acompanhante
 */
AcompanhanteSchema.methods.reativar = function(usuarioId) {
  this.status = 'ativo';
  this.motivo_bloqueio = null;
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

// Métodos estáticos para busca de acompanhantes

/**
 * Buscar acompanhantes por status
 */
AcompanhanteSchema.statics.buscarPorStatus = function(status, prefeituraId) {
  const query = { status };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ nome: 1 });
};

/**
 * Buscar acompanhantes com documentação incompleta
 */
AcompanhanteSchema.statics.buscarDocumentacaoIncompleta = function(prefeituraId) {
  const query = { 
    documentacao_completa: false
  };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ nome: 1 });
};

/**
 * Buscar acompanhante por CPF
 */
AcompanhanteSchema.statics.buscarPorCPF = function(cpf) {
  // Remover caracteres não numéricos
  const cpfLimpo = cpf.replace(/[^\d]/g, '');
  
  return this.findOne({ 
    cpf: { $regex: cpfLimpo, $options: 'i' }
  });
};

/**
 * Buscar acompanhantes por nome (busca text)
 */
AcompanhanteSchema.statics.buscarPorNome = function(nome, prefeituraId) {
  const query = { $text: { $search: nome } };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .select({ score: { $meta: 'textScore' } });
};

/**
 * Buscar acompanhantes por paciente
 */
AcompanhanteSchema.statics.buscarPorPaciente = function(pacienteId) {
  return this.find({ 
    pacientes: pacienteId,
    status: 'ativo'
  }).sort({ nome: 1 });
};

module.exports = mongoose.model('Acompanhante', AcompanhanteSchema); 