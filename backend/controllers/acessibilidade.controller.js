/**
 * Controlador de Acessibilidade
 * 
 * Este controlador gerencia funcionalidades relacionadas à acessibilidade,
 * como relatórios, verificações e configurações personalizadas.
 */

const RelatorioAcessibilidade = require('../models/relatorio-acessibilidade.model');
const ConfiguracaoAcessibilidade = require('../models/configuracao-acessibilidade.model');
const { tratarErro, validarObjetoId } = require('../utils/api-utils');

/**
 * Registra um novo relatório de acessibilidade
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const registrarRelatorio = async (req, res) => {
  try {
    const { erros, avisos, componentes, pagina, navegador, data } = req.body;
    
    // Validações básicas
    if (!pagina) {
      return res.status(400).json({ erro: 'A página é obrigatória' });
    }
    
    // Criar relatório
    const relatorio = await RelatorioAcessibilidade.create({
      erros: erros || [],
      avisos: avisos || [],
      componentes: componentes || { total: 0, acessiveis: 0 },
      pagina,
      navegador,
      data: data || new Date(),
      usuario: req.usuario?._id
    });
    
    return res.status(201).json({
      mensagem: 'Relatório de acessibilidade registrado com sucesso',
      relatorio
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Lista relatórios de acessibilidade com filtros e paginação
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const listarRelatorios = async (req, res) => {
  try {
    const { pagina, dataInicio, dataFim, temErros, navegador } = req.query;
    
    // Opções de paginação
    const opcoes = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { data: -1 }, // Mais recentes primeiro
      populate: { path: 'usuario', select: 'nome email' }
    };
    
    // Construir filtros
    const filtros = {};
    
    if (pagina) {
      filtros.pagina = pagina;
    }
    
    if (navegador) {
      filtros.navegador = navegador;
    }
    
    // Filtro por período
    if (dataInicio || dataFim) {
      filtros.data = {};
      
      if (dataInicio) {
        filtros.data.$gte = new Date(dataInicio);
      }
      
      if (dataFim) {
        filtros.data.$lte = new Date(dataFim);
      }
    }
    
    // Filtro por erros
    if (temErros === 'true') {
      filtros['erros.0'] = { $exists: true }; // Tem pelo menos um erro
    }
    
    // Executar consulta com paginação
    const resultado = await RelatorioAcessibilidade.paginate(filtros, opcoes);
    
    return res.json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém relatório de acessibilidade por ID
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const obterRelatorioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!validarObjetoId(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }
    
    // Buscar relatório
    const relatorio = await RelatorioAcessibilidade.findById(id)
      .populate('usuario', 'nome email');
    
    if (!relatorio) {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }
    
    return res.json(relatorio);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém estatísticas gerais de acessibilidade
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const obterEstatisticas = async (req, res) => {
  try {
    // Total de relatórios
    const totalRelatorios = await RelatorioAcessibilidade.countDocuments();
    
    // Total de relatórios com erros
    const totalComErros = await RelatorioAcessibilidade.countDocuments({
      'erros.0': { $exists: true }
    });
    
    // Média de erros por relatório
    const mediaErros = await RelatorioAcessibilidade.aggregate([
      {
        $project: {
          qtdErros: { $size: '$erros' }
        }
      },
      {
        $group: {
          _id: null,
          mediaErros: { $avg: '$qtdErros' }
        }
      }
    ]);
    
    // Páginas com mais erros
    const paginasComMaisErros = await RelatorioAcessibilidade.aggregate([
      {
        $project: {
          pagina: 1,
          qtdErros: { $size: '$erros' }
        }
      },
      {
        $group: {
          _id: '$pagina',
          totalErros: { $sum: '$qtdErros' },
          ocorrencias: { $sum: 1 }
        }
      },
      {
        $sort: { totalErros: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Últimos 30 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    
    const ultimos30Dias = await RelatorioAcessibilidade.aggregate([
      {
        $match: {
          data: { $gte: dataLimite }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } },
          totalRelatorios: { $sum: 1 },
          totalErros: { $sum: { $size: '$erros' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return res.json({
      totalRelatorios,
      totalComErros,
      percentualComErros: totalRelatorios > 0 ? (totalComErros / totalRelatorios) * 100 : 0,
      mediaErros: mediaErros.length > 0 ? mediaErros[0].mediaErros : 0,
      paginasComMaisErros,
      ultimos30Dias
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Salva configurações de acessibilidade personalizadas para um usuário
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const salvarConfiguracoes = async (req, res) => {
  try {
    const { altoContraste, fonteAumentada, animacoesReduzidas, espacamentoTexto } = req.body;
    
    // Verificar se já existe configuração para o usuário
    let configuracao = await ConfiguracaoAcessibilidade.findOne({
      usuario: req.usuario._id
    });
    
    if (configuracao) {
      // Atualizar configuração existente
      configuracao.altoContraste = altoContraste !== undefined ? altoContraste : configuracao.altoContraste;
      configuracao.fonteAumentada = fonteAumentada !== undefined ? fonteAumentada : configuracao.fonteAumentada;
      configuracao.animacoesReduzidas = animacoesReduzidas !== undefined ? animacoesReduzidas : configuracao.animacoesReduzidas;
      configuracao.espacamentoTexto = espacamentoTexto !== undefined ? espacamentoTexto : configuracao.espacamentoTexto;
      configuracao.atualizado_em = new Date();
      
      await configuracao.save();
    } else {
      // Criar nova configuração
      configuracao = await ConfiguracaoAcessibilidade.create({
        usuario: req.usuario._id,
        altoContraste: altoContraste || false,
        fonteAumentada: fonteAumentada || false,
        animacoesReduzidas: animacoesReduzidas || false,
        espacamentoTexto: espacamentoTexto || 'normal'
      });
    }
    
    return res.json({
      mensagem: 'Configurações de acessibilidade salvas com sucesso',
      configuracao
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obtém configurações de acessibilidade do usuário atual
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const obterConfiguracoes = async (req, res) => {
  try {
    const configuracao = await ConfiguracaoAcessibilidade.findOne({
      usuario: req.usuario._id
    });
    
    if (!configuracao) {
      // Retornar configurações padrão
      return res.json({
        altoContraste: false,
        fonteAumentada: false,
        animacoesReduzidas: false,
        espacamentoTexto: 'normal'
      });
    }
    
    return res.json(configuracao);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Executa verificação de acessibilidade em uma página específica
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
const verificarPagina = async (req, res) => {
  try {
    // Esta função seria integrada com uma biblioteca de verificação de acessibilidade
    // Como o Axe-core ou similar. A implementação específica depende da biblioteca escolhida.
    
    // Por ora, retornaremos dados simulados
    const { pagina } = req.body;
    
    if (!pagina) {
      return res.status(400).json({ erro: 'A página é obrigatória' });
    }
    
    // Simulação de resultados
    const resultados = {
      pagina,
      timestamp: new Date(),
      erros: [],
      avisos: [],
      componentes: {
        total: 120,
        acessiveis: 118
      }
    };
    
    // Adicionar alguns erros e avisos aleatórios
    const possiveisErros = [
      { codigo: 'color-contrast', mensagem: 'Contraste de cor insuficiente', elemento: 'button.primary' },
      { codigo: 'aria-required-attr', mensagem: 'Atributo ARIA obrigatório ausente', elemento: 'select#tipo' },
      { codigo: 'label', mensagem: 'Elemento de formulário sem label', elemento: 'input#nome' }
    ];
    
    const possiveisAvisos = [
      { codigo: 'region', mensagem: 'Considere usar landmarks', elemento: 'div.content' },
      { codigo: 'heading-order', mensagem: 'Ordem de cabeçalhos inconsistente', elemento: 'h3' },
      { codigo: 'link-name', mensagem: 'Link sem texto descritivo', elemento: 'a.btn' }
    ];
    
    // Adicionar até 2 erros aleatórios
    const qtdErros = Math.floor(Math.random() * 3); // 0, 1 ou 2 erros
    for (let i = 0; i < qtdErros; i++) {
      const indice = Math.floor(Math.random() * possiveisErros.length);
      resultados.erros.push(possiveisErros[indice]);
    }
    
    // Adicionar até 3 avisos aleatórios
    const qtdAvisos = Math.floor(Math.random() * 4); // 0, 1, 2 ou 3 avisos
    for (let i = 0; i < qtdAvisos; i++) {
      const indice = Math.floor(Math.random() * possiveisAvisos.length);
      resultados.avisos.push(possiveisAvisos[indice]);
    }
    
    // Atualizar contagem de componentes acessíveis baseada nos erros
    resultados.componentes.acessiveis = resultados.componentes.total - resultados.erros.length;
    
    // Salvar o relatório no banco de dados
    await RelatorioAcessibilidade.create({
      erros: resultados.erros,
      avisos: resultados.avisos,
      componentes: resultados.componentes,
      pagina: resultados.pagina,
      navegador: req.headers['user-agent'],
      data: resultados.timestamp,
      usuario: req.usuario?._id
    });
    
    return res.json(resultados);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

module.exports = {
  registrarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
  obterEstatisticas,
  salvarConfiguracoes,
  obterConfiguracoes,
  verificarPagina
}; 