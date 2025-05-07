/**
 * Modelo de Configuração de Acessibilidade
 * 
 * Este modelo armazena as configurações de acessibilidade personalizadas
 * para cada usuário do sistema.
 */

const mongoose = require('mongoose');

/**
 * Schema para configurações de acessibilidade de usuários
 */
const ConfiguracaoAcessibilidadeSchema = new mongoose.Schema({
  // Usuário a quem pertencem as configurações
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  
  // Modo alto contraste
  altoContraste: {
    type: Boolean,
    default: false
  },
  
  // Aumentar tamanho da fonte
  fonteAumentada: {
    type: Boolean,
    default: false
  },
  
  // Reduzir ou desativar animações
  animacoesReduzidas: {
    type: Boolean,
    default: false
  },
  
  // Configuração de espaçamento de texto
  espacamentoTexto: {
    type: String,
    enum: ['normal', 'aumentado', 'maximo'],
    default: 'normal'
  },
  
  // Ativar leitura automática de texto (para deficientes visuais)
  leituraAutomatica: {
    type: Boolean,
    default: false
  },
  
  // Foco altamente visível para navegação por teclado
  focoVisivel: {
    type: Boolean,
    default: true
  },
  
  // Preferência de visualização de imagens com legendas sempre visíveis
  legendasImagens: {
    type: Boolean,
    default: false
  },
  
  // Simplificar interface para usuários com deficiência cognitiva
  interfaceSimplificada: {
    type: Boolean,
    default: false
  },
  
  // Definir tamanho da fonte (em percentual, 100% = normal)
  tamanhoFonte: {
    type: Number,
    min: 100,
    max: 200,
    default: 100
  },
  
  // Tema preferido (claro, escuro, automático)
  temaPrefererido: {
    type: String,
    enum: ['claro', 'escuro', 'automatico'],
    default: 'automatico'
  }
}, {
  timestamps: {
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  }
});

/**
 * Método estático para obter configurações padrão
 */
ConfiguracaoAcessibilidadeSchema.statics.getDefault = function() {
  return {
    altoContraste: false,
    fonteAumentada: false,
    animacoesReduzidas: false,
    espacamentoTexto: 'normal',
    leituraAutomatica: false,
    focoVisivel: true,
    legendasImagens: false,
    interfaceSimplificada: false,
    tamanhoFonte: 100,
    temaPrefererido: 'automatico'
  };
};

module.exports = mongoose.model('ConfiguracaoAcessibilidade', ConfiguracaoAcessibilidadeSchema); 