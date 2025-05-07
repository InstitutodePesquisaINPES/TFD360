import api from './api';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo_perfil: string;
    foto: string | null;
    prefeitura: {
      id: string;
      nome: string;
    } | null;
    permissoes: string[];
  };
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Serviço para autenticação e gerenciamento de usuários
 */
const authService = {
  /**
   * Realizar login no sistema
   * @param email Email do usuário
   * @param senha Senha do usuário
   * @returns Tokens de acesso e dados do usuário
   */
  login: async (email: string, senha: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      senha
    });
    return response.data.data;
  },
  
  /**
   * Atualizar token de acesso usando o refresh token
   * @param refreshToken Token de atualização
   * @returns Novos tokens de acesso
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await api.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken
    });
    return response.data.data;
  },
  
  /**
   * Solicitar recuperação de senha
   * @param email Email do usuário
   * @returns Mensagem de sucesso
   */
  solicitarRecuperacao: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<null>>('/auth/recuperar-senha', {
      email
    });
    return { message: response.data.message };
  },
  
  /**
   * Verificar token de recuperação de senha
   * @param token Token de recuperação
   * @returns Validade do token
   */
  verificarTokenRecuperacao: async (token: string): Promise<{ valido: boolean; email?: string }> => {
    try {
      const response = await api.get<ApiResponse<{ email: string }>>(`/auth/verificar-token/${token}`);
      return { valido: true, email: response.data.data.email };
    } catch (error) {
      return { valido: false };
    }
  },
  
  /**
   * Redefinir senha com token de recuperação
   * @param token Token de recuperação
   * @param novaSenha Nova senha
   * @returns Mensagem de sucesso
   */
  redefinirSenha: async (token: string, novaSenha: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<null>>('/auth/redefinir-senha', {
      token,
      novaSenha
    });
    return { message: response.data.message };
  },
  
  /**
   * Verificar se o email está disponível (não cadastrado)
   * @param email Email para verificar
   * @returns Se o email está disponível
   */
  verificarEmail: async (email: string): Promise<{ disponivel: boolean }> => {
    try {
      await api.get<ApiResponse<null>>(`/auth/verificar-email/${email}`);
      return { disponivel: true };
    } catch (error) {
      return { disponivel: false };
    }
  },
  
  /**
   * Realizar logout do sistema (invalidar tokens)
   * @returns Mensagem de sucesso
   */
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return { message: response.data.message };
  }
};

export default authService; 