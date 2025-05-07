const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Esquema para o modelo de Agendamento de Relatório
 */
const AgendamentoRelatorioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'O nome do agendamento é obrigatório'],
    trim: true,
    maxlength: [100, 'O nome não pode ter mais de 100 caracteres']
  },
  
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'A descrição não pode ter mais de 500 caracteres']
  },
  
  tipo_relatorio: {
    type: String,
    required: [true, 'O tipo de relatório é obrigatório'],
    enum: {
      values: ['usuarios', 'prefeituras', 'solicitacoes_tfd', 'logs_acesso'],
      message: 'Tipo de relatório inválido'
    }
  },
  
  parametros: {
    type: Object,
    default: {}
  },
  
  frequencia: {
    type: String,
    required: [true, 'A frequência de execução é obrigatória'],
    enum: {
      values: ['diario', 'semanal', 'mensal', 'sob_demanda'],
      message: 'Frequência inválida'
    }
  },
  
  dia_semana: {
    type: Number,
    min: [0, 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)'],
    max: [6, 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)'],
    validate: {
      validator: function(v) {
        return this.frequencia !== 'semanal' || (v >= 0 && v <= 6);
      },
      message: 'Dia da semana obrigatório para frequência semanal'
    }
  },
  
  dia_mes: {
    type: Number,
    min: [1, 'Dia do mês deve ser entre 1 e 31'],
    max: [31, 'Dia do mês deve ser entre 1 e 31'],
    validate: {
      validator: function(v) {
        return this.frequencia !== 'mensal' || (v >= 1 && v <= 31);
      },
      message: 'Dia do mês obrigatório para frequência mensal'
    }
  },
  
  horario: {
    type: String,
    required: [true, 'O horário de execução é obrigatório'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de horário inválido (HH:MM)']
  },
  
  formato_saida: {
    type: String,
    required: [true, 'O formato de saída é obrigatório'],
    enum: {
      values: ['pdf', 'excel', 'csv'],
      message: 'Formato de saída inválido'
    },
    default: 'pdf'
  },
  
  destinatarios: {
    type: [String],
    validate: {
      validator: function(v) {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return v.every(email => emailRegex.test(email));
      },
      message: 'Um ou mais endereços de e-mail são inválidos'
    }
  },
  
  ativo: {
    type: Boolean,
    default: true
  },
  
  criado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O usuário que criou o agendamento é obrigatório']
  },
  
  criado_em: {
    type: Date,
    default: Date.now
  },
  
  atualizado_em: {
    type: Date,
    default: Date.now
  },
  
  ultima_execucao: {
    type: Date,
    default: null
  },
  
  proxima_execucao: {
    type: Date,
    default: null
  },
  
  status_ultima_execucao: {
    type: String,
    enum: {
      values: ['pendente', 'sucesso', 'erro', null],
      message: 'Status de execução inválido'
    },
    default: null
  },
  
  mensagem_erro: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  }
});

// Adicionar índices para melhorar performance de buscas
AgendamentoRelatorioSchema.index({ tipo_relatorio: 1 });
AgendamentoRelatorioSchema.index({ frequencia: 1 });
AgendamentoRelatorioSchema.index({ criado_por: 1 });
AgendamentoRelatorioSchema.index({ proxima_execucao: 1, ativo: 1 });

// Adicionar plugin de paginação
AgendamentoRelatorioSchema.plugin(mongoosePaginate);

// Middleware pre-save para calcular a próxima execução automaticamente
AgendamentoRelatorioSchema.pre('save', async function(next) {
  // Se não for agendamento sob demanda e estiver ativo, calcular próxima execução
  if (this.isModified('frequencia') || this.isModified('horario') || 
      this.isModified('dia_semana') || this.isModified('dia_mes') || 
      this.isModified('ativo') || this.isNew) {
    
    if (this.frequencia !== 'sob_demanda' && this.ativo) {
      this.proxima_execucao = calcularProximaExecucao(this);
    }
  }
  
  next();
});

/**
 * Função auxiliar para calcular a próxima execução de um agendamento
 */
function calcularProximaExecucao(agendamento) {
  const agora = new Date();
  const [horas, minutos] = agendamento.horario.split(':').map(Number);
  let dataProximaExecucao = new Date();
  
  dataProximaExecucao.setHours(horas, minutos, 0, 0);
  
  // Se o horário já passou hoje, a próxima execução será no próximo período
  if (dataProximaExecucao <= agora) {
    dataProximaExecucao.setDate(dataProximaExecucao.getDate() + 1);
  }
  
  switch (agendamento.frequencia) {
    case 'diario':
      // Já está configurado corretamente
      break;
    
    case 'semanal':
      // Avança para o próximo dia da semana correspondente
      const diaDaSemanaAtual = dataProximaExecucao.getDay();
      const diaDaSemanaDesejado = agendamento.dia_semana;
      
      let diasAteProximoDia = diaDaSemanaDesejado - diaDaSemanaAtual;
      if (diasAteProximoDia <= 0) {
        diasAteProximoDia += 7;
      }
      
      dataProximaExecucao.setDate(dataProximaExecucao.getDate() + diasAteProximoDia);
      break;
    
    case 'mensal':
      // Avança para o dia do mês específico
      const diaDoMesDesejado = agendamento.dia_mes;
      const mesAtual = dataProximaExecucao.getMonth();
      
      // Configura para o dia específico do mês atual
      dataProximaExecucao.setDate(diaDoMesDesejado);
      
      // Se o dia já passou no mês atual, avança para o próximo mês
      if (dataProximaExecucao <= agora) {
        dataProximaExecucao.setMonth(mesAtual + 1);
      }
      
      // Ajusta para o último dia do mês se o dia especificado for maior que o número de dias no mês
      const ultimoDiaDoMes = new Date(dataProximaExecucao.getFullYear(), dataProximaExecucao.getMonth() + 1, 0).getDate();
      if (diaDoMesDesejado > ultimoDiaDoMes) {
        dataProximaExecucao.setDate(ultimoDiaDoMes);
      }
      break;
      
    case 'sob_demanda':
      // Sem próxima execução programada
      return null;
  }
  
  return dataProximaExecucao;
}

module.exports = mongoose.model('AgendamentoRelatorio', AgendamentoRelatorioSchema); 