import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import PacienteSearch from '../../components/PacienteSearch';
import RelatorioAssistente from '../../components/RelatorioAssistente';
import { 
  ArrowPathIcon, 
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Paciente {
  _id: string;
  nome: string;
  cpf: string;
  cartao_sus?: string;
  data_nascimento?: string;
}

interface Filtros {
  dataInicio?: string;
  dataFim?: string;
  tipoAtendimento?: string;
  status?: string;
  formato: string;
}

// Definição dos formatos disponíveis
const formatosDisponiveis = [
  {
    id: 'pdf',
    nome: 'PDF',
    descricao: 'Documento em formato PDF, ideal para visualização e impressão.',
    icone: <DocumentTextIcon className="w-5 h-5" />
  },
  {
    id: 'excel',
    nome: 'Excel',
    descricao: 'Planilha Excel, perfeita para análise e manipulação dos dados.',
    icone: <TableCellsIcon className="w-5 h-5" />
  },
  {
    id: 'csv',
    nome: 'CSV',
    descricao: 'Arquivo CSV, compatível com diversos sistemas e planilhas.',
    icone: <ListBulletIcon className="w-5 h-5" />
  }
];

const RelatorioPaciente: React.FC = () => {
  const { hasPermission } = useAuth();
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: undefined,
    dataFim: undefined,
    tipoAtendimento: undefined,
    status: undefined,
    formato: 'pdf'
  });

  const permissaoGerarRelatorio = hasPermission('gerar_relatorio_solicitacoes_tfd');

  const handleSelectPaciente = (paciente: Paciente | null) => {
    setSelectedPaciente(paciente);
    setError(null);
    setSuccess(null);
  };

  const handleChangeFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor === '' ? undefined : valor
    }));
    
    // Se os filtros estiverem ocultos, exibir ao selecionar um filtro via assistente
    if (!mostrarFiltros) {
      setMostrarFiltros(true);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: undefined,
      dataFim: undefined,
      tipoAtendimento: undefined,
      status: undefined,
      formato: 'pdf'
    });
  };

  const gerarRelatorio = async () => {
    if (!selectedPaciente) {
      setError('Por favor, selecione um paciente para gerar o relatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Determinar a extensão do arquivo com base no formato
      let extensao = 'pdf';
      let tipoMime = 'application/pdf';
      
      if (filtros.formato === 'excel') {
        extensao = 'xlsx';
        tipoMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (filtros.formato === 'csv') {
        extensao = 'csv';
        tipoMime = 'text/csv';
      }

      // Usar a URL correta para o endpoint do relatório por paciente
      const response = await api.get('/relatorios/paciente-solicitacoes', {
        params: {
          pacienteId: selectedPaciente._id,
          ...filtros
        },
        responseType: 'blob'
      });
      
      // Verificar o tipo de conteúdo real retornado
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes(tipoMime)) {
        console.warn(`Tipo de conteúdo esperado (${tipoMime}) difere do recebido (${contentType})`);
      }

      // Criar uma URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: tipoMime }));
      
      // Criar um link temporário e clicar nele para fazer o download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_paciente_${selectedPaciente.cpf.replace(/\D/g, '')}_${new Date().toISOString().split('T')[0]}.${extensao}`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      link.remove();

      setSuccess('Relatório gerado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError('Não foi possível gerar o relatório. Verifique se o paciente possui solicitações registradas.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar CPF para exibição
  const formatCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Calcular idade
  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  // Formatar data para exibição
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout title="Relatório por Paciente">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Relatório de TFD por Paciente</h1>
          
          <div className="flex space-x-2">
            <Link
              to="/relatorios"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Voltar para Relatórios
            </Link>
          </div>
        </div>

        {!permissaoGerarRelatorio ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Você não possui permissão para gerar relatórios de TFD.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Buscar Paciente</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecione um paciente para gerar um relatório completo com todas as solicitações TFD.
              </p>
              
              <div className="mb-6">
                <PacienteSearch 
                  onSelectPaciente={handleSelectPaciente}
                  selectedPaciente={selectedPaciente}
                />
              </div>
              
              {selectedPaciente && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Paciente Selecionado</h3>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedPaciente.nome}</p>
                      <p className="text-sm text-gray-500">CPF: {formatCPF(selectedPaciente.cpf)}</p>
                      {selectedPaciente.cartao_sus && (
                        <p className="text-sm text-gray-500">Cartão SUS: {selectedPaciente.cartao_sus}</p>
                      )}
                    </div>
                    {selectedPaciente.data_nascimento && (
                    <div className="mt-2 sm:mt-0">
                        <p className="text-sm text-gray-500">Data de nascimento: {formatarData(selectedPaciente.data_nascimento)}</p>
                        <p className="text-sm text-gray-500">Idade: {calcularIdade(selectedPaciente.data_nascimento)} anos</p>
                  </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPaciente && (
                <RelatorioAssistente 
                  paciente={selectedPaciente}
                  onSelecionarFiltro={handleChangeFiltro}
                />
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{success}</span>
                </div>
              )}
            </div>
            
            {selectedPaciente && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Filtros do Relatório</h2>
                  
                  <button
                    type="button"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {mostrarFiltros ? (
                      <>
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Ocultar filtros
                      </>
                    ) : (
                      <>
                        <FunnelIcon className="h-4 w-4 mr-1" />
                        Mostrar filtros
                      </>
                    )}
                  </button>
                </div>
                
                {mostrarFiltros && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="data-inicio">
                          Data Início
                      </label>
                      <input
                        type="date"
                          id="data-inicio"
                          className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filtros.dataInicio || ''}
                        onChange={(e) => handleChangeFiltro('dataInicio', e.target.value)}
                      />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="data-fim">
                          Data Fim
                      </label>
                      <input
                        type="date"
                          id="data-fim"
                          className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filtros.dataFim || ''}
                        onChange={(e) => handleChangeFiltro('dataFim', e.target.value)}
                      />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                          Status da Solicitação
                      </label>
                      <select
                        id="status"
                          className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filtros.status || ''}
                        onChange={(e) => handleChangeFiltro('status', e.target.value)}
                      >
                          <option value="">Todos os status</option>
                        <option value="solicitado">Solicitado</option>
                        <option value="em_analise">Em análise</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="agendado">Agendado</option>
                        <option value="realizado">Realizado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="negado">Negado</option>
                      </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipo-atendimento">
                        Tipo de Atendimento
                      </label>
                      <select
                          id="tipo-atendimento"
                          className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filtros.tipoAtendimento || ''}
                        onChange={(e) => handleChangeFiltro('tipoAtendimento', e.target.value)}
                      >
                          <option value="">Todos os tipos</option>
                        <option value="consulta">Consulta</option>
                        <option value="exame">Exame</option>
                        <option value="cirurgia">Cirurgia</option>
                        <option value="tratamento">Tratamento</option>
                        <option value="retorno">Retorno</option>
                      </select>
                  </div>
                  
                      {/* Seleção de formato do relatório */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formato">
                          Formato do Relatório
                        </label>
                        <select
                          id="formato"
                          className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={filtros.formato}
                          onChange={(e) => handleChangeFiltro('formato', e.target.value)}
                        >
                          {formatosDisponiveis.map(formato => (
                            <option key={formato.id} value={formato.id}>{formato.nome}</option>
                          ))}
                        </select>
                  </div>
                </div>
                    
                    {/* Exibir descrição do formato selecionado */}
                    <div className="mt-2 flex items-start p-2 bg-gray-50 rounded-md mb-4">
                      {formatosDisponiveis.find(f => f.id === filtros.formato)?.icone}
                      <p className="ml-2 text-sm text-gray-600">
                        {formatosDisponiveis.find(f => f.id === filtros.formato)?.descricao}
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </>
              )}
              
                <div className="mt-4">
                <button
                  type="button"
                  onClick={gerarRelatorio}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? (
                    <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Gerando relatório...
                    </>
                  ) : (
                    <>
                        <DocumentChartBarIcon className="-ml-1 mr-2 h-5 w-5" />
                        Gerar relatório do paciente
                    </>
                  )}
                </button>
              </div>
            </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default RelatorioPaciente; 