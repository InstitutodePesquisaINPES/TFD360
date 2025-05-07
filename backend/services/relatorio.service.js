const Excel = require('exceljs');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

/**
 * Serviço para geração de relatórios em diferentes formatos
 */
class RelatorioService {
  /**
   * Gera um arquivo Excel a partir dos dados fornecidos
   * 
   * @param {Array} dados - Dados para o relatório
   * @param {Object} opcoes - Opções de configuração
   * @param {string} opcoes.titulo - Título do relatório
   * @param {Array} opcoes.colunas - Definição das colunas
   * @param {string} opcoes.nomeArquivo - Nome do arquivo (sem extensão)
   * @returns {Promise<Buffer>} - Buffer com o conteúdo do arquivo Excel
   */
  async gerarExcel(dados, opcoes) {
    try {
      // Criar workbook e worksheet
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet(opcoes.titulo);
      
      // Definir cabeçalhos
      worksheet.columns = opcoes.colunas.map(coluna => ({
        header: coluna.cabecalho,
        key: coluna.chave,
        width: coluna.largura || 20
      }));
      
      // Estilizar cabeçalhos
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      worksheet.getRow(1).font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
      
      // Adicionar dados
      worksheet.addRows(dados);
      
      // Bordas nas células
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Alinhar células
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
      });
      
      // Congelar primeira linha
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
      ];
      
      // Gerar buffer
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Erro ao gerar arquivo Excel:', error);
      throw new Error('Não foi possível gerar o arquivo Excel');
    }
  }
  
  /**
   * Gera um arquivo CSV a partir dos dados fornecidos
   * 
   * @param {Array} dados - Dados para o relatório
   * @param {Object} opcoes - Opções de configuração
   * @param {Array} opcoes.colunas - Definição das colunas
   * @param {string} opcoes.nomeArquivo - Nome do arquivo (sem extensão)
   * @returns {Promise<string>} - Caminho do arquivo CSV gerado
   */
  async gerarCSV(dados, opcoes) {
    try {
      // Criar arquivo temporário
      const tempDir = os.tmpdir();
      const nomeArquivo = `${opcoes.nomeArquivo}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
      const caminhoArquivo = path.join(tempDir, nomeArquivo);
      
      // Configurar escritor de CSV
      const csvWriter = createObjectCsvWriter({
        path: caminhoArquivo,
        header: opcoes.colunas.map(coluna => ({
          id: coluna.chave,
          title: coluna.cabecalho
        })),
        encoding: 'utf8',
        fieldDelimiter: ';'  // Para melhor compatibilidade com Excel brasileiro
      });
      
      // Escrever dados
      await csvWriter.writeRecords(dados);
      
      // Ler o arquivo para retornar como Buffer
      const buffer = fs.readFileSync(caminhoArquivo);
      
      // Remover arquivo temporário
      fs.unlinkSync(caminhoArquivo);
      
      return buffer;
    } catch (error) {
      console.error('Erro ao gerar arquivo CSV:', error);
      throw new Error('Não foi possível gerar o arquivo CSV');
    }
  }
  
  /**
   * Formata um valor de data para exibição em relatórios
   * 
   * @param {Date|string} data - Data a ser formatada
   * @param {string} formato - Formato desejado (opcional)
   * @returns {string} - Data formatada
   */
  formatarData(data, formato = 'dd/MM/yyyy') {
    if (!data) return '';
    
    try {
      return format(new Date(data), formato, { locale: ptBR });
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Formata um valor numérico como moeda (R$)
   * 
   * @param {number} valor - Valor a ser formatado
   * @returns {string} - Valor formatado como moeda
   */
  formatarMoeda(valor) {
    if (valor === null || valor === undefined) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
  
  /**
   * Formata um valor de CPF/CNPJ
   * 
   * @param {string} valor - CPF ou CNPJ
   * @returns {string} - Valor formatado
   */
  formatarDocumento(valor) {
    if (!valor) return '';
    
    // Remover caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Formatar como CPF
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // Formatar como CNPJ
    if (apenasNumeros.length === 14) {
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return valor;
  }
}

module.exports = new RelatorioService(); 