import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { 
  DocumentChartBarIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Tipos para os relatórios
interface RelatorioOption {
  id: string;
  nome: string;
  descricao: string;
  permissao: string;
  icone: React.ReactNode;
}

interface FiltroRelatorio {
  dataInicio?: string;
  dataFim?: string;
  prefeituraId?: string;
  tipoUsuario?: string;
  status?: string;
  tipoAtendimento?: string;
  formato: string; // Novo campo para o formato
}

// Componente principal
const Relatorios: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroRelatorio>({
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    formato: 'pdf' // Valor padrão: PDF
  });
  const [prefeituras, setPrefeituras] = useState<any[]>([]);
  const [gerando, setGerando] = useState(false);
  
  // Opções de formato disponíveis
  const formatosDisponiveis = [
    {
      id: 'pdf',
      nome: 'PDF',
      descricao: 'Documento em formato PDF, ideal para visualização e impressão.',
      icone: <DocumentTextIcon className="w-5 h-5" />
    },
    {
      id: 'excel',
      nome: 'Excel',
      descricao: 'Planilha Excel, perfeita para análise e manipulação dos dados.',
      icone: <TableCellsIcon className="w-5 h-5" />
    },
    {
      id: 'csv',
      nome: 'CSV',
      descricao: 'Arquivo CSV, compatível com diversos sistemas e planilhas.',
      icone: <ListBulletIcon className="w-5 h-5" />
    }
  ];
  
  // Opções de relatórios disponíveis
  const opcoesRelatorios: RelatorioOption[] = [
    {
      id: 'usuarios',
      nome: 'Usuários do Sistema',
      descricao: 'Relatório com todos os usuários cadastrados no sistema, filtrados por prefeitura e tipo de perfil.',
      permissao: 'gerar_relatorio_usuarios',
      icone: <DocumentChartBarIcon className="w-8 h-8" />
    },
    {
      id: 'prefeituras',
      nome: 'Prefeituras Cadastradas',
      descricao: 'Relatório com todas as prefeituras cadastradas e informações sobre contrato e status.',
      permissao: 'gerar_relatorio_prefeituras',
      icone: <DocumentChartBarIcon className="w-8 h-8" />
    },
    {
      id: 'acessos',
      nome: 'Log de Acessos',
      descricao: 'Relatório de acessos ao sistema por período e usuário.',
      permissao: 'gerar_relatorio_logs',
      icone: <DocumentChartBarIcon className="w-8 h-8" />
    },
    {
      id: 'solicitacoes-tfd',
      nome: 'Solicitações de TFD',
      descricao: 'Relatório de solicitações de Tratamento Fora do Domicílio por período, status e tipo de atendimento.',
      permissao: 'gerar_relatorio_solicitacoes_tfd',
      icone: <DocumentChartBarIcon className="w-8 h-8" />
    },
    {
      id: 'paciente-solicitacoes',
      nome: 'Relatório por Paciente',
      descricao: 'Gera um relatório detalhado com todo o histórico de solicitações TFD de um paciente específico.',
      permissao: 'gerar_relatorio_solicitacoes_tfd',
      icone: <DocumentChartBarIcon className="w-8 h-8" />
    }
  ];

  // Carregar prefeituras para o filtro (apenas para Super Admin)
  useEffect(() => {
    const carregarPrefeituras = async () => {
      if (user?.tipo_perfil === 'Super Admin') {
        try {
          const response = await api.get('/prefeituras');
          setPrefeituras(response.data);
        } catch (err) {
          console.error('Erro ao carregar prefeituras:', err);
          setError('Não foi possível carregar a lista de prefeituras.');
        }
      }
    };

    carregarPrefeituras();
  }, [user]);

  // Função para gerar o relatório
  const gerarRelatorio = async () => {
    if (!relatorioSelecionado) {
      setError('Selecione um tipo de relatório para continuar.');
      return;
    }

    setGerando(true);
    setError(null);

    try {
      const params = {
        ...filtros,
        prefeituraId: user?.tipo_perfil !== 'Super Admin' ? user?.prefeitura?.id : filtros.prefeituraId
      };

      const response = await api.get(`/relatorios/${relatorioSelecionado}`, {
        params,
        responseType: 'blob'
      });

      // Determinar a extensão do arquivo com base no formato
      let extensao = 'pdf';
      let tipoMime = 'application/pdf';
      
      if (filtros.formato === 'excel') {
        extensao = 'xlsx';
        tipoMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (filtros.formato === 'csv') {
        extensao = 'csv';
        tipoMime = 'text/csv';
      }
      
      // Verificar o tipo de conteúdo real retornado
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes(tipoMime)) {
        console.warn(`Tipo de conteúdo esperado (${tipoMime}) difere do recebido (${contentType})`);
      }

      // Criar um link para download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: tipoMime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${relatorioSelecionado}_${new Date().toISOString().split('T')[0]}.${extensao}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.response?.data?.message || 'Não foi possível gerar o relatório. Tente novamente mais tarde.');
    } finally {
      setGerando(false);
    }
  };

  // Renderiza os filtros conforme o relatório selecionado
  const renderizarFiltros = () => {
    if (!relatorioSelecionado) return null;

    return (
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-lg mb-4">Filtros do Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro de data (comum para todos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="data-inicio">Data Início</label>
            <input
              id="data-inicio"
              type="date"
              className="w-full rounded-md border border-gray-300 p-2"
              value={filtros.dataInicio || ''}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              aria-label="Data de início do período"
              title="Selecione a data de início do período"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="data-fim">Data Fim</label>
            <input
              id="data-fim"
              type="date"
              className="w-full rounded-md border border-gray-300 p-2"
              value={filtros.dataFim || ''}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              aria-label="Data de fim do período"
              title="Selecione a data de fim do período"
            />
          </div>

          {/* Filtro de prefeitura (apenas para Super Admin) */}
          {user?.tipo_perfil === 'Super Admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="prefeitura">Prefeitura</label>
              <select
                id="prefeitura"
                className="w-full rounded-md border border-gray-300 p-2"
                value={filtros.prefeituraId || ''}
                onChange={(e) => setFiltros({ ...filtros, prefeituraId: e.target.value })}
                aria-label="Selecione a prefeitura"
                title="Filtrar por prefeitura específica"
              >
                <option value="">Todas as prefeituras</option>
                {prefeituras.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtros específicos para relatório de usuários */}
          {relatorioSelecionado === 'usuarios' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipo-usuario">Tipo de Usuário</label>
              <select
                id="tipo-usuario"
                className="w-full rounded-md border border-gray-300 p-2"
                value={filtros.tipoUsuario || ''}
                onChange={(e) => setFiltros({ ...filtros, tipoUsuario: e.target.value })}
                aria-label="Selecione o tipo de usuário"
                title="Filtrar por tipo de usuário"
              >
                <option value="">Todos os tipos</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin Prefeitura">Admin Prefeitura</option>
                <option value="Gestor TFD">Gestor TFD</option>
                <option value="Secretario Saude">Secretário de Saúde</option>
                <option value="Motorista">Motorista</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Paciente">Paciente</option>
              </select>
            </div>
          )}

          {/* Filtros específicos para relatório de prefeituras */}
          {relatorioSelecionado === 'prefeituras' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">Status</label>
              <select
                id="status"
                className="w-full rounded-md border border-gray-300 p-2"
                value={filtros.status || ''}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                aria-label="Selecione o status da prefeitura"
                title="Filtrar por status da prefeitura"
              >
                <option value="">Todos</option>
                <option value="ativa">Ativa</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
          )}

          {/* Filtros específicos para relatório de solicitações TFD */}
          {relatorioSelecionado === 'solicitacoes-tfd' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status-tfd">Status</label>
                <select
                  id="status-tfd"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={filtros.status || ''}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  aria-label="Selecione o status da solicitação"
                  title="Filtrar por status da solicitação"
                >
                  <option value="">Todos</option>
                  <option value="solicitado">Solicitado</option>
                  <option value="em_analise">Em análise</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="negado">Negado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipo-atendimento">Tipo de Atendimento</label>
                <select
                  id="tipo-atendimento"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={filtros.tipoAtendimento || ''}
                  onChange={(e) => setFiltros({ ...filtros, tipoAtendimento: e.target.value })}
                  aria-label="Selecione o tipo de atendimento"
                  title="Filtrar por tipo de atendimento"
                >
                  <option value="">Todos</option>
                  <option value="consulta">Consulta</option>
                  <option value="exame">Exame</option>
                  <option value="cirurgia">Cirurgia</option>
                  <option value="tratamento">Tratamento</option>
                  <option value="retorno">Retorno</option>
                </select>
              </div>
            </>
          )}
          
          {/* Seleção de formato (comum para todos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formato">Formato do Relatório</label>
            <select
              id="formato"
              className="w-full rounded-md border border-gray-300 p-2"
              value={filtros.formato}
              onChange={(e) => setFiltros({ ...filtros, formato: e.target.value })}
              aria-label="Selecione o formato do relatório"
              title="Escolha o formato para exportação do relatório"
            >
              {formatosDisponiveis.map(formato => (
                <option key={formato.id} value={formato.id}>{formato.nome}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Exibir descrição do formato selecionado */}
        <div className="mt-2 flex items-start p-2 bg-gray-50 rounded-md">
          {formatosDisponiveis.find(f => f.id === filtros.formato)?.icone}
          <p className="ml-2 text-sm text-gray-600">
            {formatosDisponiveis.find(f => f.id === filtros.formato)?.descricao}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={gerarRelatorio}
            disabled={gerando}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            aria-label={gerando ? "Gerando relatório..." : "Gerar relatório"}
            title="Clique para gerar o relatório com os filtros selecionados"
          >
            {gerando ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <DocumentChartBarIcon className="w-5 h-5 mr-2" />
                Gerar Relatório
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Renderiza card do relatório
  const renderCardRelatorio = (relatorio: RelatorioOption) => {
    const temPermissao = hasPermission(relatorio.permissao);
    if (!temPermissao) return null;

    // Para o relatório por paciente, redirecionar para uma página específica
    if (relatorio.id === 'paciente-solicitacoes') {
      return (
        <div key={relatorio.id} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {relatorio.icone}
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">{relatorio.nome}</h3>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{relatorio.descricao}</p>
          </div>
          <div className="px-5 py-3 bg-gray-50 flex justify-end">
            <Link 
              to="/admin/relatorio-paciente" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Ir para página
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={relatorio.id} 
        className={`bg-white shadow rounded-lg overflow-hidden cursor-pointer ${
          relatorioSelecionado === relatorio.id ? 'ring-2 ring-indigo-500' : ''
        }`}
        onClick={() => setRelatorioSelecionado(relatorio.id)}
      >
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {relatorio.icone}
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">{relatorio.nome}</h3>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">{relatorio.descricao}</p>
        </div>
        <div className="px-5 py-3 bg-gray-50 flex justify-end">
          <span 
            className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
              relatorioSelecionado === relatorio.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {relatorioSelecionado === relatorio.id ? 'Selecionado' : 'Clique para selecionar'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Relatórios do Sistema</h1>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Lista de relatórios disponíveis */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Selecione o tipo de relatório</h2>
            <p className="mt-1 text-sm text-gray-500">
              Escolha um dos relatórios abaixo para gerar. Cada relatório possui filtros específicos.
            </p>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opcoesRelatorios.map(opcao => renderCardRelatorio(opcao))}
          </div>
        </div>

        {/* Área de filtros do relatório selecionado */}
        {renderizarFiltros()}
      </div>
    </MainLayout>
  );
};

export default Relatorios; 