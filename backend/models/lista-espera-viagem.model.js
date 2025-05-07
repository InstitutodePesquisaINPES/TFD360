const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Lista de Espera para Viagens
 */
const ListaEsperaViagemSchema = new Schema({
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
  solicitacao_tfd: {
    type: Schema.Types.ObjectId,
    ref: 'SolicitacaoTFD'
  },
  
  // Informações da lista de espera
  acompanhante: {
    type: Boolean,
    default: false
  },
  id_acompanhante: {
    type: Schema.Types.ObjectId,
    ref: 'Acompanhante'
  },
  prioridade: {
    type: Number,
    default: 5,
    min: 1,
    max: 10,
    required: [true, 'Nível de prioridade é obrigatório']
  },
  status: {
    type: String,
    enum: {
      values: ['aguardando', 'chamado', 'confirmado', 'recusado', 'cancelado'],
      message: 'Status inválido'
    },
    default: 'aguardando',
    index: true
  },
  ordem: {
    type: Number,
    required: [true, 'Ordem na lista é obrigatória'],
    min: 1
  },
  motivo_prioridade: {
    type: String,
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // Informações de chamada
  data_chamada: {
    type: Date
  },
  data_resposta: {
    type: Date
  },
  prazo_resposta: {
    type: Date
  },
  notificacao_enviada: {
    type: Boolean,
    default: false
  },
  
  // Timestamps e relações
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

// Índices para melhorar performance
ListaEsperaViagemSchema.index({ viagem: 1, paciente: 1 }, { unique: true });
ListaEsperaViagemSchema.index({ viagem: 1, prioridade: 1, ordem: 1 });
ListaEsperaViagemSchema.index({ paciente: 1, status: 1 });

/**
 * Método para calcular a próxima ordem disponível para a viagem
 * ordenação baseada em prioridade e ordem de entrada
 */
ListaEsperaViagemSchema.statics.proximaOrdem = async function(viagemId, prioridade) {
  try {
    const ListaEsperaViagem = this;
    
    // Buscar último item da mesma prioridade
    const ultimoItem = await ListaEsperaViagem.findOne({
      viagem: viagemId,
      prioridade: prioridade,
      status: { $ne: 'cancelado' }
    }).sort({ ordem: -1 });
    
    if (ultimoItem) {
      return ultimoItem.ordem + 1;
    }
    
    // Se não houver itens com esta prioridade, verificar se existem itens de menor prioridade
    // para inserir antes deles
    if (prioridade <= 5) {
      // Para prioridades normais ou baixas, verificar se há itens de menor prioridade
      const itemMenorPrioridade = await ListaEsperaViagem.findOne({
        viagem: viagemId,
        prioridade: { $gt: prioridade },
        status: { $ne: 'cancelado' }
      }).sort({ prioridade: 1, ordem: 1 });
      
      if (itemMenorPrioridade) {
        // Reordenar todos os itens com menor prioridade
        await ListaEsperaViagem.updateMany(
          {
            viagem: viagemId, 
            prioridade: itemMenorPrioridade.prioridade,
            ordem: { $gte: itemMenorPrioridade.ordem },
            status: { $ne: 'cancelado' }
          },
          { $inc: { ordem: 1 } }
        );
        
        return itemMenorPrioridade.ordem;
      }
    }
    
    // Se não houver outros itens ou apenas itens de maior prioridade, começar com 1
    return 1;
  } catch (error) {
    console.error('Erro ao calcular próxima ordem na lista de espera:', error);
    throw error;
  }
};

/**
 * Método para reorganizar a lista de espera após alterações
 */
ListaEsperaViagemSchema.statics.reorganizarLista = async function(viagemId) {
  try {
    const ListaEsperaViagem = this;
    
    // Obter todos os itens da lista de espera para esta viagem, ordenados por prioridade e ordem
    const itens = await ListaEsperaViagem.find({
      viagem: viagemId,
      status: { $ne: 'cancelado' }
    }).sort({ prioridade: 1, ordem: 1 });
    
    let ultimaPrioridade = 0;
    let ordemAtual = 1;
    
    // Reorganizar os itens sequencialmente
    for (const item of itens) {
      // Se mudou a prioridade, reiniciar a ordem
      if (item.prioridade !== ultimaPrioridade) {
        ordemAtual = 1;
        ultimaPrioridade = item.prioridade;
      }
      
      // Atualizar a ordem se necessário
      if (item.ordem !== ordemAtual) {
        item.ordem = ordemAtual;
        await item.save();
      }
      
      ordemAtual++;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao reorganizar lista de espera:', error);
    throw error;
  }
};

/**
 * Método para chamar próximo paciente da lista de espera
 */
ListaEsperaViagemSchema.statics.chamarProximoPaciente = async function(viagemId) {
  try {
    const ListaEsperaViagem = this;
    const ViagemPaciente = mongoose.model('ViagemPaciente');
    const Viagem = mongoose.model('Viagem');
    
    // Buscar a viagem para verificar vagas disponíveis
    const viagem = await Viagem.findById(viagemId);
    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }
    
    if (viagem.vagas_disponiveis <= 0) {
      throw new Error('Não há vagas disponíveis para chamar pacientes da lista de espera');
    }
    
    // Buscar o próximo paciente na lista de espera (por prioridade e ordem)
    const proximoPaciente = await ListaEsperaViagem.findOne({
      viagem: viagemId,
      status: 'aguardando'
    }).sort({ prioridade: 1, ordem: 1 }).populate('paciente');
    
    if (!proximoPaciente) {
      throw new Error('Não há pacientes aguardando na lista de espera');
    }
    
    // Verificar se há vagas suficientes (considerando acompanhante)
    const vagasNecessarias = proximoPaciente.acompanhante ? 2 : 1;
    if (viagem.vagas_disponiveis < vagasNecessarias) {
      throw new Error('Não há vagas suficientes para chamar o próximo paciente da lista de espera');
    }
    
    // Atualizar status na lista de espera
    proximoPaciente.status = 'chamado';
    proximoPaciente.data_chamada = new Date();
    
    // Prazo de resposta (24 horas)
    const prazoResposta = new Date();
    prazoResposta.setHours(prazoResposta.getHours() + 24);
    proximoPaciente.prazo_resposta = prazoResposta;
    
    await proximoPaciente.save();
    
    // Adicionar paciente à viagem com status 'pendente'
    const viagemPaciente = new ViagemPaciente({
      viagem: viagemId,
      paciente: proximoPaciente.paciente._id,
      acompanhante: proximoPaciente.id_acompanhante,
      status: 'pendente',
      observacoes: `Chamado da lista de espera em ${new Date().toLocaleDateString()}`,
      prefeitura: proximoPaciente.prefeitura,
      usuario_cadastro: proximoPaciente.usuario_ultima_atualizacao || proximoPaciente.usuario_cadastro
    });
    
    await viagemPaciente.save();
    
    // Retornar o paciente chamado
    return {
      listaEspera: proximoPaciente,
      viagemPaciente: viagemPaciente
    };
  } catch (error) {
    console.error('Erro ao chamar próximo paciente da lista de espera:', error);
    throw error;
  }
};

// Exportar o modelo
module.exports = mongoose.model('ListaEsperaViagem', ListaEsperaViagemSchema); 