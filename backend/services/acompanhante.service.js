const mongoose = require('mongoose');
const Acompanhante = require('../models/acompanhante.model');
const Paciente = require('../models/paciente.model');
const Documento = require('../models/documento.model');
const { criarError } = require('../utils/error.utils');

/**
 * Serviço para gerenciamento de acompanhantes
 */
class AcompanhanteService {
  /**
   * Lista acompanhantes com filtros
   * @param {Object} filtros - Filtros de busca
   * @param {Object} opcoesPaginacao - Opções de paginação
   * @returns {Promise<Object>} Resultado paginado
   */
  async listarAcompanhantes(filtros = {}, opcoesPaginacao = { page: 1, limit: 10 }) {
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
      
      if (filtros.status) {
        query.status = filtros.status;
      }
      
      if (filtros.paciente_id) {
        query.pacientes = filtros.paciente_id;
      }
      
      if (filtros.relacao_paciente) {
        query.relacao_paciente = filtros.relacao_paciente;
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
          { path: 'pacientes', select: 'nome cpf' },
          { path: 'prefeitura', select: 'nome cidade estado' },
          { path: 'usuario_cadastro', select: 'nome email' }
        ]
      };
      
      // Executar consulta paginada
      return await Acompanhante.paginate(query, options);
    } catch (error) {
      console.error('Erro ao listar acompanhantes:', error);
      throw error;
    }
  }
  
  /**
   * Busca um acompanhante pelo ID
   * @param {string} id - ID do acompanhante
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Acompanhante encontrado
   */
  async obterAcompanhantePorId(id, prefeitura_id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw criarError('ID de acompanhante inválido', 400);
      }
      
      const acompanhante = await Acompanhante.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      })
      .populate('pacientes', 'nome cpf')
      .populate('prefeitura', 'nome cidade estado')
      .populate('usuario_cadastro', 'nome email')
      .populate('usuario_ultima_atualizacao', 'nome email');
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
      }
      
      // Buscar documentos do acompanhante
      const documentos = await Documento.find({
        ref_id: id,
        tipo_ref: 'acompanhante',
        status: { $ne: 'arquivado' }
      }).sort({ created_at: -1 });
      
      // Adicionar documentos ao resultado
      const resultado = acompanhante.toObject();
      resultado.documentos = documentos;
      
      return resultado;
    } catch (error) {
      console.error(`Erro ao buscar acompanhante ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Verifica se o CPF já está em uso por outro acompanhante
   * @param {string} cpf - CPF a verificar
   * @param {string} acompanhanteId - ID do acompanhante atual (para edição)
   * @returns {Promise<boolean>} true se o CPF estiver disponível
   */
  async verificarCPFDisponivel(cpf, acompanhanteId = null) {
    try {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      // Consulta base
      const query = { cpf: cpfLimpo };
      
      // Se for edição, excluir o próprio acompanhante da verificação
      if (acompanhanteId) {
        query._id = { $ne: acompanhanteId };
      }
      
      const acompanhanteExistente = await Acompanhante.findOne(query);
      return !acompanhanteExistente;
    } catch (error) {
      console.error(`Erro ao verificar disponibilidade de CPF ${cpf}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria um novo acompanhante
   * @param {Object} dadosAcompanhante - Dados do acompanhante
   * @param {string} usuario_id - ID do usuário que está criando
   * @returns {Promise<Object>} Acompanhante criado
   */
  async criarAcompanhante(dadosAcompanhante, usuario_id) {
    try {
      // Validar CPF único
      const cpfDisponivel = await this.verificarCPFDisponivel(dadosAcompanhante.cpf);
      if (!cpfDisponivel) {
        throw criarError('CPF já cadastrado para outro acompanhante', 400);
      }
      
      // Validar idade mínima (18 anos)
      const dataNascimento = new Date(dadosAcompanhante.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const mesAtual = hoje.getMonth();
      const mesNascimento = dataNascimento.getMonth();
      
      if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }
      
      if (idade < 18) {
        throw criarError('Acompanhante deve ter pelo menos 18 anos', 400);
      }
      
      // Adicionar informações adicionais
      dadosAcompanhante.usuario_cadastro = usuario_id;
      dadosAcompanhante.status = dadosAcompanhante.status || 'ativo';
      
      // Se houver paciente definido, verificar se existe
      if (dadosAcompanhante.paciente_id) {
        const paciente = await Paciente.findOne({
          _id: dadosAcompanhante.paciente_id,
          prefeitura: dadosAcompanhante.prefeitura
        });
        
        if (!paciente) {
          throw criarError('Paciente não encontrado', 404);
        }
        
        // Inicializar array de pacientes
        if (!dadosAcompanhante.pacientes) {
          dadosAcompanhante.pacientes = [];
        }
        
        dadosAcompanhante.pacientes.push(dadosAcompanhante.paciente_id);
        delete dadosAcompanhante.paciente_id;
      }
      
      // Criar o acompanhante
      const novoAcompanhante = new Acompanhante(dadosAcompanhante);
      await novoAcompanhante.save();
      
      // Atualizar pacientes relacionados
      if (novoAcompanhante.pacientes && novoAcompanhante.pacientes.length > 0) {
        for (const pacienteId of novoAcompanhante.pacientes) {
          await Paciente.findByIdAndUpdate(pacienteId, {
            $addToSet: { acompanhantes: novoAcompanhante._id }
          });
        }
      }
      
      return await this.obterAcompanhantePorId(novoAcompanhante._id, dadosAcompanhante.prefeitura);
    } catch (error) {
      console.error('Erro ao criar acompanhante:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um acompanhante existente
   * @param {string} id - ID do acompanhante
   * @param {Object} dadosAtualizacao - Dados a atualizar
   * @param {string} usuario_id - ID do usuário que está atualizando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Acompanhante atualizado
   */
  async atualizarAcompanhante(id, dadosAtualizacao, usuario_id, prefeitura_id) {
    try {
      // Verificar se acompanhante existe
      const acompanhante = await Acompanhante.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      });
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
      }
      
      // Validar CPF único se estiver sendo alterado
      if (dadosAtualizacao.cpf && dadosAtualizacao.cpf !== acompanhante.cpf) {
        const cpfDisponivel = await this.verificarCPFDisponivel(dadosAtualizacao.cpf, id);
        if (!cpfDisponivel) {
          throw criarError('CPF já cadastrado para outro acompanhante', 400);
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
        
        if (idade < 18) {
          throw criarError('Acompanhante deve ter pelo menos 18 anos', 400);
        }
      }
      
      // Adicionar usuário que atualizou
      dadosAtualizacao.usuario_ultima_atualizacao = usuario_id;
      
      // Lista de campos que não podem ser atualizados
      const camposProtegidos = ['_id', 'prefeitura', 'usuario_cadastro', 'created_at', 'pacientes'];
      
      // Remover campos protegidos
      camposProtegidos.forEach(campo => {
        delete dadosAtualizacao[campo];
      });
      
      // Atualizar o acompanhante
      const acompanhanteAtualizado = await Acompanhante.findByIdAndUpdate(
        id, 
        { $set: dadosAtualizacao },
        { new: true, runValidators: true }
      );
      
      return await this.obterAcompanhantePorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao atualizar acompanhante ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Altera o status de um acompanhante
   * @param {string} id - ID do acompanhante
   * @param {string} novoStatus - Novo status
   * @param {string} motivo - Motivo da alteração (opcional)
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Object>} Acompanhante atualizado
   */
  async alterarStatus(id, novoStatus, motivo, usuario_id, prefeitura_id) {
    try {
      const acompanhante = await Acompanhante.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      });
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
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
        acompanhante.bloquear(motivo, usuario_id);
      } else if (novoStatus === 'ativo') {
        acompanhante.reativar(usuario_id);
      } else {
        acompanhante.status = novoStatus;
        acompanhante.usuario_ultima_atualizacao = usuario_id;
      }
      
      await acompanhante.save();
      
      return await this.obterAcompanhantePorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao alterar status do acompanhante ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove um acompanhante (altera o status para inativo)
   * @param {string} id - ID do acompanhante
   * @param {string} usuario_id - ID do usuário
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<boolean>} Resultado da operação
   */
  async removerAcompanhante(id, usuario_id, prefeitura_id) {
    try {
      const acompanhante = await Acompanhante.findOne({ 
        _id: id, 
        prefeitura: prefeitura_id 
      });
      
      if (!acompanhante) {
        throw criarError('Acompanhante não encontrado', 404);
      }
      
      // Remover acompanhante de todos os pacientes relacionados
      for (const pacienteId of acompanhante.pacientes) {
        await Paciente.findByIdAndUpdate(pacienteId, {
          $pull: { acompanhantes: id }
        });
      }
      
      // Inativar acompanhante
      acompanhante.status = 'inativo';
      acompanhante.usuario_ultima_atualizacao = usuario_id;
      await acompanhante.save();
      
      return true;
    } catch (error) {
      console.error(`Erro ao remover acompanhante ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Busca acompanhantes de um paciente específico
   * @param {string} pacienteId - ID do paciente
   * @param {string} prefeitura_id - ID da prefeitura
   * @returns {Promise<Array>} Lista de acompanhantes
   */
  async buscarAcompanhantesPorPaciente(pacienteId, prefeitura_id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
        throw criarError('ID de paciente inválido', 400);
      }
      
      // Verificar se o paciente existe
      const paciente = await Paciente.findOne({ 
        _id: pacienteId, 
        prefeitura: prefeitura_id 
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Buscar acompanhantes vinculados ao paciente
      const acompanhantes = await Acompanhante.find({
        pacientes: pacienteId,
        prefeitura: prefeitura_id,
        status: 'ativo'
      })
      .select('-__v')
      .sort({ nome: 1 });
      
      return acompanhantes;
    } catch (error) {
      console.error(`Erro ao buscar acompanhantes do paciente ${pacienteId}:`, error);
      throw error;
    }
  }
}

module.exports = new AcompanhanteService(); 