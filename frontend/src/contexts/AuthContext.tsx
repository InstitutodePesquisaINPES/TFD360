import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

// Definição dos tipos
interface User {
  id: string;
  nome: string;
  email: string;
  tipo_perfil: string;
  foto: string | null;
  prefeitura: {
    id: string;
    nome: string;
    logo: string | null;
  } | null;
  permissoes: string[];
}

interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  hasPermission: (permission: string) => boolean;
  updateUser: (userData: User) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Criação do contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe um token salvo
    const storedToken = localStorage.getItem('@TFD360:token');
    const storedUser = localStorage.getItem('@TFD360:user');

    if (storedToken && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Função para fazer login
  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, senha: password });
      
      const { user, accessToken } = response.data;

      // Salvar dados no localStorage
      localStorage.setItem('@TFD360:token', accessToken);
      localStorage.setItem('@TFD360:user', JSON.stringify(user));
      
      // Configurar token no header das requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Função para fazer logout
  function signOut() {
    localStorage.removeItem('@TFD360:token');
    localStorage.removeItem('@TFD360:user');
    localStorage.removeItem('@TFD360:refreshToken');
    
    api.defaults.headers.common['Authorization'] = '';
    
    setUser(null);
  }

  // Função para verificar se o usuário possui uma permissão específica
  function hasPermission(permission: string): boolean {
    if (!user) return false;
    return user.permissoes.includes(permission);
  }

  // Função para atualizar dados do usuário
  function updateUser(userData: User) {
    setUser(userData);
    localStorage.setItem('@TFD360:user', JSON.stringify(userData));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signed: !!user,
        loading,
        signIn,
        signOut,
        hasPermission,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para utilizar o contexto
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
} 