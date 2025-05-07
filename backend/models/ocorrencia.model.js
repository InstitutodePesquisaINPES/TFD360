const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Ocorrência para motoristas
 */
const OcorrenciaSchema = new Schema({
  // Relacionamentos
  motorista: {
    type: Schema.Types.ObjectId,
    ref: 'Motorista',
    required: [true, 'Motorista é obrigatório'],
    index: true
  },
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
  },
  viagem: {
    type: Schema.Types.ObjectId,
    ref: 'Viagem'
  },
  
  // Informações da ocorrência
  tipo_ocorrencia: {
    type: String,
    required: [true, 'Tipo de ocorrência é obrigatório'],
    enum: {
      values: [
        'atraso',
        'falta',
        'acidente',
        'avaria_veiculo',
        'multa',
        'reclamacao_passageiro',
        'rota_incorreta',
        'problema_documentacao',
        'comportamento_inadequado',
        'uso_inadequado_veiculo',
        'elogio',
        'outros'
      ],
      message: 'Tipo de ocorrência inválido'
    }
  },
  data: {
    type: Date,
    required: [true, 'Data da ocorrência é obrigatória'],
    default: Date.now
  },
  gravidade: {
    type: String,
    enum: {
      values: ['baixa', 'media', 'alta', 'critica'],
      message: 'Gravidade inválida'
    },
    default: 'media'
  },
  descricao: {
    type: String,
    required: [true, 'Descrição da ocorrência é obrigatória'],
    trim: true
  },
  local: {
    type: String,
    trim: true
  },
  
  // Medidas tomadas e consequências
  medidas_tomadas: {
    type: String,
    trim: true
  },
  consequencias: {
    advertencia: {
      type: Boolean,
      default: false
    },
    suspensao: {
      type: Boolean,
      default: false
    },
    dias_suspensao: {
      type: Number,
      min: 0
    },
    multa: {
      type: Boolean,
      default: false
    },
    valor_multa: {
      type: Number,
      min: 0
    },
    afastamento: {
      type: Boolean,
      default: false
    },
    periodo_afastamento: {
      inicio: Date,
      fim: Date
    },
    outras: {
      type: String,
      trim: true
    }
  },
  
  // Status e resolução
  status: {
    type: String,
    enum: {
      values: ['registrada', 'em_analise', 'resolvida', 'arquivada'],
      message: 'Status de ocorrência inválido'
    },
    default: 'registrada'
  },
  resolucao: {
    descricao: {
      type: String,
      trim: true
    },
    data: Date,
    usuario_resolucao: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Anexos (opcional para armazenar evidências, documentos, etc.)
  anexos: [{
    nome: String,
    url: String,
    tipo: String,
    tamanho: Number,
    data_upload: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rastreamento
  usuario_registro: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário de registro é obrigatório']
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
OcorrenciaSchema.index({ motorista: 1, data: -1 });
OcorrenciaSchema.index({ prefeitura: 1, tipo_ocorrencia: 1 });
OcorrenciaSchema.index({ viagem: 1 });

// Virtual para determinar se a ocorrência é recente (menos de 30 dias)
OcorrenciaSchema.virtual('recente').get(function() {
  if (!this.data) return false;
  
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  
  return this.data >= trintaDiasAtras;
});

/**
 * Método para resolver uma ocorrência
 * @param {String} descricaoResolucao - Descrição da resolução
 * @param {Schema.Types.ObjectId} usuarioId - ID do usuário que está resolvendo
 * @returns {Promise<Object>} Ocorrência atualizada
 */
OcorrenciaSchema.methods.resolver = async function(descricaoResolucao, usuarioId) {
  try {
    if (!descricaoResolucao) {
      throw new Error('Descrição da resolução é obrigatória');
    }
    
    this.status = 'resolvida';
    this.resolucao = {
      descricao: descricaoResolucao,
      data: new Date(),
      usuario_resolucao: usuarioId
    };
    
    await this.save();
    return this;
  } catch (error) {
    console.error(`Erro ao resolver ocorrência ${this._id}:`, error);
    throw error;
  }
};

/**
 * Método estático para encontrar ocorrências graves de um motorista
 * @param {Schema.Types.ObjectId} motoristaId - ID do motorista
 * @param {Number} periodo - Período em dias para considerar (padrão: 90 dias)
 * @returns {Promise<Array>} Lista de ocorrências graves no período
 */
OcorrenciaSchema.statics.encontrarOcorrenciasGraves = async function(motoristaId, periodo = 90) {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);
    
    return await this.find({
      motorista: motoristaId,
      data: { $gte: dataLimite },
      gravidade: { $in: ['alta', 'critica'] }
    })
    .sort({ data: -1 });
  } catch (error) {
    console.error(`Erro ao buscar ocorrências graves para o motorista ${motoristaId}:`, error);
    throw error;
  }
};

/**
 * Método estático para contar ocorrências por tipo em um período
 * @param {Schema.Types.ObjectId} motoristaId - ID do motorista
 * @param {Number} periodo - Período em dias para considerar (padrão: 180 dias)
 * @returns {Promise<Object>} Contagem de ocorrências por tipo
 */
OcorrenciaSchema.statics.contarOcorrenciasPorTipo = async function(motoristaId, periodo = 180) {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);
    
    return await this.aggregate([
      {
        $match: {
          motorista: mongoose.Types.ObjectId(motoristaId),
          data: { $gte: dataLimite }
        }
      },
      {
        $group: {
          _id: '$tipo_ocorrencia',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  } catch (error) {
    console.error(`Erro ao contar ocorrências por tipo para o motorista ${motoristaId}:`, error);
    throw error;
  }
};

const Ocorrencia = mongoose.model('Ocorrencia', OcorrenciaSchema);

module.exports = Ocorrencia; 