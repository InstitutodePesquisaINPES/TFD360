import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import MainLayout from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import logsService, { Log, FiltrosLogs } from '@services/logs.service';

export default function Logs() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  
  // Estados para paginação
  const [paginacao, setPaginacao] = useState({
    total: 0,
    pagina: 1,
    limite: 20,
    paginas: 1
  });
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosLogs>({
    usuario_id: '',
    entidade: '',
    acao: '',
    data_inicio: '',
    data_fim: '',
    pagina: 1,
    limite: 20
  });
  
  // Estado para mostrar/esconder filtros avançados
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Listas para filtros dropdown
  const [usuarios, setUsuarios] = useState<{id: string; nome: string}[]>([]);
  const [entidades, setEntidades] = useState<string[]>([]);
  const [acoes, setAcoes] = useState<string[]>([]);
  
  // Verificar permissão para visualizar logs
  const podeVisualizarLogs = hasPermission('visualizar_logs');
  
  // Carregar logs
  useEffect(() => {
    const carregarLogs = async () => {
      if (!podeVisualizarLogs) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const resultado = await logsService.listar(filtros);
        setLogs(resultado.data.items);
        setPaginacao({
          total: resultado.data.total,
          pagina: resultado.data.pagina,
          limite: resultado.data.limite,
          paginas: resultado.data.paginas
        });
      } catch (error: any) {
        console.error('Erro ao carregar logs:', error);
        setError(error.response?.data?.message || 'Erro ao carregar logs');
      } finally {
        setLoading(false);
      }
    };
    
    carregarLogs();
  }, [filtros, podeVisualizarLogs]);
  
  // Carregar dados para filtros
  useEffect(() => {
    if (!podeVisualizarLogs) return;
    
    const carregarFiltros = async () => {
      try {
        const [acoesResultado, entidadesResultado] = await Promise.all([
          logsService.listarAcoes(),
          logsService.listarEntidades()
        ]);
        
        setAcoes(acoesResultado);
        setEntidades(entidadesResultado);
      } catch (error) {
        console.error('Erro ao carregar dados para filtros:', error);
      }
    };
    
    carregarFiltros();
  }, [podeVisualizarLogs]);
  
  // Atualizar filtros
  const atualizarFiltro = (chave: keyof FiltrosLogs, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [chave]: valor,
      pagina: chave === 'pagina' ? valor : 1 // Resetar paginação quando qualquer filtro mudar
    }));
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      usuario_id: '',
      entidade: '',
      acao: '',
      data_inicio: '',
      data_fim: '',
      pagina: 1,
      limite: 20
    });
    setMostrarFiltros(false);
  };
  
  // Handler para busca
  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltro('pagina', 1);
  };
  
  // Função para exportar logs
  const exportarLogs = async () => {
    try {
      setExportando(true);
      const { url } = await logsService.exportar({ ...filtros, limite: 1000 });
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'logs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Erro ao exportar logs:', error);
      alert(error.response?.data?.message || 'Erro ao exportar logs');
    } finally {
      setExportando(false);
    }
  };
  
  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Função para formatação de ações
  const formatarAcao = (acao: string) => {
    const acoesFormatadas: Record<string, { texto: string; cor: string }> = {
      'criar': { texto: 'Criação', cor: 'bg-green-100 text-green-800' },
      'atualizar': { texto: 'Atualização', cor: 'bg-blue-100 text-blue-800' },
      'remover': { texto: 'Exclusão', cor: 'bg-red-100 text-red-800' },
      'login': { texto: 'Login', cor: 'bg-indigo-100 text-indigo-800' },
      'logout': { texto: 'Logout', cor: 'bg-gray-100 text-gray-800' },
      'alterar_status': { texto: 'Alteração de Status', cor: 'bg-yellow-100 text-yellow-800' },
      'alterar_senha': { texto: 'Alteração de Senha', cor: 'bg-purple-100 text-purple-800' }
    };
    
    return acoesFormatadas[acao] || { texto: acao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), cor: 'bg-gray-100 text-gray-800' };
  };
  
  // Verificar permissão para visualizar logs
  if (!podeVisualizarLogs) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para acessar esta página. Entre em contato com o administrador do
            sistema caso acredite que isso seja um erro.
          </p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
            
            <button
              onClick={exportarLogs}
              disabled={exportando || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {exportando ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
          
          {/* Filtros de busca */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleBusca}>
                <div className="flex items-center">
                  <div className="flex-1 flex gap-4">
                    <div className="w-1/2">
                      <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">
                        Data Inicial
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="data_inicio"
                          value={filtros.data_inicio || ''}
                          onChange={(e) => atualizarFiltro('data_inicio', e.target.value)}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="w-1/2">
                      <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700">
                        Data Final
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="data_fim"
                          value={filtros.data_fim || ''}
                          onChange={(e) => atualizarFiltro('data_fim', e.target.value)}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <FunnelIcon className="h-5 w-5 mr-1" />
                    {mostrarFiltros ? 'Ocultar Filtros' : 'Mais Filtros'}
                  </button>
                  
                  <button
                    type="submit"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                    Filtrar
                  </button>
                </div>
                
                {/* Filtros avançados */}
                {mostrarFiltros && (
                  <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="entidade" className="block text-sm font-medium text-gray-700">
                        Entidade
                      </label>
                      <select
                        id="entidade"
                        name="entidade"
                        value={filtros.entidade || ''}
                        onChange={(e) => atualizarFiltro('entidade', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Todas as entidades</option>
                        {entidades.map((entidade) => (
                          <option key={entidade} value={entidade}>
                            {entidade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="acao" className="block text-sm font-medium text-gray-700">
                        Ação
                      </label>
                      <select
                        id="acao"
                        name="acao"
                        value={filtros.acao || ''}
                        onChange={(e) => atualizarFiltro('acao', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Todas as ações</option>
                        {acoes.map((acao) => (
                          <option key={acao} value={acao}>
                            {formatarAcao(acao).texto}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
          
          {/* Mensagem de erro */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          {/* Lista de Logs */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            {loading ? (
              // Estado de carregamento
              <div className="px-4 py-5 sm:p-6">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : logs.length === 0 ? (
              // Nenhum log encontrado
              <div className="px-4 py-5 sm:p-6 text-center">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum log encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros para encontrar o que procura.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ação
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entidade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => {
                      const acao = formatarAcao(log.acao);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                              {formatarData(log.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                              {log.usuario.nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${acao.cor}`}>
                              {acao.texto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
                              {log.entidade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              {log.entidade_id && <span className="ml-1 text-xs text-gray-400">({log.entidade_id})</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ip}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Paginação */}
            {!loading && logs.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(paginacao.pagina - 1) * paginacao.limite + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(paginacao.pagina * paginacao.limite, paginacao.total)}
                      </span>{' '}
                      de <span className="font-medium">{paginacao.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                      <button
                        onClick={() => atualizarFiltro('pagina', Math.max(1, paginacao.pagina - 1))}
                        disabled={paginacao.pagina === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          paginacao.pagina === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {/* Páginas numeradas */}
                      {Array.from({ length: paginacao.paginas }, (_, i) => i + 1).map((pagina) => (
                        <button
                          key={pagina}
                          onClick={() => atualizarFiltro('pagina', pagina)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagina === paginacao.pagina
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pagina}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => atualizarFiltro('pagina', Math.min(paginacao.paginas, paginacao.pagina + 1))}
                        disabled={paginacao.pagina === paginacao.paginas}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          paginacao.pagina === paginacao.paginas
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Próxima</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 