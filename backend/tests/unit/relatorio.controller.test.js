const relatorioController = require('../../controllers/relatorio.controller');
const Prefeitura = require('../../models/prefeitura.model');
const User = require('../../models/user.model');
const LogAcesso = require('../../models/logAcesso.model');
const SolicitacaoTFD = require('../../models/solicitacao-tfd.model');

// Mock dos modelos
jest.mock('../../models/prefeitura.model');
jest.mock('../../models/user.model');
jest.mock('../../models/logAcesso.model');
jest.mock('../../models/solicitacao-tfd.model');

// Mock do PDFDocument
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pipe: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });
});

describe('Controlador de Relatórios', () => {
  
  // Mock de requisição e resposta
  let req;
  let res;
  
  beforeEach(() => {
    // Configuração comum para cada teste
    req = {
      query: {},
      userId: 'usuario-teste-id',
      userTipo: 'Super Admin',
      userPermissions: ['gerar_relatorio_usuarios', 'gerar_relatorio_prefeituras', 'gerar_relatorio_logs', 'gerar_relatorio_solicitacoes_tfd'],
      userPrefeituraId: 'prefeitura-teste-id'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    // Resetar mocks dos modelos
    User.find.mockReset();
    User.findById.mockReset();
    Prefeitura.find.mockReset();
    Prefeitura.findById.mockReset();
    LogAcesso.find.mockReset();
    SolicitacaoTFD.find.mockReset();
    SolicitacaoTFD.findById.mockReset();
  });

  describe('gerarRelatorioUsuarios', () => {
    it('deve retornar status 403 quando o usuário não tem permissão', async () => {
      // Configurar
      req.userPermissions = [];
      
      // Executar
      await relatorioController.gerarRelatorioUsuarios(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('não tem permissão')
      }));
    });

    it('deve gerar relatório de usuários para Super Admin', async () => {
      // Configurar
      const usuariosMock = [
        { 
          _id: 'usuario1', 
          nome: 'Usuário Teste 1', 
          email: 'usuario1@teste.com', 
          tipo_perfil: 'Admin Prefeitura',
          prefeitura: { nome: 'Prefeitura Teste' }
        }
      ];
      
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(usuariosMock)
          })
        })
      });
      
      Prefeitura.findById.mockResolvedValue({ nome: 'Prefeitura Teste' });
      
      // Executar
      await relatorioController.gerarRelatorioUsuarios(req, res);
      
      // Verificar
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('relatorio_usuarios'));
    });
  });

  describe('gerarRelatorioPrefeituras', () => {
    it('deve retornar status 403 quando o usuário não tem permissão', async () => {
      // Configurar
      req.userPermissions = [];
      
      // Executar
      await relatorioController.gerarRelatorioPrefeituras(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('não tem permissão')
      }));
    });

    it('deve retornar status 403 quando o usuário não é Super Admin', async () => {
      // Configurar
      req.userTipo = 'Admin Prefeitura';
      
      // Executar
      await relatorioController.gerarRelatorioPrefeituras(req, res);
      
      // Verificar
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Apenas Super Admin')
      }));
    });

    it('deve gerar relatório de prefeituras para Super Admin', async () => {
      // Configurar
      const prefeiturasMock = [
        { 
          _id: 'prefeitura1', 
          nome: 'Prefeitura Teste 1', 
          status: 'ativa',
          data_validade_contrato: new Date('2030-12-31')
        }
      ];
      
      Prefeitura.find.mockResolvedValue(prefeiturasMock);
      
      // Executar
      await relatorioController.gerarRelatorioPrefeituras(req, res);
      
      // Verificar
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('relatorio_prefeituras'));
    });
  });

  // Testes adicionais para outros métodos de relatório
  // ...
}); 