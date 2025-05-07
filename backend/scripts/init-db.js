/**
 * Script para inicializar o banco de dados e criar o primeiro usuário Super Admin
 * Uso: node scripts/init-db.js
 */

const { sequelize, User, Prefeitura } = require('../models');
const authConfig = require('../config/auth');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Função para inicializar o banco de dados
const inicializarBancoDados = async () => {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // Sincronizar os modelos com o banco de dados (criar tabelas)
    console.log('Sincronizando modelos com o banco de dados...');
    await sequelize.sync({ force: true });
    console.log('Modelos sincronizados com sucesso.');

    // Verificar se já existe um usuário Super Admin
    console.log('Verificando se já existe um usuário Super Admin...');
    const superAdminExistente = await User.findOne({
      where: { tipo_perfil: authConfig.roles.SUPER_ADMIN }
    });

    if (superAdminExistente) {
      console.log('Já existe um usuário Super Admin no sistema.');
    } else {
      // Criar o primeiro usuário Super Admin
      console.log('Criando o primeiro usuário Super Admin...');
      
      // Gerar hash da senha
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      // Criar o usuário
      const superAdmin = await User.create({
        nome: 'Administrador do Sistema',
        email: 'admin@tfd360.com.br',
        cpf: '00000000000',
        senha: senhaHash,
        tipo_perfil: authConfig.roles.SUPER_ADMIN,
        ativo: true
      });
      
      console.log('Usuário Super Admin criado com sucesso:');
      console.log('- Email: admin@tfd360.com.br');
      console.log('- Senha: admin123');
      console.log('- ID:', superAdmin.id);
    }

    // Verificar se já existe uma prefeitura demo
    console.log('Verificando se já existe uma prefeitura demo...');
    const prefeituraExistente = await Prefeitura.findOne({
      where: { nome: 'Prefeitura Demonstração' }
    });

    if (prefeituraExistente) {
      console.log('Já existe uma prefeitura demo no sistema.');
    } else {
      // Criar a prefeitura demo
      console.log('Criando a prefeitura demo...');
      
      // Data de validade: 1 ano a partir de hoje
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);
      
      // Criar a prefeitura
      const prefeituraDemo = await Prefeitura.create({
        nome: 'Prefeitura Demonstração',
        cnpj: '00000000000000',
        cidade: 'Cidade Demo',
        estado: 'UF',
        data_validade_contrato: dataValidade,
        limite_usuarios: 20,
        status: 'ativa',
        modulos_ativos: ['core', 'pacientes', 'viagens', 'logistica', 'frota', 'financeiro', 'alertas', 'relatorios']
      });
      
      console.log('Prefeitura demo criada com sucesso:');
      console.log('- Nome: Prefeitura Demonstração');
      console.log('- ID:', prefeituraDemo.id);
      
      // Criar um usuário Admin para a prefeitura demo
      console.log('Criando um usuário Admin para a prefeitura demo...');
      
      // Gerar hash da senha
      const senhaHash = await bcrypt.hash('demo123', 10);
      
      // Criar o usuário
      const adminDemo = await User.create({
        nome: 'Administrador da Prefeitura',
        email: 'admin.demo@tfd360.com.br',
        cpf: '11111111111',
        senha: senhaHash,
        tipo_perfil: authConfig.roles.ADMIN,
        prefeitura_id: prefeituraDemo.id,
        ativo: true
      });
      
      console.log('Usuário Admin da prefeitura demo criado com sucesso:');
      console.log('- Email: admin.demo@tfd360.com.br');
      console.log('- Senha: demo123');
      console.log('- ID:', adminDemo.id);
    }

    console.log('Inicialização do banco de dados concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  }
};

// Executar a função de inicialização
inicializarBancoDados(); 