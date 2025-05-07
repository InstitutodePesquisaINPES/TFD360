import api from './api';

export interface Prefeitura {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  logo?: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  configuracoes?: Record<string, any>;
}

export interface PaginacaoPrefeituras {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface FiltrosPrefeituras {
  termo?: string;
  status?: 'ativa' | 'inativa' | 'todas';
  estado?: string;
  pagina?: number;
  limite?: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Serviço para gerenciar prefeituras
 */
const prefeiturasService = {
  /**
   * Listar prefeituras com filtros e paginação
   * @param filtros Filtros para a busca de prefeituras
   * @returns Lista de prefeituras e informações de paginação
   */
  listar: async (filtros: FiltrosPrefeituras = {}) => {
    const response = await api.get<ApiResponse<PaginatedResponse<Prefeitura>>>('/prefeituras', {
      params: { ...filtros }
    });
    return response.data;
  },
  
  /**
   * Buscar prefeitura por ID
   * @param id ID da prefeitura
   * @returns Dados da prefeitura
   */
  buscar: async (id: string): Promise<Prefeitura> => {
    const response = await api.get<ApiResponse<Prefeitura>>(`/prefeituras/${id}`);
    return response.data;
  },
  
  /**
   * Criar uma nova prefeitura
   * @param dados Dados da nova prefeitura
   * @returns Prefeitura criada
   */
  criar: async (dados: FormData): Promise<{ message: string; prefeitura: Prefeitura }> => {
    const response = await api.post('/prefeituras', dados, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  /**
   * Atualizar uma prefeitura existente
   * @param id ID da prefeitura
   * @param dados Dados atualizados da prefeitura
   * @returns Prefeitura atualizada
   */
  atualizar: async (id: string, dados: FormData): Promise<{ message: string; prefeitura: Prefeitura }> => {
    const response = await api.put<ApiResponse<Prefeitura>>(`/prefeituras/${id}`, dados, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  /**
   * Ativar ou desativar uma prefeitura
   * @param id ID da prefeitura
   * @param ativa Status para definir (true = ativa, false = inativa)
   * @returns Mensagem de sucesso
   */
  alterarStatus: async (id: string, ativa: boolean): Promise<{ message: string; prefeitura: { id: string; nome: string; ativa: boolean } }> => {
    const response = await api.patch<ApiResponse<Prefeitura>>(`/prefeituras/${id}/status`, { 
      status: ativa ? 'ATIVA' : 'INATIVA' 
    });
    return response.data;
  },
  
  /**
   * Remover uma prefeitura
   * @param id ID da prefeitura
   * @returns Mensagem de sucesso
   */
  remover: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<null>>(`/prefeituras/${id}`);
    return response.data;
  },
  
  /**
   * Listar todos os estados brasileiros
   * @returns Lista de estados
   */
  listarEstados: async (): Promise<{ sigla: string; nome: string }[]> => {
    const response = await api.get('/prefeituras/estados');
    return response.data;
  },
  
  /**
   * Buscar dados de um CNPJ na Receita Federal
   * @param cnpj CNPJ para consulta
   * @returns Dados da empresa
   */
  consultarCNPJ: async (cnpj: string): Promise<any> => {
    const response = await api.get(`/prefeituras/consulta-cnpj/${cnpj}`);
    return response.data;
  },
  
  /**
   * Buscar estatísticas da prefeitura
   * @param id ID da prefeitura
   * @returns Estatísticas da prefeitura
   */
  estatisticas: async (id: string): Promise<any> => {
    const response = await api.get(`/prefeituras/${id}/estatisticas`);
    return response.data;
  },

  /**
   * Atualizar configurações da prefeitura
   * @param id ID da prefeitura
   * @param configuracoes Configurações da prefeitura
   * @returns Configurações atualizadas
   */
  atualizarConfiguracoes: async (id: string, configuracoes: Record<string, any>): Promise<{ message: string; configuracoes: Record<string, any> }> => {
    const response = await api.patch(`/prefeituras/${id}/configuracoes`, { configuracoes });
    return response.data;
  }
};

export default prefeiturasService; 