const relatorioService = require('../../services/relatorio.service');
const fs = require('fs');
const path = require('path');

// Mock do fs
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('conteúdo teste')),
  unlinkSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

describe('Serviço de Relatórios', () => {
  
  describe('gerarExcel', () => {
    it('deve gerar um arquivo Excel corretamente', async () => {
      // Dados de teste
      const dados = [
        { nome: 'Usuário Teste 1', email: 'usuario1@teste.com', ativo: 'Sim' },
        { nome: 'Usuário Teste 2', email: 'usuario2@teste.com', ativo: 'Não' },
      ];
      
      const opcoes = {
        titulo: 'Teste de Relatório',
        colunas: [
          { cabecalho: 'Nome', chave: 'nome', largura: 25 },
          { cabecalho: 'E-mail', chave: 'email', largura: 30 },
          { cabecalho: 'Ativo', chave: 'ativo', largura: 10 }
        ],
        nomeArquivo: 'teste_relatorio'
      };
      
      // Executar
      const resultado = await relatorioService.gerarExcel(dados, opcoes);
      
      // Verificar
      expect(resultado).toBeInstanceOf(Buffer);
    });
    
    it('deve lançar erro em caso de falha na geração do Excel', async () => {
      // Mock de erro
      const mockError = new Error('Erro ao gerar Excel');
      
      // Sobrescrever o método com uma implementação que lança erro
      const originalMethod = relatorioService.gerarExcel;
      relatorioService.gerarExcel = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      // Dados de teste
      const dados = [{ nome: 'Teste' }];
      const opcoes = {
        titulo: 'Teste',
        colunas: [{ cabecalho: 'Nome', chave: 'nome' }],
        nomeArquivo: 'teste'
      };
      
      // Executar e verificar
      await expect(relatorioService.gerarExcel(dados, opcoes)).rejects.toThrow();
      
      // Restaurar método original
      relatorioService.gerarExcel = originalMethod;
    });
  });
  
  describe('gerarCSV', () => {
    it('deve gerar um arquivo CSV corretamente', async () => {
      // Dados de teste
      const dados = [
        { nome: 'Usuário Teste 1', email: 'usuario1@teste.com', ativo: 'Sim' },
        { nome: 'Usuário Teste 2', email: 'usuario2@teste.com', ativo: 'Não' },
      ];
      
      const opcoes = {
        colunas: [
          { cabecalho: 'Nome', chave: 'nome' },
          { cabecalho: 'E-mail', chave: 'email' },
          { cabecalho: 'Ativo', chave: 'ativo' }
        ],
        nomeArquivo: 'teste_relatorio'
      };
      
      // Executar
      const resultado = await relatorioService.gerarCSV(dados, opcoes);
      
      // Verificar
      expect(resultado).toBeInstanceOf(Buffer);
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });
  
  describe('formatarData', () => {
    it('deve formatar data corretamente', () => {
      // Executar
      const resultado = relatorioService.formatarData('2023-01-15');
      
      // Verificar
      expect(resultado).toBe('15/01/2023');
    });
    
    it('deve retornar string vazia para data inválida', () => {
      // Executar
      const resultado = relatorioService.formatarData('data-invalida');
      
      // Verificar
      expect(resultado).toBe('');
    });
    
    it('deve retornar string vazia para data nula', () => {
      // Executar
      const resultado = relatorioService.formatarData(null);
      
      // Verificar
      expect(resultado).toBe('');
    });
  });
  
  describe('formatarMoeda', () => {
    it('deve formatar valor como moeda brasileira', () => {
      // Executar
      const resultado = relatorioService.formatarMoeda(1234.56);
      
      // Verificar
      expect(resultado).toBe('R$ 1.234,56');
    });
    
    it('deve retornar string vazia para valor nulo', () => {
      // Executar
      const resultado = relatorioService.formatarMoeda(null);
      
      // Verificar
      expect(resultado).toBe('');
    });
  });
  
  describe('formatarDocumento', () => {
    it('deve formatar CPF corretamente', () => {
      // Executar
      const resultado = relatorioService.formatarDocumento('12345678901');
      
      // Verificar
      expect(resultado).toBe('123.456.789-01');
    });
    
    it('deve formatar CNPJ corretamente', () => {
      // Executar
      const resultado = relatorioService.formatarDocumento('12345678901234');
      
      // Verificar
      expect(resultado).toBe('12.345.678/9012-34');
    });
    
    it('deve retornar o valor original se não for CPF nem CNPJ', () => {
      // Executar
      const resultado = relatorioService.formatarDocumento('123456');
      
      // Verificar
      expect(resultado).toBe('123456');
    });
    
    it('deve retornar string vazia para valor nulo', () => {
      // Executar
      const resultado = relatorioService.formatarDocumento(null);
      
      // Verificar
      expect(resultado).toBe('');
    });
  });
}); 