const AgendamentoRelatorio = require('../models/agendamento-relatorio.model');
const RelatorioService = require('./relatorio.service');
const EmailService = require('./email.service');
const { criarError } = require('../utils/error.utils');

/**
 * Busca todos os agendamentos de relatórios com opções de filtro e paginação
 */
const listarAgendamentos = async (filtros = {}, opcoesPaginacao = {}) => {
  const { tipo_relatorio, ativo, usuario_id } = filtros;
  
  // Prepara query de busca
  const query = {};
  
  if (tipo_relatorio) {
    query.tipo_relatorio = tipo_relatorio;
  }
  
  if (ativo !== undefined) {
    query.ativo = ativo === 'true' || ativo === true;
  }
  
  if (usuario_id) {
    query.criado_por = usuario_id;
  }
  
  // Configura opções de paginação
  const opcoes = {
    page: parseInt(opcoesPaginacao.pagina) || 1,
    limit: parseInt(opcoesPaginacao.limite) || 10,
    sort: { criado_em: -1 },
    populate: { path: 'criado_por', select: 'nome email perfil' }
  };
  
  // Executa a consulta paginada
  const resultado = await AgendamentoRelatorio.paginate(query, opcoes);
  
  return {
    agendamentos: resultado.docs,
    paginacao: {
      total: resultado.totalDocs,
      pagina_atual: resultado.page,
      total_paginas: resultado.totalPages,
      limite: resultado.limit
    }
  };
};

/**
 * Busca um agendamento de relatório pelo ID
 */
const obterAgendamentoPorId = async (id) => {
  const agendamento = await AgendamentoRelatorio.findById(id)
    .populate('criado_por', 'nome email perfil');
  
  if (!agendamento) {
    throw criarError('Agendamento de relatório não encontrado', 404);
  }
  
  return agendamento;
};

/**
 * Cria um novo agendamento de relatório
 */
const criarAgendamento = async (dadosAgendamento, usuario_id) => {
  // Adiciona o usuário que está criando o agendamento
  dadosAgendamento.criado_por = usuario_id;
  
  // Cria o agendamento
  const novoAgendamento = new AgendamentoRelatorio(dadosAgendamento);
  await novoAgendamento.save();
  
  return novoAgendamento;
};

/**
 * Atualiza um agendamento de relatório existente
 */
const atualizarAgendamento = async (id, dadosAtualizacao) => {
  const agendamento = await AgendamentoRelatorio.findById(id);
  
  if (!agendamento) {
    throw criarError('Agendamento de relatório não encontrado', 404);
  }
  
  // Atualiza apenas os campos permitidos
  const camposAtualizaveis = [
    'nome', 'descricao', 'tipo_relatorio', 'parametros', 
    'frequencia', 'dia_semana', 'dia_mes', 'horario',
    'formato_saida', 'destinatarios', 'ativo'
  ];
  
  camposAtualizaveis.forEach(campo => {
    if (dadosAtualizacao[campo] !== undefined) {
      agendamento[campo] = dadosAtualizacao[campo];
    }
  });
  
  // Salva as alterações
  await agendamento.save();
  
  return agendamento;
};

/**
 * Altera o status de um agendamento (ativo/inativo)
 */
const alterarStatus = async (id, ativo) => {
  const agendamento = await AgendamentoRelatorio.findById(id);
  
  if (!agendamento) {
    throw criarError('Agendamento de relatório não encontrado', 404);
  }
  
  agendamento.ativo = ativo;
  await agendamento.save();
  
  return agendamento;
};

/**
 * Remove um agendamento de relatório
 */
const removerAgendamento = async (id) => {
  const resultado = await AgendamentoRelatorio.findByIdAndDelete(id);
  
  if (!resultado) {
    throw criarError('Agendamento de relatório não encontrado', 404);
  }
  
  return { mensagem: 'Agendamento de relatório removido com sucesso' };
};

/**
 * Executa um agendamento de relatório específico
 */
const executarAgendamento = async (id) => {
  const agendamento = await AgendamentoRelatorio.findById(id);
  
  if (!agendamento) {
    throw criarError('Agendamento de relatório não encontrado', 404);
  }
  
  try {
    // Atualiza o status para pendente antes de executar
    agendamento.status_ultima_execucao = 'pendente';
    agendamento.mensagem_erro = null;
    await agendamento.save();
    
    // Executa o relatório baseado no tipo e parâmetros
    const resultado = await RelatorioService.gerarRelatorio(
      agendamento.tipo_relatorio,
      agendamento.parametros,
      agendamento.formato_saida
    );
    
    // Se tiver destinatários, envia por email
    if (agendamento.destinatarios && agendamento.destinatarios.length > 0) {
      await EmailService.enviarRelatorio({
        destinatarios: agendamento.destinatarios,
        assunto: `Relatório: ${agendamento.nome}`,
        mensagem: `Relatório gerado automaticamente pelo sistema TFD360.\n\nDescrição: ${agendamento.descricao || 'Sem descrição'}`,
        anexo: {
          conteudo: resultado.conteudo,
          nome: `relatorio_${agendamento.tipo_relatorio}_${new Date().toISOString().slice(0, 10)}.${agendamento.formato_saida}`,
          tipo: resultado.tipoConteudo
        }
      });
    }
    
    // Atualiza o status e data de execução
    agendamento.status_ultima_execucao = 'sucesso';
    agendamento.ultima_execucao = new Date();
    
    // Se for agendamento recorrente, calcula a próxima execução
    if (agendamento.frequencia !== 'sob_demanda' && agendamento.ativo) {
      agendamento.proxima_execucao = await calcularProximaExecucao(agendamento);
    }
    
    await agendamento.save();
    
    return {
      mensagem: 'Relatório executado com sucesso',
      resultado: resultado
    };
  } catch (erro) {
    // Registra o erro na execução
    agendamento.status_ultima_execucao = 'erro';
    agendamento.mensagem_erro = erro.message || 'Erro ao executar o relatório';
    agendamento.ultima_execucao = new Date();
    await agendamento.save();
    
    throw criarError(`Erro ao executar o relatório: ${erro.message}`, 500);
  }
};

/**
 * Verifica e executa todos os agendamentos programados para execução
 * Esta função deve ser chamada periodicamente por um job agendado
 */
const processarAgendamentosPendentes = async () => {
  const agora = new Date();
  
  // Busca agendamentos ativos com próxima execução programada para antes de agora
  const agendamentosPendentes = await AgendamentoRelatorio.find({
    ativo: true,
    proxima_execucao: { $lte: agora },
    frequencia: { $ne: 'sob_demanda' }
  });
  
  console.log(`Processando ${agendamentosPendentes.length} agendamentos pendentes`);
  
  const resultados = [];
  
  // Executa cada agendamento pendente
  for (const agendamento of agendamentosPendentes) {
    try {
      await executarAgendamento(agendamento._id);
      resultados.push({
        id: agendamento._id,
        nome: agendamento.nome,
        status: 'sucesso'
      });
    } catch (erro) {
      resultados.push({
        id: agendamento._id,
        nome: agendamento.nome,
        status: 'erro',
        mensagem: erro.message
      });
    }
  }
  
  return resultados;
};

/**
 * Calcula a próxima execução baseada na frequência configurada
 * Função auxiliar para uso interno apenas
 */
const calcularProximaExecucao = async (agendamento) => {
  const agora = new Date();
  const [horas, minutos] = agendamento.horario.split(':').map(Number);
  let dataProximaExecucao = new Date();
  
  dataProximaExecucao.setHours(horas, minutos, 0, 0);
  
  // Se o horário já passou hoje, a próxima execução será no próximo período
  if (dataProximaExecucao <= agora) {
    dataProximaExecucao.setDate(dataProximaExecucao.getDate() + 1);
  }
  
  switch (agendamento.frequencia) {
    case 'diario':
      // Já está configurado corretamente
      break;
    
    case 'semanal':
      // Avança para o próximo dia da semana correspondente
      const diaDaSemanaAtual = dataProximaExecucao.getDay();
      const diaDaSemanaDesejado = agendamento.dia_semana;
      
      let diasAteProximoDia = diaDaSemanaDesejado - diaDaSemanaAtual;
      if (diasAteProximoDia <= 0) {
        diasAteProximoDia += 7;
      }
      
      dataProximaExecucao.setDate(dataProximaExecucao.getDate() + diasAteProximoDia);
      break;
    
    case 'mensal':
      // Avança para o dia do mês específico
      const diaDoMesDesejado = agendamento.dia_mes;
      const mesAtual = dataProximaExecucao.getMonth();
      
      // Configura para o dia específico do mês atual
      dataProximaExecucao.setDate(diaDoMesDesejado);
      
      // Se o dia já passou no mês atual, avança para o próximo mês
      if (dataProximaExecucao <= agora) {
        dataProximaExecucao.setMonth(mesAtual + 1);
      }
      
      // Ajusta para o último dia do mês se o dia especificado for maior que o número de dias no mês
      const ultimoDiaDoMes = new Date(dataProximaExecucao.getFullYear(), dataProximaExecucao.getMonth() + 1, 0).getDate();
      if (diaDoMesDesejado > ultimoDiaDoMes) {
        dataProximaExecucao.setDate(ultimoDiaDoMes);
      }
      break;
      
    case 'sob_demanda':
      // Sem próxima execução programada
      return null;
  }
  
  return dataProximaExecucao;
};

module.exports = {
  listarAgendamentos,
  obterAgendamentoPorId,
  criarAgendamento,
  atualizarAgendamento,
  alterarStatus,
  removerAgendamento,
  executarAgendamento,
  processarAgendamentosPendentes
}; 