import api from './api';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo_perfil: string;
  prefeitura: {
    id: string;
    nome: string;
    logo?: string;
  } | null;
  ativo: boolean;
  ultimo_login: string | null;
  foto: string | null;
  created_at: string;
  updated_at: string;
  permissoes?: string[];
}

export interface PaginacaoUsuarios {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface FiltrosUsuarios {
  termo?: string;
  tipo_perfil?: string;
  prefeitura_id?: string;
  status?: 'ativo' | 'inativo' | 'todos';
  pagina?: number;
  limite?: number;
}

// Interface para objetos de resposta da API
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Serviço para gerenciar usuários
 */
const usuariosService = {
  /**
   * Listar usuários com filtros e paginação
   * @param filtros Filtros para a busca de usuários
   * @returns Lista de usuários e informações de paginação
   */
  listar: async (filtros: FiltrosUsuarios = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString());
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.termo) params.append('termo', filtros.termo);
    if (filtros.tipo_perfil) params.append('tipo_perfil', filtros.tipo_perfil);
    if (filtros.prefeitura_id) params.append('prefeitura_id', filtros.prefeitura_id);
    if (filtros.status && filtros.status !== 'todos') params.append('status', filtros.status);
    
    const response = await api.get<ApiResponse<PaginatedResponse<Usuario>>>('/usuarios', {
      params: { ...filtros }
    });
    return response.data;
  },
  
  /**
   * Buscar usuário por ID
   * @param id ID do usuário
   * @returns Dados do usuário
   */
  buscar: async (id: string): Promise<Usuario> => {
    const response = await api.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    return response.data;
  },
  
  /**
   * Criar um novo usuário
   * @param dados Dados do novo usuário
   * @returns Usuário criado
   */
  criar: async (dados: FormData): Promise<{ message: string; usuario: Usuario }> => {
    const response = await api.post('/usuarios', dados, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  /**
   * Atualizar um usuário existente
   * @param id ID do usuário
   * @param dados Dados atualizados do usuário
   * @returns Usuário atualizado
   */
  atualizar: async (id: string, dados: FormData): Promise<{ message: string; usuario: Usuario }> => {
    const response = await api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, dados);
    return response.data;
  },
  
  /**
   * Alterar a senha de um usuário
   * @param id ID do usuário
   * @param senhaAtual Senha atual (obrigatória se for o próprio usuário)
   * @param novaSenha Nova senha
   * @returns Mensagem de sucesso
   */
  alterarSenha: async (id: string, senhaAtual: string | null, novaSenha: string): Promise<{ message: string }> => {
    const payload = senhaAtual 
      ? { senhaAtual, novaSenha }
      : { novaSenha };
    
    const response = await api.post<ApiResponse<null>>(`/usuarios/${id}/alterar-senha`, payload);
    return response.data;
  },
  
  /**
   * Ativar ou desativar um usuário
   * @param id ID do usuário
   * @param ativo Status para definir (true = ativo, false = inativo)
   * @returns Mensagem de sucesso
   */
  alterarStatus: async (id: string, ativo: boolean): Promise<{ message: string; usuario: { id: string; nome: string; ativo: boolean } }> => {
    const response = await api.patch<ApiResponse<Usuario>>(`/usuarios/${id}/status`, { status: ativo ? 'ATIVO' : 'INATIVO' });
    return response.data;
  },
  
  /**
   * Remover um usuário
   * @param id ID do usuário
   * @returns Mensagem de sucesso
   */
  remover: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<null>>(`/usuarios/${id}`);
    return response.data;
  },
  
  /**
   * Listar todos os perfis disponíveis
   * @returns Lista de perfis
   */
  listarPerfis: async (): Promise<{ id: string; nome: string }[]> => {
    const response = await api.get('/usuarios/perfis');
    return response.data;
  },
  
  /**
   * Listar todas as permissões disponíveis
   * @returns Lista de permissões
   */
  listarPermissoes: async (): Promise<{ id: string; nome: string }[]> => {
    const response = await api.get('/usuarios/permissoes');
    return response.data;
  }
};

export default usuariosService; 