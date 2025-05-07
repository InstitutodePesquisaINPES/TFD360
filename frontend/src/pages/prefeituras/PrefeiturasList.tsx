import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import {
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import api from '@services/api';
import prefeiturasService, { Prefeitura, FiltrosPrefeituras } from '@services/prefeituras.service';

interface Prefeitura {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  estado: string;
  data_validade_contrato: string;
  status: string;
  ativa: boolean;
  limite_usuarios: number;
  logo: string | null;
  modulos_ativos: string[];
}

interface PaginacaoProps {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export default function PrefeiturasList() {
  const { hasPermission } = useAuth();
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPrefeituras>({
    termo: '',
    status: 'todas',
    estado: '',
    pagina: 1,
    limite: 10
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [estados, setEstados] = useState<{sigla: string; nome: string}[]>([]);

  const carregarPrefeituras = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const resultado = await prefeiturasService.listar(filtros);
      setPrefeituras(resultado.data.items);
      setFiltros(prev => ({
        ...prev,
        total: resultado.data.total,
        paginas: resultado.data.paginas
      }));
    } catch (error: any) {
      console.error('Erro ao carregar prefeituras:', error);
      setError(error.response?.data?.message || 'Erro ao carregar prefeituras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPrefeituras();
  }, [filtros]);

  useEffect(() => {
    const carregarEstados = async () => {
      try {
        const resultado = await prefeiturasService.listarEstados();
        setEstados(resultado);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      }
    };
    
    carregarEstados();
  }, []);

  const atualizarFiltro = (chave: keyof FiltrosPrefeituras, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [chave]: valor,
      pagina: chave === 'pagina' ? valor : 1
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      termo: '',
      status: 'todas',
      estado: '',
      pagina: 1,
      limite: 10
    });
    setMostrarFiltros(false);
  };

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltro('pagina', 1);
  };

  const handleExcluirPrefeitura = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta prefeitura? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/prefeituras/${id}`);
      carregarPrefeituras();
    } catch (err: any) {
      console.error('Erro ao excluir prefeitura:', err);
      alert(err.response?.data?.message || 'Erro ao excluir prefeitura. Tente novamente mais tarde.');
    }
  };

  const handleAlterarStatus = async (id: string, novoStatus: string) => {
    try {
      await api.patch(`/prefeituras/${id}/status`, { status: novoStatus });
      carregarPrefeituras();
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      alert(err.response?.data?.message || 'Erro ao alterar status. Tente novamente mais tarde.');
    }
  };

  const mudarPagina = (pagina: number) => {
    if (pagina < 1 || pagina > filtros.paginas) return;
    atualizarFiltro('pagina', pagina);
  };

  const getStatusBadge = (prefeitura: Prefeitura) => {
    if (prefeitura.status === 'inativo') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          <XCircleIcon className="inline-block w-4 h-4 mr-1 text-gray-500" />
          Inativa
        </span>
      );
    }

    if (!prefeitura.ativa) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          <ExclamationCircleIcon className="inline-block w-4 h-4 mr-1 text-red-500" />
          Contrato Expirado
        </span>
      );
    }

    const dataValidade = new Date(prefeitura.data_validade_contrato);
    const hoje = new Date();
    const diff = dataValidade.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diff / (1000 * 3600 * 24));

    if (diasRestantes <= 30) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          <ClockIcon className="inline-block w-4 h-4 mr-1 text-yellow-500" />
          Expira em {diasRestantes} dias
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircleIcon className="inline-block w-4 h-4 mr-1 text-green-500" />
        Ativa
      </span>
    );
  };

  if (!hasPermission('gerenciar_prefeituras')) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para acessar esta página. Entre em contato com o administrador do
            sistema caso acredite que isso seja um erro.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Prefeituras</h1>
            
            {hasPermission('gerenciar_prefeituras') && (
              <Link
                to="/prefeituras/nova"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Prefeitura
              </Link>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleBusca}>
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={filtros.termo || ''}
                        onChange={(e) => atualizarFiltro('termo', e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Buscar por nome, CNPJ ou cidade"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <FunnelIcon className="h-5 w-5 mr-1" />
                    Filtros
                  </button>
                  
                  <button
                    type="submit"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    Buscar
                  </button>
                </div>
                
                {mostrarFiltros && (
                  <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={filtros.status}
                        onChange={(e) => atualizarFiltro('status', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="todas">Todas</option>
                        <option value="ativa">Ativas</option>
                        <option value="inativa">Inativas</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        id="estado"
                        name="estado"
                        value={filtros.estado || ''}
                        onChange={(e) => atualizarFiltro('estado', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Todos os estados</option>
                        {estados.map((estado) => (
                          <option key={estado.sigla} value={estado.sigla}>
                            {estado.nome}
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
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : prefeituras.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma prefeitura encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filtros.termo || filtros.estado || filtros.status !== 'todas'
                    ? 'Tente ajustar os filtros para encontrar o que procura.'
                    : 'Comece cadastrando uma nova prefeitura para gerenciar.'}
                </p>
                {hasPermission('gerenciar_prefeituras') && (
                  <div className="mt-6">
                    <Link
                      to="/prefeituras/nova"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Nova Prefeitura
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {prefeituras.map((prefeitura) => (
                  <li key={prefeitura.id}>
                    <Link
                      to={`/prefeituras/${prefeitura.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {prefeitura.logo ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover mr-4"
                                src={prefeitura.logo}
                                alt={prefeitura.nome}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                                <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {prefeitura.nome}
                              </p>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <p className="truncate">
                                  {prefeitura.endereco.cidade}, {prefeitura.endereco.estado}
                                </p>
                                <span className="mx-1">•</span>
                                <p>{prefeitura.cnpj}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              prefeitura.ativa
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {prefeitura.ativa ? (
                                <>
                                  <CheckCircleIcon className="mr-1 h-3 w-3" />
                                  Ativa
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="mr-1 h-3 w-3" />
                                  Inativa
                                </>
                              )}
                            </span>
                            <AdjustmentsHorizontalIcon className="ml-2 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            
            {!loading && prefeituras.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(filtros.pagina - 1) * filtros.limite + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(filtros.pagina * filtros.limite, filtros.total)}
                      </span>{' '}
                      de <span className="font-medium">{filtros.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                      <button
                        onClick={() => mudarPagina(Math.max(1, filtros.pagina - 1))}
                        disabled={filtros.pagina === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          filtros.pagina === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {Array.from({ length: filtros.paginas }, (_, i) => i + 1).map((pagina) => (
                        <button
                          key={pagina}
                          onClick={() => mudarPagina(pagina)}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Prefeituras</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie as prefeituras cadastradas no sistema
            </p>
          </div>
          <Link
            to="/prefeituras/nova"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Prefeitura
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleFiltrar} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[280px]">
              <label htmlFor="filtro" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="filtro"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Nome, CNPJ ou cidade..."
                />
              </div>
            </div>
            <div className="w-40">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando prefeituras...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {prefeituras.length === 0 ? (
              <div className="p-6 text-center">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma prefeitura encontrada</h3>
                <p className="text-gray-500">
                  Não foram encontradas prefeituras com os filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Prefeitura
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        CNPJ
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Cidade/UF
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Validade
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Módulos
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prefeituras.map((prefeitura) => (
                      <tr key={prefeitura.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {prefeitura.logo ? (
                                <img
                                  src={prefeitura.logo}
                                  alt={prefeitura.nome}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <Link
                                  to={`/prefeituras/${prefeitura.id}`}
                                  className="hover:text-indigo-600"
                                >
                                  {prefeitura.nome}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{prefeitura.cnpj}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {prefeitura.cidade}/{prefeitura.estado}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(prefeitura)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(prefeitura.data_validade_contrato).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{prefeitura.modulos_ativos.length}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/prefeituras/${prefeitura.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Ver detalhes"
                            >
                              <span className="sr-only">Ver detalhes</span>
                              <MagnifyingGlassIcon className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/prefeituras/${prefeitura.id}/editar`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <span className="sr-only">Editar</span>
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            {prefeitura.status === 'ativo' ? (
                              <button
                                onClick={() => handleAlterarStatus(prefeitura.id, 'inativo')}
                                className="text-orange-600 hover:text-orange-900"
                                title="Desativar"
                              >
                                <span className="sr-only">Desativar</span>
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAlterarStatus(prefeitura.id, 'ativo')}
                                className="text-green-600 hover:text-green-900"
                                title="Ativar"
                              >
                                <span className="sr-only">Ativar</span>
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleExcluirPrefeitura(prefeitura.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <span className="sr-only">Excluir</span>
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {prefeituras.length > 0 && (
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
                        onClick={() => mudarPagina(paginacao.pagina - 1)}
                        disabled={paginacao.pagina === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                          paginacao.pagina === 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        &laquo;
                      </button>
                      
                      {/* Botões de página */}
                      {Array.from({ length: paginacao.paginas }, (_, i) => i + 1).map((pagina) => (
                        <button
                          key={pagina}
                          onClick={() => mudarPagina(pagina)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            paginacao.pagina === pagina
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pagina}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => mudarPagina(paginacao.pagina + 1)}
                        disabled={paginacao.pagina === paginacao.paginas}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                          paginacao.pagina === paginacao.paginas ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="sr-only">Próxima</span>
                        &raquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 