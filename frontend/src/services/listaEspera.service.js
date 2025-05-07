import api from './api';

/**
 * Serviço para gerenciar operações relacionadas à lista de espera de pacientes em viagens
 */
export const listaEsperaService = {
  /**
   * Obter lista de espera de uma viagem
   * @param {string} viagemId - ID da viagem
   * @returns {Promise} Lista de pacientes na lista de espera
   */
  obterListaEspera: async (viagemId) => {
    try {
      const response = await api.get(`/viagens/${viagemId}/lista-espera`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter lista de espera da viagem ${viagemId}:`, error);
      throw error;
    }
  },

  /**
   * Adicionar paciente à lista de espera de uma viagem
   * @param {string} viagemId - ID da viagem
   * @param {Object} dados - Dados do paciente para a lista de espera
   * @param {string} dados.paciente_id - ID do paciente
   * @param {string} dados.prioridade - Prioridade na lista (alta, media, normal)
   * @param {boolean} dados.acompanhante - Se necessita de acompanhante
   * @param {string} dados.observacao - Observação adicional
   * @returns {Promise} Dados do registro criado
   */
  adicionarPacienteListaEspera: async (viagemId, dados) => {
    try {
      const response = await api.post(`/viagens/${viagemId}/lista-espera`, dados);
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar paciente à lista de espera da viagem ${viagemId}:`, error);
      throw error;
    }
  },

  /**
   * Remover paciente da lista de espera
   * @param {string} viagemId - ID da viagem
   * @param {string} listaEsperaId - ID do registro na lista de espera
   * @returns {Promise} Resultado da operação
   */
  removerPacienteListaEspera: async (viagemId, listaEsperaId) => {
    try {
      const response = await api.delete(`/viagens/${viagemId}/lista-espera/${listaEsperaId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao remover paciente da lista de espera:`, error);
      throw error;
    }
  },

  /**
   * Adicionar pacientes da lista de espera à viagem
   * @param {string} viagemId - ID da viagem
   * @param {Array} pacientesIds - IDs dos registros da lista de espera para adicionar
   * @returns {Promise} Resultado da operação
   */
  adicionarDaListaEspera: async (viagemId, pacientesIds) => {
    try {
      const response = await api.post(`/viagens/${viagemId}/adicionar-da-lista-espera`, {
        pacientes: pacientesIds
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar pacientes da lista de espera à viagem ${viagemId}:`, error);
      throw error;
    }
  },

  /**
   * Atualizar prioridade de um paciente na lista de espera
   * @param {string} viagemId - ID da viagem
   * @param {string} listaEsperaId - ID do registro na lista de espera
   * @param {string} prioridade - Nova prioridade (alta, media, normal)
   * @returns {Promise} Registro atualizado
   */
  atualizarPrioridade: async (viagemId, listaEsperaId, prioridade) => {
    try {
      const response = await api.patch(`/viagens/${viagemId}/lista-espera/${listaEsperaId}/prioridade`, {
        prioridade
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar prioridade na lista de espera:`, error);
      throw error;
    }
  },

  /**
   * Adicionar observação a um paciente na lista de espera
   * @param {string} viagemId - ID da viagem
   * @param {string} listaEsperaId - ID do registro na lista de espera
   * @param {string} observacao - Nova observação
   * @returns {Promise} Registro atualizado
   */
  atualizarObservacao: async (viagemId, listaEsperaId, observacao) => {
    try {
      const response = await api.patch(`/viagens/${viagemId}/lista-espera/${listaEsperaId}/observacao`, {
        observacao
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar observação na lista de espera:`, error);
      throw error;
    }
  },

  /**
   * Obter estatísticas da lista de espera
   * @param {string} viagemId - ID da viagem
   * @returns {Promise} Dados estatísticos da lista de espera
   */
  obterEstatisticas: async (viagemId) => {
    try {
      const response = await api.get(`/viagens/${viagemId}/lista-espera/estatisticas`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter estatísticas da lista de espera da viagem ${viagemId}:`, error);
      throw error;
    }
  }
}; 