const { expect } = require('chai');
const sinon = require('sinon');
const documentoController = require('../../controllers/documento.controller');
const documentoService = require('../../services/documento.service');
const { mockReq, mockRes } = require('../helpers/express-mock');

describe('Documento Controller', () => {
  let req, res, sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = mockReq();
    res = mockRes();
    
    // Configuração padrão para autenticação
    req.usuario = {
      id: '60d21b4667d0d8992e610c85',
      prefeitura: '60d21b4667d0d8992e610c80',
      perfil: 'gestor'
    };
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('listarDocumentos', () => {
    it('deve listar documentos com filtros da prefeitura do usuário', async () => {
      // Preparação
      const resultadoEsperado = {
        docs: [
          { _id: '60d21b4667d0d8992e610c90', nome_arquivo: 'documento1.pdf' },
          { _id: '60d21b4667d0d8992e610c91', nome_arquivo: 'documento2.pdf' }
        ],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        limit: 10
      };
      
      req.query = {
        page: '1',
        limit: '10',
        ref_id: '60d21b4667d0d8992e610c95',
        tipo_ref: 'paciente'
      };
      
      sandbox.stub(documentoService, 'listarDocumentos').resolves(resultadoEsperado);
      
      // Execução
      await documentoController.listarDocumentos(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(resultadoEsperado)).to.be.true;
      
      const chamadaServico = documentoService.listarDocumentos.getCall(0);
      expect(chamadaServico.args[0]).to.include({
        prefeitura_id: req.usuario.prefeitura,
        ref_id: req.query.ref_id,
        tipo_ref: req.query.tipo_ref
      });
    });
    
    it('deve tratar erros corretamente', async () => {
      // Preparação
      const erro = new Error('Erro ao listar documentos');
      sandbox.stub(documentoService, 'listarDocumentos').rejects(erro);
      
      // Execução
      await documentoController.listarDocumentos(req, res);
      
      // Verificação
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith(sinon.match({ erro: 'Erro ao listar documentos' }))).to.be.true;
    });
  });
  
  describe('obterDocumentoPorId', () => {
    it('deve obter documento pelo ID', async () => {
      // Preparação
      const documentoEsperado = {
        _id: '60d21b4667d0d8992e610c90',
        nome_arquivo: 'documento1.pdf',
        tipo_documento: 'cpf',
        status: 'ativo'
      };
      
      req.params = { id: documentoEsperado._id };
      
      sandbox.stub(documentoService, 'obterDocumentoPorId').resolves(documentoEsperado);
      
      // Execução
      await documentoController.obterDocumentoPorId(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(documentoEsperado)).to.be.true;
      expect(documentoService.obterDocumentoPorId.calledWith(
        req.params.id,
        req.usuario.prefeitura
      )).to.be.true;
    });
    
    it('deve retornar erro para ID inválido', async () => {
      // Preparação
      req.params = { id: 'id_invalido' };
      
      // Execução
      await documentoController.obterDocumentoPorId(req, res);
      
      // Verificação
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match({ erro: 'ID de documento inválido' }))).to.be.true;
    });
  });
  
  describe('criarDocumento', () => {
    it('deve criar um novo documento', async () => {
      // Preparação
      const novoDocumento = {
        _id: '60d21b4667d0d8992e610c90',
        nome_arquivo: 'documento1.pdf',
        tipo_documento: 'cpf',
        ref_id: '60d21b4667d0d8992e610c95',
        tipo_ref: 'paciente',
        status: 'pendente_validacao'
      };
      
      req.file = {
        originalname: 'documento1.pdf',
        buffer: Buffer.from('conteúdo do arquivo'),
        mimetype: 'application/pdf',
        size: 12345
      };
      
      req.body = {
        ref_id: '60d21b4667d0d8992e610c95',
        tipo_ref: 'paciente',
        tipo_documento: 'cpf'
      };
      
      sandbox.stub(documentoService, 'criarDocumento').resolves(novoDocumento);
      
      // Execução
      await documentoController.criarDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        mensagem: 'Documento enviado com sucesso',
        documento: novoDocumento
      }))).to.be.true;
      
      expect(documentoService.criarDocumento.calledWith(
        sinon.match(req.body),
        req.file,
        req.usuario.id
      )).to.be.true;
    });
    
    it('deve retornar erro quando não há arquivo', async () => {
      // Preparação
      req.file = null;
      
      // Execução
      await documentoController.criarDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match({ erro: 'Nenhum arquivo enviado' }))).to.be.true;
    });
  });
  
  describe('aprovarDocumento', () => {
    it('deve aprovar um documento', async () => {
      // Preparação
      const documentoAprovado = {
        _id: '60d21b4667d0d8992e610c90',
        nome_arquivo: 'documento1.pdf',
        status: 'ativo'
      };
      
      req.params = { id: documentoAprovado._id };
      
      sandbox.stub(documentoService, 'aprovarDocumento').resolves(documentoAprovado);
      
      // Execução
      await documentoController.aprovarDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        mensagem: 'Documento aprovado com sucesso',
        documento: documentoAprovado
      }))).to.be.true;
      
      expect(documentoService.aprovarDocumento.calledWith(
        req.params.id,
        req.usuario.id,
        req.usuario.prefeitura
      )).to.be.true;
    });
  });
  
  describe('rejeitarDocumento', () => {
    it('deve rejeitar um documento com motivo', async () => {
      // Preparação
      const documentoRejeitado = {
        _id: '60d21b4667d0d8992e610c90',
        nome_arquivo: 'documento1.pdf',
        status: 'rejeitado',
        motivo_rejeicao: 'Documento ilegível'
      };
      
      req.params = { id: documentoRejeitado._id };
      req.body = { motivo: 'Documento ilegível' };
      
      sandbox.stub(documentoService, 'rejeitarDocumento').resolves(documentoRejeitado);
      
      // Execução
      await documentoController.rejeitarDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        mensagem: 'Documento rejeitado com sucesso',
        documento: documentoRejeitado
      }))).to.be.true;
      
      expect(documentoService.rejeitarDocumento.calledWith(
        req.params.id,
        req.body.motivo,
        req.usuario.id,
        req.usuario.prefeitura
      )).to.be.true;
    });
    
    it('deve retornar erro quando não há motivo', async () => {
      // Preparação
      req.params = { id: '60d21b4667d0d8992e610c90' };
      req.body = {}; // Sem motivo
      
      // Execução
      await documentoController.rejeitarDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match({ erro: 'Motivo da rejeição é obrigatório' }))).to.be.true;
    });
  });
  
  describe('removerDocumento', () => {
    it('deve remover um documento', async () => {
      // Preparação
      req.params = { id: '60d21b4667d0d8992e610c90' };
      
      sandbox.stub(documentoService, 'removerDocumento').resolves(true);
      
      // Execução
      await documentoController.removerDocumento(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        mensagem: 'Documento removido com sucesso'
      }))).to.be.true;
      
      expect(documentoService.removerDocumento.calledWith(
        req.params.id,
        req.usuario.prefeitura
      )).to.be.true;
    });
  });
  
  describe('listarDocumentosPorReferencia', () => {
    it('deve listar documentos por referência (paciente)', async () => {
      // Preparação
      const documentos = [
        { _id: '60d21b4667d0d8992e610c90', nome_arquivo: 'documento1.pdf' },
        { _id: '60d21b4667d0d8992e610c91', nome_arquivo: 'documento2.pdf' }
      ];
      
      req.params = {
        ref_id: '60d21b4667d0d8992e610c95',
        tipo_ref: 'paciente'
      };
      
      sandbox.stub(documentoService, 'listarDocumentosPorReferencia').resolves(documentos);
      
      // Execução
      await documentoController.listarDocumentosPorReferencia(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(documentos)).to.be.true;
      
      expect(documentoService.listarDocumentosPorReferencia.calledWith(
        req.params.ref_id,
        req.params.tipo_ref,
        req.usuario.prefeitura
      )).to.be.true;
    });
    
    it('deve retornar erro para tipo de referência inválido', async () => {
      // Preparação
      req.params = {
        ref_id: '60d21b4667d0d8992e610c95',
        tipo_ref: 'tipo_invalido'
      };
      
      // Execução
      await documentoController.listarDocumentosPorReferencia(req, res);
      
      // Verificação
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        erro: 'Tipo de referência inválido, deve ser paciente ou acompanhante'
      }))).to.be.true;
    });
  });
  
  describe('listarDocumentosAVencer', () => {
    it('deve listar documentos a vencer nos próximos dias', async () => {
      // Preparação
      const documentos = [
        { _id: '60d21b4667d0d8992e610c90', nome_arquivo: 'documento1.pdf', data_vencimento: new Date(Date.now() + 1000*60*60*24*10) },
        { _id: '60d21b4667d0d8992e610c91', nome_arquivo: 'documento2.pdf', data_vencimento: new Date(Date.now() + 1000*60*60*24*20) }
      ];
      
      req.query = { dias: '30' };
      
      sandbox.stub(documentoService, 'listarDocumentosAVencer').resolves(documentos);
      
      // Execução
      await documentoController.listarDocumentosAVencer(req, res);
      
      // Verificação
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(documentos)).to.be.true;
      
      expect(documentoService.listarDocumentosAVencer.calledWith(
        req.usuario.prefeitura,
        30
      )).to.be.true;
    });
  });
}); 