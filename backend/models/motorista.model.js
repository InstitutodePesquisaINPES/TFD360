const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Motorista para viagens TFD
 */
const MotoristaSchema = new Schema({
  // Dados pessoais
  nome: {
    type: String,
    required: [true, 'Nome do motorista é obrigatório'],
    trim: true
  },
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    trim: true,
    validate: {
      validator: function(cpf) {
        // Validação básica de CPF
        return /^\d{11}$/.test(cpf.replace(/[^\d]/g, ''));
      },
      message: 'CPF inválido'
    },
    index: true
  },
  data_nascimento: {
    type: Date,
    required: [true, 'Data de nascimento é obrigatória'],
    validate: {
      validator: function(data) {
        // Verificar se a data não é futuro
        if (data > new Date()) return false;
        
        // Verificar idade mínima (21 anos para ser motorista)
        const hoje = new Date();
        const idade = hoje.getFullYear() - data.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = data.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < data.getDate())) {
          return idade - 1 >= 21;
        }
        
        return idade >= 21;
      },
      message: 'Motorista deve ter pelo menos 21 anos'
    }
  },
  sexo: {
    type: String,
    enum: {
      values: ['masculino', 'feminino', 'outro'],
      message: 'Sexo deve ser: masculino, feminino ou outro'
    }
  },
  
  // Contato
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  telefone_alternativo: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true; // Campo opcional
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Email inválido'
    }
  },
  
  // Endereço
  endereco: {
    logradouro: { type: String, trim: true },
    numero: { type: String, trim: true },
    complemento: { type: String, trim: true },
    bairro: { type: String, trim: true },
    cidade: { type: String, trim: true },
    estado: { type: String, trim: true, minlength: 2, maxlength: 2 },
    cep: { type: String, trim: true }
  },
  
  // Dados profissionais
  numero_cnh: {
    type: String,
    required: [true, 'Número da CNH é obrigatório'],
    trim: true
  },
  categoria_cnh: {
    type: String,
    required: [true, 'Categoria da CNH é obrigatória'],
    enum: {
      values: ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'],
      message: 'Categoria da CNH inválida'
    }
  },
  validade_cnh: {
    type: Date,
    required: [true, 'Validade da CNH é obrigatória'],
    validate: {
      validator: function(data) {
        return data >= new Date();
      },
      message: 'CNH vencida'
    }
  },
  curso_transporte_passageiros: {
    type: Boolean,
    default: false
  },
  data_curso_passageiros: {
    type: Date
  },
  curso_primeiros_socorros: {
    type: Boolean,
    default: false
  },
  data_curso_socorros: {
    type: Date
  },
  
  // Status e disponibilidade
  status: {
    type: String,
    enum: {
      values: ['ativo', 'ferias', 'licenca', 'inativo'],
      message: 'Status inválido'
    },
    default: 'ativo',
    index: true
  },
  motivo_inatividade: {
    type: String,
    trim: true
  },
  data_inicio_inatividade: {
    type: Date
  },
  data_fim_inatividade: {
    type: Date
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Vínculos
  tipo_vinculo: {
    type: String,
    enum: {
      values: ['concursado', 'contratado', 'terceirizado'],
      message: 'Tipo de vínculo inválido'
    }
  },
  data_contratacao: {
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
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhorar performance
MotoristaSchema.index({ prefeitura: 1, status: 1 });
MotoristaSchema.index({ cpf: 1 });

// Virtual para calcular idade
MotoristaSchema.virtual('idade').get(function() {
  if (!this.data_nascimento) return null;
  
  const hoje = new Date();
  const dataNascimento = new Date(this.data_nascimento);
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  
  const mesAtual = hoje.getMonth();
  const mesNascimento = dataNascimento.getMonth();
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  
  return idade;
});

// Virtual para retornar histórico de viagens (relacionamento inverso)
MotoristaSchema.virtual('viagens', {
  ref: 'Viagem',
  localField: '_id',
  foreignField: 'motorista',
  justOne: false
});

/**
 * Método para verificar se o motorista está disponível em determinada data
 * @param {Date} data - Data para verificar
 * @returns {Promise<boolean>} Disponibilidade
 */
MotoristaSchema.methods.verificarDisponibilidade = async function(data) {
  try {
    const Viagem = mongoose.model('Viagem');
    
    // Criar data de início e fim para comparação (mesma data, meia noite a meia noite)
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    
    // Verificar status atual
    if (this.status !== 'ativo') {
      return false;
    }
    
    // Verificar se está em período de inatividade (férias, licença)
    if (this.data_inicio_inatividade && this.data_fim_inatividade) {
      if (dataInicio >= this.data_inicio_inatividade && dataInicio <= this.data_fim_inatividade) {
        return false;
      }
    }
    
    // Verificar CNH válida
    if (this.validade_cnh && this.validade_cnh < dataInicio) {
      return false;
    }
    
    // Verificar se há viagens na data
    const viagensExistentes = await Viagem.countDocuments({
      motorista: this._id,
      data_viagem: { $gte: dataInicio, $lte: dataFim },
      status: { $nin: ['cancelada'] }
    });
    
    // Se houver viagens na data, não está disponível
    if (viagensExistentes > 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao verificar disponibilidade do motorista ${this._id}:`, error);
    throw error;
  }
};

/**
 * Método para atualizar status
 * @param {string} novoStatus - Novo status
 * @param {Object} opcoes - Opções adicionais (motivo, datas)
 * @returns {Promise<Object>} Motorista atualizado
 */
MotoristaSchema.methods.atualizarStatus = async function(novoStatus, opcoes = {}) {
  try {
    if (!['ativo', 'ferias', 'licenca', 'inativo'].includes(novoStatus)) {
      throw new Error('Status inválido');
    }
    
    this.status = novoStatus;
    
    // Limpar dados de inatividade se estiver voltando a ativo
    if (novoStatus === 'ativo') {
      this.motivo_inatividade = null;
      this.data_inicio_inatividade = null;
      this.data_fim_inatividade = null;
    } else {
      // Registrar motivo e datas se estiver indo para inatividade
      this.motivo_inatividade = opcoes.motivo || null;
      this.data_inicio_inatividade = opcoes.data_inicio || new Date();
      this.data_fim_inatividade = opcoes.data_fim || null;
    }
    
    await this.save();
    return this;
  } catch (error) {
    console.error(`Erro ao atualizar status do motorista ${this._id}:`, error);
    throw error;
  }
};

// Exportar o modelo
module.exports = mongoose.model('Motorista', MotoristaSchema); 