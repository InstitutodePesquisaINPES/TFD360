const agendamentoRelatorioController = require('../../controllers/agendamento-relatorio.controller');
const agendamentoRelatorioService = require('../../services/agendamento-relatorio.service');
const { validarObjetoId } = require('../../utils/validacao.utils');
const { tratarErro } = require('../../utils/error.utils');

// Mock dos serviços
jest.mock('../../services/agendamento-relatorio.service');
jest.mock('../../utils/validacao.utils');
jest.mock('../../utils/error.utils');

describe('Controlador de Agendamento de Relatórios', () => {
  
  // Mock de requisição e resposta
  let req;
  let res;
  
  beforeEach(() => {
    // Configuração comum para cada teste
    req = {
      query: {},
      params: {},
      body: {},
      usuario: {
        id: 'usuario-teste-id',
        tipo: 'Super Admin',
        permissions: ['gerenciar_agendamentos_relatorios']
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Resetar mocks
    agendamentoRelatorioService.listarAgendamentos.mockReset();
    agendamentoRelatorioService.obterAgendamentoPorId.mockReset();
    agendamentoRelatorioService.criarAgendamento.mockReset();
    agendamentoRelatorioService.atualizarAgendamento.mockReset();
    agendamentoRelatorioService.alterarStatus.mockReset();
    agendamentoRelatorioService.removerAgendamento.mockReset();
    agendamentoRelatorioService.executarAgendamento.mockReset();
    agendamentoRelatorioService.processarAgendamentosPendentes.mockReset();
    validarObjetoId.mockReset();
    tratarErro.mockReset();

    // Configuração padrão para validarObjetoId
    validarObjetoId.mockReturnValue(true);
  });

  describe('listar', () => {
    it('deve listar todos os agendamentos com parâmetros padrão', async () => {
      // Configurar mock
      const resultadoEsperado = {
        agendamentos: [
          { _id: 'agendamento1', nome: 'Agendamento 1', tipo_relatorio: 'usuarios' }
        ],
        total: 1,
        pagina: 1,
        limite: 10,
        paginas: 1
      };
      
      agendamentoRelatorioService.listarAgendamentos.mockResolvedValue(resultadoEsperado);
      
      // Executar
      await agendamentoRelatorioController.listar(req, res);
      
      // Verificar
      expect(agendamentoRelatorioService.listarAgendamentos).toHaveBeenCalledWith(
        { tipo_relatorio: undefined, ativo: undefined, usuario_id: undefined },
        { pagina: 1, limite: 10 }
      );
      expect(res.json).toHaveBeenCalledWith(resultadoEsperado);
    });

    it('deve listar agendamentos com filtros e paginação específicos', async () => {
      // Configurar
      req.query = { 
        tipo: 'usuarios', 
        ativo: 'true', 
        usuario_id: 'usuario123',
        page: '2',
        limit: '20'
      };
      
      const resultadoEsperado = {
        agendamentos: [
          { _id: 'agendamento1', nome: 'Agendamento 1', tipo_relatorio: 'usuarios' }
        ],
        total: 21,
        pagina: 2,
        limite: 20,
        paginas: 2
      };
      
      agendamentoRelatorioService.listarAgendamentos.mockResolvedValue(resultadoEsperado);
      
      // Executar
      await agendamentoRelatorioController.listar(req, res);
      
      // Verificar
      expect(agendamentoRelatorioService.listarAgendamentos).toHaveBeenCalledWith(
        { tipo_relatorio: 'usuarios', ativo: true, usuario_id: 'usuario123' },
        { pagina: 2, limite: 20 }
      );
      expect(res.json).toHaveBeenCalledWith(resultadoEsperado);
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      const erro = new Error('Erro ao listar agendamentos');
      agendamentoRelatorioService.listarAgendamentos.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.listar(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('obterPorId', () => {
    it('deve retornar um agendamento válido pelo ID', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      
      const agendamento = { 
        _id: 'agendamento123', 
        nome: 'Agendamento Teste', 
        tipo_relatorio: 'usuarios' 
      };
      
      agendamentoRelatorioService.obterAgendamentoPorId.mockResolvedValue(agendamento);
      
      // Executar
      await agendamentoRelatorioController.obterPorId(req, res);
      
      // Verificar
      expect(validarObjetoId).toHaveBeenCalledWith('agendamento123');
      expect(agendamentoRelatorioService.obterAgendamentoPorId).toHaveBeenCalledWith('agendamento123');
      expect(res.json).toHaveBeenCalledWith(agendamento);
    });

    it('deve retornar status 400 para ID inválido', async () => {
      // Configurar
      req.params = { id: 'id-invalido' };
      validarObjetoId.mockReturnValue(false);
      
      // Executar
      await agendamentoRelatorioController.obterPorId(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'ID de agendamento inválido' });
      expect(agendamentoRelatorioService.obterAgendamentoPorId).not.toHaveBeenCalled();
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      const erro = new Error('Agendamento não encontrado');
      agendamentoRelatorioService.obterAgendamentoPorId.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.obterPorId(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('criar', () => {
    it('deve criar um novo agendamento de relatório', async () => {
      // Configurar
      req.body = {
        nome: 'Relatório Mensal de Usuários',
        tipo_relatorio: 'usuarios',
        frequencia: 'mensal',
        filtros: { status: 'ativo' },
        destinatarios: ['email@teste.com']
      };
      
      const novoAgendamento = {
        _id: 'agendamento123',
        ...req.body,
        usuario_id: 'usuario-teste-id',
        proximo_agendamento: new Date(),
        ativo: true
      };
      
      agendamentoRelatorioService.criarAgendamento.mockResolvedValue(novoAgendamento);
      
      // Executar
      await agendamentoRelatorioController.criar(req, res);
      
      // Verificar
      expect(agendamentoRelatorioService.criarAgendamento).toHaveBeenCalledWith(
        req.body,
        'usuario-teste-id'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Agendamento de relatório criado com sucesso',
        agendamento: novoAgendamento
      });
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      req.body = {
        nome: 'Relatório Inválido',
        tipo_relatorio: 'tipo_inexistente'
      };
      
      const erro = new Error('Tipo de relatório inválido');
      agendamentoRelatorioService.criarAgendamento.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.criar(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um agendamento existente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      req.body = {
        nome: 'Relatório Atualizado',
        destinatarios: ['novoemail@teste.com']
      };
      
      const agendamentoAtualizado = {
        _id: 'agendamento123',
        nome: 'Relatório Atualizado',
        tipo_relatorio: 'usuarios',
        frequencia: 'mensal',
        destinatarios: ['novoemail@teste.com']
      };
      
      agendamentoRelatorioService.atualizarAgendamento.mockResolvedValue(agendamentoAtualizado);
      
      // Executar
      await agendamentoRelatorioController.atualizar(req, res);
      
      // Verificar
      expect(validarObjetoId).toHaveBeenCalledWith('agendamento123');
      expect(agendamentoRelatorioService.atualizarAgendamento).toHaveBeenCalledWith(
        'agendamento123',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Agendamento de relatório atualizado com sucesso',
        agendamento: agendamentoAtualizado
      });
    });

    it('deve retornar status 400 para ID inválido', async () => {
      // Configurar
      req.params = { id: 'id-invalido' };
      validarObjetoId.mockReturnValue(false);
      
      // Executar
      await agendamentoRelatorioController.atualizar(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'ID de agendamento inválido' });
      expect(agendamentoRelatorioService.atualizarAgendamento).not.toHaveBeenCalled();
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      req.body = { nome: 'Relatório Atualizado' };
      
      const erro = new Error('Agendamento não encontrado');
      agendamentoRelatorioService.atualizarAgendamento.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.atualizar(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('alterarStatus', () => {
    it('deve ativar um agendamento', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      req.body = { ativo: true };
      
      const agendamentoAtualizado = {
        _id: 'agendamento123',
        nome: 'Relatório Teste',
        ativo: true
      };
      
      agendamentoRelatorioService.alterarStatus.mockResolvedValue(agendamentoAtualizado);
      
      // Executar
      await agendamentoRelatorioController.alterarStatus(req, res);
      
      // Verificar
      expect(validarObjetoId).toHaveBeenCalledWith('agendamento123');
      expect(agendamentoRelatorioService.alterarStatus).toHaveBeenCalledWith(
        'agendamento123',
        true
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Agendamento de relatório ativado com sucesso',
        agendamento: agendamentoAtualizado
      });
    });

    it('deve desativar um agendamento', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      req.body = { ativo: false };
      
      const agendamentoAtualizado = {
        _id: 'agendamento123',
        nome: 'Relatório Teste',
        ativo: false
      };
      
      agendamentoRelatorioService.alterarStatus.mockResolvedValue(agendamentoAtualizado);
      
      // Executar
      await agendamentoRelatorioController.alterarStatus(req, res);
      
      // Verificar
      expect(agendamentoRelatorioService.alterarStatus).toHaveBeenCalledWith(
        'agendamento123',
        false
      );
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Agendamento de relatório desativado com sucesso',
        agendamento: agendamentoAtualizado
      });
    });

    it('deve retornar status 400 quando o campo ativo está ausente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      req.body = {}; // Sem o campo ativo
      
      // Executar
      await agendamentoRelatorioController.alterarStatus(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ mensagem: 'O campo "ativo" é obrigatório' });
      expect(agendamentoRelatorioService.alterarStatus).not.toHaveBeenCalled();
    });
  });

  describe('remover', () => {
    it('deve remover um agendamento pelo ID', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      
      agendamentoRelatorioService.removerAgendamento.mockResolvedValue({ deletedCount: 1 });
      
      // Executar
      await agendamentoRelatorioController.remover(req, res);
      
      // Verificar
      expect(validarObjetoId).toHaveBeenCalledWith('agendamento123');
      expect(agendamentoRelatorioService.removerAgendamento).toHaveBeenCalledWith('agendamento123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Agendamento de relatório removido com sucesso'
      });
    });

    it('deve retornar status 400 para ID inválido', async () => {
      // Configurar
      req.params = { id: 'id-invalido' };
      validarObjetoId.mockReturnValue(false);
      
      // Executar
      await agendamentoRelatorioController.remover(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(400);
      expect(agendamentoRelatorioService.removerAgendamento).not.toHaveBeenCalled();
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      
      const erro = new Error('Erro ao remover agendamento');
      agendamentoRelatorioService.removerAgendamento.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.remover(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('executar', () => {
    it('deve executar um agendamento manualmente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      
      const resultado = {
        success: true,
        relatorio_id: 'relatorio456',
        emails_enviados: ['email@teste.com']
      };
      
      agendamentoRelatorioService.executarAgendamento.mockResolvedValue(resultado);
      
      // Executar
      await agendamentoRelatorioController.executar(req, res);
      
      // Verificar
      expect(validarObjetoId).toHaveBeenCalledWith('agendamento123');
      expect(agendamentoRelatorioService.executarAgendamento).toHaveBeenCalledWith('agendamento123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Relatório gerado e enviado com sucesso',
        resultado
      });
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      req.params = { id: 'agendamento123' };
      
      const erro = new Error('Erro ao executar agendamento');
      agendamentoRelatorioService.executarAgendamento.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.executar(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });

  describe('processarPendentes', () => {
    it('deve processar todos os agendamentos pendentes', async () => {
      // Configurar
      const resultados = [
        { 
          agendamento_id: 'agendamento1',
          success: true,
          relatorio_id: 'relatorio1'
        },
        { 
          agendamento_id: 'agendamento2',
          success: true,
          relatorio_id: 'relatorio2'
        }
      ];
      
      agendamentoRelatorioService.processarAgendamentosPendentes.mockResolvedValue(resultados);
      
      // Executar
      await agendamentoRelatorioController.processarPendentes(req, res);
      
      // Verificar
      expect(agendamentoRelatorioService.processarAgendamentosPendentes).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Processados 2 agendamentos pendentes',
        resultados
      });
    });

    it('deve tratar erros adequadamente', async () => {
      // Configurar
      const erro = new Error('Erro ao processar agendamentos pendentes');
      agendamentoRelatorioService.processarAgendamentosPendentes.mockRejectedValue(erro);
      
      // Executar
      await agendamentoRelatorioController.processarPendentes(req, res);
      
      // Verificar
      expect(tratarErro).toHaveBeenCalledWith(res, erro);
    });
  });
}); 