const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Veículo para a frota de TFD
 */
const VeiculoSchema = new Schema({
  // Dados básicos
  placa: {
    type: String,
    required: [true, 'Placa do veículo é obrigatória'],
    trim: true,
    uppercase: true,
    index: true,
    validate: {
      validator: function(placa) {
        // Validação de placa no formato Mercosul ou antigo
        const regexPlacaAntiga = /^[A-Z]{3}\d{4}$/;
        const regexPlacaMercosul = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;
        return regexPlacaAntiga.test(placa) || regexPlacaMercosul.test(placa);
      },
      message: 'Formato de placa inválido'
    }
  },
  renavam: {
    type: String,
    trim: true,
    validate: {
      validator: function(renavam) {
        if (!renavam) return true; // Campo opcional
        return /^\d{11}$/.test(renavam.replace(/\D/g, ''));
      },
      message: 'RENAVAM inválido'
    }
  },
  chassi: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // Características
  marca: {
    type: String,
    required: [true, 'Marca do veículo é obrigatória'],
    trim: true
  },
  modelo: {
    type: String,
    required: [true, 'Modelo do veículo é obrigatório'],
    trim: true
  },
  ano_fabricacao: {
    type: Number,
    min: [1950, 'Ano de fabricação inválido'],
    max: [new Date().getFullYear() + 1, 'Ano de fabricação não pode ser no futuro']
  },
  ano_modelo: {
    type: Number,
    min: [1950, 'Ano do modelo inválido'],
    max: [new Date().getFullYear() + 2, 'Ano do modelo muito adiantado']
  },
  cor: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'Tipo de veículo é obrigatório'],
    enum: {
      values: ['carro', 'van', 'micro_onibus', 'onibus', 'ambulancia', 'outro'],
      message: 'Tipo de veículo inválido'
    }
  },
  combustivel: {
    type: String,
    enum: {
      values: ['gasolina', 'diesel', 'flex', 'eletrico', 'gas', 'outro'],
      message: 'Tipo de combustível inválido'
    }
  },
  
  // Capacidade e uso
  capacidade_passageiros: {
    type: Number,
    required: [true, 'Capacidade de passageiros é obrigatória'],
    min: [1, 'Capacidade mínima é 1 passageiro'],
    max: [100, 'Capacidade máxima excedida']
  },
  adaptado_pcd: {
    type: Boolean,
    default: false
  },
  ar_condicionado: {
    type: Boolean,
    default: false
  },
  possui_maca: {
    type: Boolean,
    default: false
  },
  ativo: {
    type: Boolean,
    default: true
  },
  
  // Documentação e manutenção
  status_operacional: {
    type: String,
    enum: {
      values: ['disponivel', 'em_viagem', 'em_manutencao', 'inativo'],
      message: 'Status operacional inválido'
    },
    default: 'disponivel'
  },
  quilometragem_atual: {
    type: Number,
    min: [0, 'Quilometragem não pode ser negativa']
  },
  data_ultima_manutencao: {
    type: Date
  },
  proxima_manutencao_km: {
    type: Number,
    min: [0, 'Quilometragem para próxima manutenção não pode ser negativa']
  },
  data_licenciamento: {
    type: Date
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Relações e rastreamento
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
VeiculoSchema.index({ prefeitura: 1, status_operacional: 1 });
VeiculoSchema.index({ capacidade_passageiros: 1 });

// Virtual para descrição completa
VeiculoSchema.virtual('descricao_completa').get(function() {
  return `${this.marca} ${this.modelo} (${this.placa})`;
});

// Virtual para próxima manutenção
VeiculoSchema.virtual('proxima_manutencao_km_restante').get(function() {
  if (!this.quilometragem_atual || !this.proxima_manutencao_km) return null;
  return Math.max(0, this.proxima_manutencao_km - this.quilometragem_atual);
});

// Virtual para retornar histórico de viagens (relacionamento inverso)
VeiculoSchema.virtual('viagens', {
  ref: 'Viagem',
  localField: '_id',
  foreignField: 'veiculo',
  justOne: false
});

/**
 * Método para verificar se o veículo está disponível em determinada data
 * @param {Date} data - Data para verificar
 * @returns {Promise<boolean>} Disponibilidade
 */
VeiculoSchema.methods.verificarDisponibilidade = async function(data) {
  try {
    const Viagem = mongoose.model('Viagem');
    
    // Criar data de início e fim para comparação (mesma data, meia noite a meia noite)
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    
    // Verificar se há viagens na data
    const viagensExistentes = await Viagem.countDocuments({
      veiculo: this._id,
      data_viagem: { $gte: dataInicio, $lte: dataFim },
      status: { $nin: ['cancelada', 'concluida'] }
    });
    
    // Se não estiver ativo, não está disponível
    if (!this.ativo) {
      return false;
    }
    
    // Se status for diferente de 'disponivel', não está disponível
    if (this.status_operacional !== 'disponivel') {
      return false;
    }
    
    // Se houver viagens na data, não está disponível
    if (viagensExistentes > 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao verificar disponibilidade do veículo ${this._id}:`, error);
    throw error;
  }
};

/**
 * Método para atualizar status operacional
 * @param {string} novoStatus - Novo status operacional
 * @param {string} observacao - Observação opcional
 * @returns {Promise<Object>} Veículo atualizado
 */
VeiculoSchema.methods.atualizarStatus = async function(novoStatus, observacao) {
  try {
    if (!['disponivel', 'em_viagem', 'em_manutencao', 'inativo'].includes(novoStatus)) {
      throw new Error('Status operacional inválido');
    }
    
    this.status_operacional = novoStatus;
    
    if (observacao) {
      this.observacoes = this.observacoes 
        ? `${this.observacoes}\n[${new Date().toLocaleString()}] ${observacao}`
        : `[${new Date().toLocaleString()}] ${observacao}`;
    }
    
    await this.save();
    return this;
  } catch (error) {
    console.error(`Erro ao atualizar status do veículo ${this._id}:`, error);
    throw error;
  }
};

/**
 * Método para atualizar quilometragem
 * @param {number} novaQuilometragem - Nova quilometragem
 * @returns {Promise<Object>} Veículo atualizado
 */
VeiculoSchema.methods.atualizarQuilometragem = async function(novaQuilometragem) {
  try {
    if (novaQuilometragem < 0) {
      throw new Error('Quilometragem não pode ser negativa');
    }
    
    if (this.quilometragem_atual && novaQuilometragem < this.quilometragem_atual) {
      throw new Error('Nova quilometragem não pode ser menor que a atual');
    }
    
    this.quilometragem_atual = novaQuilometragem;
    await this.save();
    return this;
  } catch (error) {
    console.error(`Erro ao atualizar quilometragem do veículo ${this._id}:`, error);
    throw error;
  }
};

// Exportar o modelo
module.exports = mongoose.model('Veiculo', VeiculoSchema); 