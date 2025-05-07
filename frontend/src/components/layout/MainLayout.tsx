import { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const { user, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Função para verificar qual item do menu está ativo
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Função para lidar com o logout
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  
  // Lista de itens do menu com controle de permissão
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <HomeIcon className="h-5 w-5" />,
      permission: null, // Todos podem acessar
    },
    {
      name: 'Prefeituras',
      path: '/prefeituras',
      icon: <BuildingOfficeIcon className="h-5 w-5" />,
      permission: 'gerenciar_prefeituras', // Apenas superadmin
    },
    {
      name: 'Usuários',
      path: '/usuarios',
      icon: <UsersIcon className="h-5 w-5" />,
      permission: 'gerenciar_usuarios', // Superadmin
    },
    {
      name: 'Viagens',
      path: '/viagens',
      icon: <TruckIcon className="h-5 w-5" />,
      permission: null, // Todos podem acessar
    },
    {
      name: 'Solicitações TFD',
      path: '/admin/solicitacoes-tfd',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      permission: 'visualizar_solicitacoes', // Permissão necessária
    },
    {
      name: 'Documentos',
      path: '/documentos',
      icon: <DocumentDuplicateIcon className="h-5 w-5" />,
      permission: 'gerenciar_documentos', // Permissão necessária
    },
    {
      name: 'Logs',
      path: '/logs',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      permission: 'visualizar_logs', // Superadmin
    },
    {
      name: 'Relatórios',
      path: '/relatorios',
      icon: <ChartPieIcon className="h-5 w-5" />,
      permission: 'gerar_relatorios', // Administradores e gestores
    },
  ];
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar para mobile */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-indigo-600">
          <Link to="/dashboard" className="text-white font-bold text-xl">
            TFD360
          </Link>
          <button
            className="text-white focus:outline-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              // Renderizar apenas se o usuário tiver permissão ou se não for necessária
              (!item.permission || hasPermission(item.permission)) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
      
      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
              <Link to="/dashboard" className="text-white font-bold text-xl">
                TFD360
              </Link>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {menuItems.map((item) => (
                  // Renderizar apenas se o usuário tiver permissão ou se não for necessária
                  (!item.permission || hasPermission(item.permission)) && (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive(item.path)
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  )
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-end">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Informações do usuário logado */}
              <div className="relative">
                <button
                  className="max-w-xs flex items-center text-sm rounded-full focus:outline-none"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="Menu do usuário"
                  title="Menu do usuário"
                >
                  <span className="mr-2 hidden sm:block">
                    {user?.nome || 'Usuário'}
                  </span>
                  {user?.prefeitura && (
                    <span className="mr-2 text-xs text-gray-500 hidden sm:block">
                      ({user.prefeitura.nome})
                    </span>
                  )}
                  <div className="flex items-center">
                    {user?.foto ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.foto}
                        alt={user.nome}
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    )}
                    <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-400" />
                  </div>
                </button>
                
                {/* Menu do usuário */}
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <Link
                      to="/perfil"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 