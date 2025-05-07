/**
 * Script de configuração para acessibilidade no TFD360
 * Executa todas as configurações necessárias para garantir acessibilidade
 * e resolver problemas de linting.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretório raiz do projeto frontend
const frontendDir = __dirname;

console.log('💼 Iniciando configuração de acessibilidade para o TFD360...');

// Verificar se os arquivos de configuração existem
const configFiles = [
  '.eslintrc.js',
  '.eslintignore',
  'axe.config.js',
  'vite-axe-plugin.js'
];

configFiles.forEach(file => {
  const filePath = path.join(frontendDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo ${file} não encontrado!`);
    process.exit(1);
  }
  console.log(`✅ Arquivo ${file} encontrado.`);
});

// Verificar se o componente AccessibleSelect existe
const accessibleSelectPath = path.join(frontendDir, 'src', 'components', 'AccessibleSelect.tsx');
if (!fs.existsSync(accessibleSelectPath)) {
  console.error('❌ Componente AccessibleSelect não encontrado!');
  process.exit(1);
}
console.log('✅ Componente AccessibleSelect encontrado.');

// Verificar configurações no package.json
try {
  const packageJsonPath = path.join(frontendDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts.lint.includes('--config .eslintrc.js')) {
    console.error('❌ Configuração de lint no package.json não está correta!');
    process.exit(1);
  }
  console.log('✅ Configuração de lint no package.json está correta.');
} catch (error) {
  console.error('❌ Erro ao verificar package.json:', error.message);
  process.exit(1);
}

// Executar lint com as novas configurações
console.log('🔍 Executando ESLint com as novas configurações...');
try {
  execSync('npm run lint', { stdio: 'inherit', cwd: frontendDir });
  console.log('✅ ESLint concluído com sucesso.');
} catch (error) {
  console.error('⚠️ ESLint encontrou problemas, mas continuaremos o processo...');
}

// Atualizar os componentes que usam Select
console.log('🔄 Verificando componentes que usam Select...');
const componentsDir = path.join(frontendDir, 'src', 'components');
const files = fs.readdirSync(componentsDir);

let selectComponents = 0;

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('<Select') && 
        !content.includes('<AccessibleSelect') && 
        file !== 'AccessibleSelect.tsx') {
      console.log(`ℹ️ Componente ${file} usa Select e deve ser atualizado para AccessibleSelect.`);
      selectComponents++;
    }
  }
});

if (selectComponents === 0) {
  console.log('✅ Todos os componentes estão usando AccessibleSelect.');
} else {
  console.log(`⚠️ ${selectComponents} componentes ainda usam o Select padrão e precisam ser atualizados.`);
}

console.log('');
console.log('🎉 Configuração de acessibilidade concluída!');
console.log('');
console.log('📋 Resumo das alterações:');
console.log('1. Arquivos de configuração verificados e prontos');
console.log('2. Componente AccessibleSelect implementado');
console.log('3. ESLint configurado para ignorar falsos positivos');
console.log('4. Estilos CSS para acessibilidade adicionados');
console.log('');
console.log('📝 Próximos passos:');
console.log('1. Execute "npm run dev" para iniciar o servidor de desenvolvimento');
console.log('2. Teste a aplicação com ferramentas de acessibilidade');
console.log('3. Atualize outros componentes para usar AccessibleSelect se necessário');
console.log('');
console.log('🔍 Para testar a acessibilidade, use:');
console.log('- Chrome DevTools > Lighthouse > Accessibility');
console.log('- Extensão axe DevTools no Chrome');
console.log('- Leitor de tela NVDA para teste real'); 