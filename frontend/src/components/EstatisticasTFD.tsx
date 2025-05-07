import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

interface EstatisticaTFD {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  corFundo: string;
  corTexto: string;
  descricao: string;
}

const EstatisticasTFD: React.FC = () => {
  const [estatisticas, setEstatisticas] = useState<EstatisticaTFD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        setLoading(true);
        const response = await api.get('/solicitacoes-tfd/estatisticas');
        
        // Transformar os dados da API em estatísticas formatadas
        const dados = response.data;
        
        const estatisticasFormatadas: EstatisticaTFD[] = [
          {
            titulo: 'Total de Solicitações',
            valor: dados.total || 0,
            icone: <DocumentTextIcon className="h-6 w-6" />,
            corFundo: 'bg-blue-100',
            corTexto: 'text-blue-800',
            descricao: 'Todas as solicitações TFD registradas no sistema'
          },
          {
            titulo: 'Em Análise',
            valor: dados.por_status?.em_analise || 0,
            icone: <ClockIcon className="h-6 w-6" />,
            corFundo: 'bg-yellow-100',
            corTexto: 'text-yellow-800',
            descricao: 'Solicitações em processo de análise'
          },
          {
            titulo: 'Aprovadas',
            valor: dados.por_status?.aprovado || 0,
            icone: <CheckCircleIcon className="h-6 w-6" />,
            corFundo: 'bg-green-100',
            corTexto: 'text-green-800',
            descricao: 'Solicitações que foram aprovadas'
          },
          {
            titulo: 'Agendadas',
            valor: dados.por_status?.agendado || 0,
            icone: <CalendarIcon className="h-6 w-6" />,
            corFundo: 'bg-indigo-100',
            corTexto: 'text-indigo-800',
            descricao: 'Solicitações com agendamento confirmado'
          },
          {
            titulo: 'Realizadas',
            valor: dados.por_status?.realizado || 0,
            icone: <CheckCircleIcon className="h-6 w-6" />,
            corFundo: 'bg-teal-100',
            corTexto: 'text-teal-800',
            descricao: 'Solicitações já realizadas'
          },
          {
            titulo: 'Negadas/Canceladas',
            valor: (dados.por_status?.negado || 0) + (dados.por_status?.cancelado || 0),
            icone: <XCircleIcon className="h-6 w-6" />,
            corFundo: 'bg-red-100',
            corTexto: 'text-red-800',
            descricao: 'Solicitações negadas ou canceladas'
          }
        ];
        
        // Calcular prioridades
        if (dados.por_prioridade) {
          const urgentes = {
            titulo: 'Urgentes/Emergência',
            valor: (dados.por_prioridade?.urgente || 0) + (dados.por_prioridade?.emergencia || 0),
            icone: <ExclamationCircleIcon className="h-6 w-6" />,
            corFundo: 'bg-orange-100',
            corTexto: 'text-orange-800',
            descricao: 'Solicitações marcadas como urgentes ou emergência'
          };
          
          estatisticasFormatadas.push(urgentes);
        }
        
        setEstatisticas(estatisticasFormatadas);
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError('Não foi possível carregar as estatísticas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarEstatisticas();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-500">Carregando estatísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Estatísticas de TFD</h3>
        <p className="max-w-2xl mt-1 text-sm text-gray-500">
          Resumo geral das solicitações de Tratamento Fora do Domicílio
        </p>
      </div>
      
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {estatisticas.map((estatistica, index) => (
          <div key={index} className={`${estatistica.corFundo} rounded-lg shadow p-4`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-2 ${estatistica.corFundo}`}>
                <div className={estatistica.corTexto}>
                  {estatistica.icone}
                </div>
              </div>
              <div className="ml-4">
                <h4 className={`text-lg font-semibold ${estatistica.corTexto}`}>{estatistica.valor}</h4>
                <p className={`text-sm font-medium ${estatistica.corTexto}`}>{estatistica.titulo}</p>
                <p className="text-xs text-gray-600 mt-1">{estatistica.descricao}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstatisticasTFD; 