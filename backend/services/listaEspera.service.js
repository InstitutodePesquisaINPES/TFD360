const ListaEspera = require('../models/listaEspera.model');
const Viagem = require('../models/viagem.model');
const Paciente = require('../models/paciente.model');
const mongoose = require('mongoose');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Serviço para gerenciar a lista de espera de pacientes para viagens
 */
class ListaEsperaService {
  /**
   * Adiciona um paciente à lista de espera de uma viagem
   * @param {Object} dados - Dados da solicitação
   * @returns {Promise<Object>} - Registro da lista de espera criado
   */
  async adicionarPacienteListaEspera(dados) {
    const { viagemId, pacienteId, prefeituraId, usuarioId, prioridade, acompanhante, observacao } = dados;

    // Verificar se a viagem existe
    const viagem = await Viagem.findById(viagemId);
    if (!viagem) {
      throw new NotFoundError('Viagem não encontrada');
    }

    // Verificar se o paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      throw new NotFoundError('Paciente não encontrado');
    }

    // Verificar se o paciente já está na lista de espera desta viagem
    const existeNaLista = await ListaEspera.verificarPacienteListaEspera(viagemId, pacienteId);
    if (existeNaLista) {
      throw new ConflictError('Paciente já está na lista de espera desta viagem');
    }

    // Criar o registro na lista de espera
    const novoRegistro = new ListaEspera({
      viagem: viagemId,
      paciente: pacienteId,
      prefeitura: prefeituraId,
      usuario_cadastro: usuarioId,
      prioridade: prioridade || 'normal',
      acompanhante: acompanhante || false,
      observacao: observacao || ''
    });

    await novoRegistro.save();
    
    // Retornar o registro criado com informações do paciente
    return ListaEspera.findById(novoRegistro._id).populate('paciente');
  }

  /**
   * Obtém a lista de espera de uma viagem
   * @param {String} viagemId - ID da viagem
   * @param {String} prefeituraId - ID da prefeitura
   * @returns {Promise<Array>} - Lista de pacientes em espera
   */
  async obterListaEspera(viagemId, prefeituraId) {
    // Verificar se a viagem existe
    const viagem = await Viagem.findById(viagemId);
    if (!viagem) {
      throw new NotFoundError('Viagem não encontrada');
    }

    // Buscar a lista de espera ordenada
    return ListaEspera.obterListaEsperaOrdenada(viagemId, prefeituraId);
  }

  /**
   * Remove um paciente da lista de espera
   * @param {String} id - ID do registro na lista de espera
   * @returns {Promise<Object>} - Registro removido
   */
  async removerDaListaEspera(id) {
    const registro = await ListaEspera.findById(id);
    if (!registro) {
      throw new NotFoundError('Registro não encontrado na lista de espera');
    }

    if (registro.status !== 'pendente') {
      throw new BadRequestError('Apenas registros pendentes podem ser removidos da lista de espera');
    }

    // Remover o registro (definir como recusado)
    return ListaEspera.findByIdAndUpdate(
      id,
      { 
        status: 'recusado',
        motivo_recusa: 'Removido da lista de espera',
        updated_at: new Date() 
      },
      { new: true }
    );
  }

  /**
   * Adiciona um paciente da lista de espera à viagem
   * @param {String} listaEsperaId - ID do registro na lista de espera
   * @returns {Promise<Object>} - Paciente adicionado à viagem
   */
  async adicionarPacienteAViagem(listaEsperaId) {
    // Buscar o registro na lista de espera
    const registro = await ListaEspera.findById(listaEsperaId).populate('paciente viagem');
    
    if (!registro) {
      throw new NotFoundError('Registro não encontrado na lista de espera');
    }

    if (registro.status !== 'pendente') {
      throw new BadRequestError('Este paciente já foi processado na lista de espera');
    }

    // Adicionar o paciente à viagem (implementar lógica para adicionar à viagem)
    // Esta implementação depende de como está estruturado o módulo de viagens
    try {
      // Atualizar o status na lista de espera
      await ListaEspera.marcarComoAdicionado(registro.viagem._id, registro.paciente._id);
      
      // Retornar o paciente adicionado
      return {
        paciente: registro.paciente,
        mensagem: 'Paciente adicionado à viagem com sucesso'
      };
    } catch (error) {
      // Se houver erro ao adicionar à viagem, mantém na lista de espera
      throw new Error(`Erro ao adicionar paciente à viagem: ${error.message}`);
    }
  }

  /**
   * Atualiza a prioridade de um paciente na lista de espera
   * @param {String} id - ID do registro na lista de espera
   * @param {String} prioridade - Nova prioridade
   * @returns {Promise<Object>} - Registro atualizado
   */
  async atualizarPrioridade(id, prioridade) {
    const registro = await ListaEspera.findById(id);
    if (!registro) {
      throw new NotFoundError('Registro não encontrado na lista de espera');
    }

    if (registro.status !== 'pendente') {
      throw new BadRequestError('Apenas registros pendentes podem ser atualizados');
    }

    if (!['alta', 'media', 'normal'].includes(prioridade)) {
      throw new BadRequestError('Prioridade inválida. Deve ser: alta, media ou normal');
    }

    return ListaEspera.findByIdAndUpdate(
      id,
      { prioridade, updated_at: new Date() },
      { new: true }
    ).populate('paciente');
  }

  /**
   * Obtém estatísticas da lista de espera por viagem
   * @param {String} viagemId - ID da viagem
   * @returns {Promise<Object>} - Estatísticas da lista de espera
   */
  async obterEstatisticas(viagemId) {
    const total = await ListaEspera.countDocuments({ 
      viagem: viagemId, 
      status: 'pendente' 
    });

    const porPrioridade = await ListaEspera.aggregate([
      { 
        $match: { 
          viagem: mongoose.Types.ObjectId(viagemId),
          status: 'pendente'
        } 
      },
      {
        $group: {
          _id: '$prioridade',
          count: { $sum: 1 }
        }
      }
    ]);

    // Formatar os resultados
    const estatisticas = {
      total,
      prioridades: {
        alta: 0,
        media: 0,
        normal: 0
      }
    };

    // Preencher as estatísticas por prioridade
    porPrioridade.forEach(item => {
      estatisticas.prioridades[item._id] = item.count;
    });

    return estatisticas;
  }
}

module.exports = new ListaEsperaService(); 