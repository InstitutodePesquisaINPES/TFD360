import api from './api';

export interface Log {
  id: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  acao: string;
  entidade: string;
  entidade_id: string | null;
  detalhes: Record<string, any> | null;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface FiltrosLogs {
  usuario_id?: string;
  entidade?: string;
  acao?: string;
  data_inicio?: string;
  data_fim?: string;
  pagina?: number;
  limite?: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

/**
 * Serviço para gerenciar logs e auditoria do sistema
 */
const logsService = {
  /**
   * Listar logs com filtros e paginação
   * @param filtros Filtros para a busca de logs
   * @returns Lista de logs e informações de paginação
   */
  listar: async (filtros: FiltrosLogs = {}) => {
    const response = await api.get<ApiResponse<PaginatedResponse<Log>>>('/logs', {
      params: { ...filtros }
    });
    return response.data;
  },
  
  /**
   * Buscar log por ID
   * @param id ID do log
   * @returns Detalhes do log
   */
  buscar: async (id: string): Promise<Log> => {
    const response = await api.get<ApiResponse<Log>>(`/logs/${id}`);
    return response.data;
  },
  
  /**
   * Buscar logs de uma entidade específica
   * @param entidade Tipo da entidade (ex: "usuario", "prefeitura")
   * @param entidadeId ID da entidade
   * @returns Lista de logs relacionados à entidade
   */
  buscarPorEntidade: async (entidade: string, entidadeId: string, pagina = 1, limite = 10): Promise<PaginatedResponse<Log>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Log>>>('/logs', {
      params: {
        entidade,
        entidade_id: entidadeId,
        pagina,
        limite
      }
    });
    return response.data.data;
  },
  
  /**
   * Exportar logs para CSV
   * @param filtros Filtros para a exportação
   * @returns URL para download do arquivo
   */
  exportar: async (filtros: FiltrosLogs = {}): Promise<string> => {
    const response = await api.post<ApiResponse<{url: string}>>('/logs/exportar', filtros);
    return response.data.data.url;
  },
  
  /**
   * Listar tipos de ações registradas no sistema
   * @returns Lista de ações
   */
  listarAcoes: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/logs/acoes');
    return response.data.data;
  },
  
  /**
   * Listar tipos de entidades registradas no sistema
   * @returns Lista de entidades
   */
  listarEntidades: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/logs/entidades');
    return response.data.data;
  }
};

export default logsService; 