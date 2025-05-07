import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, Table, Button, Badge, Form, Col, Row, 
  Card, Modal, Spinner, Alert, Pagination
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faPlay, faCheck, faTimes, faFilter, faSync
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import agendamentoRelatorioService from '../../services/agendamento-relatorio.service';
import { AgendamentoRelatorio, AgendamentoRelatorioFiltros, PaginationOptions } from '../../types';

const AgendamentosRelatorios: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para armazenar os dados
  const [agendamentos, setAgendamentos] = useState<AgendamentoRelatorio[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [executando, setExecutando] = useState<boolean>(false);
  const [idExecutando, setIdExecutando] = useState<string | null>(null);
  
  // Estados para o modal de confirmação
  const [showModal, setShowModal] = useState<boolean>(false);
  const [agendamentoParaRemover, setAgendamentoParaRemover] = useState<AgendamentoRelatorio | null>(null);
  
  // Estados para filtros e paginação
  const [filtros, setFiltros] = useState<AgendamentoRelatorioFiltros>({});
  const [paginacao, setPaginacao] = useState<PaginationOptions>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Carregar agendamentos ao iniciar
  useEffect(() => {
    carregarAgendamentos();
  }, [filtros, paginacao.page, paginacao.limit]);
  
  // Função para carregar agendamentos com filtros e paginação
  const carregarAgendamentos = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const resultado = await agendamentoRelatorioService.listarAgendamentos(
        filtros,
        { page: paginacao.page, limit: paginacao.limit }
      );
      
      setAgendamentos(resultado.docs);
      setPaginacao({
        ...paginacao,
        total: resultado.total,
        totalPages: resultado.pages
      });
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setErro('Falha ao carregar os agendamentos de relatórios. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para aplicar filtros
  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginacao({ ...paginacao, page: 1 }); // Reiniciar para a primeira página
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({});
    setPaginacao({ ...paginacao, page: 1 });
  };
  
  // Funções para manipular o modal de confirmação
  const abrirModalRemover = (agendamento: AgendamentoRelatorio) => {
    setAgendamentoParaRemover(agendamento);
    setShowModal(true);
  };
  
  const fecharModal = () => {
    setShowModal(false);
    setAgendamentoParaRemover(null);
  };
  
  // Função para remover agendamento
  const removerAgendamento = async () => {
    if (!agendamentoParaRemover?._id) return;
    
    try {
      await agendamentoRelatorioService.removerAgendamento(agendamentoParaRemover._id);
      setAgendamentos(agendamentos.filter(a => a._id !== agendamentoParaRemover._id));
      fecharModal();
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      setErro('Falha ao remover o agendamento. Tente novamente mais tarde.');
    }
  };
  
  // Função para executar um agendamento manualmente
  const executarAgendamento = async (id: string) => {
    setIdExecutando(id);
    setExecutando(true);
    setErro(null);
    
    try {
      await agendamentoRelatorioService.executarAgendamento(id);
      // Recarregar para atualizar o status
      await carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao executar agendamento:', error);
      setErro('Falha ao executar o relatório. Tente novamente mais tarde.');
    } finally {
      setExecutando(false);
      setIdExecutando(null);
    }
  };
  
  // Função para alternar o status de um agendamento
  const alternarStatusAgendamento = async (id: string, ativo: boolean) => {
    try {
      const agendamentoAtualizado = await agendamentoRelatorioService.alterarStatus(id, !ativo);
      
      // Atualizar a lista localmente
      setAgendamentos(agendamentos.map(a => 
        a._id === id ? { ...a, ativo: agendamentoAtualizado.ativo } : a
      ));
    } catch (error) {
      console.error('Erro ao alterar status do agendamento:', error);
      setErro('Falha ao alterar o status do agendamento. Tente novamente mais tarde.');
    }
  };
  
  // Função para navegar entre páginas
  const mudarPagina = (pagina: number) => {
    setPaginacao({ ...paginacao, page: pagina });
  };

  // Renderizar status de agendamento com cor apropriada
  const renderizarStatus = (status: string | null | undefined) => {
    if (!status) return <Badge bg="secondary">Não executado</Badge>;
    
    switch (status) {
      case 'pendente':
        return <Badge bg="warning">Pendente</Badge>;
      case 'sucesso':
        return <Badge bg="success">Sucesso</Badge>;
      case 'erro':
        return <Badge bg="danger">Erro</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // Renderizar a data formatada
  const renderizarData = (data: string | Date | undefined | null) => {
    if (!data) return '-';
    try {
      return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };
  
  // Renderizar opções para frequência
  const renderizarFrequencia = (agendamento: AgendamentoRelatorio) => {
    const frequencias = {
      diario: 'Diário',
      semanal: 'Semanal',
      mensal: 'Mensal',
      sob_demanda: 'Sob Demanda'
    };
    
    let texto = frequencias[agendamento.frequencia] || agendamento.frequencia;
    
    if (agendamento.frequencia === 'semanal' && agendamento.dia_semana !== undefined) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      texto += ` (${diasSemana[agendamento.dia_semana]})`;
    } else if (agendamento.frequencia === 'mensal' && agendamento.dia_mes !== undefined) {
      texto += ` (Dia ${agendamento.dia_mes})`;
    }
    
    if (agendamento.horario) {
      texto += ` às ${agendamento.horario}`;
    }
    
    return texto;
  };
  
  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Agendamentos de Relatórios</h5>
            <Button 
              variant="light" 
              size="sm" 
              as={Link} 
              to="/admin/agendamentos-relatorios/novo"
            >
              <FontAwesomeIcon icon={faPlus} /> Novo Agendamento
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Filtros */}
          <Form onSubmit={aplicarFiltros} className="mb-4">
            <Row>
              <Col sm={12} md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Relatório</Form.Label>
                  <Form.Select
                    aria-label="Filtrar por tipo de relatório"
                    value={filtros.tipo_relatorio || ''}
                    onChange={(e) => setFiltros({...filtros, tipo_relatorio: e.target.value || undefined})}
                  >
                    <option value="">Todos</option>
                    {agendamentoRelatorioService.getTiposRelatorio().map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col sm={12} md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    aria-label="Filtrar por status"
                    value={filtros.ativo === undefined ? '' : filtros.ativo ? 'true' : 'false'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFiltros({
                        ...filtros, 
                        ativo: value === '' ? undefined : value === 'true'
                      });
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col sm={12} md={4} className="d-flex align-items-end mb-3">
                <div className="d-grid w-100 d-md-flex gap-2">
                  <Button type="submit" variant="primary">
                    <FontAwesomeIcon icon={faFilter} /> Filtrar
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={limparFiltros}
                  >
                    Limpar
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
          
          {/* Alerta de erro */}
          {erro && (
            <Alert variant="danger" onClose={() => setErro(null)} dismissible>
              {erro}
            </Alert>
          )}
          
          {/* Tabela de agendamentos */}
          {carregando ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando agendamentos...</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <Alert variant="info">
              Nenhum agendamento de relatório encontrado.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Frequência</th>
                      <th>Última Execução</th>
                      <th>Próxima Execução</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map(agendamento => (
                      <tr key={agendamento._id}>
                        <td>{agendamento.nome}</td>
                        <td>
                          {agendamentoRelatorioService.getTiposRelatorio()
                            .find(t => t.value === agendamento.tipo_relatorio)?.label || 
                            agendamento.tipo_relatorio}
                        </td>
                        <td>{renderizarFrequencia(agendamento)}</td>
                        <td>{renderizarData(agendamento.ultima_execucao)}</td>
                        <td>{renderizarData(agendamento.proxima_execucao)}</td>
                        <td>{renderizarStatus(agendamento.status_ultima_execucao)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => navigate(`/admin/agendamentos-relatorios/editar/${agendamento._id}`)}
                              title="Editar"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            
                            <Button 
                              variant={agendamento.ativo ? "outline-warning" : "outline-success"} 
                              size="sm"
                              onClick={() => alternarStatusAgendamento(agendamento._id!, agendamento.ativo)}
                              title={agendamento.ativo ? "Desativar" : "Ativar"}
                            >
                              <FontAwesomeIcon icon={agendamento.ativo ? faTimes : faCheck} />
                            </Button>
                            
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => abrirModalRemover(agendamento)}
                              title="Remover"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                            
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => executarAgendamento(agendamento._id!)}
                              disabled={executando && idExecutando === agendamento._id}
                              title="Executar agora"
                            >
                              {executando && idExecutando === agendamento._id ? (
                                <Spinner 
                                  as="span" 
                                  animation="border" 
                                  size="sm" 
                                  role="status" 
                                  aria-hidden="true" 
                                />
                              ) : (
                                <FontAwesomeIcon icon={faPlay} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Paginação */}
              {paginacao.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => mudarPagina(1)} 
                      disabled={paginacao.page === 1} 
                    />
                    <Pagination.Prev 
                      onClick={() => mudarPagina(paginacao.page - 1)} 
                      disabled={paginacao.page === 1} 
                    />
                    
                    {Array.from({ length: paginacao.totalPages }, (_, i) => i + 1).map(page => (
                      <Pagination.Item 
                        key={page} 
                        active={page === paginacao.page}
                        onClick={() => mudarPagina(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    
                    <Pagination.Next 
                      onClick={() => mudarPagina(paginacao.page + 1)} 
                      disabled={paginacao.page === paginacao.totalPages} 
                    />
                    <Pagination.Last 
                      onClick={() => mudarPagina(paginacao.totalPages)} 
                      disabled={paginacao.page === paginacao.totalPages} 
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de confirmação para remover */}
      <Modal show={showModal} onHide={fecharModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Remoção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja remover o agendamento <strong>{agendamentoParaRemover?.nome}</strong>?
          <div className="mt-2">
            <Alert variant="warning">
              Esta ação não poderá ser desfeita.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={removerAgendamento}>
            Remover
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AgendamentosRelatorios; 