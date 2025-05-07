import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import EstatisticasTFD from '../../components/EstatisticasTFD';
import { 
  ArrowPathIcon, 
  PlusIcon, 
  FunnelIcon, 
  DocumentTextIcon, 
  DocumentPlusIcon,
  DocumentChartBarIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Solicitacao {
  _id: string;
  numero: string;
  data_solicitacao: string;
  status: string;
  prioridade: string;
  tipo_atendimento: string;
  especialidade: string;
  paciente: {
    _id: string;
    nome: string;
    cpf: string;
  };
  destino: {
    cidade: string;
    estado: string;
    estabelecimento: string;
  };
}

interface Filtro {
  status?: string;
  prioridade?: string;
  tipo_atendimento?: string;
  dataInicio?: string;
  dataFim?: string;
  termo?: string;
}

const SolicitacoesTFD: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [filtros, setFiltros] = useState<Filtro>({});
  const [filtragem, setFiltragem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [totalSolicitacoes, setTotalSolicitacoes] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const permissaoCriar = hasPermission('criar_solicitacoes');
  const permissaoVisualizar = hasPermission('visualizar_solicitacoes');
  const permissaoGerarRelatorio = hasPermission('gerar_relatorio_solicitacoes_tfd');

  // Carregar solicitações ao iniciar ou quando os filtros mudarem
  useEffect(() => {
    carregarSolicitacoes();
  }, [paginaAtual, filtros]);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir parâmetros de consulta
      const params = {
        page: paginaAtual,
        limit: itensPorPagina,
        ...filtros
      };

      const response = await api.get('/solicitacoes-tfd', { params });
      setSolicitacoes(response.data.solicitacoes);
      setTotalSolicitacoes(response.data.paginacao.total);
      setFiltragem(false);
    } catch (err: any) {
      console.error('Erro ao carregar solicitações:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaAtual(1); // Voltar para a primeira página ao aplicar filtros
    setFiltragem(true);
  };

  const limparFiltros = () => {
    setFiltros({});
    setPaginaAtual(1);
    setFiltragem(true);
  };

  const obterStatusFormatado = (status: string) => {
    const statusMap: Record<string, { texto: string, classe: string }> = {
      'solicitado': { texto: 'Solicitado', classe: 'bg-blue-100 text-blue-800' },
      'em_analise': { texto: 'Em Análise', classe: 'bg-yellow-100 text-yellow-800' },
      'aprovado': { texto: 'Aprovado', classe: 'bg-green-100 text-green-800' },
      'agendado': { texto: 'Agendado', classe: 'bg-indigo-100 text-indigo-800' },
      'realizado': { texto: 'Realizado', classe: 'bg-purple-100 text-purple-800' },
      'cancelado': { texto: 'Cancelado', classe: 'bg-gray-100 text-gray-800' },
      'negado': { texto: 'Negado', classe: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { texto: status, classe: 'bg-gray-100 text-gray-800' };
  };

  const obterPrioridadeFormatada = (prioridade: string) => {
    const prioridadeMap: Record<string, { texto: string, classe: string }> = {
      'normal': { texto: 'Normal', classe: 'bg-gray-100 text-gray-800' },
      'urgente': { texto: 'Urgente', classe: 'bg-orange-100 text-orange-800' },
      'emergencia': { texto: 'Emergência', classe: 'bg-red-100 text-red-800' }
    };
    
    return prioridadeMap[prioridade] || { texto: prioridade, classe: 'bg-gray-100 text-gray-800' };
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina);
  };

  return (
    <MainLayout title="Solicitações de TFD">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Solicitações de TFD</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Filtrar solicitações"
              title="Filtrar solicitações"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filtros
            </button>
            
            {permissaoGerarRelatorio && (
              <>
                <Link
                  to="/admin/relatorios"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Gerar relatório geral"
                  title="Ir para a página de relatórios gerais"
                >
                  <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                  Relatórios
                </Link>
                
                <Link
                  to="/admin/relatorio-paciente"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Relatório por paciente"
                  title="Gerar relatório por paciente"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Por Paciente
                </Link>
              </>
            )}
            
            {permissaoCriar && (
              <Link
                to="/admin/solicitacoes-tfd/nova"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Nova solicitação"
                title="Criar nova solicitação de TFD"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Nova
              </Link>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Área de filtros */}
        {mostrarFiltros && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filtrar Solicitações</h2>
            
            <form onSubmit={aplicarFiltros}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
                    value={filtros.status || ''}
                    onChange={(e) => setFiltros({...filtros, status: e.target.value || undefined})}
                  >
                    <option value="">Todos</option>
                    <option value="solicitado">Solicitado</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="agendado">Agendado</option>
                    <option value="realizado">Realizado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="negado">Negado</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="prioridade" className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    id="prioridade"
                    name="prioridade"
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
                    value={filtros.prioridade || ''}
                    onChange={(e) => setFiltros({...filtros, prioridade: e.target.value || undefined})}
                  >
                    <option value="">Todas</option>
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                    <option value="emergencia">Emergência</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tipo_atendimento" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Atendimento
                  </label>
                  <select
                    id="tipo_atendimento"
                    name="tipo_atendimento"
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
                    value={filtros.tipo_atendimento || ''}
                    onChange={(e) => setFiltros({...filtros, tipo_atendimento: e.target.value || undefined})}
                  >
                    <option value="">Todos</option>
                    <option value="consulta">Consulta</option>
                    <option value="exame">Exame</option>
                    <option value="cirurgia">Cirurgia</option>
                    <option value="tratamento">Tratamento</option>
                    <option value="retorno">Retorno</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    id="dataInicio"
                    name="dataInicio"
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    value={filtros.dataInicio || ''}
                    onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value || undefined})}
                  />
                </div>
                
                <div>
                  <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    id="dataFim"
                    name="dataFim"
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    value={filtros.dataFim || ''}
                    onChange={(e) => setFiltros({...filtros, dataFim: e.target.value || undefined})}
                  />
                </div>
                
                <div>
                  <label htmlFor="termo" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar por texto
                  </label>
                  <input
                    type="text"
                    id="termo"
                    name="termo"
                    placeholder="Número, paciente, médico..."
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    value={filtros.termo || ''}
                    onChange={(e) => setFiltros({...filtros, termo: e.target.value || undefined})}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Limpar Filtros
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Aplicar Filtros
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Dashboard com estatísticas */}
        <div className="mb-6">
          <EstatisticasTFD />
        </div>
        
        {/* Lista de solicitações */}
        <div className="bg-white shadow overflow-hidden rounded-md">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Carregando solicitações...</span>
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="py-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação encontrada</h3>
              <p className="text-gray-500">
                {Object.keys(filtros).length > 0 
                  ? 'Não existem solicitações que correspondam aos filtros aplicados.'
                  : 'Não há solicitações cadastradas no sistema.'}
              </p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº / Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Especialidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Destino
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status / Prioridade
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitacoes.map((solicitacao) => {
                    const statusFormatado = obterStatusFormatado(solicitacao.status);
                    const prioridadeFormatada = obterPrioridadeFormatada(solicitacao.prioridade);
                    
                    return (
                      <tr key={solicitacao._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{solicitacao.numero}</div>
                          <div className="text-sm text-gray-500">{formatarData(solicitacao.data_solicitacao)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{solicitacao.paciente.nome}</div>
                          <div className="text-sm text-gray-500">
                            CPF: {solicitacao.paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-900">{solicitacao.especialidade}</div>
                          <div className="text-sm text-gray-500">{solicitacao.tipo_atendimento}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-gray-900">{solicitacao.destino.estabelecimento}</div>
                          <div className="text-sm text-gray-500">
                            {solicitacao.destino.cidade}/{solicitacao.destino.estado}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusFormatado.classe}`}>
                            {statusFormatado.texto}
                          </span>
                          <div className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prioridadeFormatada.classe}`}>
                              {prioridadeFormatada.texto}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {permissaoVisualizar && (
                            <Link
                              to={`/admin/solicitacoes-tfd/${solicitacao._id}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Visualizar
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Paginação */}
              {totalSolicitacoes > itensPorPagina && (
                <nav className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{((paginaAtual - 1) * itensPorPagina) + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(paginaAtual * itensPorPagina, totalSolicitacoes)}
                      </span> de{' '}
                      <span className="font-medium">{totalSolicitacoes}</span> resultados
                    </p>
                  </div>
                  <div className="flex-1 flex justify-between sm:justify-end">
                    <button
                      onClick={() => irParaPagina(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        paginaAtual === 1 ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-white text-gray-700 hover:bg-gray-50'
                      } mr-3`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => irParaPagina(paginaAtual + 1)}
                      disabled={paginaAtual * itensPorPagina >= totalSolicitacoes}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        paginaAtual * itensPorPagina >= totalSolicitacoes ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Próxima
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SolicitacoesTFD; 