import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Form, Button, Card, Row, Col, Alert, Spinner 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';

import agendamentoRelatorioService from '../../services/agendamento-relatorio.service';
import { AgendamentoRelatorio } from '../../types';

const AgendamentoRelatorioForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdicao = !!id;
  
  // Estados para o formulário
  const [formData, setFormData] = useState<Partial<AgendamentoRelatorio>>({
    nome: '',
    descricao: '',
    tipo_relatorio: '',
    parametros: {},
    frequencia: 'sob_demanda',
    dia_semana: 1,
    dia_mes: 1,
    horario: '12:00',
    formato_saida: 'pdf',
    destinatarios: [],
    ativo: true
  });
  
  // Estado para destinatários (como string para edição)
  const [destinatariosString, setDestinatariosString] = useState('');
  
  // Estados de UI
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  
  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (isEdicao) {
      carregarAgendamento();
    }
  }, [id]);
  
  const carregarAgendamento = async () => {
    if (!id) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      const agendamento = await agendamentoRelatorioService.obterAgendamentoPorId(id);
      
      // Preencher formulário com dados
      setFormData({
        nome: agendamento.nome,
        descricao: agendamento.descricao || '',
        tipo_relatorio: agendamento.tipo_relatorio,
        parametros: agendamento.parametros || {},
        frequencia: agendamento.frequencia,
        dia_semana: agendamento.dia_semana || 1,
        dia_mes: agendamento.dia_mes || 1,
        horario: agendamento.horario,
        formato_saida: agendamento.formato_saida,
        destinatarios: agendamento.destinatarios || [],
        ativo: agendamento.ativo
      });
      
      // Converter array de destinatários para string
      if (agendamento.destinatarios && agendamento.destinatarios.length > 0) {
        setDestinatariosString(agendamento.destinatarios.join(', '));
      }
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
      setErro('Não foi possível carregar os dados do agendamento. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Handler para mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handler para mudanças nos destinatários
  const handleDestinatariosChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDestinatariosString(e.target.value);
  };
  
  // Validar o formulário antes de enviar
  const validarFormulario = () => {
    if (!formData.nome || !formData.nome.trim()) {
      setErro('O nome do agendamento é obrigatório.');
      return false;
    }
    
    if (!formData.tipo_relatorio) {
      setErro('Selecione um tipo de relatório.');
      return false;
    }
    
    if (!formData.frequencia) {
      setErro('Selecione uma frequência de execução.');
      return false;
    }
    
    if (formData.frequencia === 'semanal' && (formData.dia_semana === undefined || formData.dia_semana < 0 || formData.dia_semana > 6)) {
      setErro('Selecione um dia da semana válido.');
      return false;
    }
    
    if (formData.frequencia === 'mensal' && (formData.dia_mes === undefined || formData.dia_mes < 1 || formData.dia_mes > 31)) {
      setErro('Selecione um dia do mês válido (1-31).');
      return false;
    }
    
    if (!formData.horario || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.horario)) {
      setErro('Informe um horário válido no formato HH:MM.');
      return false;
    }
    
    // Validar e-mails dos destinatários
    if (destinatariosString.trim()) {
      const emails = destinatariosString.split(',').map(email => email.trim());
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          setErro(`O e-mail '${email}' não é válido.`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);
    
    if (!validarFormulario()) {
      return;
    }
    
    // Processar destinatários
    const destinatarios = destinatariosString
      ? destinatariosString.split(',').map(email => email.trim())
      : [];
    
    // Preparar dados para envio
    const dadosEnvio: Partial<AgendamentoRelatorio> = {
      ...formData,
      destinatarios
    };
    
    // Remover campos não aplicáveis conforme a frequência
    if (dadosEnvio.frequencia !== 'semanal') {
      delete dadosEnvio.dia_semana;
    }
    
    if (dadosEnvio.frequencia !== 'mensal') {
      delete dadosEnvio.dia_mes;
    }
    
    setSalvando(true);
    
    try {
      if (isEdicao) {
        await agendamentoRelatorioService.atualizarAgendamento(id, dadosEnvio);
        setMensagemSucesso('Agendamento atualizado com sucesso!');
      } else {
        await agendamentoRelatorioService.criarAgendamento(dadosEnvio);
        setMensagemSucesso('Agendamento criado com sucesso!');
        
        // Limpar formulário após criar
        if (!isEdicao) {
          setFormData({
            nome: '',
            descricao: '',
            tipo_relatorio: '',
            parametros: {},
            frequencia: 'sob_demanda',
            dia_semana: 1,
            dia_mes: 1,
            horario: '12:00',
            formato_saida: 'pdf',
            destinatarios: [],
            ativo: true
          });
          setDestinatariosString('');
        }
      }
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate('/admin/agendamentos-relatorios');
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      setErro('Ocorreu um erro ao salvar o agendamento. Tente novamente mais tarde.');
    } finally {
      setSalvando(false);
    }
  };
  
  if (carregando) {
    return (
      <Container fluid className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Carregando dados do agendamento...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {isEdicao ? 'Editar Agendamento de Relatório' : 'Novo Agendamento de Relatório'}
            </h5>
            <Button 
              variant="light" 
              size="sm" 
              onClick={() => navigate('/admin/agendamentos-relatorios')}
              title="Voltar"
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Voltar
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {erro && (
            <Alert variant="danger" onClose={() => setErro(null)} dismissible>
              {erro}
            </Alert>
          )}
          
          {mensagemSucesso && (
            <Alert variant="success" onClose={() => setMensagemSucesso(null)} dismissible>
              {mensagemSucesso}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Agendamento <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nome"
                    value={formData.nome || ''}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Ex: Relatório Mensal de Usuários"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Relatório <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tipo_relatorio"
                    value={formData.tipo_relatorio || ''}
                    onChange={handleChange}
                    required
                    aria-label="Selecione o tipo de relatório"
                  >
                    <option value="">Selecione um tipo</option>
                    {agendamentoRelatorioService.getTiposRelatorio().map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                name="descricao"
                value={formData.descricao || ''}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                placeholder="Descrição opcional sobre o propósito deste agendamento"
              />
            </Form.Group>
            
            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label>Frequência <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="frequencia"
                  value={formData.frequencia || ''}
                  onChange={handleChange}
                  required
                  aria-label="Selecione a frequência de execução"
                >
                  <option value="sob_demanda">Sob Demanda</option>
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </Form.Select>
              </Form.Group>
              
              {formData.frequencia === 'semanal' && (
                <Form.Group as={Col} md={6}>
                  <Form.Label>Dia da Semana <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="dia_semana"
                    value={formData.dia_semana || 0}
                    onChange={handleChange}
                    required
                    aria-label="Selecione o dia da semana"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                  </Form.Select>
                </Form.Group>
              )}
              
              {formData.frequencia === 'mensal' && (
                <Form.Group as={Col} md={6}>
                  <Form.Label>Dia do Mês <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="dia_mes"
                    value={formData.dia_mes || 1}
                    onChange={handleChange}
                    required
                    aria-label="Selecione o dia do mês"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Row>
            
            <Row className="mb-3">
              {(formData.frequencia === 'diario' || 
                formData.frequencia === 'semanal' || 
                formData.frequencia === 'mensal') && (
                <Form.Group as={Col} md={6}>
                  <Form.Label>Horário de Execução <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="time"
                    name="horario"
                    value={formData.horario || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              )}
              
              <Form.Group as={Col} md={6}>
                <Form.Label>Formato de Saída <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="formato_saida"
                  value={formData.formato_saida || 'pdf'}
                  onChange={handleChange}
                  required
                  aria-label="Selecione o formato de saída"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </Form.Select>
              </Form.Group>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Destinatários (separados por vírgula)</Form.Label>
              <Form.Control
                as="textarea"
                value={destinatariosString}
                onChange={handleDestinatariosChange}
                rows={2}
                placeholder="Ex: email1@exemplo.com.br, email2@exemplo.com.br"
              />
              <Form.Text className="text-muted">
                Deixe em branco se não desejar enviar o relatório por e-mail.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                id="ativo"
                name="ativo"
                label="Agendamento ativo"
                checked={formData.ativo || false}
                onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
              />
            </Form.Group>
            
            <div className="d-flex gap-2 justify-content-end">
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/agendamentos-relatorios')}
                disabled={salvando}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </Button>
              
              <Button 
                variant="primary" 
                type="submit" 
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} /> Salvar
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AgendamentoRelatorioForm; 