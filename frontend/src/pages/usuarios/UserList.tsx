import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  prefeitura: string;
  role: string;
  ativo: boolean;
  dataCriacao: string;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
  user: 'Usuário'
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Em uma implementação real, você buscaria da API
        // const response = await api.get('/usuarios', { 
        //   params: { 
        //     page: currentPage, 
        //     limit: itemsPerPage,
        //     search: searchTerm 
        //   } 
        // });
        // setUsers(response.data.users);
        // setTotalPages(response.data.totalPages);
        
        // Mock para demonstração
        setTimeout(() => {
          const mockUsers: User[] = Array.from({ length: 25 }, (_, index) => ({
            id: `${index + 1}`,
            nome: `Usuário ${index + 1}`,
            email: `usuario${index + 1}@example.com`,
            cargo: index % 3 === 0 ? 'Coordenador' : index % 3 === 1 ? 'Analista' : 'Supervisor',
            prefeitura: index % 4 === 0 ? 'São Paulo' : index % 4 === 1 ? 'Rio de Janeiro' : index % 4 === 2 ? 'Belo Horizonte' : 'Recife',
            role: index % 5 === 0 ? 'super_admin' : index % 5 === 1 ? 'admin' : index % 5 === 2 ? 'gestor' : index % 5 === 3 ? 'operador' : 'user',
            ativo: index % 6 !== 0,
            dataCriacao: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
          }));

          // Filtrar com base no termo de busca
          const filteredUsers = searchTerm
            ? mockUsers.filter(user => 
                user.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.prefeitura.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : mockUsers;

          // Calcular paginação
          const totalItems = filteredUsers.length;
          const totalPagesCount = Math.ceil(totalItems / itemsPerPage);
          setTotalPages(totalPagesCount);

          // Pegar apenas os itens da página atual
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
          
          setUsers(paginatedUsers);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, itemsPerPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset para primeira página ao buscar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      // Em uma implementação real, você enviaria para a API
      // await api.delete(`/usuarios/${userToDelete.id}`);
      
      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remover usuário da lista após exclusão
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Usuários</h1>
        <div className="mt-3 sm:mt-0">
          <Link
            to="/usuarios/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Novo Usuário
          </Link>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex w-full md:max-w-md">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Buscar usuários..."
            />
          </div>
          <button
            type="submit"
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="grid grid-cols-12 gap-2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Nome</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Cargo</div>
              <div className="col-span-1">Perfil</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Cadastro</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-200 bg-white">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="animate-pulse grid grid-cols-12 gap-2">
                    <div className="col-span-3 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-3 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-2 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-4 text-center text-sm text-gray-500 bg-white">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-2 px-6 py-4 text-sm text-gray-500">
                  <div className="col-span-3 flex items-center">
                    <Link to={`/usuarios/${user.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                      {user.nome}
                    </Link>
                  </div>
                  <div className="col-span-3">{user.email}</div>
                  <div className="col-span-2">{user.cargo}</div>
                  <div className="col-span-1">{roleLabels[user.role] || user.role}</div>
                  <div className="col-span-1">
                    <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="col-span-1">{formatDate(user.dataCriacao)}</div>
                  <div className="col-span-1 text-right space-x-2">
                    <Link
                      to={`/usuarios/editar/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5 inline-block" />
                      <span className="sr-only">Editar</span>
                    </Link>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5 inline-block" />
                      <span className="sr-only">Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, (currentPage - 1) * itemsPerPage + users.length)}
                </span>{' '}
                de <span className="font-medium">{totalPages * itemsPerPage}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Próximo</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Excluir usuário</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Tem certeza que deseja excluir o usuário "{userToDelete.nome}"? Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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

export default UserList; 