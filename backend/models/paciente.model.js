const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Paciente
 */
const PacienteSchema = new Schema({
  // Dados pessoais
  nome: {
    type: String,
    required: [true, 'Nome do paciente é obrigatório'],
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
    unique: true,
    validate: {
      validator: function(cpf) {
        // Implementar validação de CPF aqui se necessário
        return /^\d{11}$/.test(cpf.replace(/[^\d]/g, ''));
      },
      message: 'CPF inválido'
    }
  },
  rg: {
    type: String,
    trim: true,
    required: [true, 'RG é obrigatório']
  },
  sexo: {
    type: String,
    enum: {
      values: ['masculino', 'feminino', 'outro'],
      message: 'Sexo deve ser: masculino, feminino ou outro'
    },
    required: [true, 'Sexo é obrigatório']
  },
  estado_civil: {
    type: String,
    enum: {
      values: ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro'],
      message: 'Estado civil inválido'
    }
  },
  nacionalidade: {
    type: String,
    default: 'brasileira',
    trim: true
  },
  naturalidade: {
    cidade: { type: String, trim: true },
    estado: { type: String, trim: true }
  },
  
  // Contato
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  telefone_alternativo: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Simples validação de email
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Email inválido'
    }
  },
  
  // Endereço
  cep: {
    type: String,
    required: [true, 'CEP é obrigatório'],
    trim: true
  },
  logradouro: {
    type: String,
    required: [true, 'Logradouro é obrigatório'],
    trim: true
  },
  numero: {
    type: String,
    required: [true, 'Número é obrigatório'],
    trim: true
  },
  complemento: {
    type: String,
    trim: true
  },
  bairro: {
    type: String,
    required: [true, 'Bairro é obrigatório'],
    trim: true
  },
  cidade: {
    type: String,
    required: [true, 'Cidade é obrigatória'],
    trim: true
  },
  estado: {
    type: String,
    required: [true, 'Estado é obrigatório'],
    trim: true,
    minlength: [2, 'Utilize a sigla do estado com 2 caracteres'],
    maxlength: [2, 'Utilize a sigla do estado com 2 caracteres']
  },
  
  // Dados de saúde
  cartao_sus: {
    type: String,
    required: [true, 'Cartão SUS é obrigatório'],
    trim: true
  },
  convenio_medico: {
    possui: {
      type: Boolean,
      default: false
    },
    nome: {
      type: String,
      trim: true
    },
    numero: {
      type: String,
      trim: true
    }
  },
  
  condicoes_medicas: [{
    tipo: {
      type: String,
      required: [true, 'Tipo da condição médica é obrigatório'],
      trim: true
    },
    descricao: {
      type: String,
      required: [true, 'Descrição da condição médica é obrigatória'],
      trim: true
    },
    data_diagnostico: {
      type: Date
    },
    medicamentos: [{
      nome: {
        type: String,
        required: [true, 'Nome do medicamento é obrigatório'],
        trim: true
      },
      dosagem: {
        type: String,
        trim: true
      },
      posologia: {
        type: String,
        trim: true
      }
    }]
  }],
  
  alergias: [{
    tipo: {
      type: String,
      required: [true, 'Tipo da alergia é obrigatório'],
      trim: true
    },
    descricao: {
      type: String,
      required: [true, 'Descrição da alergia é obrigatória'],
      trim: true
    },
    gravidade: {
      type: String,
      enum: {
        values: ['leve', 'moderada', 'grave'],
        message: 'Gravidade da alergia inválida'
      },
      default: 'moderada'
    }
  }],
  
  necessidades_especiais: [{
    tipo: {
      type: String,
      required: [true, 'Tipo da necessidade especial é obrigatório'],
      trim: true
    },
    descricao: {
      type: String,
      required: [true, 'Descrição da necessidade especial é obrigatória'],
      trim: true
    }
  }],
  
  // Dados financeiros e socioeconômicos
  renda_familiar: {
    type: Number,
    min: [0, 'Renda familiar não pode ser negativa']
  },
  ocupacao: {
    type: String,
    trim: true
  },
  beneficio_social: {
    recebe: {
      type: Boolean,
      default: false
    },
    tipo: {
      type: String,
      trim: true
    },
    valor: {
      type: Number,
      min: [0, 'Valor do benefício não pode ser negativo']
    }
  },
  
  // Relações com outros modelos
  acompanhantes: [{
    type: Schema.Types.ObjectId,
    ref: 'Acompanhante'
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
  observacoes: {
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
PacienteSchema.index({ cpf: 1 }, { unique: true });
PacienteSchema.index({ cartao_sus: 1 });
PacienteSchema.index({ nome: 'text' });
PacienteSchema.index({ prefeitura: 1 });
PacienteSchema.index({ status: 1 });

// Campos virtuais
PacienteSchema.virtual('idade').get(function() {
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

PacienteSchema.virtual('endereco_completo').get(function() {
  if (!this.logradouro) return '';
  
  let endereco = `${this.logradouro}, ${this.numero}`;
  if (this.complemento) endereco += `, ${this.complemento}`;
  endereco += ` - ${this.bairro}, ${this.cidade}/${this.estado}`;
  if (this.cep) endereco += ` - CEP: ${this.cep}`;
  
  return endereco;
});

// Relacionamentos virtuais
PacienteSchema.virtual('solicitacoes_tfd', {
  ref: 'SolicitacaoTFD',
  localField: '_id',
  foreignField: 'paciente',
  options: { sort: { data_solicitacao: -1 } }
});

PacienteSchema.virtual('documentos', {
  ref: 'Documento',
  localField: '_id',
  foreignField: 'ref_id',
  match: { tipo_ref: 'paciente', status: { $ne: 'arquivado' } },
  options: { sort: { updated_at: -1 } }
});

/**
 * Verifica se o paciente possui todos os documentos necessários
 */
PacienteSchema.methods.possuiTodosDocumentos = async function() {
  try {
    const Documento = mongoose.model('Documento');
    
    // Lista de documentos necessários para pacientes
    const documentosNecessarios = [
      'rg_cpf', 
      'comprovante_residencia', 
      'cartao_sus'
    ];
    
    // Buscar documentos ativos do paciente
    const documentos = await Documento.find({
      ref_id: this._id,
      tipo_ref: 'paciente',
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
 * Adiciona uma condição médica ao paciente
 */
PacienteSchema.methods.adicionarCondicaoMedica = function(condicao) {
  if (!this.condicoes_medicas) {
    this.condicoes_medicas = [];
  }
  
  this.condicoes_medicas.push(condicao);
  return this;
};

/**
 * Adiciona uma alergia ao paciente
 */
PacienteSchema.methods.adicionarAlergia = function(alergia) {
  if (!this.alergias) {
    this.alergias = [];
  }
  
  this.alergias.push(alergia);
  return this;
};

/**
 * Adiciona uma necessidade especial ao paciente
 */
PacienteSchema.methods.adicionarNecessidadeEspecial = function(necessidade) {
  if (!this.necessidades_especiais) {
    this.necessidades_especiais = [];
  }
  
  this.necessidades_especiais.push(necessidade);
  return this;
};

/**
 * Adiciona um acompanhante ao paciente
 */
PacienteSchema.methods.adicionarAcompanhante = function(acompanhanteId) {
  if (!this.acompanhantes) {
    this.acompanhantes = [];
  }
  
  if (!this.acompanhantes.includes(acompanhanteId)) {
    this.acompanhantes.push(acompanhanteId);
  }
  
  return this;
};

/**
 * Bloqueia o paciente
 */
PacienteSchema.methods.bloquear = function(motivo, usuarioId) {
  this.status = 'bloqueado';
  this.motivo_bloqueio = motivo;
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

/**
 * Reativa o paciente
 */
PacienteSchema.methods.reativar = function(usuarioId) {
  this.status = 'ativo';
  this.motivo_bloqueio = null;
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

// Métodos estáticos para busca de pacientes

/**
 * Buscar pacientes por status
 */
PacienteSchema.statics.buscarPorStatus = function(status, prefeituraId) {
  const query = { status };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ nome: 1 });
};

/**
 * Buscar pacientes com documentação incompleta
 */
PacienteSchema.statics.buscarDocumentacaoIncompleta = function(prefeituraId) {
  const query = { 
    documentacao_completa: false
  };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ nome: 1 });
};

/**
 * Buscar paciente por CPF
 */
PacienteSchema.statics.buscarPorCPF = function(cpf) {
  // Remover caracteres não numéricos
  const cpfLimpo = cpf.replace(/[^\d]/g, '');
  
  return this.findOne({ 
    cpf: { $regex: cpfLimpo, $options: 'i' }
  });
};

/**
 * Buscar paciente por cartão SUS
 */
PacienteSchema.statics.buscarPorCartaoSUS = function(cartaoSUS) {
  return this.findOne({ 
    cartao_sus: { $regex: cartaoSUS.replace(/[^\d]/g, ''), $options: 'i' }
  });
};

/**
 * Buscar pacientes por nome (busca text)
 */
PacienteSchema.statics.buscarPorNome = function(nome, prefeituraId) {
  const query = { $text: { $search: nome } };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .select({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Paciente', PacienteSchema); 