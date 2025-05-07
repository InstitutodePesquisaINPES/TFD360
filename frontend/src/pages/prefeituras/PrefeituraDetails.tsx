import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import {
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import api from '@services/api';

interface Prefeitura {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  endereco: string;
  cep: string;
  data_validade_contrato: string;
  limite_usuarios: number;
  modulos_ativos: string[];
  status: string;
  ativa: boolean;
  observacoes: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

interface ModuloSistema {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
}

interface EstatisticasPrefeitura {
  usuarios: {
    total: number;
    ativos: number;
    inativos: number;
    porPerfil: Record<string, number>;
  };
  ultimoUsuarioAtivo: {
    id: string;
    nome: string;
    email: string;
    ultimo_login: string;
  } | null;
}

export default function PrefeituraDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [prefeitura, setPrefeitura] = useState<Prefeitura | null>(null);
  const [modulos, setModulos] = useState<ModuloSistema[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasPrefeitura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar detalhes da prefeitura
        const prefeituraResponse = await api.get(`/prefeituras/${id}`);
        setPrefeitura(prefeituraResponse.data);

        // Carregar lista de módulos do sistema
        const modulosResponse = await api.get('/prefeituras/modulos');
        setModulos(modulosResponse.data);

        // Carregar estatísticas da prefeitura (usuários, etc.)
        try {
          const estatisticasResponse = await api.get(`/prefeituras/${id}/estatisticas`);
          setEstatisticas(estatisticasResponse.data);
        } catch (err) {
          console.warn('Não foi possível carregar estatísticas da prefeitura:', err);
          // Não exibiremos erro, apenas não mostraremos esta seção
        }
      } catch (err: any) {
        console.error('Erro ao carregar detalhes da prefeitura:', err);
        setError(
          err.response?.data?.message || 'Erro ao carregar detalhes da prefeitura. Tente novamente mais tarde.'
        );
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id]);

  // Verificar permissão para acessar a página
  if (!hasPermission('gerenciar_prefeituras')) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para visualizar os detalhes desta prefeitura.
            Entre em contato com o administrador do sistema caso acredite que isso seja um erro.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            aria-label="Voltar"
          >
            Voltar
          </button>
        </div>
      </MainLayout>
    );
  }

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando informações da prefeitura...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Renderizar estado de erro
  if (error || !prefeitura) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">
                {error || 'Prefeitura não encontrada'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/prefeituras')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              aria-label="Voltar para a lista de prefeituras"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar para a lista de prefeituras
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Função para obter o status da prefeitura de forma visual
  const getStatusBadge = () => {
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

    // Verifica se está expirando em até 30 dias
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

  // Obter módulo pelo ID
  const getModulo = (id: string) => {
    return modulos.find((m) => m.id === id);
  };

  // Formatação de data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/prefeituras')}
              className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              aria-label="Voltar para lista de prefeituras"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{prefeitura.nome}</h1>
              <p className="text-sm text-gray-600">
                Detalhes e configurações da prefeitura
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/prefeituras/${id}/editar`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar Prefeitura
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna 1: Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de informações principais */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20">
                    {prefeitura.logo ? (
                      <img
                        src={prefeitura.logo}
                        alt={`Logo da ${prefeitura.nome}`}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-10 w-10 text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <h2 className="text-xl font-bold text-gray-900">{prefeitura.nome}</h2>
                    <div className="flex items-center mt-1">
                      <IdentificationIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">{prefeitura.cnpj}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPinIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">
                        {prefeitura.cidade}/{prefeitura.estado}
                      </span>
                    </div>
                    <div className="mt-2">{getStatusBadge()}</div>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium">Informações de Contato</h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prefeitura.telefone && (
                      <div className="flex items-start">
                        <PhoneIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Telefone</p>
                          <p className="text-sm text-gray-600">{prefeitura.telefone}</p>
                        </div>
                      </div>
                    )}
                    {prefeitura.email && (
                      <div className="flex items-start">
                        <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{prefeitura.email}</p>
                        </div>
                      </div>
                    )}
                    {prefeitura.endereco && (
                      <div className="flex items-start sm:col-span-2">
                        <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Endereço Completo</p>
                          <p className="text-sm text-gray-600">
                            {prefeitura.endereco}
                            {prefeitura.cep && <span>, CEP: {prefeitura.cep}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card de estatísticas */}
            {estatisticas && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Estatísticas de Usuários</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Total de Usuários</p>
                          <p className="text-2xl font-semibold text-gray-700">
                            {estatisticas.usuarios.total}
                            <span className="text-sm text-gray-500 ml-1">
                              /{prefeitura.limite_usuarios}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div>
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            {estatisticas.usuarios.ativos} ativos
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            {estatisticas.usuarios.inativos} inativos
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Distribuição por Perfil</p>
                      {Object.entries(estatisticas.usuarios.porPerfil).map(([perfil, quantidade]) => (
                        <div key={perfil} className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600 capitalize">
                            {perfil.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-medium">{quantidade}</span>
                        </div>
                      ))}
                    </div>

                    {estatisticas.ultimoUsuarioAtivo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Último Usuário Ativo
                        </p>
                        <p className="text-sm font-semibold">{estatisticas.ultimoUsuarioAtivo.nome}</p>
                        <p className="text-xs text-gray-600">{estatisticas.ultimoUsuarioAtivo.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Último login em: {new Date(estatisticas.ultimoUsuarioAtivo.ultimo_login).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-right">
                    <Link
                      to={`/usuarios?prefeitura=${id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Ver todos os usuários
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Card de observações */}
            {prefeitura.observacoes && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Observações</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-line">{prefeitura.observacoes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2: Configurações e Módulos */}
          <div className="space-y-6">
            {/* Card de configurações do contrato */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Contrato</h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      {prefeitura.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Data de Validade</dt>
                    <dd className="text-sm text-gray-900">
                      {formatarData(prefeitura.data_validade_contrato)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Limite de Usuários</dt>
                    <dd className="text-sm text-gray-900">{prefeitura.limite_usuarios}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Data de Cadastro</dt>
                    <dd className="text-sm text-gray-900">{formatarData(prefeitura.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Última Atualização</dt>
                    <dd className="text-sm text-gray-900">{formatarData(prefeitura.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Card de módulos ativos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Módulos Ativos</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {prefeitura.modulos_ativos.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum módulo ativado além do core.</p>
                  ) : (
                    prefeitura.modulos_ativos.map((moduloId) => {
                      const modulo = getModulo(moduloId);
                      return (
                        <div key={moduloId} className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center">
                              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">
                              {modulo ? modulo.nome : moduloId}
                            </h4>
                            {modulo && (
                              <p className="text-sm text-gray-600">{modulo.descricao}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Card de ações rápidas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to={`/prefeituras/${id}/editar`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar Prefeitura
                  </Link>
                  
                  <Link
                    to={`/usuarios/novo?prefeitura=${id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Adicionar Usuário
                  </Link>
                  
                  <Link
                    to={`/prefeituras/${id}/relatorios`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Gerar Relatórios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 