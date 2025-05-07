import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import prefeiturasService, { Prefeitura } from '@services/prefeituras.service';

export default function PrefeituraDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [prefeitura, setPrefeitura] = useState<Prefeitura | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalExclusao, setModalExclusao] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<boolean>(false);
  const [processando, setProcessando] = useState<boolean>(false);
  
  // Verificar permissão para gerenciar prefeituras
  const podeGerenciarPrefeituras = hasPermission('gerenciar_prefeituras');
  
  // Carregar dados da prefeitura
  useEffect(() => {
    const carregarPrefeitura = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError('ID da prefeitura não especificado');
          setLoading(false);
          return;
        }
        
        const data = await prefeiturasService.buscar(id);
        setPrefeitura(data);
      } catch (error: any) {
        console.error('Erro ao carregar prefeitura:', error);
        setError(error.response?.data?.message || 'Erro ao carregar dados da prefeitura');
      } finally {
        setLoading(false);
      }
    };
    
    carregarPrefeitura();
  }, [id]);
  
  // Handler para alterar status da prefeitura
  const alterarStatus = async () => {
    if (!prefeitura) return;
    
    try {
      setProcessando(true);
      await prefeiturasService.alterarStatus(prefeitura.id, !prefeitura.ativa);
      setPrefeitura(prev => prev ? { ...prev, ativa: !prev.ativa } : null);
      setModalStatus(false);
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.message || 'Erro ao alterar status da prefeitura');
    } finally {
      setProcessando(false);
    }
  };
  
  // Handler para excluir prefeitura
  const excluirPrefeitura = async () => {
    if (!id) return;
    
    try {
      setProcessando(true);
      await prefeiturasService.remover(id);
      setModalExclusao(false);
      
      // Redirecionar para a lista de prefeituras após a exclusão
      navigate('/prefeituras', { replace: true });
    } catch (error: any) {
      console.error('Erro ao excluir prefeitura:', error);
      alert(error.response?.data?.message || 'Erro ao excluir prefeitura');
    } finally {
      setProcessando(false);
    }
  };
  
  // Função para formatar data
  const formatarData = (data: string | null) => {
    if (!data) return 'N/A';
    
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Função para formatar CNPJ
  const formatarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };
  
  // Função para formatar telefone
  const formatarTelefone = (telefone: string | null) => {
    if (!telefone) return 'N/A';
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length === 11 
      ? telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      : telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };
  
  // Função para formatar CEP
  const formatarCEP = (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  };
  
  // Verificar permissão para gerenciar prefeituras
  if (!podeGerenciarPrefeituras) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para acessar esta página. Entre em contato com o administrador do
            sistema caso acredite que isso seja um erro.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  if (loading) {
    return (
      <MainLayout>
        <div className="py-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !prefeitura) {
    return (
      <MainLayout>
        <div className="py-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <h3 className="text-sm font-medium text-red-800">
                  {error || 'Não foi possível carregar os dados da prefeitura'}
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/prefeituras"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar para Lista de Prefeituras
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Botão de voltar */}
          <div className="mb-6">
            <Link
              to="/prefeituras"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Voltar para a lista
            </Link>
          </div>
          
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                {prefeitura.logo ? (
                  <img 
                    src={prefeitura.logo} 
                    alt={prefeitura.nome}
                    className="h-16 w-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{prefeitura.nome}</h1>
                  <p className="text-gray-500 flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prefeitura.ativa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {prefeitura.ativa ? (
                        <>
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="mr-1 h-3 w-3" />
                          Inativa
                        </>
                      )}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">{formatarCNPJ(prefeitura.cnpj)}</span>
                  </p>
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex space-x-2">
                <Link
                  to={`/prefeituras/${prefeitura.id}/editar`}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </Link>
                <button
                  onClick={() => setModalStatus(true)}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    prefeitura.ativa
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {prefeitura.ativa ? (
                    <>
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Ativar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setModalExclusao(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
          
          {/* Informações da prefeitura */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Informações da Prefeitura</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {/* Dados básicos */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Dados Básicos
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Nome
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{prefeitura.nome}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400" />
                      CNPJ
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatarCNPJ(prefeitura.cnpj)}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{prefeitura.email}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Telefone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatarTelefone(prefeitura.telefone)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Endereço */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Endereço
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Logradouro
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {prefeitura.endereco.logradouro}, {prefeitura.endereco.numero}
                      {prefeitura.endereco.complemento && ` - ${prefeitura.endereco.complemento}`}
                    </dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Bairro</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prefeitura.endereco.bairro}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">CEP</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatarCEP(prefeitura.endereco.cep)}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Cidade</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prefeitura.endereco.cidade}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prefeitura.endereco.estado}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Dados do sistema */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Dados do Sistema
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Data de Cadastro
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatarData(prefeitura.created_at)}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                      Última Atualização
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatarData(prefeitura.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de alteração de status */}
      {modalStatus && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    {prefeitura.ativa ? (
                      <XCircleIcon className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {prefeitura.ativa ? 'Desativar prefeitura' : 'Ativar prefeitura'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {prefeitura.ativa
                          ? `Tem certeza que deseja desativar a prefeitura ${prefeitura.nome}? Isso afetará o acesso de todos os usuários vinculados a ela.`
                          : `Tem certeza que deseja ativar a prefeitura ${prefeitura.nome}?`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    prefeitura.ativa
                      ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                  onClick={alterarStatus}
                  disabled={processando}
                >
                  {processando ? 'Processando...' : prefeitura.ativa ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setModalStatus(false)}
                  disabled={processando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {modalExclusao && (
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
                    <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Excluir prefeitura
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir a prefeitura <strong>{prefeitura.nome}</strong>? Esta ação não pode ser desfeita e todos os dados associados serão removidos permanentemente, incluindo usuários vinculados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={excluirPrefeitura}
                  disabled={processando}
                >
                  {processando ? 'Excluindo...' : 'Excluir'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setModalExclusao(false)}
                  disabled={processando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 