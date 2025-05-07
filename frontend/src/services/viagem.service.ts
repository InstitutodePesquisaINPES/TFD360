import axios from 'axios';
import { api } from './api';

export interface IViagem {
  _id?: string;
  numero?: string;
  destino: string;
  data_ida: Date | string;
  data_volta?: Date | string;
  situacao: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  motorista?: string;
  veiculo?: string;
  observacoes?: string;
  pacientes?: string[] | any[];
  created_at?: Date;
  updated_at?: Date;
}

export interface IViagemPaciente {
  _id?: string;
  viagem_id: string;
  paciente_id: string;
  acompanhante_id?: string;
  situacao: 'CONFIRMADO' | 'PENDENTE' | 'CANCELADO';
  observacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IFiltroViagem {
  destino?: string;
  data_inicial?: Date | string;
  data_final?: Date | string;
  situacao?: string;
  motorista?: string;
  veiculo?: string;
  paciente_id?: string;
}

class ViagemService {
  async listarViagens(filtros?: IFiltroViagem): Promise<IViagem[]> {
    try {
      const params = new URLSearchParams();
      
      if (filtros?.destino) params.append('destino', filtros.destino);
      if (filtros?.data_inicial) params.append('data_inicial', filtros.data_inicial.toString());
      if (filtros?.data_final) params.append('data_final', filtros.data_final.toString());
      if (filtros?.situacao) params.append('situacao', filtros.situacao);
      if (filtros?.motorista) params.append('motorista', filtros.motorista);
      if (filtros?.veiculo) params.append('veiculo', filtros.veiculo);
      if (filtros?.paciente_id) params.append('paciente_id', filtros.paciente_id);
      
      const response = await api.get('/viagens', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar viagens:', error);
      throw error;
    }
  }

  async obterViagemPorId(id: string): Promise<IViagem> {
    try {
      const response = await api.get(`/viagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter viagem ${id}:`, error);
      throw error;
    }
  }

  async criarViagem(viagem: IViagem): Promise<IViagem> {
    try {
      const response = await api.post('/viagens', viagem);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      throw error;
    }
  }

  async atualizarViagem(id: string, viagem: Partial<IViagem>): Promise<IViagem> {
    try {
      const response = await api.put(`/viagens/${id}`, viagem);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar viagem ${id}:`, error);
      throw error;
    }
  }

  async excluirViagem(id: string): Promise<void> {
    try {
      await api.delete(`/viagens/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir viagem ${id}:`, error);
      throw error;
    }
  }

  async alterarSituacao(id: string, situacao: IViagem['situacao']): Promise<IViagem> {
    try {
      const response = await api.patch(`/viagens/${id}/situacao`, { situacao });
      return response.data;
    } catch (error) {
      console.error(`Erro ao alterar situação da viagem ${id}:`, error);
      throw error;
    }
  }

  async adicionarPaciente(viagemId: string, pacienteId: string, acompanhanteId?: string, observacoes?: string): Promise<IViagemPaciente> {
    try {
      const payload = {
        paciente_id: pacienteId,
        acompanhante_id: acompanhanteId,
        observacoes
      };
      
      const response = await api.post(`/viagens/${viagemId}/pacientes`, payload);
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar paciente à viagem ${viagemId}:`, error);
      throw error;
    }
  }

  async removerPaciente(viagemId: string, pacienteId: string): Promise<void> {
    try {
      await api.delete(`/viagens/${viagemId}/pacientes/${pacienteId}`);
    } catch (error) {
      console.error(`Erro ao remover paciente da viagem ${viagemId}:`, error);
      throw error;
    }
  }

  async atualizarSituacaoPaciente(viagemId: string, pacienteId: string, situacao: IViagemPaciente['situacao']): Promise<IViagemPaciente> {
    try {
      const response = await api.patch(`/viagens/${viagemId}/pacientes/${pacienteId}/situacao`, { situacao });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar situação do paciente na viagem:`, error);
      throw error;
    }
  }

  async obterPacientesViagem(viagemId: string): Promise<IViagemPaciente[]> {
    try {
      const response = await api.get(`/viagens/${viagemId}/pacientes`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter pacientes da viagem ${viagemId}:`, error);
      throw error;
    }
  }

  async gerarRelatorioViagem(viagemId: string, formato: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    try {
      const response = await api.get(`/viagens/${viagemId}/relatorio?formato=${formato}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao gerar relatório da viagem ${viagemId}:`, error);
      throw error;
    }
  }
}

export const viagemService = new ViagemService(); 