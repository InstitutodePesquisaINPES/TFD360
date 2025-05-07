/**
 * Modelo de Relatório de Acessibilidade
 * 
 * Este modelo armazena dados de relatórios de verificação de acessibilidade
 * gerados pelo frontend ou por verificações automatizadas.
 */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Schema para armazenar detalhes de um erro ou aviso de acessibilidade
 */
const ProblemaSchema = new mongoose.Schema({
  // Código do problema (ex: 'color-contrast', 'aria-required-attr')
  codigo: {
    type: String,
    required: true
  },
  
  // Mensagem descritiva do problema
  mensagem: {
    type: String,
    required: true
  },
  
  // Elemento HTML onde o problema foi encontrado
  elemento: {
    type: String,
    required: true
  },
  
  // Nível de impacto (crítico, severo, moderado, menor)
  impacto: {
    type: String,
    enum: ['critico', 'severo', 'moderado', 'menor'],
    default: 'moderado'
  },
  
  // Dicas para correção
  dicas: {
    type: String
  }
});

/**
 * Schema para componentes verificados
 */
const ComponentesSchema = new mongoose.Schema({
  // Total de componentes verificados
  total: {
    type: Number,
    default: 0
  },
  
  // Número de componentes acessíveis
  acessiveis: {
    type: Number,
    default: 0
  }
});

/**
 * Schema principal do relatório de acessibilidade
 */
const RelatorioAcessibilidadeSchema = new mongoose.Schema({
  // Lista de erros de acessibilidade encontrados
  erros: [ProblemaSchema],
  
  // Lista de avisos de acessibilidade
  avisos: [ProblemaSchema],
  
  // Estatísticas de componentes
  componentes: {
    type: ComponentesSchema,
    default: { total: 0, acessiveis: 0 }
  },
  
  // URL ou nome da página verificada
  pagina: {
    type: String,
    required: true
  },
  
  // Informações do navegador ou agente de usuário
  navegador: {
    type: String
  },
  
  // Data da verificação
  data: {
    type: Date,
    default: Date.now
  },
  
  // Usuário que realizou a verificação ou a quem o relatório está associado
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Status da verificação (pendente, concluído, em andamento)
  status: {
    type: String,
    enum: ['pendente', 'concluido', 'em_andamento'],
    default: 'concluido'
  },
  
  // Pontuação geral de acessibilidade (0-100)
  pontuacao: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: {
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  }
});

// Adicionar plugin de paginação
RelatorioAcessibilidadeSchema.plugin(mongoosePaginate);

// Middleware para calcular pontuação de acessibilidade automaticamente
RelatorioAcessibilidadeSchema.pre('save', function(next) {
  // Calcular pontuação com base nos erros e componentes acessíveis
  if (this.componentes && this.componentes.total > 0) {
    const taxaComponentesAcessiveis = this.componentes.acessiveis / this.componentes.total;
    
    // Penalidade para cada erro
    const penalidade = this.erros.length * 5;
    
    // Calcular pontuação base (0-100)
    let pontuacaoBase = taxaComponentesAcessiveis * 100;
    
    // Aplicar penalidades, mas garantir que a pontuação não seja negativa
    this.pontuacao = Math.max(0, pontuacaoBase - penalidade);
  } else {
    // Valor padrão se não houver dados suficientes
    this.pontuacao = 0;
  }
  
  next();
});

module.exports = mongoose.model('RelatorioAcessibilidade', RelatorioAcessibilidadeSchema); 