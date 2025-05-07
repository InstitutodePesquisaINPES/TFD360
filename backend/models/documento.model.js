const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const fs = require('fs');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Schema de Documento
 * 
 * Armazena documentos digitais associados a pacientes, acompanhantes
 * e outros tipos de entidades no sistema.
 */
const DocumentoSchema = new Schema({
  // Referência ao objeto associado
  ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ID de referência é obrigatório'],
    index: true
  },
  
  // Tipo de referência (paciente, acompanhante, etc)
  tipo_ref: {
    type: String,
    required: [true, 'Tipo de referência é obrigatório'],
    enum: ['paciente', 'acompanhante', 'solicitacao_tfd'],
    index: true
  },
  
  // Tipo de documento
  tipo_documento: {
    type: String,
    required: [true, 'Tipo de documento é obrigatório'],
    enum: [
      'rg', 'cpf', 'cartao_sus', 'comprovante_residencia',
      'laudo_medico', 'exame', 'receita', 'declaracao', 'autorizacao',
      'procuracao', 'termo_responsabilidade', 'documentacao_complementar',
      'outros'
    ],
    index: true
  },
  
  // Nome original do arquivo
  nome_arquivo: {
    type: String,
    required: [true, 'Nome do arquivo é obrigatório']
  },
  
  // Caminho do arquivo no sistema de arquivos
  caminho_arquivo: {
    type: String,
    required: [true, 'Caminho do arquivo é obrigatório']
  },
  
  // Formato do arquivo (extensão)
  formato: {
    type: String,
    required: [true, 'Formato do arquivo é obrigatório']
  },
  
  // Tamanho do arquivo em bytes
  tamanho: {
    type: Number,
    required: [true, 'Tamanho do arquivo é obrigatório']
  },
  
  // Descrição opcional do documento
  descricao: {
    type: String,
    default: ''
  },
  
  // Data de emissão do documento
  data_emissao: {
    type: Date,
    default: null
  },
  
  // Data de vencimento do documento
  data_vencimento: {
    type: Date,
    default: null,
    index: true
  },
  
  // Se o documento deve ser visível para o paciente na área do usuário
  visivel_paciente: {
    type: Boolean,
    default: false
  },
  
  // Status do documento
  status: {
    type: String,
    enum: ['pendente_validacao', 'ativo', 'rejeitado', 'arquivado'],
    default: 'pendente_validacao',
    index: true
  },
  
  // Motivo de rejeição (opcional)
  motivo_rejeicao: {
    type: String,
    default: null
  },
  
  // Referência à prefeitura
  prefeitura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prefeitura',
    required: [true, 'Prefeitura é obrigatória'],
    index: true
  },
  
  // Informações de auditoria
  usuario_cadastro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário de cadastro é obrigatório']
  },
  
  usuario_ultima_atualizacao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice de texto para busca
DocumentoSchema.index({
  nome_arquivo: 'text',
  descricao: 'text'
});

// Índices
DocumentoSchema.index({ ref_id: 1, tipo_documento: 1 });
DocumentoSchema.index({ prefeitura: 1 });
DocumentoSchema.index({ status: 1 });

// Campos virtuais
DocumentoSchema.virtual('url_arquivo').get(function() {
  return `/api/documentos/${this._id}/arquivo`;
});

DocumentoSchema.virtual('dias_para_vencimento').get(function() {
  if (!this.data_vencimento) return null;
  
  const hoje = new Date();
  const vencimento = new Date(this.data_vencimento);
  const diff = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
});

DocumentoSchema.virtual('esta_vencido').get(function() {
  if (!this.data_vencimento) return false;
  
  const hoje = new Date();
  const vencimento = new Date(this.data_vencimento);
  return vencimento < hoje;
});

/**
 * Middleware para deletar arquivo físico quando o documento for excluído
 */
DocumentoSchema.pre('remove', async function() {
  try {
    // Verificar se o arquivo existe e removê-lo
    if (fs.existsSync(this.caminho_arquivo)) {
      fs.unlinkSync(this.caminho_arquivo);
    }

    // Registrar evento de remoção de documento
    const EventoPaciente = mongoose.model('EventoPaciente');
    
    if (this.tipo_ref === 'paciente') {
      await EventoPaciente.create({
        paciente: this.ref_id,
        tipo_evento: 'Documento',
        descricao: `Exclusão de documento: ${this.tipo_documento} - ${this.nome_arquivo}`,
        data: new Date(),
        usuario: this.usuario_ultima_atualizacao || this.usuario_cadastro
      });
    } else if (this.tipo_ref === 'acompanhante') {
      const Acompanhante = mongoose.model('Acompanhante');
      const acompanhante = await Acompanhante.findById(this.ref_id);
      
      if (acompanhante) {
        await EventoPaciente.create({
          paciente: acompanhante.paciente,
          tipo_evento: 'Documento',
          descricao: `Exclusão de documento de acompanhante: ${this.tipo_documento} - ${this.nome_arquivo}`,
          data: new Date(),
          usuario: this.usuario_ultima_atualizacao || this.usuario_cadastro
        });
      }
    }
  } catch (error) {
    console.error('Erro ao excluir arquivo do documento:', error);
  }
});

/**
 * Método para aprovar um documento
 * @param {string} usuario_id - ID do usuário que está aprovando
 */
DocumentoSchema.methods.aprovar = async function(usuario_id) {
  this.status = 'ativo';
  this.motivo_rejeicao = null;
  this.usuario_ultima_atualizacao = usuario_id;
  await this.save();
  
  // Registrar evento de aprovação
  await this.registrarEvento('Aprovação', usuario_id);
  
  // Verificar se todos os documentos do paciente ou acompanhante estão completos
  if (this.tipo_ref === 'paciente') {
    const Paciente = mongoose.model('Paciente');
    const paciente = await Paciente.findById(this.ref_id);
    if (paciente) await paciente.possuiTodosDocumentos();
  } else if (this.tipo_ref === 'acompanhante') {
    const Acompanhante = mongoose.model('Acompanhante');
    const acompanhante = await Acompanhante.findById(this.ref_id);
    if (acompanhante) await acompanhante.possuiTodosDocumentos();
  }
};

/**
 * Método para rejeitar um documento
 * @param {string} motivo - Motivo da rejeição
 * @param {string} usuario_id - ID do usuário que está rejeitando
 */
DocumentoSchema.methods.rejeitar = async function(motivo, usuario_id) {
  this.status = 'rejeitado';
  this.motivo_rejeicao = motivo;
  this.usuario_ultima_atualizacao = usuario_id;
  await this.save();
  
  // Registrar evento de rejeição
  await this.registrarEvento(`Rejeição (Motivo: ${motivo})`, usuario_id);
  
  // Atualizar status de documentação completa
  if (this.tipo_ref === 'paciente') {
    const Paciente = mongoose.model('Paciente');
    const paciente = await Paciente.findById(this.ref_id);
    if (paciente) {
      paciente.documentacao_pendente = true;
      await paciente.save();
    }
  } else if (this.tipo_ref === 'acompanhante') {
    const Acompanhante = mongoose.model('Acompanhante');
    const acompanhante = await Acompanhante.findById(this.ref_id);
    if (acompanhante) {
      acompanhante.documentacao_completa = false;
      await acompanhante.save();
    }
  }
};

/**
 * Método para arquivar um documento
 * @param {string} usuario_id - ID do usuário que está arquivando
 */
DocumentoSchema.methods.arquivar = async function(usuario_id) {
  this.status = 'arquivado';
  this.usuario_ultima_atualizacao = usuario_id;
  await this.save();
  
  // Registrar evento de arquivamento
  await this.registrarEvento('Arquivamento', usuario_id);
};

/**
 * Método privado para registrar evento
 */
DocumentoSchema.methods.registrarEvento = async function(acao, usuarioId) {
  try {
    const EventoPaciente = mongoose.model('EventoPaciente');
    
    if (this.tipo_ref === 'paciente') {
      await EventoPaciente.create({
        paciente: this.ref_id,
        tipo_evento: 'Documento',
        descricao: `${acao} de documento: ${this.tipo_documento} - ${this.nome_arquivo}`,
        data: new Date(),
        usuario: usuarioId
      });
    } else if (this.tipo_ref === 'acompanhante') {
      const Acompanhante = mongoose.model('Acompanhante');
      const acompanhante = await Acompanhante.findById(this.ref_id);
      
      if (acompanhante) {
        await EventoPaciente.create({
          paciente: acompanhante.paciente,
          tipo_evento: 'Documento',
          descricao: `${acao} de documento de acompanhante (${acompanhante.nome}): ${this.tipo_documento} - ${this.nome_arquivo}`,
          data: new Date(),
          usuario: usuarioId
        });
      }
    }
  } catch (error) {
    console.error('Erro ao registrar evento de documento:', error);
  }
};

/**
 * Método estático para buscar documentos por paciente
 */
DocumentoSchema.statics.buscarPorPaciente = function(pacienteId) {
  return this.find({
    ref_id: pacienteId,
    tipo_ref: 'paciente'
  }).sort({ created_at: -1 });
};

/**
 * Método estático para buscar documentos por acompanhante
 */
DocumentoSchema.statics.buscarPorAcompanhante = function(acompanhanteId) {
  return this.find({
    ref_id: acompanhanteId,
    tipo_ref: 'acompanhante'
  }).sort({ created_at: -1 });
};

/**
 * Método estático para buscar documentos por vencimento
 */
DocumentoSchema.statics.buscarPorVencimento = function(prefeituraId, diasLimite = 30) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + diasLimite);
  
  return this.find({
    prefeitura: prefeituraId,
    data_vencimento: { $lte: dataLimite, $gte: new Date() },
    status: 'ativo'
  }).sort({ data_vencimento: 1 });
};

// Plugin de paginação
DocumentoSchema.plugin(mongoosePaginate);

const Documento = mongoose.model('Documento', DocumentoSchema);

module.exports = Documento; 