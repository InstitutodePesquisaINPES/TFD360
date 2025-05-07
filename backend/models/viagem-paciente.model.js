const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const QRCode = require('qrcode');

/**
 * Schema de relacionamento entre Viagem e Paciente
 */
const ViagemPacienteSchema = new Schema({
  // Referências
  viagem: {
    type: Schema.Types.ObjectId,
    ref: 'Viagem',
    required: [true, 'Viagem é obrigatória'],
    index: true
  },
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'Paciente é obrigatório'],
    index: true
  },
  acompanhante: {
    type: Schema.Types.ObjectId,
    ref: 'Acompanhante'
  },
  
  // Status e informações
  status: {
    type: String,
    enum: {
      values: ['confirmado', 'pendente', 'ausente', 'lista_espera', 'cancelado', 'compareceu'],
      message: 'Status inválido'
    },
    default: 'pendente',
    index: true
  },
  tipo_paciente: {
    type: String,
    enum: {
      values: ['novo', 'retorno', 'urgencia'],
      message: 'Tipo de paciente inválido'
    },
    default: 'novo'
  },
  necessidades_especiais: {
    type: Boolean,
    default: false
  },
  descricao_necessidades: {
    type: String,
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Informações de embarque e desembarque
  horario_checkin: {
    type: Date
  },
  horario_checkout: {
    type: Date
  },
  localizacao_checkin: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  localizacao_checkout: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  
  // Informações de chamada da lista de espera
  data_chamada_lista_espera: {
    type: Date
  },
  status_confirmacao_lista_espera: {
    type: String,
    enum: {
      values: ['pendente', 'confirmado', 'recusado', 'sem_resposta'],
      message: 'Status de confirmação inválido'
    }
  },
  observacao_lista_espera: {
    type: String,
    trim: true
  },
  
  // Campos de documentação e passagem
  codigo_passagem: {
    type: String,
    unique: true,
    sparse: true
  },
  qrcode_base64: {
    type: String
  },
  data_emissao_passagem: {
    type: Date
  },
  
  // Relacionamento com prefeitura e rastreamento
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
  }
});

// Índices compostos para melhorar performance
ViagemPacienteSchema.index({ viagem: 1, paciente: 1 }, { unique: true });
ViagemPacienteSchema.index({ paciente: 1, created_at: -1 });

// Validação para horários de check-in e check-out
ViagemPacienteSchema.path('horario_checkout').validate(function(horario_checkout) {
  if (!horario_checkout) return true;
  if (!this.horario_checkin) return false;
  return horario_checkout > this.horario_checkin;
}, 'Horário de check-out deve ser posterior ao horário de check-in');

// Validação para impedir paciente em múltiplas viagens no mesmo dia
ViagemPacienteSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('viagem') || this.isModified('paciente')) {
      const Viagem = mongoose.model('Viagem');
      const ViagemPaciente = mongoose.model('ViagemPaciente');
      
      // Obter a data da viagem atual
      const viagemAtual = await Viagem.findById(this.viagem);
      if (!viagemAtual) {
        return next(new Error('Viagem não encontrada'));
      }
      
      const dataViagem = new Date(viagemAtual.data_viagem);
      const dataInicio = new Date(dataViagem);
      dataInicio.setHours(0, 0, 0, 0);
      
      const dataFim = new Date(dataViagem);
      dataFim.setHours(23, 59, 59, 999);
      
      // Buscar outras viagens do mesmo paciente na mesma data (exceto esta)
      const outrasViagens = await ViagemPaciente.find({
        _id: { $ne: this._id },
        paciente: this.paciente,
        status: { $nin: ['cancelado', 'lista_espera'] }
      }).populate({
        path: 'viagem',
        match: {
          data_viagem: { $gte: dataInicio, $lte: dataFim },
          status: { $ne: 'cancelada' }
        },
        select: 'data_viagem'
      });
      
      // Filtrar apenas as viagens válidas (após populate)
      const viagensValidas = outrasViagens.filter(vp => vp.viagem !== null);
      
      if (viagensValidas.length > 0) {
        return next(new Error('Paciente já está registrado em outra viagem na mesma data'));
      }
    }
    
    // Se estiver gerando o código de passagem
    if (this.isNew || this.isModified('status')) {
      if (this.status === 'confirmado' && !this.codigo_passagem) {
        this.codigo_passagem = await this.gerarCodigoPassagem();
        // Gerar QR Code apenas se o código de passagem existir
        if (this.codigo_passagem) {
          this.qrcode_base64 = await this.gerarQRCode();
          this.data_emissao_passagem = new Date();
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Gerar código de passagem único
ViagemPacienteSchema.methods.gerarCodigoPassagem = async function() {
  try {
    const prefixo = 'TFD';
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear().toString().substr(2, 2);
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
    const dia = dataAtual.getDate().toString().padStart(2, '0');
    
    // Obter último código gerado para incrementar o sequencial
    const ViagemPaciente = mongoose.model('ViagemPaciente');
    const ultimoRegistro = await ViagemPaciente.findOne({
      codigo_passagem: { $regex: `^${prefixo}${ano}${mes}${dia}` }
    }).sort({ codigo_passagem: -1 });
    
    let sequencial = 1;
    if (ultimoRegistro && ultimoRegistro.codigo_passagem) {
      const ultimoSequencial = ultimoRegistro.codigo_passagem.substr(-4);
      sequencial = parseInt(ultimoSequencial, 10) + 1;
    }
    
    return `${prefixo}${ano}${mes}${dia}${sequencial.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Erro ao gerar código de passagem:', error);
    return null;
  }
};

// Gerar QR Code para a passagem
ViagemPacienteSchema.methods.gerarQRCode = async function() {
  try {
    if (!this.codigo_passagem) return null;
    
    const dados = {
      codigo: this.codigo_passagem,
      paciente: this.paciente.toString(),
      viagem: this.viagem.toString(),
      timestamp: new Date().toISOString()
    };
    
    const qrCodeString = JSON.stringify(dados);
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeString);
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return null;
  }
};

// Método para realizar check-in
ViagemPacienteSchema.methods.realizarCheckin = async function(localizacao = null) {
  this.horario_checkin = new Date();
  this.status = 'compareceu';
  
  if (localizacao && localizacao.latitude && localizacao.longitude) {
    this.localizacao_checkin = {
      latitude: localizacao.latitude,
      longitude: localizacao.longitude
    };
  }
  
  await this.save();
  return true;
};

// Método para realizar check-out
ViagemPacienteSchema.methods.realizarCheckout = async function(localizacao = null) {
  if (!this.horario_checkin) {
    throw new Error('Não é possível realizar check-out sem check-in prévio');
  }
  
  this.horario_checkout = new Date();
  
  if (localizacao && localizacao.latitude && localizacao.longitude) {
    this.localizacao_checkout = {
      latitude: localizacao.latitude,
      longitude: localizacao.longitude
    };
  }
  
  await this.save();
  return true;
};

// Método para chamar paciente da lista de espera
ViagemPacienteSchema.methods.chamarDaListaEspera = async function() {
  if (this.status !== 'lista_espera') {
    throw new Error('Paciente não está na lista de espera');
  }
  
  this.status = 'pendente';
  this.data_chamada_lista_espera = new Date();
  this.status_confirmacao_lista_espera = 'pendente';
  
  await this.save();
  return true;
};

// Exportar o modelo
module.exports = mongoose.model('ViagemPaciente', ViagemPacienteSchema); 