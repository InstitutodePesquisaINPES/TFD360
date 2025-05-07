const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Solicitação de TFD (Tratamento Fora do Domicílio)
 */
const SolicitacaoTFDSchema = new Schema({
  // Número e identificação
  numero: {
    type: String,
    required: [true, 'Número da solicitação é obrigatório'],
    trim: true,
    unique: true
  },
  codigo_procedimento: {
    type: String,
    trim: true
  },
  prioridade: {
    type: String,
    enum: {
      values: ['normal', 'urgente', 'emergencia'],
      message: 'Prioridade deve ser: normal, urgente ou emergencia'
    },
    default: 'normal'
  },
  
  // Datas
  data_solicitacao: {
    type: Date,
    required: [true, 'Data da solicitação é obrigatória'],
    default: Date.now
  },
  data_agendamento: {
    type: Date
  },
  data_viagem: {
    type: Date
  },
  data_retorno: {
    type: Date
  },
  
  // Relações com outros modelos
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'Paciente é obrigatório']
  },
  acompanhante: {
    type: Schema.Types.ObjectId,
    ref: 'Acompanhante'
  },
  medico_solicitante: {
    nome: {
      type: String,
      required: [true, 'Nome do médico solicitante é obrigatório'],
      trim: true
    },
    crm: {
      type: String,
      required: [true, 'CRM do médico solicitante é obrigatório'],
      trim: true
    },
    especialidade: {
      type: String,
      trim: true
    },
    contato: {
      type: String,
      trim: true
    }
  },
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória']
  },
  
  // Destino e transporte
  destino: {
    cidade: {
      type: String,
      required: [true, 'Cidade de destino é obrigatória'],
      trim: true
    },
    estado: {
      type: String,
      required: [true, 'Estado de destino é obrigatório'],
      trim: true,
      minlength: [2, 'Utilize a sigla do estado com 2 caracteres'],
      maxlength: [2, 'Utilize a sigla do estado com 2 caracteres']
    },
    estabelecimento: {
      type: String,
      required: [true, 'Estabelecimento de destino é obrigatório'],
      trim: true
    },
    endereco: {
      type: String,
      trim: true
    },
    telefone: {
      type: String,
      trim: true
    }
  },
  transporte: {
    tipo: {
      type: String,
      enum: {
        values: ['terrestre', 'aereo', 'fluvial', 'outro'],
        message: 'Tipo de transporte deve ser: terrestre, aereo, fluvial ou outro'
      },
      required: [true, 'Tipo de transporte é obrigatório']
    },
    detalhes: {
      type: String,
      trim: true
    }
  },
  
  // Informações médicas
  tipo_atendimento: {
    type: String,
    enum: {
      values: ['consulta', 'exame', 'cirurgia', 'tratamento', 'retorno'],
      message: 'Tipo de atendimento deve ser: consulta, exame, cirurgia, tratamento ou retorno'
    },
    required: [true, 'Tipo de atendimento é obrigatório']
  },
  especialidade: {
    type: String,
    required: [true, 'Especialidade é obrigatória'],
    trim: true
  },
  cid: {
    type: String,
    trim: true,
    required: [true, 'CID é obrigatório']
  },
  justificativa_clinica: {
    type: String,
    required: [true, 'Justificativa clínica é obrigatória'],
    trim: true
  },
  sintomas: {
    type: String,
    trim: true
  },
  exames_realizados: [{
    nome: {
      type: String,
      trim: true
    },
    data: {
      type: Date
    },
    resultado: {
      type: String,
      trim: true
    }
  }],
  
  // Status e gerenciamento
  status: {
    type: String,
    enum: {
      values: [
        'solicitado', 
        'em_analise', 
        'aprovado', 
        'agendado', 
        'realizado', 
        'cancelado', 
        'negado'
      ],
      message: 'Status inválido'
    },
    default: 'solicitado'
  },
  status_laudo: {
    type: String,
    enum: {
      values: ['pendente', 'enviado', 'aprovado', 'negado'],
      message: 'Status do laudo inválido'
    },
    default: 'pendente'
  },
  motivo_negacao: {
    type: String,
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Acomodação
  necessita_acomodacao: {
    type: Boolean,
    default: false
  },
  tipo_acomodacao: {
    type: String,
    enum: {
      values: ['hotel', 'casa_apoio', 'hospital', 'outro', 'nao_aplicavel'],
      message: 'Tipo de acomodação inválido'
    },
    default: 'nao_aplicavel'
  },
  detalhes_acomodacao: {
    type: String,
    trim: true
  },
  
  // Ajuda de custo
  ajuda_custo: {
    aprovada: {
      type: Boolean,
      default: false
    },
    valor: {
      type: Number,
      default: 0
    },
    data_pagamento: {
      type: Date
    },
    observacoes: {
      type: String,
      trim: true
    }
  },
  
  // Histórico de alterações e comentários
  historico: [{
    data: {
      type: Date,
      default: Date.now
    },
    status_anterior: {
      type: String
    },
    status_novo: {
      type: String
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    observacao: {
      type: String,
      trim: true
    }
  }],
  comentarios: [{
    texto: {
      type: String,
      trim: true,
      required: [true, 'Texto do comentário é obrigatório']
    },
    data: {
      type: Date,
      default: Date.now
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Usuário é obrigatório']
    }
  }],
  
  // Campos de sistema
  documentacao_completa: {
    type: Boolean,
    default: false
  },
  documentacao_pendente: {
    type: [String],
    default: []
  },
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
SolicitacaoTFDSchema.index({ numero: 1 });
SolicitacaoTFDSchema.index({ paciente: 1 });
SolicitacaoTFDSchema.index({ 'destino.cidade': 1 });
SolicitacaoTFDSchema.index({ status: 1 });
SolicitacaoTFDSchema.index({ prioridade: 1 });
SolicitacaoTFDSchema.index({ prefeitura: 1 });
SolicitacaoTFDSchema.index({ data_solicitacao: -1 });
SolicitacaoTFDSchema.index({ data_agendamento: 1 });
SolicitacaoTFDSchema.index({ cid: 'text', numero: 'text', 'medico_solicitante.nome': 'text' });

// Campos virtuais
SolicitacaoTFDSchema.virtual('tempo_espera').get(function() {
  if (!this.data_solicitacao) return null;
  
  const dataAgendamento = this.data_agendamento || new Date();
  const diff = dataAgendamento - this.data_solicitacao;
  
  // Retorna o tempo de espera em dias
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

SolicitacaoTFDSchema.virtual('status_texto').get(function() {
  const statusMap = {
    'solicitado': 'Solicitado',
    'em_analise': 'Em análise',
    'aprovado': 'Aprovado',
    'agendado': 'Agendado',
    'realizado': 'Realizado',
    'cancelado': 'Cancelado',
    'negado': 'Negado'
  };
  
  return statusMap[this.status] || this.status;
});

// Relacionamentos virtuais
SolicitacaoTFDSchema.virtual('documentos', {
  ref: 'Documento',
  localField: '_id',
  foreignField: 'ref_id',
  match: { tipo_ref: 'solicitacao_tfd', status: { $ne: 'arquivado' } },
  options: { sort: { updated_at: -1 } }
});

/**
 * Verifica se a solicitação possui todos os documentos necessários
 */
SolicitacaoTFDSchema.methods.possuiTodosDocumentos = async function() {
  try {
    const Documento = mongoose.model('Documento');
    
    // Lista de documentos necessários para solicitações TFD
    const documentosNecessarios = [
      'laudo_medico',
      'encaminhamento',
      'exames'
    ];
    
    // Para procedimentos cirúrgicos, adicionar documentos específicos
    if (this.tipo_atendimento === 'cirurgia') {
      documentosNecessarios.push('autorizacao_cirurgia');
    }
    
    // Buscar documentos ativos da solicitação
    const documentos = await Documento.find({
      ref_id: this._id,
      tipo_ref: 'solicitacao_tfd',
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
 * Adiciona um registro ao histórico de alterações
 */
SolicitacaoTFDSchema.methods.adicionarHistorico = function(statusAnterior, statusNovo, observacao, usuarioId) {
  if (!this.historico) {
    this.historico = [];
  }
  
  this.historico.push({
    data: new Date(),
    status_anterior: statusAnterior,
    status_novo: statusNovo,
    usuario: usuarioId,
    observacao: observacao
  });
  
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

/**
 * Adiciona um comentário à solicitação
 */
SolicitacaoTFDSchema.methods.adicionarComentario = function(texto, usuarioId) {
  if (!this.comentarios) {
    this.comentarios = [];
  }
  
  this.comentarios.push({
    texto: texto,
    data: new Date(),
    usuario: usuarioId
  });
  
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

/**
 * Altera o status da solicitação
 */
SolicitacaoTFDSchema.methods.alterarStatus = function(novoStatus, observacao, usuarioId) {
  const statusAnterior = this.status;
  this.status = novoStatus;
  
  // Adicionar ao histórico
  this.adicionarHistorico(statusAnterior, novoStatus, observacao, usuarioId);
  
  return this;
};

/**
 * Aprova a solicitação
 */
SolicitacaoTFDSchema.methods.aprovar = function(observacao, usuarioId) {
  return this.alterarStatus('aprovado', observacao || 'Solicitação aprovada', usuarioId);
};

/**
 * Nega a solicitação
 */
SolicitacaoTFDSchema.methods.negar = function(motivo, usuarioId) {
  this.motivo_negacao = motivo;
  return this.alterarStatus('negado', `Solicitação negada. Motivo: ${motivo}`, usuarioId);
};

/**
 * Cancela a solicitação
 */
SolicitacaoTFDSchema.methods.cancelar = function(motivo, usuarioId) {
  return this.alterarStatus('cancelado', `Solicitação cancelada. Motivo: ${motivo}`, usuarioId);
};

/**
 * Agenda a solicitação
 */
SolicitacaoTFDSchema.methods.agendar = function(dataAgendamento, observacao, usuarioId) {
  this.data_agendamento = dataAgendamento;
  return this.alterarStatus('agendado', observacao || `Solicitação agendada para ${dataAgendamento.toLocaleDateString()}`, usuarioId);
};

/**
 * Marca a solicitação como realizada
 */
SolicitacaoTFDSchema.methods.marcarRealizada = function(observacao, usuarioId) {
  return this.alterarStatus('realizado', observacao || 'Procedimento realizado', usuarioId);
};

/**
 * Aprova ajuda de custo
 */
SolicitacaoTFDSchema.methods.aprovarAjudaCusto = function(valor, observacoes, usuarioId) {
  this.ajuda_custo = {
    aprovada: true,
    valor: valor,
    data_pagamento: null,
    observacoes: observacoes
  };
  
  this.usuario_ultima_atualizacao = usuarioId;
  return this;
};

/**
 * Registra pagamento de ajuda de custo
 */
SolicitacaoTFDSchema.methods.registrarPagamentoAjudaCusto = function(dataPagamento, usuarioId) {
  if (this.ajuda_custo && this.ajuda_custo.aprovada) {
    this.ajuda_custo.data_pagamento = dataPagamento || new Date();
    this.usuario_ultima_atualizacao = usuarioId;
  }
  
  return this;
};

// Métodos estáticos para busca de solicitações

/**
 * Buscar solicitações por status
 */
SolicitacaoTFDSchema.statics.buscarPorStatus = function(status, prefeituraId) {
  const query = { status };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ data_solicitacao: -1 });
};

/**
 * Buscar solicitações por paciente
 */
SolicitacaoTFDSchema.statics.buscarPorPaciente = function(pacienteId) {
  return this.find({ 
    paciente: pacienteId
  }).sort({ data_solicitacao: -1 });
};

/**
 * Buscar solicitações por destino
 */
SolicitacaoTFDSchema.statics.buscarPorDestino = function(cidade, estado, prefeituraId) {
  const query = { 
    'destino.cidade': cidade
  };
  
  if (estado) {
    query['destino.estado'] = estado;
  }
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ data_solicitacao: -1 });
};

/**
 * Buscar solicitações por prioridade
 */
SolicitacaoTFDSchema.statics.buscarPorPrioridade = function(prioridade, prefeituraId) {
  const query = { prioridade };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ data_solicitacao: -1 });
};

/**
 * Buscar solicitações por período
 */
SolicitacaoTFDSchema.statics.buscarPorPeriodo = function(dataInicio, dataFim, prefeituraId) {
  const query = { 
    data_solicitacao: { 
      $gte: dataInicio, 
      $lte: dataFim 
    }
  };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ data_solicitacao: -1 });
};

/**
 * Buscar solicitações com documentação incompleta
 */
SolicitacaoTFDSchema.statics.buscarDocumentacaoIncompleta = function(prefeituraId) {
  const query = { 
    documentacao_completa: false,
    status: { $nin: ['cancelado', 'negado', 'realizado'] }
  };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ prioridade: -1, data_solicitacao: 1 });
};

/**
 * Gerar relatório de solicitações por período e status
 */
SolicitacaoTFDSchema.statics.gerarRelatorio = async function(dataInicio, dataFim, prefeituraId) {
  const match = {
    data_solicitacao: { 
      $gte: dataInicio, 
      $lte: dataFim 
    }
  };
  
  if (prefeituraId) {
    match.prefeitura = mongoose.Types.ObjectId(prefeituraId);
  }
  
  const resultado = await this.aggregate([
    { $match: match },
    { 
      $group: {
        _id: '$status',
        quantidade: { $sum: 1 },
        solicitacoes: { $push: { id: '$_id', numero: '$numero', data: '$data_solicitacao' } }
      }
    },
    {
      $project: {
        status: '$_id',
        quantidade: 1,
        solicitacoes: 1,
        _id: 0
      }
    },
    { $sort: { quantidade: -1 } }
  ]);
  
  return resultado;
};

/**
 * Buscar solicitações aguardando análise
 */
SolicitacaoTFDSchema.statics.buscarAguardandoAnalise = function(prefeituraId) {
  const query = { 
    status: { $in: ['solicitado', 'em_analise'] }
  };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query).sort({ prioridade: -1, data_solicitacao: 1 });
};

/**
 * Buscar solicitações por texto (busca em vários campos)
 */
SolicitacaoTFDSchema.statics.buscarPorTexto = function(texto, prefeituraId) {
  const query = { $text: { $search: texto } };
  
  if (prefeituraId) {
    query.prefeitura = prefeituraId;
  }
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .select({ score: { $meta: 'textScore' } });
};

/**
 * Encontrar solicitação pelo número
 */
SolicitacaoTFDSchema.statics.buscarPorNumero = function(numero) {
  return this.findOne({ numero });
};

module.exports = mongoose.model('SolicitacaoTFD', SolicitacaoTFDSchema); 