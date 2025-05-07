const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Manutenção para veículos da frota
 */
const ManutencaoSchema = new Schema({
  // Relacionamentos
  veiculo: {
    type: Schema.Types.ObjectId,
    ref: 'Veiculo',
    required: [true, 'Veículo é obrigatório'],
    index: true
  },
  prefeitura: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
  },
  
  // Informações da manutenção
  tipo_manutencao: {
    type: String,
    required: [true, 'Tipo de manutenção é obrigatório'],
    enum: {
      values: [
        'preventiva',
        'corretiva',
        'revisao_periodica',
        'troca_oleo',
        'troca_pneus',
        'higienizacao',
        'conserto_geral',
        'reforma',
        'manutencao_ar_condicionado',
        'manutencao_eletrica',
        'conclusao_manutencao',
        'outros'
      ],
      message: 'Tipo de manutenção inválido'
    }
  },
  data: {
    type: Date,
    required: [true, 'Data da manutenção é obrigatória'],
    default: Date.now
  },
  km_registrado: {
    type: Number,
    required: [true, 'Quilometragem no momento da manutenção é obrigatória'],
    min: [0, 'Quilometragem não pode ser negativa']
  },
  proxima_manutencao_km: {
    type: Number,
    min: [0, 'Quilometragem para próxima manutenção não pode ser negativa']
  },
  descricao: {
    type: String,
    required: [true, 'Descrição da manutenção é obrigatória'],
    trim: true
  },
  custo: {
    type: Number,
    min: [0, 'Custo não pode ser negativo']
  },
  local: {
    type: String,
    trim: true
  },
  
  // Serviços realizados
  servicos_realizados: [{
    descricao: {
      type: String,
      required: [true, 'Descrição do serviço é obrigatória'],
      trim: true
    },
    valor: {
      type: Number,
      min: [0, 'Valor não pode ser negativo']
    }
  }],
  
  // Peças substituídas
  pecas_substituidas: [{
    descricao: {
      type: String,
      required: [true, 'Descrição da peça é obrigatória'],
      trim: true
    },
    quantidade: {
      type: Number,
      min: [1, 'Quantidade mínima é 1'],
      required: [true, 'Quantidade é obrigatória']
    },
    valor_unitario: {
      type: Number,
      min: [0, 'Valor não pode ser negativo']
    }
  }],
  
  // Status e observações
  status: {
    type: String,
    enum: {
      values: ['programada', 'em_andamento', 'concluida', 'cancelada'],
      message: 'Status de manutenção inválido'
    },
    default: 'concluida'
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Anexos (opcional para armazenar notas fiscais, comprovantes, etc.)
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
ManutencaoSchema.index({ veiculo: 1, data: -1 });
ManutencaoSchema.index({ prefeitura: 1, tipo_manutencao: 1 });

// Virtual para calcular valor total das peças
ManutencaoSchema.virtual('valor_total_pecas').get(function() {
  if (!this.pecas_substituidas || this.pecas_substituidas.length === 0) return 0;
  
  return this.pecas_substituidas.reduce((total, peca) => {
    return total + (peca.quantidade * (peca.valor_unitario || 0));
  }, 0);
});

// Virtual para calcular valor total dos serviços
ManutencaoSchema.virtual('valor_total_servicos').get(function() {
  if (!this.servicos_realizados || this.servicos_realizados.length === 0) return 0;
  
  return this.servicos_realizados.reduce((total, servico) => {
    return total + (servico.valor || 0);
  }, 0);
});

// Virtual para calcular valor total da manutenção
ManutencaoSchema.virtual('valor_total').get(function() {
  const totalPecas = this.valor_total_pecas || 0;
  const totalServicos = this.valor_total_servicos || 0;
  
  // Se o custo total já foi definido, usar ele
  if (this.custo) {
    return this.custo;
  }
  
  // Caso contrário, calcular com base nas peças e serviços
  return totalPecas + totalServicos;
});

/**
 * Método para calcular quilometragem percorrida desde a última manutenção
 * @param {Number} quilometragemAtual - Quilometragem atual do veículo
 * @returns {Number} Quilometragem percorrida
 */
ManutencaoSchema.methods.calcularKmPercorrido = function(quilometragemAtual) {
  if (!quilometragemAtual || !this.km_registrado) return 0;
  return Math.max(0, quilometragemAtual - this.km_registrado);
};

/**
 * Método estático para encontrar manutenções próximas do vencimento por km
 * @param {Schema.Types.ObjectId} veiculoId - ID do veículo
 * @param {Number} kmAtual - Quilometragem atual do veículo
 * @param {Number} kmAlerta - Quilometragem para alertar antes de vencer (padrão: 500 km)
 * @returns {Promise<Array>} Lista de manutenções próximas do vencimento
 */
ManutencaoSchema.statics.encontrarManutencoesPorVencer = async function(veiculoId, kmAtual, kmAlerta = 500) {
  try {
    return await this.find({
      veiculo: veiculoId,
      proxima_manutencao_km: { $lte: kmAtual + kmAlerta, $gt: kmAtual },
      status: 'concluida'
    })
    .sort({ proxima_manutencao_km: 1 });
  } catch (error) {
    console.error(`Erro ao buscar manutenções por vencer para o veículo ${veiculoId}:`, error);
    throw error;
  }
};

/**
 * Método estático para encontrar a última manutenção de um determinado tipo
 * @param {Schema.Types.ObjectId} veiculoId - ID do veículo
 * @param {String} tipoManutencao - Tipo de manutenção
 * @returns {Promise<Object>} Última manutenção do tipo especificado
 */
ManutencaoSchema.statics.encontrarUltimaManutencao = async function(veiculoId, tipoManutencao) {
  try {
    return await this.findOne({
      veiculo: veiculoId,
      tipo_manutencao: tipoManutencao,
      status: 'concluida'
    })
    .sort({ data: -1 });
  } catch (error) {
    console.error(`Erro ao buscar última manutenção do tipo ${tipoManutencao} para o veículo ${veiculoId}:`, error);
    throw error;
  }
};

const Manutencao = mongoose.model('Manutencao', ManutencaoSchema);

module.exports = Manutencao; 