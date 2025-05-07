const mongoose = require('mongoose');
const Paciente = require('../models/paciente.model');
const Acompanhante = require('../models/acompanhante.model');
const Documento = require('../models/documento.model');
const { criarError } = require('../utils/error.utils');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const uploadDir = path.join(__dirname, '../uploads');

/**
 * Serviço para gerenciamento de pacientes
 */
class PacienteService {
  /**
   * Lista pacientes com filtro por prefeitura e outros critérios
   * @param {Object} filtros - Filtros de busca
   * @param {Object} opcoesPaginacao - Opções de paginação
   * @returns {Promise<Object>} Resultado paginado
   */
  async listarPacientes(filtros = {}, opcoesPaginacao = { page: 1, limit: 10 }) {
    try {
      const query = {};
      
      // Filtro por prefeitura - obrigatório por segurança
      if (!filtros.prefeitura_id) {
        throw criarError('Prefeitura não informada', 400);
      }
      query.prefeitura = filtros.prefeitura_id;
      
      // Filtros opcionais
      if (filtros.nome) {
        query.$text = { $search: filtros.nome };
      }
      
      if (filtros.cpf) {
        query.cpf = { $regex: filtros.cpf.replace(/[^\d]/g, ''), $options: 'i' };
      }
      
      if (filtros.cartao_sus) {
        query.cartao_sus = { $regex: filtros.cartao_sus.replace(/[^\d]/g, ''), $options: 'i' };
      }
      
      if (filtros.status) {
        query.status = filtros.status;
      }
      
      // Filtros por condições médicas
      if (filtros.cid) {
        query['condicoes_medicas.cid'] = { $regex: filtros.cid, $options: 'i' };
      }
      
      // Filtro por documentação
      if (filtros.documentacao_completa !== undefined) {
        query.documentacao_completa = filtros.documentacao_completa === 'true';
      }
      
      // Opções de ordenação
      const sort = filtros.sort_by ? 
        { [filtros.sort_by]: filtros.sort_order === 'desc' ? -1 : 1 } : 
        { nome: 1 };
      
      // Opções de paginação
      const options = {
        page: opcoesPaginacao.page,
        limit: opcoesPaginacao.limit,
        sort,
        populate: [
          { path: 'acompanhantes', select: 'nome cpf telefone relacao_paciente' },
          { path: 'prefeitura', select: 'nome cidade estado' },
          { path: 'usuario_cadastro', select: 'nome email' }
        ]
      };
      
      // Executar consulta paginada
      return await Paciente.paginate(query, options);
    } catch (error) {
      console.error('Erro ao listar pacientes:', error);
      throw error;
    }
  }
  
  /**
   * Busca um paciente pelo ID
   * @param {string} id - ID do paciente
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Paciente encontrado
   */
  async obterPacientePorId(id, prefeitura_id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw criarError('ID de paciente inválido', 400);
      }
      
      const paciente = await Paciente.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      })
      .populate('acompanhantes')
      .populate('prefeitura', 'nome cidade estado')
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Buscar documentos do paciente
      const documentos = await Documento.find({
        ref_id: id,
        tipo_ref: 'paciente',
        status: { $ne: 'arquivado' }
      }).sort({ created_at: -1 });
      
      // Adicionar documentos ao resultado
      const resultado = paciente.toObject();
      resultado.documentos = documentos;
      
      return resultado;
    } catch (error) {
      console.error(`Erro ao buscar paciente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Verifica se o CPF já está em uso por outro paciente
   * @param {string} cpf - CPF a verificar
   * @param {string} pacienteId - ID do paciente atual (para edição)
   * @returns {Promise<boolean>} true se o CPF estiver disponível
   */
  async verificarCPFDisponivel(cpf, pacienteId = null) {
    try {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      // Consulta base
      const query = { cpf: cpfLimpo };
      
      // Se for edição, excluir o próprio paciente da verificação
      if (pacienteId) {
        query._id = { $ne: pacienteId };
      }
      
      const pacienteExistente = await Paciente.findOne(query);
      return !pacienteExistente;
    } catch (error) {
      console.error(`Erro ao verificar disponibilidade de CPF ${cpf}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria um novo paciente
   * @param {Object} dadosPaciente - Dados do paciente
   * @param {string} usuario_id - ID do usuário que está criando
   * @returns {Promise<Object>} Paciente criado
   */
  async criarPaciente(dadosPaciente, usuario_id) {
    try {
      // Validar CPF único
      const cpfDisponivel = await this.verificarCPFDisponivel(dadosPaciente.cpf);
      if (!cpfDisponivel) {
        throw criarError('CPF já cadastrado para outro paciente', 400);
      }
      
      // Validar idade mínima (16 anos)
      const dataNascimento = new Date(dadosPaciente.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const mesAtual = hoje.getMonth();
      const mesNascimento = dataNascimento.getMonth();
      
      if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }
      
      if (idade < 16) {
        throw criarError('Paciente deve ter pelo menos 16 anos', 400);
      }
      
      // Adicionar informações adicionais
      dadosPaciente.usuario_cadastro = usuario_id;
      dadosPaciente.status = dadosPaciente.status || 'ativo';
      
      // Criar o paciente
      const novoPaciente = new Paciente(dadosPaciente);
      await novoPaciente.save();
      
      return await this.obterPacientePorId(novoPaciente._id, dadosPaciente.prefeitura);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um paciente existente
   * @param {string} id - ID do paciente
   * @param {Object} dadosAtualizacao - Dados a atualizar
   * @param {string} usuario_id - ID do usuário que está atualizando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Paciente atualizado
   */
  async atualizarPaciente(id, dadosAtualizacao, usuario_id, prefeitura_id) {
    try {
      // Verificar se paciente existe
      const paciente = await Paciente.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Validar CPF único se estiver sendo alterado
      if (dadosAtualizacao.cpf && dadosAtualizacao.cpf !== paciente.cpf) {
        const cpfDisponivel = await this.verificarCPFDisponivel(dadosAtualizacao.cpf, id);
        if (!cpfDisponivel) {
          throw criarError('CPF já cadastrado para outro paciente', 400);
        }
      }
      
      // Validar idade mínima se data de nascimento for alterada
      if (dadosAtualizacao.data_nascimento) {
        const dataNascimento = new Date(dadosAtualizacao.data_nascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = dataNascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
          idade--;
        }
        
        if (idade < 16) {
          throw criarError('Paciente deve ter pelo menos 16 anos', 400);
        }
      }
      
      // Adicionar usuário que atualizou
      dadosAtualizacao.usuario_ultima_atualizacao = usuario_id;
      
      // Lista de campos que não podem ser atualizados
      const camposProtegidos = ['_id', 'prefeitura', 'usuario_cadastro', 'created_at'];
      
      // Remover campos protegidos
      camposProtegidos.forEach(campo => {
        delete dadosAtualizacao[campo];
      });
      
      // Atualizar o paciente
      const pacienteAtualizado = await Paciente.findByIdAndUpdate(
        id, 
        { $set: dadosAtualizacao },
        { new: true, runValidators: true }
      );
      
      return await this.obterPacientePorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao atualizar paciente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Adiciona uma condição médica a um paciente
   * @param {string} pacienteId - ID do paciente
   * @param {Object} condicaoMedica - Dados da condição médica
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Paciente atualizado
   */
  async adicionarCondicaoMedica(pacienteId, condicaoMedica, usuario_id, prefeitura_id) {
    try {
      const paciente = await Paciente.findOne({ 
        _id: pacienteId, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      paciente.adicionarCondicaoMedica(condicaoMedica);
      paciente.usuario_ultima_atualizacao = usuario_id;
      
      await paciente.save();
      
      return await this.obterPacientePorId(pacienteId, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao adicionar condição médica ao paciente ${pacienteId}:`, error);
      throw error;
    }
  }
  
  /**
   * Altera o status de um paciente
   * @param {string} id - ID do paciente
   * @param {string} novoStatus - Novo status
   * @param {string} motivo - Motivo da alteração (opcional)
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Paciente atualizado
   */
  async alterarStatus(id, novoStatus, motivo, usuario_id, prefeitura_id) {
    try {
      const paciente = await Paciente.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Validar status
      if (!['ativo', 'inativo', 'bloqueado'].includes(novoStatus)) {
        throw criarError('Status inválido', 400);
      }
      
      // Aplicar a alteração
      if (novoStatus === 'bloqueado') {
        if (!motivo) {
          throw criarError('Motivo do bloqueio é obrigatório', 400);
        }
        paciente.bloquear(motivo, usuario_id);
      } else if (novoStatus === 'ativo') {
        paciente.reativar(usuario_id);
      } else {
        paciente.status = novoStatus;
        paciente.usuario_ultima_atualizacao = usuario_id;
      }
      
      await paciente.save();
      
      return await this.obterPacientePorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao alterar status do paciente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Vincula um acompanhante a um paciente
   * @param {string} pacienteId - ID do paciente
   * @param {string} acompanhanteId - ID do acompanhante
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Paciente atualizado
   */
  async vincularAcompanhante(pacienteId, acompanhanteId, usuario_id, prefeitura_id) {
    try {
      // Verificar se o paciente existe
      const paciente = await Paciente.findOne({ 
        _id: pacienteId, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Verificar se o acompanhante existe
      const acompanhante = await Acompanhante.findOne({
        _id: acompanhanteId,
        prefeitura: prefeitura_id
      });
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
      }
      
      // Adicionar acompanhante ao paciente
      paciente.adicionarAcompanhante(acompanhanteId);
      paciente.usuario_ultima_atualizacao = usuario_id;
      await paciente.save();
      
      // Adicionar paciente ao acompanhante
      acompanhante.adicionarPaciente(pacienteId);
      acompanhante.usuario_ultima_atualizacao = usuario_id;
      await acompanhante.save();
      
      return await this.obterPacientePorId(pacienteId, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao vincular acompanhante ${acompanhanteId} ao paciente ${pacienteId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove um acompanhante de um paciente
   * @param {string} pacienteId - ID do paciente
   * @param {string} acompanhanteId - ID do acompanhante
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Paciente atualizado
   */
  async removerAcompanhante(pacienteId, acompanhanteId, usuario_id, prefeitura_id) {
    try {
      // Verificar se o paciente existe
      const paciente = await Paciente.findOne({ 
        _id: pacienteId, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Verificar se o acompanhante existe
      const acompanhante = await Acompanhante.findOne({
        _id: acompanhanteId,
        prefeitura: prefeitura_id
      });
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
      }
      
      // Remover acompanhante do paciente
      paciente.acompanhantes = paciente.acompanhantes.filter(
        id => id.toString() !== acompanhanteId.toString()
      );
      paciente.usuario_ultima_atualizacao = usuario_id;
      await paciente.save();
      
      // Remover paciente do acompanhante
      acompanhante.removerPaciente(pacienteId);
      acompanhante.usuario_ultima_atualizacao = usuario_id;
      await acompanhante.save();
      
      return await this.obterPacientePorId(pacienteId, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao remover acompanhante ${acompanhanteId} do paciente ${pacienteId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gera e retorna a ficha completa do paciente em formato JSON
   * @param {string} id - ID do paciente
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Ficha completa do paciente
   */
  async gerarFichaPaciente(id, prefeitura_id) {
    try {
      // Obter dados completos do paciente
      const paciente = await this.obterPacientePorId(id, prefeitura_id);
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Buscar acompanhantes com dados completos
      const acompanhantes = await Promise.all(
        paciente.acompanhantes.map(async (acompanhanteId) => {
          const acompanhante = await Acompanhante.findById(acompanhanteId)
            .select('-__v -prefeitura');
          
          // Buscar documentos do acompanhante
          const documentos = await Documento.find({
            ref_id: acompanhanteId,
            tipo_ref: 'acompanhante',
            status: { $ne: 'arquivado' }
          });
          
          const resultado = acompanhante.toObject();
          resultado.documentos = documentos;
          
          return resultado;
        })
      );
      
      // Criar objeto de retorno completo
      const fichaPaciente = {
        ...paciente,
        acompanhantes_detalhados: acompanhantes
      };
      
      return fichaPaciente;
    } catch (error) {
      console.error(`Erro ao gerar ficha do paciente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Processa upload de foto do paciente
   * @param {Object} arquivo - Objeto do arquivo
   * @param {string} pacienteId - ID do paciente
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} URL da foto salva
   */
  async uploadFotoPaciente(arquivo, pacienteId, prefeitura_id) {
    try {
      // Verificar se o paciente existe
      const paciente = await Paciente.findOne({ 
        _id: pacienteId, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Configurações para salvar a foto
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único
      const extensao = path.extname(arquivo.originalname).toLowerCase();
      const nomeArquivo = `foto_paciente_${pacienteId}_${uuidv4()}${extensao}`;
      const caminhoArquivo = path.join(uploadDir, nomeArquivo);
      
      // Validar extensão
      const extensoesPermitidas = ['.jpg', '.jpeg', '.png'];
      if (!extensoesPermitidas.includes(extensao)) {
        throw criarError('Formato de arquivo não suportado. Envie JPG, JPEG ou PNG', 400);
      }
      
      // Validar tamanho (max 5MB)
      const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
      if (arquivo.size > tamanhoMaximo) {
        throw criarError('Tamanho máximo de arquivo excedido. Limite de 5MB', 400);
      }
      
      // Salvar o arquivo
      await fs.promises.writeFile(caminhoArquivo, arquivo.buffer);
      
      // Atualizar paciente com URL da foto
      const foto_url = `/api/pacientes/${pacienteId}/foto`;
      paciente.foto_url = foto_url;
      await paciente.save();
      
      return { foto_url };
    } catch (error) {
      console.error(`Erro ao fazer upload da foto do paciente ${pacienteId}:`, error);
      throw error;
    }
  }
}

module.exports = new PacienteService(); 