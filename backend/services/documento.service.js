const mongoose = require('mongoose');
const Documento = require('../models/documento.model');
const { criarError } = require('../utils/error.utils');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const uploadDir = path.join(__dirname, '../uploads/documentos');

/**
 * Serviço para gerenciamento de documentos
 */
class DocumentoService {
  /**
   * Lista documentos com filtros
   * @param {Object} filtros - Filtros de busca
   * @param {Object} opcoesPaginacao - Opções de paginação
   * @returns {Promise<Object>} Resultado paginado
   */
  async listarDocumentos(filtros = {}, opcoesPaginacao = { page: 1, limit: 10 }) {
    try {
      const query = {};
      
      // Filtro por prefeitura - obrigatório por segurança
      if (!filtros.prefeitura_id) {
        throw criarError('Prefeitura não informada', 400);
      }
      query.prefeitura = filtros.prefeitura_id;
      
      // Filtros obrigatórios de contexto
      if (filtros.ref_id) {
        query.ref_id = filtros.ref_id;
      }
      
      if (filtros.tipo_ref) {
        query.tipo_ref = filtros.tipo_ref;
      }
      
      // Verificar que pelo menos um filtro de contexto foi especificado
      if (!filtros.ref_id && !filtros.tipo_ref) {
        throw criarError('É necessário informar pelo menos ref_id ou tipo_ref', 400);
      }
      
      // Filtros opcionais
      if (filtros.tipo_documento) {
        query.tipo_documento = filtros.tipo_documento;
      }
      
      if (filtros.status) {
        query.status = filtros.status;
      } else {
        // Por padrão, excluir documentos arquivados
        query.status = { $ne: 'arquivado' };
      }
      
      // Filtros de data
      if (filtros.data_inicio && filtros.data_fim) {
        query.created_at = {
          $gte: new Date(filtros.data_inicio),
          $lte: new Date(filtros.data_fim)
        };
      } else if (filtros.data_inicio) {
        query.created_at = { $gte: new Date(filtros.data_inicio) };
      } else if (filtros.data_fim) {
        query.created_at = { $lte: new Date(filtros.data_fim) };
      }
      
      // Documentos vencidos ou a vencer
      if (filtros.vencidos === 'true') {
        query.data_vencimento = { $lte: new Date() };
      } else if (filtros.a_vencer_em_dias) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + parseInt(filtros.a_vencer_em_dias));
        
        query.data_vencimento = { 
          $gte: new Date(), 
          $lte: dataLimite 
        };
      }
      
      // Opções de ordenação
      const sort = filtros.sort_by ? 
        { [filtros.sort_by]: filtros.sort_order === 'desc' ? -1 : 1 } : 
        { created_at: -1 };
      
      // Opções de paginação
      const options = {
        page: opcoesPaginacao.page,
        limit: opcoesPaginacao.limit,
        sort,
        populate: [
          { path: 'usuario_cadastro', select: 'nome email' },
          { path: 'usuario_ultima_atualizacao', select: 'nome email' }
        ]
      };
      
      // Executar consulta paginada
      return await Documento.paginate(query, options);
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }
  
  /**
   * Busca um documento pelo ID
   * @param {string} id - ID do documento
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Documento encontrado
   */
  async obterDocumentoPorId(id, prefeitura_id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw criarError('ID de documento inválido', 400);
      }
      
      const documento = await Documento.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      })
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!documento) {
        throw criarError('Documento não encontrado', 404);
      }
      
      return documento;
    } catch (error) {
      console.error(`Erro ao buscar documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria um novo documento
   * @param {Object} dadosDocumento - Metadados do documento
   * @param {Object} arquivo - Arquivo a ser salvo
   * @param {string} usuario_id - ID do usuário que está criando
   * @returns {Promise<Object>} Documento criado
   */
  async criarDocumento(dadosDocumento, arquivo, usuario_id) {
    try {
      // Validar dados obrigatórios
      if (!dadosDocumento.ref_id || !dadosDocumento.tipo_ref || !dadosDocumento.tipo_documento) {
        throw criarError('Dados incompletos para criar documento', 400);
      }
      
      if (!arquivo) {
        throw criarError('Nenhum arquivo enviado', 400);
      }
      
      // Verificar se o diretório de upload existe, senão criar
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único
      const extensao = path.extname(arquivo.originalname).toLowerCase();
      const nomeArquivo = `${dadosDocumento.tipo_ref}_${dadosDocumento.ref_id}_${uuidv4()}${extensao}`;
      const caminhoArquivo = path.join(uploadDir, nomeArquivo);
      
      // Validar extensões permitidas (PDF, imagens, documentos Office, etc.)
      const extensoesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
      if (!extensoesPermitidas.includes(extensao)) {
        throw criarError('Formato de arquivo não suportado', 400);
      }
      
      // Validar tamanho (max 10MB)
      const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
      if (arquivo.size > tamanhoMaximo) {
        throw criarError('Tamanho máximo de arquivo excedido. Limite de 10MB', 400);
      }
      
      // Salvar o arquivo fisicamente
      await fs.promises.writeFile(caminhoArquivo, arquivo.buffer);
      
      // Preparar dados do documento
      const novoDocumento = {
        ref_id: dadosDocumento.ref_id,
        tipo_ref: dadosDocumento.tipo_ref,
        tipo_documento: dadosDocumento.tipo_documento,
        nome_arquivo: arquivo.originalname,
        caminho_arquivo: caminhoArquivo,
        formato: extensao.substring(1), // Remove o ponto
        tamanho: arquivo.size,
        descricao: dadosDocumento.descricao || '',
        data_emissao: dadosDocumento.data_emissao || null,
        data_vencimento: dadosDocumento.data_vencimento || null,
        visivel_paciente: dadosDocumento.visivel_paciente === 'true' || false,
        status: dadosDocumento.status || 'pendente_validacao',
        usuario_cadastro: usuario_id,
        prefeitura: dadosDocumento.prefeitura
      };
      
      // Criar documento no banco
      const documento = new Documento(novoDocumento);
      await documento.save();
      
      // Verificar a completude da documentação
      await this.verificarCompletude(documento);
      
      return documento;
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }
  
  /**
   * Aprova um documento
   * @param {string} id - ID do documento
   * @param {string} usuario_id - ID do usuário que está aprovando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Documento atualizado
   */
  async aprovarDocumento(id, usuario_id, prefeitura_id) {
    try {
      const documento = await this.obterDocumentoPorId(id, prefeitura_id);
      
      if (documento.status === 'ativo') {
        throw criarError('Documento já está aprovado', 400);
      }
      
      await documento.aprovar(usuario_id);
      
      return await this.obterDocumentoPorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao aprovar documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Rejeita um documento
   * @param {string} id - ID do documento
   * @param {string} motivo - Motivo da rejeição
   * @param {string} usuario_id - ID do usuário que está rejeitando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Documento atualizado
   */
  async rejeitarDocumento(id, motivo, usuario_id, prefeitura_id) {
    try {
      const documento = await this.obterDocumentoPorId(id, prefeitura_id);
      
      if (!motivo) {
        throw criarError('Motivo da rejeição é obrigatório', 400);
      }
      
      await documento.rejeitar(motivo, usuario_id);
      
      return await this.obterDocumentoPorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao rejeitar documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Arquiva um documento
   * @param {string} id - ID do documento
   * @param {string} usuario_id - ID do usuário que está arquivando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Documento atualizado
   */
  async arquivarDocumento(id, usuario_id, prefeitura_id) {
    try {
      const documento = await this.obterDocumentoPorId(id, prefeitura_id);
      
      await documento.arquivar(usuario_id);
      
      return await this.obterDocumentoPorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao arquivar documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove um documento
   * @param {string} id - ID do documento
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<boolean>} Resultado da operação
   */
  async removerDocumento(id, prefeitura_id) {
    try {
      const documento = await this.obterDocumentoPorId(id, prefeitura_id);
      
      await documento.remove();
      
      return true;
    } catch (error) {
      console.error(`Erro ao remover documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém o arquivo físico de um documento
   * @param {string} id - ID do documento
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Caminho e informações do arquivo
   */
  async obterArquivoDocumento(id, prefeitura_id) {
    try {
      const documento = await this.obterDocumentoPorId(id, prefeitura_id);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(documento.caminho_arquivo)) {
        throw criarError('Arquivo físico não encontrado', 404);
      }
      
      return {
        caminho: documento.caminho_arquivo,
        nome_original: documento.nome_arquivo,
        formato: documento.formato,
        tamanho: documento.tamanho
      };
    } catch (error) {
      console.error(`Erro ao obter arquivo do documento ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Lista documentos de um paciente ou acompanhante
   * @param {string} ref_id - ID do paciente ou acompanhante
   * @param {string} tipo_ref - Tipo de referência ('paciente' ou 'acompanhante')
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Array>} Lista de documentos
   */
  async listarDocumentosPorReferencia(ref_id, tipo_ref, prefeitura_id) {
    try {
      if (!['paciente', 'acompanhante'].includes(tipo_ref)) {
        throw criarError('Tipo de referência inválido', 400);
      }
      
      const documentos = await Documento.find({
        ref_id,
        tipo_ref,
        prefeitura: prefeitura_id,
        status: { $ne: 'arquivado' }
      })
      .sort({ created_at: -1 })
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      return documentos;
    } catch (error) {
      console.error(`Erro ao listar documentos da referência ${ref_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Lista documentos que estão a vencer nos próximos N dias
   * @param {string} prefeitura_id - ID da prefeitura
   * @param {number} diasLimite - Número de dias para vencimento
   * @returns {Promise<Array>} Lista de documentos
   */
  async listarDocumentosAVencer(prefeitura_id, diasLimite = 30) {
    try {
      // Calcular data limite de vencimento
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + diasLimite);
      
      // Buscar documentos ativos que vão vencer
      const documentos = await Documento.find({
        prefeitura: prefeitura_id,
        data_vencimento: { $lte: dataLimite, $gte: new Date() },
        status: 'ativo'
      })
      .sort({ data_vencimento: 1 })
      .populate('usuario_cadastro', 'nome email');
      
      return documentos;
    } catch (error) {
      console.error(`Erro ao listar documentos a vencer em ${diasLimite} dias:`, error);
      throw error;
    }
  }
  
  /**
   * Método privado para verificar a completude da documentação
   * @param {Object} documento - Documento recém criado
   * @returns {Promise<void>}
   */
  async verificarCompletude(documento) {
    try {
      if (documento.tipo_ref === 'paciente') {
        const Paciente = mongoose.model('Paciente');
        const paciente = await Paciente.findById(documento.ref_id);
        
        if (paciente) {
          await paciente.possuiTodosDocumentos();
        }
      } else if (documento.tipo_ref === 'acompanhante') {
        const Acompanhante = mongoose.model('Acompanhante');
        const acompanhante = await Acompanhante.findById(documento.ref_id);
        
        if (acompanhante) {
          await acompanhante.possuiTodosDocumentos();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar completude da documentação:', error);
      // Não propagar erro, apenas logar
    }
  }
}

module.exports = new DocumentoService(); 