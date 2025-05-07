import api from './api';
import { AxiosResponse } from 'axios';
import { 
  AgendamentoRelatorio, 
  AgendamentoRelatorioFiltros, 
  PaginatedResult, 
  PaginationOptions 
} from '../types';

/**
 * Classe de serviço para gerenciar agendamentos de relatórios
 */
class AgendamentoRelatorioService {
  private baseUrl = '/agendamento-relatorios';

  /**
   * Lista todos os agendamentos de relatórios com paginação e filtros
   */
  async listarAgendamentos(
    filtros?: AgendamentoRelatorioFiltros,
    paginacao?: PaginationOptions
  ): Promise<PaginatedResult<AgendamentoRelatorio>> {
    try {
      // Construir parâmetros de query
      const params = {
        page: paginacao?.page || 1,
        limit: paginacao?.limit || 10,
        tipo: filtros?.tipo_relatorio,
        ativo: filtros?.ativo !== undefined ? String(filtros.ativo) : undefined,
        usuario_id: filtros?.usuario_id
      };

      const response: AxiosResponse<PaginatedResult<AgendamentoRelatorio>> = 
        await api.get(this.baseUrl, { params });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao listar agendamentos de relatórios:', error);
      throw error;
    }
  }

  /**
   * Busca um agendamento de relatório pelo ID
   */
  async obterAgendamentoPorId(id: string): Promise<AgendamentoRelatorio> {
    try {
      const response: AxiosResponse<AgendamentoRelatorio> = 
        await api.get(`${this.baseUrl}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar agendamento de relatório com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo agendamento de relatório
   */
  async criarAgendamento(dados: AgendamentoRelatorio): Promise<AgendamentoRelatorio> {
    try {
      const response: AxiosResponse<{ mensagem: string, agendamento: AgendamentoRelatorio }> = 
        await api.post(this.baseUrl, dados);
      
      return response.data.agendamento;
    } catch (error) {
      console.error('Erro ao criar agendamento de relatório:', error);
      throw error;
    }
  }

  /**
   * Atualiza um agendamento de relatório existente
   */
  async atualizarAgendamento(id: string, dados: Partial<AgendamentoRelatorio>): Promise<AgendamentoRelatorio> {
    try {
      const response: AxiosResponse<{ mensagem: string, agendamento: AgendamentoRelatorio }> = 
        await api.put(`${this.baseUrl}/${id}`, dados);
      
      return response.data.agendamento;
    } catch (error) {
      console.error(`Erro ao atualizar agendamento de relatório com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Altera o status (ativo/inativo) de um agendamento
   */
  async alterarStatus(id: string, ativo: boolean): Promise<AgendamentoRelatorio> {
    try {
      const response: AxiosResponse<{ mensagem: string, agendamento: AgendamentoRelatorio }> = 
        await api.patch(`${this.baseUrl}/${id}/status`, { ativo });
      
      return response.data.agendamento;
    } catch (error) {
      console.error(`Erro ao alterar status do agendamento de relatório com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove um agendamento de relatório
   */
  async removerAgendamento(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Erro ao remover agendamento de relatório com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Executa um agendamento de relatório manualmente
   */
  async executarAgendamento(id: string): Promise<{ mensagem: string, resultado: any }> {
    try {
      const response: AxiosResponse<{ mensagem: string, resultado: any }> = 
        await api.post(`${this.baseUrl}/${id}/executar`);
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao executar agendamento de relatório com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Processa todos os agendamentos pendentes (apenas para administradores)
   */
  async processarAgendamentosPendentes(): Promise<{ mensagem: string, resultados: any[] }> {
    try {
      const response: AxiosResponse<{ mensagem: string, resultados: any[] }> = 
        await api.post(`${this.baseUrl}/processar-pendentes`);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao processar agendamentos pendentes:', error);
      throw error;
    }
  }

  /**
   * Retorna as opções de tipos de relatório disponíveis
   */
  getTiposRelatorio(): { value: string, label: string }[] {
    return [
      { value: 'usuarios', label: 'Usuários' },
      { value: 'prefeituras', label: 'Prefeituras' },
      { value: 'solicitacoes_tfd', label: 'Solicitações TFD' },
      { value: 'logs_acesso', label: 'Logs de Acesso' }
    ];
  }

  /**
   * Retorna as opções de frequência disponíveis
   */
  getFrequencias(): { value: string, label: string }[] {
    return [
      { value: 'diario', label: 'Diário' },
      { value: 'semanal', label: 'Semanal' },
      { value: 'mensal', label: 'Mensal' },
      { value: 'sob_demanda', label: 'Sob Demanda' }
    ];
  }

  /**
   * Retorna as opções de dias da semana
   */
  getDiasSemana(): { value: number, label: string }[] {
    return [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Segunda-feira' },
      { value: 2, label: 'Terça-feira' },
      { value: 3, label: 'Quarta-feira' },
      { value: 4, label: 'Quinta-feira' },
      { value: 5, label: 'Sexta-feira' },
      { value: 6, label: 'Sábado' }
    ];
  }

  /**
   * Retorna as opções de formatos de saída disponíveis
   */
  getFormatosSaida(): { value: string, label: string }[] {
    return [
      { value: 'pdf', label: 'PDF' },
      { value: 'excel', label: 'Excel' },
      { value: 'csv', label: 'CSV' }
    ];
  }
}

export default new AgendamentoRelatorioService(); 