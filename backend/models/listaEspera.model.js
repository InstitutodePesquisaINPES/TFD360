const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Lista de Espera para adicionar pacientes à viagem
 */
const ListaEsperaSchema = new Schema({
  // Viagem relacionada
  viagem: {
    type: Schema.Types.ObjectId,
    ref: 'Viagem',
    required: [true, 'Viagem é obrigatória'],
    index: true
  },
  
  // Paciente na lista de espera
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'Paciente é obrigatório'],
    index: true
  },
  
  // Se o paciente precisará de acompanhante
  acompanhante: {
    type: Boolean,
    default: false
  },
  
  // Prioridade na lista de espera
  prioridade: {
    type: String,
    enum: {
      values: ['alta', 'media', 'normal'],
      message: 'Prioridade deve ser: alta, media ou normal'
    },
    default: 'normal',
    index: true
  },
  
  // Observações sobre o paciente na lista de espera
  observacao: {
    type: String,
    trim: true
  },
  
  // Data da solicitação
  data_solicitacao: {
    type: Date,
    default: Date.now
  },
  
  // Status da solicitação
  status: {
    type: String,
    enum: {
      values: ['pendente', 'adicionado', 'recusado', 'expirado'],
      message: 'Status deve ser: pendente, adicionado, recusado ou expirado'
    },
    default: 'pendente',
    index: true
  },
  
  // Razão se recusado ou expirado
  motivo_recusa: {
    type: String,
    trim: true
  },
  
  // Campos de auditoria
  usuario_cadastro: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário de cadastro é obrigatório']
  },
  
  // Prefeitura para segmentação
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Definir índice composto para evitar duplicação de paciente na lista de espera da mesma viagem
ListaEsperaSchema.index({ viagem: 1, paciente: 1 }, { unique: true });

// Método para verificar se um paciente já está na lista de espera
ListaEsperaSchema.statics.verificarPacienteListaEspera = async function(viagemId, pacienteId) {
  const registro = await this.findOne({
    viagem: viagemId,
    paciente: pacienteId,
    status: 'pendente'
  });
  
  return !!registro;
};

// Método para obter a lista de espera ordenada por prioridade e data
ListaEsperaSchema.statics.obterListaEsperaOrdenada = async function(viagemId, prefeituraId) {
  return this.find({
    viagem: viagemId,
    prefeitura: prefeituraId,
    status: 'pendente'
  })
  .populate('paciente')
  .sort({ 
    prioridade: 1, // Alta (-1), Média (0), Normal (1)
    created_at: 1 // Os mais antigos primeiro
  });
};

// Método para atualizar status quando paciente for adicionado à viagem
ListaEsperaSchema.statics.marcarComoAdicionado = async function(viagemId, pacienteId) {
  return this.findOneAndUpdate(
    {
      viagem: viagemId,
      paciente: pacienteId,
      status: 'pendente'
    },
    {
      status: 'adicionado',
      updated_at: new Date()
    }
  );
};

// Método para atualizar status quando paciente for recusado
ListaEsperaSchema.statics.marcarComoRecusado = async function(viagemId, pacienteId, motivo) {
  return this.findOneAndUpdate(
    {
      viagem: viagemId,
      paciente: pacienteId,
      status: 'pendente'
    },
    {
      status: 'recusado',
      motivo_recusa: motivo,
      updated_at: new Date()
    }
  );
};

// Exportar o modelo
module.exports = mongoose.model('ListaEspera', ListaEsperaSchema); 