const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema para armazenar dados de localização de veículos em tempo real
 */
const LocalizacaoSchema = new Schema({
  // Referência ao veículo
  veiculo: {
    type: Schema.Types.ObjectId,
    ref: 'Veiculo',
    required: true,
    index: true
  },
  
  // Referência à viagem (opcional)
  viagem: {
    type: Schema.Types.ObjectId,
    ref: 'Viagem',
    index: true,
    default: null
  },
  
  // Coordenadas geográficas
  latitude: {
    type: Number,
    required: true
  },
  
  longitude: {
    type: Number,
    required: true
  },
  
  // Momento da captura da localização
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Dados adicionais (opcionais)
  velocidade: {
    type: Number,
    default: 0 // km/h
  },
  
  quilometragem: {
    type: Number,
    default: 0 // km
  },
  
  // Endereço aproximado (obtido por geocodificação reversa)
  endereco: {
    type: String,
    default: null
  },
  
  // Campo para armazenar metadados adicionais
  metadados: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Índice composto para consultas eficientes
LocalizacaoSchema.index({ veiculo: 1, timestamp: -1 });
LocalizacaoSchema.index({ viagem: 1, timestamp: -1 });

// Índice geoespacial para consultas por proximidade
LocalizacaoSchema.index({ 
  coordenadas: '2dsphere' 
});

/**
 * Método para formatar os dados de localização
 * @returns {Object} - Dados formatados
 */
LocalizacaoSchema.methods.formatar = function() {
  return {
    id: this._id,
    veiculo: this.veiculo,
    viagem: this.viagem,
    coordenadas: {
      latitude: this.latitude,
      longitude: this.longitude
    },
    velocidade: this.velocidade,
    quilometragem: this.quilometragem,
    endereco: this.endereco,
    timestamp: this.timestamp,
    metadados: this.metadados
  };
};

/**
 * Método estático para obter a última localização de um veículo
 * @param {String} veiculoId - ID do veículo
 * @returns {Promise<Object>} - Última localização
 */
LocalizacaoSchema.statics.obterUltimaLocalizacao = async function(veiculoId) {
  return this.findOne({ veiculo: veiculoId })
    .sort({ timestamp: -1 })
    .populate('veiculo', 'placa modelo marca tipo')
    .populate('viagem', 'origem destino data_ida data_volta status');
};

/**
 * Método estático para obter as últimas localizações de múltiplos veículos
 * @param {Array<String>} veiculosIds - Array de IDs de veículos
 * @returns {Promise<Array<Object>>} - Lista de últimas localizações
 */
LocalizacaoSchema.statics.obterUltimasLocalizacoes = async function(veiculosIds) {
  // Usamos aggregate para melhor performance
  return this.aggregate([
    {
      $match: {
        veiculo: { $in: veiculosIds.map(id => new mongoose.Types.ObjectId(id)) }
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$veiculo',
        doc: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$doc' }
    }
  ]);
};

// Virtualizar campo coordenadas como GeoJSON point
LocalizacaoSchema.virtual('coordenadasGeoJSON').get(function() {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude]
  };
});

// Remover campos desnecessários na serialização
LocalizacaoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  }
});

module.exports = mongoose.model('Localizacao', LocalizacaoSchema); 