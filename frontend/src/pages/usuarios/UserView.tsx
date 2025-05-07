import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  role: string;
  prefeitura: {
    id: string;
    nome: string;
  } | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  ultimoLogin: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
  user: 'Usuário',
};

const UserView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Em uma implementação real, você buscaria da API
        // const response = await api.get(`/usuarios/${id}`);
        // setUser(response.data);
        
        // Mock para demonstração
        setTimeout(() => {
          setUser({
            id: id || '1',
            nome: 'João Silva',
            email: 'joao.silva@exemplo.com',
            telefone: '(11) 98765-4321',
            cargo: 'Coordenador',
            role: 'admin',
            prefeitura: {
              id: '1',
              nome: 'Prefeitura de São Paulo'
            },
            ativo: true,
            createdAt: '2023-01-15T10:30:00Z',
            updatedAt: '2023-06-10T14:45:00Z',
            ultimoLogin: '2023-10-05T08:20:00Z'
          });
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        setError('Não foi possível carregar os detalhes do usuário. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    } else {
      setError('ID do usuário não fornecido');
      setLoading(false);
    }
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      // Em uma implementação real, você enviaria para a API
      // await api.delete(`/usuarios/${id}`);
      
      // Mock para demonstração
      setTimeout(() => {
        navigate('/usuarios');
      }, 500);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setError('Não foi possível excluir o usuário. Tente novamente mais tarde.');
      setShowDeleteModal(false);
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/4"></div>
            <div className="h-20 bg-slate-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <Link
                    to="/usuarios"
                    className="text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Voltar para a lista de usuários
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <p className="text-gray-700">Usuário não encontrado</p>
            <div className="mt-4">
              <Link
                to="/usuarios"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar para a lista de usuários
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/usuarios"
              className="text-gray-400 hover:text-gray-500"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Detalhes do Usuário</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/usuarios/editar/${user.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Editar
            </Link>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Excluir
            </button>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
            <div className="flex-shrink-0 mb-4 sm:mb-0">
              {user.ativo ? (
                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                  <UserCircleIcon className="h-16 w-16" />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <UserCircleIcon className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="sm:ml-6">
              <h2 className="text-2xl font-bold text-gray-900">{user.nome}</h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {user.cargo}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <ShieldCheckIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {roleLabels[user.role] || user.role}
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900">
                  <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <a href={`mailto:${user.email}`} className="text-indigo-600 hover:text-indigo-900">
                    {user.email}
                  </a>
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900">
                  <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <a href={`tel:${user.telefone}`} className="text-indigo-600 hover:text-indigo-900">
                    {user.telefone}
                  </a>
                </dd>
              </div>

              {user.prefeitura && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Prefeitura</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <Link to={`/prefeituras/${user.prefeitura.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {user.prefeitura.nome}
                    </Link>
                  </dd>
                </div>
              )}
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Último acesso</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {formatDate(user.ultimoLogin)}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Cadastrado em</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Última atualização</dt>
                <dd className="mt-1 flex items-center text-sm text-gray-900">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {formatDate(user.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
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
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Excluir usuário
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir o usuário <strong>{user.nome}</strong>? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? 'Excluindo...' : 'Excluir'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserView; 