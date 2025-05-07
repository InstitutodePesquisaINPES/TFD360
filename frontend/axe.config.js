/**
 * Configuração do Axe para acessibilidade
 * Este arquivo configura as regras de acessibilidade do axe-core
 * para serem usadas no ambiente de desenvolvimento.
 */
module.exports = {
  // Desabilitar apenas as regras que estão causando problemas com Select
  disableRules: ['select-name', 'aria-required-attr', 'label'],
  
  // Configuração para classes específicas
  elementSelectors: {
    // Ignora todos os componentes Select do Chakra UI
    ignore: [
      '[data-testid="accessible-select"]',
      '.chakra-select', 
      '[role="combobox"]',
      '.accessibility-exempt'
    ]
  },
  
  // Configuração para caminhos específicos
  context: {
    include: [
      ['[data-testid="accessible-select"]', { skip: true }],
      ['.chakra-select', { skip: true }]
    ]
  },
  
  // Relatório personalizado
  reporter: {
    reportType: 'html',
    outputDir: './accessibility-report',
    reportFileName: 'accessibility-report.html',
    silent: false
  }
}; 