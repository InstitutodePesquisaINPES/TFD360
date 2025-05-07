const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogAcessoSchema = new Schema({
  usuario_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prefeitura_id: {
    type: Schema.Types.ObjectId,
    ref: 'Prefeitura'
  },
  ip: {
    type: String,
    required: true
  },
  data_acesso: {
    type: Date,
    default: Date.now
  },
  user_agent: {
    type: String
  },
  acao: {
    type: String,
    enum: ['login', 'logout', 'acesso_painel'],
    default: 'login'
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

module.exports = mongoose.model('LogAcesso', LogAcessoSchema); 