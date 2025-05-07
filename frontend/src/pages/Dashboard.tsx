import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

// Tipo para estatísticas do Super Admin
interface SuperAdminStats {
  prefeituras: {
    total: number;
    ativas: number;
    expiradas: number;
    expirando: number;
  };
  usuarios: {
    total: number;
    ativos: number;
  };
}

// Tipo para estatísticas do Admin de Prefeitura
interface PrefeituraStats {
  usuarios: {
    total: number;
    porPerfil: {
      [key: string]: number;
    };
  };
  modulos: {
    ativos: string[];
    disponiveis: string[];
  };
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [superAdminStats, setSuperAdminStats] = useState<SuperAdminStats | null>(null);
  const [prefeituraStats, setPrefeituraStats] = useState<PrefeituraStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário é Super Admin
  const isSuperAdmin = user?.tipo_perfil === 'super_admin';
  // Verificar se o usuário é Admin de prefeitura
  const isPrefeituraAdmin = user?.tipo_perfil === 'admin';

  useEffect(() => {
    // Carregar estatísticas apropriadas com base no tipo de usuário
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        if (isSuperAdmin) {
          // Carregar estatísticas para Super Admin
          // Na implementação real, isso viria da API
          // Simulando dados para demonstração
          const stats: SuperAdminStats = {
            prefeituras: {
              total: 10,
              ativas: 8,
              expiradas: 1,
              expirando: 1
            },
            usuarios: {
              total: 245,
              ativos: 230
            }
          };
          setSuperAdminStats(stats);
        } else if (isPrefeituraAdmin && user?.prefeitura) {
          // Carregar estatísticas para Admin de Prefeitura
          // Na implementação real, isso viria da API
          // Simulando dados para demonstração
          const stats: PrefeituraStats = {
            usuarios: {
              total: 25,
              porPerfil: {
                admin: 2,
                gestor_tfd: 3,
                secretario: 1,
                motorista: 8,
                administrativo: 10,
                paciente: 1
              }
            },
            modulos: {
              ativos: ['core', 'pacientes', 'viagens', 'frota'],
              disponiveis: ['logistica', 'financeiro', 'alertas', 'relatorios']
            }
          };
          setPrefeituraStats(stats);
        }
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError('Não foi possível carregar as estatísticas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [isSuperAdmin, isPrefeituraAdmin, user]);

  return (
    <MainLayout>
      <div className="py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bem-vindo, {user?.nome}!
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Carregando...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md mt-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="mt-6">
            {isSuperAdmin && superAdminStats && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Visão Geral do Sistema</h2>
                
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total de Prefeituras
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {superAdminStats.prefeituras.total}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-600">Ativas: {superAdminStats.prefeituras.ativas}</span>
                          <span className="text-sm text-red-600">Expiradas: {superAdminStats.prefeituras.expiradas}</span>
                          <span className="text-sm text-yellow-600">Expirando: {superAdminStats.prefeituras.expirando}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                          <UsersIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total de Usuários
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {superAdminStats.usuarios.total}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-600">Ativos: {superAdminStats.usuarios.ativos}</span>
                          <span className="text-sm text-red-600">Inativos: {superAdminStats.usuarios.total - superAdminStats.usuarios.ativos}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
                  <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <a href="/prefeituras/nova" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Nova Prefeitura
                    </a>
                    <a href="/usuarios/novo" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <UsersIcon className="h-5 w-5 mr-2" />
                      Novo Usuário
                    </a>
                  </div>
                </div>
              </div>
            )}

            {isPrefeituraAdmin && prefeituraStats && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Visão Geral da Prefeitura</h2>
                
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                          <UsersIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total de Usuários
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {prefeituraStats.usuarios.total}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                          <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Módulos Ativos
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {prefeituraStats.modulos.ativos.length} / {prefeituraStats.modulos.ativos.length + prefeituraStats.modulos.disponiveis.length}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Módulos ativos */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Módulos Ativos</h3>
                  <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {prefeituraStats.modulos.ativos.map((modulo) => (
                      <div key={modulo} className="bg-white overflow-hidden shadow rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {modulo.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
                  <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <a href="/usuarios/novo" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <UsersIcon className="h-5 w-5 mr-2" />
                      Novo Usuário
                    </a>
                    <a href="/configuracoes" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Configurações
                    </a>
                  </div>
                </div>
              </div>
            )}

            {!isSuperAdmin && !isPrefeituraAdmin && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Seu Painel</h2>
                
                {/* Cards de acesso rápido com base nas permissões */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {hasPermission('gerenciar_pacientes') && (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                            <UsersIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Pacientes
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  <a href="/pacientes" className="text-indigo-600 hover:text-indigo-900">
                                    Gerenciar Pacientes
                                  </a>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPermission('gerenciar_viagens') && (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                            <CalendarIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Viagens
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  <a href="/viagens" className="text-indigo-600 hover:text-indigo-900">
                                    Gerenciar Viagens
                                  </a>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPermission('gerenciar_motoristas') && (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                            <TruckIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Frota
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  <a href="/frota" className="text-indigo-600 hover:text-indigo-900">
                                    Gerenciar Frota
                                  </a>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPermission('gerenciar_financeiro') && (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                            <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Financeiro
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  <a href="/financeiro" className="text-indigo-600 hover:text-indigo-900">
                                    Gerenciar Financeiro
                                  </a>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 