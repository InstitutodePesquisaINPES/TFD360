const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Viagem para Tratamento Fora do Domicílio
 */
const ViagemSchema = new Schema({
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
  unidade_saude: {
    type: String,
    required: [true, 'Unidade de saúde é obrigatória'],
    trim: true
  },
  endereco_unidade: {
    type: String,
    trim: true
  },
  tipo_tratamento: {
    type: String,
    required: [true, 'Tipo de tratamento é obrigatório'],
    enum: {
      values: ['consulta', 'exame', 'cirurgia', 'retorno', 'outros'],
      message: 'Tipo de tratamento deve ser: consulta, exame, cirurgia, retorno ou outros'
    }
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
  capacidade_veiculo: {
    type: Number,
    required: [true, 'Capacidade do veículo é obrigatória'],
    min: [1, 'Capacidade mínima é 1']
  },
  vagas_disponiveis: {
    type: Number,
    min: [0, 'Número de vagas não pode ser negativo']
  },
  
  // Status e informações adicionais
  status: {
    type: String,
    enum: {
      values: ['agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada'],
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
        // Se km_inicial não estiver definido, qualquer valor é válido
        if (this.km_inicial === undefined || this.km_inicial === null) return true;
        // Se km_final não estiver definido, é válido
        if (km_final === undefined || km_final === null) return true;
        // km_final deve ser maior ou igual a km_inicial
        return km_final >= this.km_inicial;
      },
      message: 'Quilometragem final deve ser maior ou igual à quilometragem inicial'
    }
  },
  
  // Lista de pacientes na viagem
  pacientes: [{
    paciente: {
      type: Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['confirmado', 'cancelado', 'ausente'],
        message: 'Status do paciente inválido'
      },
      default: 'confirmado'
    },
    acompanhante: {
      type: Boolean,
      default: false
    },
    id_acompanhante: {
      type: Schema.Types.ObjectId,
      ref: 'Acompanhante'
    },
    horario_checkin: {
      type: Date
    },
    horario_checkout: {
      type: Date
    },
    localizacao_checkin: {
      latitude: Number,
      longitude: Number
    },
    localizacao_checkout: {
      latitude: Number,
      longitude: Number
    },
    observacao: {
      type: String,
      trim: true
    },
    necessidades_especiais: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps e relações
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
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
ViagemSchema.index({ data_viagem: 1, prefeitura: 1 });
ViagemSchema.index({ motorista: 1, data_viagem: 1 });
ViagemSchema.index({ veiculo: 1, data_viagem: 1 });
ViagemSchema.index({ status: 1 });
ViagemSchema.index({ 'pacientes.paciente': 1 });

// Virtuals para contagem de pacientes
ViagemSchema.virtual('total_pacientes').get(function() {
  return this.pacientes ? this.pacientes.length : 0;
});

ViagemSchema.virtual('total_acompanhantes').get(function() {
  if (!this.pacientes) return 0;
  return this.pacientes.filter(p => p.acompanhante).length;
});

// Método para verificar se o veículo e motorista estão disponíveis para esta viagem
ViagemSchema.statics.verificarDisponibilidade = async function(viagemData, viagemId = null) {
  try {
    const { data_viagem, horario_saida, veiculo, motorista } = viagemData;
    
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
    
    // Verificar disponibilidade do veículo
    const viagemVeiculoExistente = await this.findOne({
      ...query,
      veiculo
    });
    
    if (viagemVeiculoExistente) {
      return {
        disponivel: false,
        mensagem: 'Veículo já está alocado para outra viagem nesta data',
        conflito: 'veiculo'
      };
    }
    
    // Verificar disponibilidade do motorista
    const viagemMotoristaExistente = await this.findOne({
      ...query,
      motorista
    });
    
    if (viagemMotoristaExistente) {
      return {
        disponivel: false,
        mensagem: 'Motorista já está alocado para outra viagem nesta data',
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

// Método para atualizar vagas disponíveis
ViagemSchema.methods.atualizarVagasDisponiveis = async function() {
  try {
    // Calcular ocupação total (pacientes + acompanhantes)
    let ocupacaoTotal = 0;
    
    for (const paciente of this.pacientes) {
      if (paciente.status === 'confirmado') {
        ocupacaoTotal += 1; // Paciente
        if (paciente.acompanhante) {
          ocupacaoTotal += 1; // Acompanhante adicional
        }
      }
    }
    
    // Atualizar vagas disponíveis
    this.vagas_disponiveis = Math.max(0, this.capacidade_veiculo - ocupacaoTotal);
    await this.save();
    
    return this.vagas_disponiveis;
  } catch (error) {
    console.error('Erro ao atualizar vagas disponíveis:', error);
    throw error;
  }
};

// Verificar se há vaga disponível para adicionar um paciente (e acompanhante se necessário)
ViagemSchema.methods.verificarVagaDisponivel = function(comAcompanhante) {
  const vagasNecessarias = comAcompanhante ? 2 : 1;
  return this.vagas_disponiveis >= vagasNecessarias;
};

// Método para adicionar paciente à viagem
ViagemSchema.methods.adicionarPaciente = async function(pacienteId, acompanhante = false, idAcompanhante = null) {
  // Verificar se o paciente já está na viagem
  const pacienteExistente = this.pacientes.find(
    p => p.paciente.toString() === pacienteId.toString()
  );
  
  if (pacienteExistente) {
    throw new Error('Paciente já está adicionado a esta viagem');
  }
  
  // Verificar disponibilidade de vagas
  const vagasNecessarias = acompanhante ? 2 : 1;
  if (this.vagas_disponiveis < vagasNecessarias) {
    throw new Error('Não há vagas suficientes para adicionar este paciente');
  }
  
  // Adicionar paciente
  this.pacientes.push({
    paciente: pacienteId,
    acompanhante: acompanhante,
    id_acompanhante: idAcompanhante,
    status: 'confirmado'
  });
  
  // Atualizar vagas disponíveis
  this.vagas_disponiveis -= vagasNecessarias;
  
  await this.save();
  return this;
};

// Método para remover paciente da viagem
ViagemSchema.methods.removerPaciente = async function(pacienteId) {
  const index = this.pacientes.findIndex(
    p => p.paciente.toString() === pacienteId.toString()
  );
  
  if (index === -1) {
    throw new Error('Paciente não encontrado nesta viagem');
  }
  
  // Liberar vagas
  const comAcompanhante = this.pacientes[index].acompanhante;
  const vagasLiberadas = comAcompanhante ? 2 : 1;
  
  // Remover paciente
  this.pacientes.splice(index, 1);
  
  // Atualizar vagas disponíveis
  this.vagas_disponiveis += vagasLiberadas;
  
  await this.save();
  return this;
};

// Método para checkin de paciente
ViagemSchema.methods.realizarCheckin = async function(pacienteId, localizacao = null) {
  const paciente = this.pacientes.find(
    p => p.paciente.toString() === pacienteId.toString()
  );
  
  if (!paciente) {
    throw new Error('Paciente não encontrado nesta viagem');
  }
  
  if (paciente.status !== 'confirmado') {
    throw new Error('Apenas pacientes confirmados podem fazer check-in');
  }
  
  paciente.horario_checkin = new Date();
  
  if (localizacao) {
    paciente.localizacao_checkin = {
      latitude: localizacao.latitude,
      longitude: localizacao.longitude
    };
  }
  
  await this.save();
  return this;
};

// Método para checkout de paciente
ViagemSchema.methods.realizarCheckout = async function(pacienteId, localizacao = null) {
  const paciente = this.pacientes.find(
    p => p.paciente.toString() === pacienteId.toString()
  );
  
  if (!paciente) {
    throw new Error('Paciente não encontrado nesta viagem');
  }
  
  if (!paciente.horario_checkin) {
    throw new Error('Paciente precisa ter feito check-in antes de fazer check-out');
  }
  
  paciente.horario_checkout = new Date();
  
  if (localizacao) {
    paciente.localizacao_checkout = {
      latitude: localizacao.latitude,
      longitude: localizacao.longitude
    };
  }
  
  await this.save();
  return this;
};

// Exportar o modelo
module.exports = mongoose.model('Viagem', ViagemSchema); 