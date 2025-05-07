import api from './api';

export const viagemService = {
  /**
   * Obter todas as viagens com opção de filtros
   * @param {Object} filtros - Objeto com filtros (destino, data, status, etc)
   * @returns {Promise} Lista de viagens
   */
  listarViagens: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros à query string
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const url = `/viagens${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar viagens:', error);
      throw error;
    }
  },

  /**
   * Obter uma viagem específica pelo ID
   * @param {string} id - ID da viagem
   * @returns {Promise} Dados da viagem
   */
  obterViagemPorId: async (id) => {
    try {
      const response = await api.get(`/viagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter viagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Criar uma nova viagem
   * @param {Object} dados - Dados da viagem
   * @returns {Promise} Viagem criada
   */
  criarViagem: async (dados) => {
    try {
      const response = await api.post('/viagens', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      throw error;
    }
  },

  /**
   * Atualizar uma viagem existente
   * @param {string} id - ID da viagem
   * @param {Object} dados - Dados atualizados da viagem
   * @returns {Promise} Viagem atualizada
   */
  atualizarViagem: async (id, dados) => {
    try {
      const response = await api.put(`/viagens/${id}`, dados);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar viagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Excluir uma viagem
   * @param {string} id - ID da viagem
   * @returns {Promise} Resultado da operação
   */
  excluirViagem: async (id) => {
    try {
      const response = await api.delete(`/viagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir viagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Alterar o status de uma viagem
   * @param {string} id - ID da viagem
   * @param {string} status - Novo status da viagem
   * @returns {Promise} Viagem atualizada
   */
  alterarStatusViagem: async (id, status) => {
    try {
      const response = await api.patch(`/viagens/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Erro ao alterar status da viagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adicionar pacientes a uma viagem
   * @param {string} viagemId - ID da viagem
   * @param {Array} pacientesIds - Array com IDs dos pacientes
   * @returns {Promise} Viagem atualizada
   */
  adicionarPacientes: async (viagemId, pacientesIds) => {
    try {
      const response = await api.post(`/viagens/${viagemId}/pacientes`, { pacientes: pacientesIds });
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar pacientes à viagem ${viagemId}:`, error);
      throw error;
    }
  },

  /**
   * Remover um paciente de uma viagem
   * @param {string} viagemId - ID da viagem
   * @param {string} pacienteId - ID do paciente
   * @returns {Promise} Viagem atualizada
   */
  removerPaciente: async (viagemId, pacienteId) => {
    try {
      const response = await api.delete(`/viagens/${viagemId}/pacientes/${pacienteId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao remover paciente da viagem ${viagemId}:`, error);
      throw error;
    }
  },

  /**
   * Gerar relatório de uma viagem
   * @param {string} id - ID da viagem
   * @param {string} formato - Formato do relatório (pdf, excel, etc)
   * @returns {Promise} URL do relatório
   */
  gerarRelatorio: async (id, formato = 'pdf') => {
    try {
      const response = await api.get(`/viagens/${id}/relatorio?formato=${formato}`, {
        responseType: 'blob'
      });
      
      // Criar URL para download do arquivo
      const blob = new Blob([response.data], { 
        type: formato === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error(`Erro ao gerar relatório da viagem ${id}:`, error);
      throw error;
    }
  }
}; 