import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import PrefeiturasList from './pages/prefeituras/PrefeiturasList';
import PrefeituraDetail from './pages/prefeituras/PrefeituraDetail';
import PrefeituraForm from './pages/prefeituras/PrefeituraForm';
import UsersList from './pages/usuarios/UsersList';
import UserDetail from './pages/usuarios/UserDetail';
import ChangePassword from './pages/usuarios/ChangePassword';
import Logs from './pages/admin/Logs';
import Relatorios from './pages/admin/Relatorios';
import SolicitacoesTFD from './pages/admin/SolicitacoesTFD';
import RelatorioPaciente from './pages/admin/RelatorioPaciente';
import AgendamentosRelatorios from './pages/admin/AgendamentosRelatorios';
import AgendamentoRelatorioForm from './pages/admin/AgendamentoRelatorioForm';
import GerenciamentoDocumentos from './pages/GerenciamentoDocumentos';
// Importar componentes de viagens
import GerenciarViagens from './pages/Viagens/GerenciarViagens';
import DetalhesViagem from './pages/Viagens/DetalhesViagem';
import CriarViagem from './pages/Viagens/CriarViagem';

// Componente para proteger rotas que requerem autenticação
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { signed, loading } = useAuth();

  // Enquanto verifica o estado de autenticação, mostra um indicador de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo
  return <>{children}</>;
};

// Componente para redirecionar usuários já autenticados para o dashboard
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { signed, loading } = useAuth();

  // Enquanto verifica o estado de autenticação, mostra um indicador de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Se já estiver autenticado, redireciona para o dashboard
  if (signed) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se não estiver autenticado, renderiza o conteúdo
  return <>{children}</>;
};

// Aplicação principal
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          
          <Route
            path="/recuperar-senha"
            element={
              <PublicRoute>
                <RecuperarSenha />
              </PublicRoute>
            }
          />
          
          <Route
            path="/redefinir-senha/:token"
            element={
              <PublicRoute>
                <RedefinirSenha />
              </PublicRoute>
            }
          />

          {/* Rotas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Rotas de Prefeituras */}
          <Route
            path="/prefeituras"
            element={
              <PrivateRoute>
                <PrefeiturasList />
              </PrivateRoute>
            }
          />
          <Route
            path="/prefeituras/nova"
            element={
              <PrivateRoute>
                <PrefeituraForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/prefeituras/:id"
            element={
              <PrivateRoute>
                <PrefeituraDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/prefeituras/:id/editar"
            element={
              <PrivateRoute>
                <PrefeituraForm />
              </PrivateRoute>
            }
          />

          {/* Rotas de Usuários */}
          <Route
            path="/usuarios"
            element={
              <PrivateRoute>
                <UsersList />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/:id"
            element={
              <PrivateRoute>
                <UserDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <PrivateRoute>
                <UserDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/:id/alterar-senha"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
          
          {/* Rotas de Viagens */}
          <Route
            path="/viagens"
            element={
              <PrivateRoute>
                <GerenciarViagens />
              </PrivateRoute>
            }
          />
          <Route
            path="/viagens/nova"
            element={
              <PrivateRoute>
                <CriarViagem />
              </PrivateRoute>
            }
          />
          <Route
            path="/viagens/:id"
            element={
              <PrivateRoute>
                <DetalhesViagem />
              </PrivateRoute>
            }
          />
          <Route
            path="/viagens/:id/editar"
            element={
              <PrivateRoute>
                <CriarViagem />
              </PrivateRoute>
            }
          />
          
          {/* Rotas Administrativas */}
          <Route
            path="/logs"
            element={
              <PrivateRoute>
                <Logs />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            }
          />
          
          {/* Rotas de Solicitações TFD */}
          <Route
            path="/admin/solicitacoes-tfd"
            element={
              <PrivateRoute>
                <SolicitacoesTFD />
              </PrivateRoute>
            }
          />

          {/* Rotas para área administrativa */}
          <Route
            path="admin/relatorio-paciente"
            element={
              <PrivateRoute>
                <RelatorioPaciente />
              </PrivateRoute>
            }
          />
          
          {/* Rotas para Agendamento de Relatórios */}
          <Route
            path="/admin/agendamentos-relatorios"
            element={
              <PrivateRoute>
                <AgendamentosRelatorios />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/agendamentos-relatorios/novo"
            element={
              <PrivateRoute>
                <AgendamentoRelatorioForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/agendamentos-relatorios/editar/:id"
            element={
              <PrivateRoute>
                <AgendamentoRelatorioForm />
              </PrivateRoute>
            }
          />
          
          {/* Rotas para Gerenciamento de Documentos */}
          <Route
            path="/documentos"
            element={
              <PrivateRoute>
                <GerenciamentoDocumentos />
              </PrivateRoute>
            }
          />

          {/* Redirecionar a raiz para o dashboard ou login */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Rota para página não encontrada */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="mb-6">Página não encontrada</p>
                <a
                  href="/dashboard"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Voltar para o Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
