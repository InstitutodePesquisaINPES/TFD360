const { Prefeitura, User } = require('../models');
const fs = require('fs');
const path = require('path');

/**
 * Listar todas as prefeituras
 * Apenas Super Admin tem acesso a essa funcionalidade
 */
const listarPrefeituras = async (req, res) => {
  try {
    // Opções de filtro e paginação
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const offset = (pagina - 1) * limite;
    
    // Construir as opções de consulta
    const options = {
      limit: limite,
      offset: offset,
      order: [['nome', 'ASC']],
      attributes: [
        'id', 'nome', 'cnpj', 'cidade', 'estado', 
        'logo', 'data_validade_contrato', 'limite_usuarios', 
        'status', 'modulos_ativos', 'created_at', 'updated_at'
      ]
    };
    
    // Aplicar filtros se existirem
    if (req.query.status) {
      options.where = { 
        ...options.where,
        status: req.query.status 
      };
    }
    
    if (req.query.termo) {
      options.where = { 
        ...options.where,
        [Op.or]: [
          { nome: { [Op.iLike]: `%${req.query.termo}%` } },
          { cnpj: { [Op.iLike]: `%${req.query.termo}%` } },
          { cidade: { [Op.iLike]: `%${req.query.termo}%` } }
        ]
      };
    }
    
    // Buscar as prefeituras com contagem
    const { rows: prefeituras, count: total } = await Prefeitura.findAndCountAll(options);
    
    // Adicionar campo que indica se a prefeitura está ativa
    const prefeiturasMapeadas = prefeituras.map(p => {
      const prefeituraObj = p.toJSON();
      prefeituraObj.ativa = p.isAtiva();
      return prefeituraObj;
    });
    
    return res.json({
      prefeituras: prefeiturasMapeadas,
      paginacao: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    console.error('Erro ao listar prefeituras:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao listar prefeituras',
      details: error.message
    });
  }
};

/**
 * Buscar uma prefeitura pelo ID
 */
const buscarPrefeitura = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID da prefeitura não fornecido'
      });
    }
    
    // Buscar a prefeitura
    const prefeitura = await Prefeitura.findByPk(id);
    
    // Verificar se a prefeitura foi encontrada
    if (!prefeitura) {
      return res.status(404).json({
        error: true,
        message: 'Prefeitura não encontrada'
      });
    }
    
    // Adicionar campo que indica se a prefeitura está ativa
    const prefeituraObj = prefeitura.toJSON();
    prefeituraObj.ativa = prefeitura.isAtiva();
    
    return res.json(prefeituraObj);
  } catch (error) {
    console.error('Erro ao buscar prefeitura:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao buscar prefeitura',
      details: error.message
    });
  }
};

/**
 * Criar uma nova prefeitura
 * Apenas Super Admin tem acesso a essa funcionalidade
 */
const criarPrefeitura = async (req, res) => {
  try {
    const dadosPrefeitura = req.body;
    
    // Salvar o arquivo de logo, se existir
    if (req.file) {
      dadosPrefeitura.logo = `/uploads/logos/${req.file.filename}`;
    }
    
    // Criar a prefeitura
    const prefeitura = await Prefeitura.create(dadosPrefeitura);
    
    return res.status(201).json({
      message: 'Prefeitura criada com sucesso',
      prefeitura
    });
  } catch (error) {
    console.error('Erro ao criar prefeitura:', error);
    
    // Se houve upload de imagem, remover em caso de erro
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'logos', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Erro ao remover arquivo de logo:', err);
      });
    }
    
    // Verificar se é um erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const erros = error.errors.map(err => ({
        campo: err.path,
        mensagem: err.message
      }));
      
      return res.status(400).json({
        error: true,
        message: 'Dados inválidos',
        erros
      });
    }
    
    return res.status(500).json({
      error: true,
      message: 'Erro ao criar prefeitura',
      details: error.message
    });
  }
};

/**
 * Atualizar uma prefeitura
 * Apenas Super Admin tem acesso a essa funcionalidade
 */
const atualizarPrefeitura = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID da prefeitura não fornecido'
      });
    }
    
    // Buscar a prefeitura
    const prefeitura = await Prefeitura.findByPk(id);
    
    // Verificar se a prefeitura foi encontrada
    if (!prefeitura) {
      return res.status(404).json({
        error: true,
        message: 'Prefeitura não encontrada'
      });
    }
    
    // Salvar o arquivo de logo, se existir
    if (req.file) {
      // Remover logo anterior se existir
      if (prefeitura.logo) {
        const logoPath = path.join(__dirname, '..', prefeitura.logo);
        fs.unlink(logoPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Erro ao remover logo anterior:', err);
          }
        });
      }
      
      dadosAtualizacao.logo = `/uploads/logos/${req.file.filename}`;
    }
    
    // Atualizar a prefeitura
    await prefeitura.update(dadosAtualizacao);
    
    // Buscar a prefeitura atualizada
    const prefeituraAtualizada = await Prefeitura.findByPk(id);
    
    return res.json({
      message: 'Prefeitura atualizada com sucesso',
      prefeitura: prefeituraAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar prefeitura:', error);
    
    // Se houve upload de imagem, remover em caso de erro
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'logos', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Erro ao remover arquivo de logo:', err);
      });
    }
    
    // Verificar se é um erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const erros = error.errors.map(err => ({
        campo: err.path,
        mensagem: err.message
      }));
      
      return res.status(400).json({
        error: true,
        message: 'Dados inválidos',
        erros
      });
    }
    
    return res.status(500).json({
      error: true,
      message: 'Erro ao atualizar prefeitura',
      details: error.message
    });
  }
};

/**
 * Alterar o status de uma prefeitura
 * Apenas Super Admin tem acesso a essa funcionalidade
 */
const alterarStatusPrefeitura = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID da prefeitura não fornecido'
      });
    }
    
    // Verificar se o status é válido
    if (!['ativa', 'expirada', 'suspensa'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Status inválido. Valores permitidos: ativa, expirada, suspensa'
      });
    }
    
    // Buscar a prefeitura
    const prefeitura = await Prefeitura.findByPk(id);
    
    // Verificar se a prefeitura foi encontrada
    if (!prefeitura) {
      return res.status(404).json({
        error: true,
        message: 'Prefeitura não encontrada'
      });
    }
    
    // Atualizar o status
    await prefeitura.update({ status });
    
    return res.json({
      message: `Status da prefeitura alterado para "${status}" com sucesso`
    });
  } catch (error) {
    console.error('Erro ao alterar status da prefeitura:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao alterar status da prefeitura',
      details: error.message
    });
  }
};

/**
 * Remover uma prefeitura
 * Apenas Super Admin tem acesso a essa funcionalidade
 * ATENÇÃO: Esta operação é perigosa e deve ser usada com cautela
 */
const removerPrefeitura = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID da prefeitura não fornecido'
      });
    }
    
    // Buscar a prefeitura
    const prefeitura = await Prefeitura.findByPk(id);
    
    // Verificar se a prefeitura foi encontrada
    if (!prefeitura) {
      return res.status(404).json({
        error: true,
        message: 'Prefeitura não encontrada'
      });
    }
    
    // Verificar se há usuários vinculados
    const usuariosCount = await User.count({
      where: { prefeitura_id: id }
    });
    
    if (usuariosCount > 0) {
      return res.status(400).json({
        error: true,
        message: `Não é possível remover a prefeitura pois existem ${usuariosCount} usuários vinculados a ela`
      });
    }
    
    // Remover logo se existir
    if (prefeitura.logo) {
      const logoPath = path.join(__dirname, '..', prefeitura.logo);
      fs.unlink(logoPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erro ao remover logo:', err);
        }
      });
    }
    
    // Remover a prefeitura
    await prefeitura.destroy();
    
    return res.json({
      message: 'Prefeitura removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover prefeitura:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao remover prefeitura',
      details: error.message
    });
  }
};

/**
 * Buscar estatísticas das prefeituras
 * Apenas Super Admin tem acesso a essa funcionalidade
 */
const estatisticasPrefeituras = async (req, res) => {
  try {
    // Total de prefeituras
    const totalPrefeituras = await Prefeitura.count();
    
    // Prefeituras por status
    const statusCounts = await Prefeitura.count({
      group: ['status']
    });
    
    // Mapeamento dos resultados
    const statusCountsObj = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {
      ativa: 0,
      expirada: 0,
      suspensa: 0
    });
    
    // Buscar prefeituras que expiram nos próximos 30 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 30);
    
    const expirandoCount = await Prefeitura.count({
      where: {
        status: 'ativa',
        data_validade_contrato: {
          [Op.lte]: dataLimite,
          [Op.gt]: new Date()
        }
      }
    });
    
    return res.json({
      total: totalPrefeituras,
      por_status: statusCountsObj,
      expirando_em_30_dias: expirandoCount
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas das prefeituras:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao buscar estatísticas das prefeituras',
      details: error.message
    });
  }
};

/**
 * Listar módulos disponíveis
 */
const listarModulos = async (req, res) => {
  try {
    const modulos = [
      {
        id: 'core',
        nome: 'Núcleo Administrativo',
        descricao: 'Módulo principal com funcionalidades administrativas e de autenticação'
      },
      {
        id: 'pacientes',
        nome: 'Cadastro de Pacientes',
        descricao: 'Gerenciamento completo de pacientes atendidos pelo TFD'
      },
      {
        id: 'viagens',
        nome: 'Gestão de Viagens TFD',
        descricao: 'Planejamento e controle de viagens médicas'
      },
      {
        id: 'logistica',
        nome: 'Logística Institucional',
        descricao: 'Gerenciamento de viagens administrativas e transporte de documentos'
      },
      {
        id: 'frota',
        nome: 'Gestão de Frota',
        descricao: 'Controle de veículos e motoristas'
      },
      {
        id: 'financeiro',
        nome: 'Financeiro e Orçamento',
        descricao: 'Controle de despesas e orçamento'
      },
      {
        id: 'alertas',
        nome: 'Alertas e Notificações',
        descricao: 'Sistema de alertas e notificações automáticas'
      },
      {
        id: 'relatorios',
        nome: 'Relatórios e Auditoria',
        descricao: 'Geração de relatórios e controle para auditoria'
      }
    ];
    
    return res.json(modulos);
  } catch (error) {
    console.error('Erro ao listar módulos:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao listar módulos',
      details: error.message
    });
  }
};

/**
 * Atualizar módulos ativos da prefeitura
 */
const atualizarModulos = async (req, res) => {
  try {
    const { id } = req.params;
    const { modulos } = req.body;
    
    // Verificar se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID da prefeitura não fornecido'
      });
    }
    
    // Verificar se os módulos foram fornecidos
    if (!modulos || !Array.isArray(modulos)) {
      return res.status(400).json({
        error: true,
        message: 'Lista de módulos não fornecida ou inválida'
      });
    }
    
    // Módulos válidos
    const modulosValidos = [
      'core', 'pacientes', 'viagens', 'logistica', 
      'frota', 'financeiro', 'alertas', 'relatorios'
    ];
    
    // Verificar se todos os módulos são válidos
    const modulosInvalidos = modulos.filter(m => !modulosValidos.includes(m));
    if (modulosInvalidos.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Módulos inválidos: ${modulosInvalidos.join(', ')}`
      });
    }
    
    // Buscar a prefeitura
    const prefeitura = await Prefeitura.findByPk(id);
    
    // Verificar se a prefeitura foi encontrada
    if (!prefeitura) {
      return res.status(404).json({
        error: true,
        message: 'Prefeitura não encontrada'
      });
    }
    
    // Garantir que o módulo 'core' sempre esteja presente
    if (!modulos.includes('core')) {
      modulos.push('core');
    }
    
    // Atualizar os módulos
    await prefeitura.update({ modulos_ativos: modulos });
    
    return res.json({
      message: 'Módulos atualizados com sucesso',
      modulos_ativos: modulos
    });
  } catch (error) {
    console.error('Erro ao atualizar módulos da prefeitura:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao atualizar módulos da prefeitura',
      details: error.message
    });
  }
};

module.exports = {
  listarPrefeituras,
  buscarPrefeitura,
  criarPrefeitura,
  atualizarPrefeitura,
  alterarStatusPrefeitura,
  removerPrefeitura,
  estatisticasPrefeituras,
  listarModulos,
  atualizarModulos
}; 