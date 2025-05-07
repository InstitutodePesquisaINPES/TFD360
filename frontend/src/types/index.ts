// Interfaces para usuários
export interface User {
  _id: string;
  nome: string;
  email: string;
  tipo_perfil: string;
  prefeitura?: string | Prefeitura;
  status: string;
  ultimo_acesso?: Date | string;
  permissoes: string[];
}

// Interfaces para prefeituras
export interface Prefeitura {
  _id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  estado: string;
  logo?: string;
  status: string;
  data_validade_contrato: Date | string;
  data_cadastro?: Date | string;
  limite_usuarios: number;
}

// Interfaces para filtros e paginação
export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedResult<T> {
  docs: T[];
  total: number;
  limit: number;
  page: number;
  pages: number;
}

// Interfaces para agendamento de relatórios
export interface AgendamentoRelatorio {
  _id?: string;
  nome: string;
  descricao?: string;
  tipo_relatorio: 'usuarios' | 'prefeituras' | 'solicitacoes_tfd' | 'logs_acesso';
  parametros?: any;
  frequencia: 'diario' | 'semanal' | 'mensal' | 'sob_demanda';
  dia_semana?: number;
  dia_mes?: number;
  horario: string;
  formato_saida: 'pdf' | 'excel' | 'csv';
  destinatarios?: string[];
  ativo: boolean;
  criado_por?: string | User;
  criado_em?: Date | string;
  atualizado_em?: Date | string;
  ultima_execucao?: Date | string;
  proxima_execucao?: Date | string;
  status_ultima_execucao?: 'pendente' | 'sucesso' | 'erro' | null;
  mensagem_erro?: string;
}

export interface AgendamentoRelatorioFiltros {
  tipo_relatorio?: string;
  ativo?: boolean;
  usuario_id?: string;
}

// Interfaces para logs de acesso
export interface LogAcesso {
  _id: string;
  usuario: string | User;
  acao: string;
  ip: string;
  data: Date | string;
  detalhes?: any;
}

// Interfaces para relatórios
export interface RelatorioOpcoes {
  formato?: 'pdf' | 'excel' | 'csv';
  filtros?: any;
  titulo?: string;
  descricao?: string;
}

// Interfaces para erros de API
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Interfaces para autenticação
export interface AuthCredentials {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Interfaces para solicitações TFD
export interface SolicitacaoTFD {
  _id: string;
  numero_solicitacao: string;
  paciente: {
    nome: string;
    cpf: string;
    data_nascimento: Date | string;
    telefone: string;
  };
  prefeitura: string | Prefeitura;
  status: string;
  tipo_atendimento: string;
  especialidade: string;
  data_solicitacao: Date | string;
  data_agendamento?: Date | string;
  data_atendimento?: Date | string;
  justificativa: string;
  observacoes?: string;
} 