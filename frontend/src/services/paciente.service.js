import api from './api';

/**
 * Serviço para gerenciar operações relacionadas a pacientes
 */
export const pacienteService = {
  /**
   * Lista todos os pacientes com opção de filtros
   * @param {Object} filtros - Objeto com filtros (nome, cpf, status, etc)
   * @returns {Promise} Lista de pacientes
   */
  listarPacientes: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros à query string
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const url = `/pacientes${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar pacientes:', error);
      throw error;
    }
  },

  /**
   * Busca pacientes por termo (nome, CPF, cartão SUS)
   * @param {string} termo - Termo de busca
   * @returns {Promise} Lista de pacientes que correspondem ao termo
   */
  buscarPacientes: async (termo) => {
    try {
      if (!termo || termo.length < 3) {
        throw new Error('O termo de busca deve ter pelo menos 3 caracteres');
      }
      
      const response = await api.get(`/pacientes/buscar?termo=${termo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw error;
    }
  },

  /**
   * Obter um paciente pelo ID
   * @param {string} id - ID do paciente
   * @returns {Promise} Dados do paciente
   */
  obterPacientePorId: async (id) => {
    try {
      const response = await api.get(`/pacientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter paciente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Criar um novo paciente
   * @param {Object} dados - Dados do paciente
   * @returns {Promise} Paciente criado
   */
  criarPaciente: async (dados) => {
    try {
      const response = await api.post('/pacientes', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  },

  /**
   * Atualizar um paciente existente
   * @param {string} id - ID do paciente
   * @param {Object} dados - Dados atualizados do paciente
   * @returns {Promise} Paciente atualizado
   */
  atualizarPaciente: async (id, dados) => {
    try {
      const response = await api.put(`/pacientes/${id}`, dados);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar paciente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bloquear ou desbloquear um paciente
   * @param {string} id - ID do paciente
   * @param {boolean} bloquear - true para bloquear, false para desbloquear
   * @param {string} motivo - Motivo do bloqueio (obrigatório se bloquear=true)
   * @returns {Promise} Paciente atualizado
   */
  alterarStatusBloqueio: async (id, bloquear, motivo = null) => {
    try {
      const endpoint = bloquear ? 'bloquear' : 'desbloquear';
      const dados = bloquear ? { motivo } : {};
      
      const response = await api.patch(`/pacientes/${id}/${endpoint}`, dados);
      return response.data;
    } catch (error) {
      console.error(`Erro ao ${bloquear ? 'bloquear' : 'desbloquear'} paciente ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adicionar uma condição médica ao paciente
   * @param {string} pacienteId - ID do paciente
   * @param {Object} condicao - Dados da condição médica
   * @returns {Promise} Paciente atualizado
   */
  adicionarCondicaoMedica: async (pacienteId, condicao) => {
    try {
      const response = await api.post(`/pacientes/${pacienteId}/condicoes-medicas`, condicao);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar condição médica:', error);
      throw error;
    }
  },

  /**
   * Remover uma condição médica do paciente
   * @param {string} pacienteId - ID do paciente
   * @param {string} condicaoId - ID da condição médica
   * @returns {Promise} Paciente atualizado
   */
  removerCondicaoMedica: async (pacienteId, condicaoId) => {
    try {
      const response = await api.delete(`/pacientes/${pacienteId}/condicoes-medicas/${condicaoId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover condição médica:', error);
      throw error;
    }
  },

  /**
   * Adicionar um documento ao paciente
   * @param {string} pacienteId - ID do paciente
   * @param {FormData} formData - Formulário com arquivo e metadados
   * @returns {Promise} Documento adicionado
   */
  adicionarDocumento: async (pacienteId, formData) => {
    try {
      const response = await api.post(`/pacientes/${pacienteId}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      throw error;
    }
  },

  /**
   * Remover um documento do paciente
   * @param {string} pacienteId - ID do paciente
   * @param {string} documentoId - ID do documento
   * @returns {Promise} Resultado da operação
   */
  removerDocumento: async (pacienteId, documentoId) => {
    try {
      const response = await api.delete(`/pacientes/${pacienteId}/documentos/${documentoId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      throw error;
    }
  },

  /**
   * Obter pacientes disponíveis para uma viagem (não associados a ela)
   * @param {string} viagemId - ID da viagem
   * @param {string} termo - Termo opcional para filtrar pacientes
   * @returns {Promise} Lista de pacientes disponíveis
   */
  obterPacientesDisponiveisParaViagem: async (viagemId, termo = '') => {
    try {
      const params = new URLSearchParams();
      if (termo) params.append('termo', termo);
      
      const response = await api.get(`/pacientes/disponiveis-para-viagem/${viagemId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter pacientes disponíveis para viagem:', error);
      throw error;
    }
  },

  /**
   * Obter histórico de viagens de um paciente
   * @param {string} pacienteId - ID do paciente
   * @returns {Promise} Lista de viagens do paciente
   */
  obterHistoricoViagens: async (pacienteId) => {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/historico-viagens`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter histórico de viagens do paciente ${pacienteId}:`, error);
      throw error;
    }
  },

  /**
   * Verificar se paciente tem todos os documentos necessários
   * @param {string} pacienteId - ID do paciente
   * @returns {Promise} Objeto contendo resultado da verificação
   */
  verificarDocumentacao: async (pacienteId) => {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/verificar-documentacao`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao verificar documentação do paciente ${pacienteId}:`, error);
      throw error;
    }
  }
}; 