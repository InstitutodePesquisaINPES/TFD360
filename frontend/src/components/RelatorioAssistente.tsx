import React, { useState } from 'react';
import { 
  LightBulbIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Paciente {
  _id: string;
  nome: string;
  cpf: string;
  cartao_sus?: string;
  data_nascimento?: string;
}

interface RelatorioAssistenteProps {
  paciente: Paciente | null;
  onSelecionarFiltro: (tipo: string, valor: string) => void;
}

type SugestaoTipo = {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  acao: () => void;
};

const RelatorioAssistente: React.FC<RelatorioAssistenteProps> = ({ paciente, onSelecionarFiltro }) => {
  const [mostrarAssistente, setMostrarAssistente] = useState(false);

  // Só mostra o assistente se tiver um paciente selecionado
  if (!paciente) return null;

  // Define as sugestões de análise
  const sugestoes: SugestaoTipo[] = [
    {
      titulo: 'Análise do último ano',
      descricao: 'Gere um relatório apenas com as solicitações do último ano para analisar a evolução recente do paciente.',
      icone: <ClockIcon className="h-5 w-5 text-indigo-500" />,
      acao: () => {
        const hoje = new Date();
        const inicioAnoPassado = new Date();
        inicioAnoPassado.setFullYear(hoje.getFullYear() - 1);
        
        onSelecionarFiltro('dataInicio', inicioAnoPassado.toISOString().split('T')[0]);
      }
    },
    {
      titulo: 'Solicitações pendentes',
      descricao: 'Visualize apenas as solicitações que ainda estão em andamento (solicitadas, em análise ou aprovadas).',
      icone: <CalendarIcon className="h-5 w-5 text-indigo-500" />,
      acao: () => {
        onSelecionarFiltro('status', 'em_analise');
      }
    },
    {
      titulo: 'Consultas médicas',
      descricao: 'Analise apenas as consultas médicas realizadas pelo paciente.',
      icone: <ChartBarIcon className="h-5 w-5 text-indigo-500" />,
      acao: () => {
        onSelecionarFiltro('tipoAtendimento', 'consulta');
      }
    },
    {
      titulo: 'Procedimentos realizados',
      descricao: 'Veja o histórico de todos os procedimentos que já foram realizados.',
      icone: <ChartBarIcon className="h-5 w-5 text-indigo-500" />,
      acao: () => {
        onSelecionarFiltro('status', 'realizado');
      }
    }
  ];

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 mt-4">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setMostrarAssistente(!mostrarAssistente)}
      >
        <div className="flex items-center">
          <LightBulbIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-md font-medium text-gray-900">Assistente de Relatórios</h3>
        </div>
        {mostrarAssistente ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {mostrarAssistente && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            Confira algumas sugestões de análise para o paciente <span className="font-medium">{paciente.nome}</span>:
          </p>
          
          <div className="space-y-3">
            {sugestoes.map((sugestao, index) => (
              <div key={index} className="bg-white rounded-md p-3 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {sugestao.icone}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{sugestao.titulo}</h4>
                    <p className="text-sm text-gray-500 mt-1">{sugestao.descricao}</p>
                    <button
                      onClick={sugestao.acao}
                      className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Aplicar esta análise
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Estas sugestões são baseadas no histórico típico de pacientes TFD e podem ajudar a identificar padrões importantes.
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatorioAssistente; 