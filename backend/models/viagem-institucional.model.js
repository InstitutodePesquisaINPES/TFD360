const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Viagem Institucional para deslocamentos administrativos
 * Utilizado no módulo de Logística Institucional
 */
const ViagemInstitucionalSchema = new Schema({
  // Dados básicos da viagem
  data_viagem: {
    type: Date,
    required: [true, 'Data da viagem é obrigatória'],
    validate: {
      validator: function(data) {
        return data >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      message: 'Data da viagem não pode ser no passado'
    }
  },
  horario_saida: {
    type: String,
    required: [true, 'Horário de saída é obrigatório'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de horário inválido (HH:MM)']
  },
  horario_previsto_retorno: {
    type: String,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de horário inválido (HH:MM)']
  },
  
  // Informações de destino
  cidade_destino: {
    type: String,
    required: [true, 'Cidade de destino é obrigatória'],
    trim: true
  },
  estado_destino: {
    type: String,
    required: [true, 'Estado de destino é obrigatório'],
    trim: true,
    minlength: [2, 'Utilize a sigla do estado com 2 caracteres'],
    maxlength: [2, 'Utilize a sigla do estado com 2 caracteres'],
    uppercase: true
  },
  local_destino: {
    type: String,
    required: [true, 'Local de destino é obrigatório'],
    trim: true
  },
  endereco_destino: {
    type: String,
    trim: true
  },
  
  // Tipo e propósito da viagem
  tipo_viagem: {
    type: String,
    required: [true, 'Tipo de viagem é obrigatório'],
    enum: {
      values: ['administrativa', 'transporte_documentos', 'reuniao', 'capacitacao', 'outros'],
      message: 'Tipo de viagem deve ser: administrativa, transporte_documentos, reuniao, capacitacao ou outros'
    }
  },
  proposito: {
    type: String,
    required: [true, 'Propósito da viagem é obrigatório'],
    trim: true
  },
  numero_processo: {
    type: String,
    trim: true
  },
  urgencia: {
    type: Boolean,
    default: false
  },
  
  // Veículo e motorista
  veiculo: {
    type: Schema.Types.ObjectId,
    ref: 'Veiculo',
    required: [true, 'Veículo é obrigatório']
  },
  motorista: {
    type: Schema.Types.ObjectId,
    ref: 'Motorista',
    required: [true, 'Motorista é obrigatório']
  },
  
  // Lista de passageiros
  passageiros: [{
    servidor: {
      type: Schema.Types.ObjectId,
      ref: 'Servidor',
      required: true
    },
    cargo: {
      type: String,
      trim: true
    },
    departamento: {
      type: String,
      trim: true
    },
    responsavel_viagem: {
      type: Boolean,
      default: false
    },
    telefone_contato: {
      type: String,
      trim: true
    },
    presente: {
      type: Boolean,
      default: false
    },
    observacao: {
      type: String,
      trim: true
    }
  }],
  
  // Lista de documentos a serem transportados (quando aplicável)
  documentos: [{
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    numero_protocolo: {
      type: String,
      trim: true
    },
    departamento_origem: {
      type: String,
      trim: true
    },
    departamento_destino: {
      type: String,
      trim: true
    },
    tipo_documento: {
      type: String,
      enum: {
        values: ['oficio', 'processo', 'relatorio', 'material', 'outros'],
        message: 'Tipo de documento inválido'
      },
      default: 'outros'
    },
    urgente: {
      type: Boolean,
      default: false
    },
    confidencial: {
      type: Boolean,
      default: false
    },
    recebido: {
      type: Boolean,
      default: false
    },
    data_recebimento: {
      type: Date
    },
    assinatura_recebimento: {
      type: String,
      trim: true
    }
  }],
  
  // Status e informações adicionais
  status: {
    type: String,
    enum: {
      values: ['agendada', 'autorizada', 'em_andamento', 'concluida', 'cancelada'],
      message: 'Status inválido'
    },
    default: 'agendada'
  },
  observacoes: {
    type: String,
    trim: true
  },
  motivo_cancelamento: {
    type: String,
    trim: true
  },
  km_inicial: {
    type: Number,
    min: [0, 'Quilometragem inicial não pode ser negativa']
  },
  km_final: {
    type: Number,
    min: [0, 'Quilometragem final não pode ser negativa'],
    validate: {
      validator: function(km_final) {
        if (this.km_inicial === undefined || this.km_inicial === null) return true;
        if (km_final === undefined || km_final === null) return true;
        return km_final >= this.km_inicial;
      },
      message: 'Quilometragem final deve ser maior ou igual à quilometragem inicial'
    }
  },
  consumo_combustivel: {
    type: Number,
    min: [0, 'Consumo de combustível não pode ser negativo']
  },
  
  // Aprovações administrativas
  autorizador: {
    type: Schema.Types.ObjectId,
    ref: 'Servidor'
  },
  data_autorizacao: {
    type: Date
  },
  observacao_autorizacao: {
    type: String,
    trim: true
  },
  
  // Timestamps e relações
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
  },
  departamento: {
    type: Schema.Types.ObjectId,
    ref: 'Departamento'
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

// Índices para melhorar performance
ViagemInstitucionalSchema.index({ data_viagem: 1, prefeitura: 1 });
ViagemInstitucionalSchema.index({ motorista: 1, data_viagem: 1 });
ViagemInstitucionalSchema.index({ veiculo: 1, data_viagem: 1 });
ViagemInstitucionalSchema.index({ status: 1 });
ViagemInstitucionalSchema.index({ 'passageiros.servidor': 1 });
ViagemInstitucionalSchema.index({ departamento: 1 });

// Método para verificar disponibilidade de veículo e motorista
ViagemInstitucionalSchema.statics.verificarDisponibilidade = async function(viagemData, viagemId = null) {
  try {
    const { data_viagem, veiculo, motorista } = viagemData;
    
    // Criar data de início e fim para comparação (mesma data, meia noite a meia noite)
    const dataInicio = new Date(data_viagem);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data_viagem);
    dataFim.setHours(23, 59, 59, 999);
    
    // Consulta base para verificar disponibilidade
    const query = {
      data_viagem: { $gte: dataInicio, $lte: dataFim },
      status: { $nin: ['cancelada', 'concluida'] }
    };
    
    // Se for edição, excluir a própria viagem da verificação
    if (viagemId) {
      query._id = { $ne: viagemId };
    }
    
    // Verificar disponibilidade do veículo (tanto em viagens institucionais quanto TFD)
    const viagemVeiculoExistente = await this.findOne({
      ...query,
      veiculo
    });
    
    if (viagemVeiculoExistente) {
      return {
        disponivel: false,
        mensagem: 'Veículo já está alocado para outra viagem institucional nesta data',
        conflito: 'veiculo'
      };
    }
    
    // Verificar nas viagens TFD também (usando o modelo de Viagem)
    const Viagem = mongoose.model('Viagem');
    const viagemTFDVeiculoExistente = await Viagem.findOne({
      'data_viagem': { $gte: dataInicio, $lte: dataFim },
      'status': { $nin: ['cancelada', 'concluida'] },
      'veiculo': veiculo
    });
    
    if (viagemTFDVeiculoExistente) {
      return {
        disponivel: false,
        mensagem: 'Veículo já está alocado para uma viagem TFD nesta data',
        conflito: 'veiculo'
      };
    }
    
    // Verificar disponibilidade do motorista (tanto em viagens institucionais quanto TFD)
    const viagemMotoristaExistente = await this.findOne({
      ...query,
      motorista
    });
    
    if (viagemMotoristaExistente) {
      return {
        disponivel: false,
        mensagem: 'Motorista já está alocado para outra viagem institucional nesta data',
        conflito: 'motorista'
      };
    }
    
    const viagemTFDMotoristaExistente = await Viagem.findOne({
      'data_viagem': { $gte: dataInicio, $lte: dataFim },
      'status': { $nin: ['cancelada', 'concluida'] },
      'motorista': motorista
    });
    
    if (viagemTFDMotoristaExistente) {
      return {
        disponivel: false,
        mensagem: 'Motorista já está alocado para uma viagem TFD nesta data',
        conflito: 'motorista'
      };
    }
    
    return {
      disponivel: true,
      mensagem: 'Veículo e motorista disponíveis para a data selecionada'
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    throw error;
  }
};

// Método para iniciar a viagem
ViagemInstitucionalSchema.methods.iniciarViagem = async function(kmInicial, observacao) {
  if (this.status !== 'autorizada') {
    throw new Error('Apenas viagens autorizadas podem ser iniciadas');
  }
  
  this.status = 'em_andamento';
  this.km_inicial = kmInicial;
  
  if (observacao) {
    this.observacoes = this.observacoes 
      ? `${this.observacoes}\n[${new Date().toLocaleString()}] Início: ${observacao}`
      : `[${new Date().toLocaleString()}] Início: ${observacao}`;
  }
  
  await this.save();
  return this;
};

// Método para finalizar a viagem
ViagemInstitucionalSchema.methods.finalizarViagem = async function(kmFinal, consumoCombustivel, observacao) {
  if (this.status !== 'em_andamento') {
    throw new Error('Apenas viagens em andamento podem ser finalizadas');
  }
  
  if (!kmFinal || kmFinal <= 0) {
    throw new Error('Quilometragem final é obrigatória');
  }
  
  if (this.km_inicial && kmFinal <= this.km_inicial) {
    throw new Error('Quilometragem final deve ser maior que a inicial');
  }
  
  this.status = 'concluida';
  this.km_final = kmFinal;
  
  if (consumoCombustivel) {
    this.consumo_combustivel = consumoCombustivel;
  }
  
  if (observacao) {
    this.observacoes = this.observacoes 
      ? `${this.observacoes}\n[${new Date().toLocaleString()}] Conclusão: ${observacao}`
      : `[${new Date().toLocaleString()}] Conclusão: ${observacao}`;
  }
  
  await this.save();
  return this;
};

// Método para autorizar a viagem
ViagemInstitucionalSchema.methods.autorizar = async function(autorizadorId, observacao) {
  if (this.status !== 'agendada') {
    throw new Error('Apenas viagens agendadas podem ser autorizadas');
  }
  
  this.status = 'autorizada';
  this.autorizador = autorizadorId;
  this.data_autorizacao = new Date();
  
  if (observacao) {
    this.observacao_autorizacao = observacao;
  }
  
  await this.save();
  return this;
};

// Método para cancelar a viagem
ViagemInstitucionalSchema.methods.cancelar = async function(motivo) {
  if (['concluida', 'cancelada'].includes(this.status)) {
    throw new Error(`Não é possível cancelar uma viagem ${this.status}`);
  }
  
  if (!motivo) {
    throw new Error('Motivo do cancelamento é obrigatório');
  }
  
  this.status = 'cancelada';
  this.motivo_cancelamento = motivo;
  
  await this.save();
  return this;
};

// Método para adicionar passageiro
ViagemInstitucionalSchema.methods.adicionarPassageiro = async function(servidorData) {
  if (['concluida', 'cancelada', 'em_andamento'].includes(this.status)) {
    throw new Error(`Não é possível adicionar passageiros a uma viagem ${this.status}`);
  }
  
  // Verificar se o servidor já está como passageiro
  const passageiroExistente = this.passageiros.find(
    p => p.servidor.toString() === servidorData.servidor.toString()
  );
  
  if (passageiroExistente) {
    throw new Error('Servidor já está adicionado como passageiro nesta viagem');
  }
  
  // Adicionar passageiro
  this.passageiros.push({
    servidor: servidorData.servidor,
    cargo: servidorData.cargo,
    departamento: servidorData.departamento,
    responsavel_viagem: servidorData.responsavel_viagem || false,
    telefone_contato: servidorData.telefone_contato,
    observacao: servidorData.observacao
  });
  
  await this.save();
  return this;
};

// Método para remover passageiro
ViagemInstitucionalSchema.methods.removerPassageiro = async function(servidorId) {
  if (['concluida', 'cancelada', 'em_andamento'].includes(this.status)) {
    throw new Error(`Não é possível remover passageiros de uma viagem ${this.status}`);
  }
  
  const indicePassageiro = this.passageiros.findIndex(
    p => p.servidor.toString() === servidorId.toString()
  );
  
  if (indicePassageiro === -1) {
    throw new Error('Servidor não encontrado como passageiro nesta viagem');
  }
  
  // Remover passageiro
  this.passageiros.splice(indicePassageiro, 1);
  
  await this.save();
  return this;
};

// Método para adicionar documento
ViagemInstitucionalSchema.methods.adicionarDocumento = async function(documentoData) {
  if (['concluida', 'cancelada'].includes(this.status)) {
    throw new Error(`Não é possível adicionar documentos a uma viagem ${this.status}`);
  }
  
  // Adicionar documento
  this.documentos.push({
    descricao: documentoData.descricao,
    numero_protocolo: documentoData.numero_protocolo,
    departamento_origem: documentoData.departamento_origem,
    departamento_destino: documentoData.departamento_destino,
    tipo_documento: documentoData.tipo_documento || 'outros',
    urgente: documentoData.urgente || false,
    confidencial: documentoData.confidencial || false
  });
  
  await this.save();
  return this;
};

// Método para remover documento
ViagemInstitucionalSchema.methods.removerDocumento = async function(documentoId) {
  if (['concluida', 'cancelada'].includes(this.status)) {
    throw new Error(`Não é possível remover documentos de uma viagem ${this.status}`);
  }
  
  const indiceDocumento = this.documentos.findIndex(
    d => d._id.toString() === documentoId.toString()
  );
  
  if (indiceDocumento === -1) {
    throw new Error('Documento não encontrado nesta viagem');
  }
  
  // Remover documento
  this.documentos.splice(indiceDocumento, 1);
  
  await this.save();
  return this;
};

// Método para registrar entrega de documento
ViagemInstitucionalSchema.methods.registrarEntregaDocumento = async function(documentoId, assinatura) {
  if (this.status !== 'em_andamento' && this.status !== 'concluida') {
    throw new Error('Só é possível registrar entrega em viagens em andamento ou concluídas');
  }
  
  const documento = this.documentos.id(documentoId);
  
  if (!documento) {
    throw new Error('Documento não encontrado nesta viagem');
  }
  
  if (documento.recebido) {
    throw new Error('Documento já foi entregue anteriormente');
  }
  
  documento.recebido = true;
  documento.data_recebimento = new Date();
  documento.assinatura_recebimento = assinatura;
  
  await this.save();
  return documento;
};

// Método para registrar presença do passageiro
ViagemInstitucionalSchema.methods.registrarPresencaPassageiro = async function(servidorId, presente) {
  if (this.status !== 'em_andamento' && this.status !== 'concluida') {
    throw new Error('Só é possível registrar presença em viagens em andamento ou concluídas');
  }
  
  const passageiro = this.passageiros.find(
    p => p.servidor.toString() === servidorId.toString()
  );
  
  if (!passageiro) {
    throw new Error('Servidor não encontrado como passageiro nesta viagem');
  }
  
  passageiro.presente = presente;
  
  await this.save();
  return passageiro;
};

// Virtual para distância percorrida
ViagemInstitucionalSchema.virtual('distancia_percorrida').get(function() {
  if (this.km_inicial !== undefined && this.km_final !== undefined) {
    return this.km_final - this.km_inicial;
  }
  return null;
});

// Exportar o modelo
module.exports = mongoose.model('ViagemInstitucional', ViagemInstitucionalSchema); 