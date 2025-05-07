const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');
const User = require('../../models/user.model');
const Prefeitura = require('../../models/prefeitura.model');

// Mock dos modelos
jest.mock('../../models/user.model');
jest.mock('../../models/prefeitura.model');
jest.mock('../../models/logAcesso.model');
jest.mock('../../models/solicitacao-tfd.model');

// Mock do middleware de autenticação
jest.mock('../../middlewares/auth.middleware', () => {
  return {
    verificarToken: (req, res, next) => {
      // Adiciona informações de teste ao req
      req.userId = 'usuario-teste-id';
      req.userEmail = 'teste@example.com';
      req.userTipo = 'Super Admin';
      req.userPermissions = [
        'gerar_relatorio_usuarios',
        'gerar_relatorio_prefeituras',
        'gerar_relatorio_logs',
        'gerar_relatorio_solicitacoes_tfd'
      ];
      req.userPrefeituraId = 'prefeitura-teste-id';
      next();
    },
    verificarPermissao: (permissao) => {
      return (req, res, next) => {
        // Verifica se o usuário tem a permissão necessária
        if (req.userPermissions && req.userPermissions.includes(permissao)) {
          next();
        } else {
          res.status(403).json({ message: 'Acesso negado: permissão insuficiente' });
        }
      };
    }
  };
});

describe('Rotas de Relatórios', () => {
  let token;
  
  beforeEach(() => {
    // Criar um token de teste
    token = jwt.sign(
      { 
        id: 'usuario-teste-id',
        email: 'teste@example.com',
        tipo_perfil: 'Super Admin'
      }, 
      'secret-key',
      { expiresIn: '1h' }
    );

    // Mock das consultas ao banco de dados
    User.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([])
        })
      })
    });
    
    Prefeitura.find.mockResolvedValue([]);
    Prefeitura.findById.mockResolvedValue({ nome: 'Prefeitura Teste' });
  });

  describe('GET /api/relatorios/usuarios', () => {
    it('deve responder com status 200 e tipo de conteúdo PDF', async () => {
      const response = await request(app)
        .get('/api/relatorios/usuarios')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/relatorios/prefeituras', () => {
    it('deve responder com status 200 e tipo de conteúdo PDF', async () => {
      const response = await request(app)
        .get('/api/relatorios/prefeituras')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/relatorios/acessos', () => {
    it('deve responder com status 200 e tipo de conteúdo PDF', async () => {
      const response = await request(app)
        .get('/api/relatorios/acessos')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/relatorios/solicitacoes-tfd', () => {
    it('deve responder com status 200 e tipo de conteúdo PDF', async () => {
      const response = await request(app)
        .get('/api/relatorios/solicitacoes-tfd')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/relatorios/paciente-solicitacoes', () => {
    it('deve responder com status 200 e tipo de conteúdo PDF quando pacienteId é fornecido', async () => {
      const response = await request(app)
        .get('/api/relatorios/paciente-solicitacoes?pacienteId=paciente-teste-id')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('deve responder com status 400 quando pacienteId não é fornecido', async () => {
      const response = await request(app)
        .get('/api/relatorios/paciente-solicitacoes')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', expect.stringContaining('ID do paciente'));
    });
  });
}); 