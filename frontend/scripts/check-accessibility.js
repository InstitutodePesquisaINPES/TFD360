/**
 * Script para verificação da acessibilidade dos componentes do frontend,
 * em especial o uso correto do componente AccessibleSelect.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Caminho para o diretório de componentes
const frontendDir = path.resolve(__dirname, '..');
const componentsDir = path.join(frontendDir, 'src', 'components');
const pagesDir = path.join(frontendDir, 'src', 'pages');

// Contadores para o relatório
let stats = {
  totalFiles: 0,
  usingAccessibleSelect: 0,
  usingStandardSelect: 0,
  potentialIssues: 0,
  filesWithIssues: []
};

/**
 * Verifica um arquivo em busca de problemas de acessibilidade
 */
function checkFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
    return;
  }

  stats.totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Verificar uso do AccessibleSelect vs Select padrão do Chakra
    const usesStandardSelect = content.includes('<Select') && 
                               !content.includes('AccessibleSelect') &&
                               fileName !== 'AccessibleSelect.tsx' &&
                               fileName !== 'Select.tsx';
    
    const usesAccessibleSelect = content.includes('<AccessibleSelect');
    
    // Verificar possíveis problemas com o AccessibleSelect
    let potentialIssues = [];
    
    if (usesAccessibleSelect) {
      stats.usingAccessibleSelect++;
      
      // Verificar se accessibleName está sendo usado
      if (!content.includes('accessibleName=')) {
        potentialIssues.push('AccessibleSelect sem accessibleName');
      }
      
      // Verificar se aria-labelledby está sendo usado sem o id correspondente
      const ariaLabelledbyMatches = content.match(/aria-labelledby=["']([^"']+)["']/g) || [];
      
      for (const match of ariaLabelledbyMatches) {
        const idMatch = match.match(/aria-labelledby=["']([^"']+)["']/);
        if (idMatch && idMatch[1]) {
          const id = idMatch[1];
          if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
            potentialIssues.push(`aria-labelledby="${id}" sem elemento correspondente com esse id`);
          }
        }
      }
    }
    
    if (usesStandardSelect) {
      stats.usingStandardSelect++;
      potentialIssues.push('Usando Select padrão em vez de AccessibleSelect');
    }
    
    // Adicionar ao relatório se houver problemas
    if (potentialIssues.length > 0) {
      stats.potentialIssues += potentialIssues.length;
      stats.filesWithIssues.push({
        file: filePath.replace(frontendDir, ''),
        issues: potentialIssues
      });
    }
    
  } catch (error) {
    console.error(chalk.red(`Erro ao processar ${filePath}:`), error.message);
  }
}

/**
 * Processa todos os arquivos em um diretório recursivamente
 */
function processDirectory(directoryPath) {
  const items = fs.readdirSync(directoryPath);
  
  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else {
      checkFile(itemPath);
    }
  }
}

/**
 * Gera um relatório dos problemas encontrados
 */
function generateReport() {
  console.log(chalk.blue.bold('\n=== RELATÓRIO DE ACESSIBILIDADE DE SELECTS ===\n'));
  
  console.log(chalk.cyan(`Total de arquivos verificados: ${chalk.white(stats.totalFiles)}`));
  console.log(chalk.cyan(`Arquivos usando AccessibleSelect: ${chalk.green(stats.usingAccessibleSelect)}`));
  console.log(chalk.cyan(`Arquivos usando Select padrão: ${chalk.yellow(stats.usingStandardSelect)}`));
  console.log(chalk.cyan(`Total de problemas potenciais: ${chalk.red(stats.potentialIssues)}\n`));
  
  if (stats.filesWithIssues.length > 0) {
    console.log(chalk.yellow.bold('Detalhes dos problemas encontrados:'));
    
    for (const fileIssue of stats.filesWithIssues) {
      console.log(chalk.white.bold(`\n${fileIssue.file}:`));
      
      for (const issue of fileIssue.issues) {
        console.log(chalk.red(` • ${issue}`));
      }
    }
    
    console.log(chalk.yellow.bold('\nRecomendações:'));
    console.log(chalk.white(' • Substitua todos os componentes Select pelo AccessibleSelect'));
    console.log(chalk.white(' • Adicione o atributo accessibleName a todos os AccessibleSelect'));
    console.log(chalk.white(' • Verifique se todos os aria-labelledby têm um elemento correspondente com o mesmo id'));
    console.log(chalk.white(' • Consulte o documento ACESSIBILIDADE-SELECTS.md para mais detalhes'));
  } else {
    console.log(chalk.green.bold('Parabéns! Nenhum problema de acessibilidade foi encontrado nos componentes Select.'));
  }
  
  console.log(chalk.blue.bold('\n=======================================\n'));
}

// Processar os diretórios
console.log(chalk.cyan('Verificando componentes...'));
processDirectory(componentsDir);

console.log(chalk.cyan('Verificando páginas...'));
processDirectory(pagesDir);

// Gerar relatório
generateReport();

// Retornar código de erro se houver problemas
process.exit(stats.potentialIssues > 0 ? 1 : 0); 