import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  KeyIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  FunnelIcon,
  PencilSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import usuariosService, { Usuario, PaginacaoUsuarios, FiltrosUsuarios } from '@services/usuarios.service';

interface Perfil {
  id: string;
  nome: string;
  descricao: string;
}

interface Prefeitura {
  id: string;
  nome: string;
}

interface PaginacaoProps {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
  user: 'Usuário',
};

export default function UsersList() {
  const { hasPermission, user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtro, setFiltro] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('');
  const [status, setStatus] = useState('todos');
  const [prefeituraId, setPrefeituraId] = useState(searchParams.get('prefeitura') || 'todos');
  
  // Paginação
  const [paginacao, setPaginacao] = useState<PaginacaoUsuarios>({
    total: 0,
    pagina: 1,
    limite: 10,
    paginas: 0,
  });

  // Verificar permissões do usuário atual
  const isSuperAdmin = currentUser?.tipo_perfil === 'super_admin';
  const isPrefeituraAdmin = currentUser?.tipo_perfil === 'admin';
  const canManageAllUsers = hasPermission('gerenciar_usuarios');
  const canManagePrefeituraUsers = hasPermission('gerenciar_usuarios_prefeitura');

  // Determinar se o usuário tem permissão para acessar a página
  const hasPermissionToAccess = canManageAllUsers || canManagePrefeituraUsers;

  // Carregar dados iniciais: prefeituras e perfis disponíveis
  useEffect(() => {
    const carregarPerfis = async () => {
      try {
        const response = await usuariosService.listarPerfis();
        setPerfis(response);
      } catch (err: any) {
        console.error('Erro ao carregar perfis:', err);
      }
    };

    carregarPerfis();
  }, []);

  // Carregar usuários com filtros e paginação
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtros: FiltrosUsuarios = {
        pagina: paginacao.pagina,
        limite: paginacao.limite,
        termo: filtro,
        tipo_perfil: tipoPerfil !== '' ? tipoPerfil : undefined,
        status: status as 'ativo' | 'inativo' | 'todos',
      };

      const response = await usuariosService.listar(filtros);
      setUsuarios(response.usuarios);
      setPaginacao(response.paginacao);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(
        err.response?.data?.message || 'Erro ao carregar usuários. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [paginacao.pagina, paginacao.limite, status]);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginacao((prev) => ({ ...prev, pagina: 1 }));
    carregarUsuarios();
  };

  const handleExcluirClick = (usuario: Usuario) => {
    setUsuarioParaExcluir(usuario);
    setMostrarModalExclusao(true);
  };

  const confirmarExclusao = async () => {
    if (!usuarioParaExcluir) return;

    try {
      await usuariosService.remover(usuarioParaExcluir.id);
      setMostrarModalExclusao(false);
      setUsuarioParaExcluir(null);
      carregarUsuarios();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      alert(err.response?.data?.message || 'Erro ao excluir usuário. Tente novamente mais tarde.');
    }
  };

  const cancelarExclusao = () => {
    setMostrarModalExclusao(false);
    setUsuarioParaExcluir(null);
  };

  const handleAlterarStatus = async (id: string, novoStatus: boolean) => {
    try {
      await usuariosService.alterarStatus(id, novoStatus);
      carregarUsuarios();
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      alert(err.response?.data?.message || 'Erro ao alterar status. Tente novamente mais tarde.');
    }
  };

  const mudarPagina = (pagina: number) => {
    if (pagina < 1 || pagina > paginacao.paginas) return;
    setPaginacao((prev) => ({ ...prev, pagina }));
  };

  const formatarData = (dataString: string | null) => {
    if (!dataString) return 'Nunca';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  };

  const getNomePerfil = (tipo_perfil: string) => {
    const perfil = perfis.find((p) => p.id === tipo_perfil);
    return perfil ? perfil.nome : tipo_perfil;
  };

  // Verificar se o usuário tem permissão para gerenciar usuários
  if (!hasPermission('gerenciar_usuarios')) {
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Usuários</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie os usuários cadastrados no sistema
            </p>
          </div>
          <Link
            to="/usuarios/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Usuário
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
                  placeholder="Nome, Email ou CPF..."
                />
              </div>
            </div>
            <div className="w-40">
              <label htmlFor="tipoPerfil" className="block text-sm font-medium text-gray-700 mb-1">
                Perfil
              </label>
              <select
                id="tipoPerfil"
                value={tipoPerfil}
                onChange={(e) => setTipoPerfil(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Todos</option>
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome}
                  </option>
                ))}
              </select>
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
              <p className="mt-4 text-gray-600">Carregando usuários...</p>
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
            {usuarios.length === 0 ? (
              <div className="p-6 text-center">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum usuário encontrado</h3>
                <p className="text-gray-500">
                  Não foram encontrados usuários com os filtros aplicados.
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
                        Usuário
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Perfil
                      </th>
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
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Último Login
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
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {usuario.foto ? (
                                <img
                                  src={usuario.foto}
                                  alt={usuario.nome}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <Link
                                  to={`/usuarios/${usuario.id}`}
                                  className="hover:text-indigo-600"
                                >
                                  {usuario.nome}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">{usuario.cpf}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{usuario.email}</div>
                          <div className="text-sm text-gray-500">{usuario.telefone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getNomePerfil(usuario.tipo_perfil)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {usuario.prefeitura ? usuario.prefeitura.nome : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {usuario.ativo ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              <CheckCircleIcon className="inline-block w-4 h-4 mr-1 text-green-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              <XCircleIcon className="inline-block w-4 h-4 mr-1 text-red-500" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatarData(usuario.ultimo_login)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/usuarios/${usuario.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Ver detalhes"
                            >
                              <span className="sr-only">Ver detalhes</span>
                              <MagnifyingGlassIcon className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/usuarios/${usuario.id}/editar`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <span className="sr-only">Editar</span>
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            {usuario.ativo ? (
                              <button
                                onClick={() => handleAlterarStatus(usuario.id, false)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Desativar"
                              >
                                <span className="sr-only">Desativar</span>
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAlterarStatus(usuario.id, true)}
                                className="text-green-600 hover:text-green-900"
                                title="Ativar"
                              >
                                <span className="sr-only">Ativar</span>
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleExcluirClick(usuario)}
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
            {usuarios.length > 0 && (
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

      {/* Modal de confirmação de exclusão */}
      {mostrarModalExclusao && usuarioParaExcluir && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Excluir usuário</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir o usuário{' '}
                        <strong>{usuarioParaExcluir.nome}</strong>? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmarExclusao}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelarExclusao}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 