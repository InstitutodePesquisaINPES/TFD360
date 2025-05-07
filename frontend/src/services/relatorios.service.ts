import api from './api';

export interface FiltrosRelatorio {
  data_inicio?: string;
  data_fim?: string;
  prefeitura_id?: string;
  usuario_id?: string;
  tipo?: string;
  formato?: 'pdf' | 'excel' | 'csv';
}

export interface RelatorioItem {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  permissao_necessaria: string;
  disponivel_para: ('super_admin' | 'admin' | 'gestor' | 'operador')[];
  parametros: {
    nome: string;
    tipo: 'data' | 'select' | 'text' | 'checkbox';
    obrigatorio: boolean;
    opcoes?: { valor: string; rotulo: string }[];
  }[];
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Serviço para geração e gerenciamento de relatórios
 */
const relatoriosService = {
  /**
   * Listar relatórios disponíveis para o usuário atual
   * @returns Lista de relatórios disponíveis
   */
  listarDisponiveis: async (): Promise<RelatorioItem[]> => {
    const response = await api.get<ApiResponse<RelatorioItem[]>>('/relatorios/disponiveis');
    return response.data.data;
  },
  
  /**
   * Gerar um relatório específico
   * @param id ID do relatório
   * @param filtros Filtros para a geração do relatório
   * @returns URL para download do relatório gerado
   */
  gerar: async (id: string, filtros: FiltrosRelatorio): Promise<{ url: string }> => {
    const response = await api.post<ApiResponse<{ url: string }>>(`/relatorios/${id}/gerar`, filtros);
    return response.data.data;
  },
  
  /**
   * Agendar geração recorrente de um relatório
   * @param id ID do relatório
   * @param agendamento Configurações de agendamento
   * @returns Detalhes do agendamento
   */
  agendar: async (id: string, agendamento: {
    filtros: FiltrosRelatorio;
    periodicidade: 'diario' | 'semanal' | 'mensal';
    dia_semana?: number; // 0-6 para domingo-sábado (para periodicidade semanal)
    dia_mes?: number; // 1-31 (para periodicidade mensal)
    hora: number; // 0-23
    minuto: number; // 0-59
    emails: string[];
    ativo: boolean;
  }): Promise<{ id: string }> => {
    const response = await api.post<ApiResponse<{ id: string }>>(`/relatorios/${id}/agendar`, agendamento);
    return response.data.data;
  },
  
  /**
   * Listar agendamentos de relatórios do usuário atual
   * @returns Lista de agendamentos
   */
  listarAgendamentos: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/relatorios/agendamentos');
    return response.data.data;
  },
  
  /**
   * Remover um agendamento de relatório
   * @param id ID do agendamento
   * @returns Mensagem de sucesso
   */
  removerAgendamento: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<null>>(`/relatorios/agendamentos/${id}`);
    return { message: response.data.message };
  },
  
  /**
   * Listar relatórios gerados recentemente para o usuário atual
   * @returns Lista de relatórios recentes
   */
  listarRecentes: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/relatorios/recentes');
    return response.data.data;
  },
  
  /**
   * Obter estatísticas gerais do sistema
   * @param filtros Filtros para as estatísticas
   * @returns Dados estatísticos
   */
  estatisticasGerais: async (filtros: { 
    prefeitura_id?: string; 
    periodo?: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
    data_inicio?: string;
    data_fim?: string;
  } = {}): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/relatorios/estatisticas', { 
      params: filtros 
    });
    return response.data.data;
  }
};

export default relatoriosService; 