const Prefeitura = require('../models/prefeitura.model');
const User = require('../models/user.model');
const LogAcesso = require('../models/logAcesso.model');
const SolicitacaoTFD = require('../models/solicitacao-tfd.model');
const PDFDocument = require('pdfkit');
const relatorioService = require('../services/relatorio.service');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

/**
 * Gera relatório de usuários do sistema em vários formatos
 */
exports.gerarRelatorioUsuarios = async (req, res) => {
  try {
    const { dataInicio, dataFim, prefeituraId, tipoUsuario, formato = 'pdf' } = req.query;
    const userId = req.userId;
    const userTipo = req.userTipo;
    
    // Verificar se o usuário tem permissão
    if (!req.userPermissions.includes('gerar_relatorio_usuarios')) {
      return res.status(403).json({ message: 'Você não tem permissão para gerar este relatório' });
    }

    // Preparar filtros
    const filtros = {};
    
    // Se não for Super Admin, limitar pela prefeitura do usuário
    if (userTipo !== 'Super Admin') {
      filtros.prefeitura_id = req.userPrefeituraId;
    } else if (prefeituraId) {
      filtros.prefeitura_id = prefeituraId;
    }

    // Filtro por tipo de usuário, se informado
    if (tipoUsuario) {
      filtros.tipo_perfil = tipoUsuario;
    }

    // Filtro por data de criação
    if (dataInicio || dataFim) {
      filtros.created_at = {};
      if (dataInicio) {
        filtros.created_at.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        filtros.created_at.$lte = dataFimObj;
      }
    }

    // Buscar usuários conforme filtros
    const usuarios = await User.find(filtros)
      .populate('prefeitura', 'nome')
      .sort({ nome: 1 })
      .select('-senha -refresh_token');

    // Buscar o nome da prefeitura filtrada, se houver
    let prefeituraNome = 'Todas as Prefeituras';
    if (filtros.prefeitura_id) {
      const prefeitura = await Prefeitura.findById(filtros.prefeitura_id);
      if (prefeitura) {
        prefeituraNome = prefeitura.nome;
      }
    }

    // Informações comuns para todos os formatos
    const titulo = 'Relatório de Usuários do Sistema';
    const subtitulo = `Prefeitura: ${prefeituraNome}`;
    const periodo = `Período: ${dataInicio ? relatorioService.formatarData(dataInicio) : 'Início'} a ${dataFim ? relatorioService.formatarData(dataFim) : 'Atual'}`;
    const dataGeracao = `Gerado em: ${relatorioService.formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss')}`;
    
    // Gerar relatório no formato solicitado
    if (formato === 'excel') {
      // Preparar dados para Excel
      const dadosExcel = usuarios.map(usuario => ({
        nome: usuario.nome || '-',
        tipo_perfil: usuario.tipo_perfil || '-',
        email: usuario.email || '-',
        prefeitura: usuario.prefeitura?.nome || '-',
        celular: usuario.celular || '-',
        ativo: usuario.ativo ? 'Sim' : 'Não',
        criado_em: usuario.created_at ? relatorioService.formatarData(usuario.created_at) : '-'
      }));
      
      // Definir colunas
      const colunas = [
        { cabecalho: 'Nome', chave: 'nome', largura: 25 },
        { cabecalho: 'Perfil', chave: 'tipo_perfil', largura: 20 },
        { cabecalho: 'E-mail', chave: 'email', largura: 30 },
        { cabecalho: 'Prefeitura', chave: 'prefeitura', largura: 25 },
        { cabecalho: 'Celular', chave: 'celular', largura: 15 },
        { cabecalho: 'Ativo', chave: 'ativo', largura: 10 },
        { cabecalho: 'Criado em', chave: 'criado_em', largura: 15 }
      ];
      
      // Gerar Excel
      const buffer = await relatorioService.gerarExcel(dadosExcel, {
        titulo: 'Usuários do Sistema',
        colunas,
        nomeArquivo: 'relatorio_usuarios'
      });
      
      // Enviar resposta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_usuarios_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      return res.send(buffer);
    } 
    else if (formato === 'csv') {
      // Preparar dados para CSV
      const dadosCSV = usuarios.map(usuario => ({
        nome: usuario.nome || '-',
        tipo_perfil: usuario.tipo_perfil || '-',
        email: usuario.email || '-',
        prefeitura: usuario.prefeitura?.nome || '-',
        celular: usuario.celular || '-',
        ativo: usuario.ativo ? 'Sim' : 'Não',
        criado_em: usuario.created_at ? relatorioService.formatarData(usuario.created_at) : '-'
      }));
      
      // Definir colunas
      const colunas = [
        { cabecalho: 'Nome', chave: 'nome' },
        { cabecalho: 'Perfil', chave: 'tipo_perfil' },
        { cabecalho: 'E-mail', chave: 'email' },
        { cabecalho: 'Prefeitura', chave: 'prefeitura' },
        { cabecalho: 'Celular', chave: 'celular' },
        { cabecalho: 'Ativo', chave: 'ativo' },
        { cabecalho: 'Criado em', chave: 'criado_em' }
      ];
      
      // Gerar CSV
      const buffer = await relatorioService.gerarCSV(dadosCSV, {
        colunas,
        nomeArquivo: 'relatorio_usuarios'
      });
      
      // Enviar resposta
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_usuarios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      return res.send(buffer);
    }
    else {
      // Formato padrão: PDF
      // Gerar o PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Configurar resposta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_usuarios_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Pipe para a resposta
      doc.pipe(res);
      
      // Adicionar cabeçalho
      doc.fontSize(18).text(titulo, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(subtitulo, { align: 'center' });
      doc.fontSize(10).text(periodo, { align: 'center' });
      doc.fontSize(10).text(dataGeracao, { align: 'center' });
      
      if (tipoUsuario) {
        doc.text(`Tipo de Usuário: ${tipoUsuario}`, { align: 'center' });
      }
      
      doc.moveDown();
      doc.fontSize(10).text(`Total de usuários encontrados: ${usuarios.length}`);
      doc.moveDown(2);
      
      // Adicionar tabela de dados
      const tableTop = 200;
      const tableLeft = 50;
      const colWidths = [150, 80, 150, 120];
      
      // Cabeçalhos da tabela
      doc.font('Helvetica-Bold');
      doc.text('Nome', tableLeft, tableTop);
      doc.text('Perfil', tableLeft + colWidths[0], tableTop);
      doc.text('Email', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Prefeitura', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.moveDown();
      
      // Linhas de dados
      let y = tableTop + 20;
      doc.font('Helvetica');
      
      usuarios.forEach((usuario, index) => {
        // Verificar se precisa adicionar uma nova página
        if (y > 700) {
          doc.addPage();
          y = 50;
          
          // Redesenhar cabeçalhos na nova página
          doc.font('Helvetica-Bold');
          doc.text('Nome', tableLeft, y);
          doc.text('Perfil', tableLeft + colWidths[0], y);
          doc.text('Email', tableLeft + colWidths[0] + colWidths[1], y);
          doc.text('Prefeitura', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
          doc.moveDown();
          
          doc.font('Helvetica');
          y += 20;
        }
        
        doc.text(usuario.nome || '-', tableLeft, y, { width: colWidths[0], ellipsis: true });
        doc.text(usuario.tipo_perfil || '-', tableLeft + colWidths[0], y, { width: colWidths[1], ellipsis: true });
        doc.text(usuario.email || '-', tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], ellipsis: true });
        doc.text(usuario.prefeitura?.nome || '-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], ellipsis: true });
        
        y += 20;
      });
      
      // Finalizar o documento
      doc.end();
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de usuários' });
  }
};

/**
 * Gera relatório de prefeituras cadastradas
 */
exports.gerarRelatorioPrefeituras = async (req, res) => {
  try {
    const { dataInicio, dataFim, status } = req.query;
    const userId = req.userId;
    const userTipo = req.userTipo;
    
    // Verificar se o usuário tem permissão
    if (!req.userPermissions.includes('gerar_relatorio_prefeituras')) {
      return res.status(403).json({ message: 'Você não tem permissão para gerar este relatório' });
    }

    // Super Admin pode ver todas as prefeituras, outros perfis apenas a sua
    if (userTipo !== 'Super Admin') {
      return res.status(403).json({ message: 'Apenas Super Admin pode gerar este relatório' });
    }

    // Preparar filtros
    const filtros = {};
    
    // Filtro por status, se informado
    if (status) {
      filtros.status = status;
    }

    // Filtro por data de criação
    if (dataInicio || dataFim) {
      filtros.created_at = {};
      if (dataInicio) {
        filtros.created_at.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        filtros.created_at.$lte = dataFimObj;
      }
    }

    // Buscar prefeituras conforme filtros
    const prefeituras = await Prefeitura.find(filtros).sort({ nome: 1 });

    // Calcular estatísticas
    const hoje = new Date();
    const prefeiturasPorStatus = {
      ativa: prefeituras.filter(p => p.status === 'ativa').length,
      expirada: prefeituras.filter(p => p.status === 'expirada').length,
      total: prefeituras.length
    };

    const prefeiturasPorVencimento = {
      vencidas: prefeituras.filter(p => p.data_validade_contrato < hoje).length,
      proximasAVencer: prefeituras.filter(p => {
        if (p.data_validade_contrato > hoje) {
          const diasRestantes = Math.ceil((p.data_validade_contrato - hoje) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 30;
        }
        return false;
      }).length
    };

    // Gerar o PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_prefeituras_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    // Pipe para a resposta
    doc.pipe(res);
    
    // Adicionar cabeçalho
    doc.fontSize(18).text('Relatório de Prefeituras Cadastradas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} a ${dataFim ? format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 'Atual'}`, { align: 'center' });
    doc.fontSize(10).text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, { align: 'center' });
    
    if (status) {
      doc.text(`Status: ${status}`, { align: 'center' });
    }
    
    doc.moveDown();
    
    // Adicionar resumo estatístico
    doc.fontSize(14).text('Resumo', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Total de prefeituras: ${prefeiturasPorStatus.total}`);
    doc.text(`Prefeituras ativas: ${prefeiturasPorStatus.ativa}`);
    doc.text(`Prefeituras expiradas: ${prefeiturasPorStatus.expirada}`);
    doc.text(`Prefeituras com contrato vencido: ${prefeiturasPorVencimento.vencidas}`);
    doc.text(`Prefeituras com contrato a vencer em 30 dias: ${prefeiturasPorVencimento.proximasAVencer}`);
    
    doc.moveDown(2);
    
    // Adicionar tabela de dados
    const tableTop = 250;
    const tableLeft = 50;
    const colWidths = [150, 100, 100, 100];
    
    // Cabeçalhos da tabela
    doc.font('Helvetica-Bold');
    doc.text('Nome', tableLeft, tableTop);
    doc.text('Cidade/UF', tableLeft + colWidths[0], tableTop);
    doc.text('Vencimento', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.moveDown();
    
    // Linhas de dados
    let y = tableTop + 20;
    doc.font('Helvetica');
    
    prefeituras.forEach((prefeitura, index) => {
      // Verificar se precisa adicionar uma nova página
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Redesenhar cabeçalhos na nova página
        doc.font('Helvetica-Bold');
        doc.text('Nome', tableLeft, y);
        doc.text('Cidade/UF', tableLeft + colWidths[0], y);
        doc.text('Vencimento', tableLeft + colWidths[0] + colWidths[1], y);
        doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.moveDown();
        
        doc.font('Helvetica');
        y += 20;
      }
      
      const localizacao = `${prefeitura.cidade || '-'}/${prefeitura.estado || '-'}`;
      const dataValidade = prefeitura.data_validade_contrato ? 
        format(new Date(prefeitura.data_validade_contrato), 'dd/MM/yyyy', { locale: ptBR }) : 
        '-';
      
      doc.text(prefeitura.nome || '-', tableLeft, y, { width: colWidths[0], ellipsis: true });
      doc.text(localizacao, tableLeft + colWidths[0], y, { width: colWidths[1], ellipsis: true });
      doc.text(dataValidade, tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], ellipsis: true });
      doc.text(prefeitura.status || '-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], ellipsis: true });
      
      y += 20;
    });
    
    // Finalizar o documento
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de prefeituras:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de prefeituras' });
  }
};

/**
 * Gera relatório de logs de acesso
 */
exports.gerarRelatorioLogs = async (req, res) => {
  try {
    const { dataInicio, dataFim, prefeituraId } = req.query;
    const userId = req.userId;
    const userTipo = req.userTipo;
    
    // Verificar se o usuário tem permissão
    if (!req.userPermissions.includes('gerar_relatorio_logs')) {
      return res.status(403).json({ message: 'Você não tem permissão para gerar este relatório' });
    }

    // Preparar filtros
    const filtros = {};
    
    // Se não for Super Admin, limitar pela prefeitura do usuário
    if (userTipo !== 'Super Admin') {
      filtros.prefeitura_id = req.userPrefeituraId;
    } else if (prefeituraId) {
      filtros.prefeitura_id = prefeituraId;
    }

    // Filtro por data de acesso
    if (dataInicio || dataFim) {
      filtros.data_acesso = {};
      if (dataInicio) {
        filtros.data_acesso.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        filtros.data_acesso.$lte = dataFimObj;
      }
    }

    // Buscar logs conforme filtros
    const logs = await LogAcesso.find(filtros)
      .populate('usuario_id', 'nome email tipo_perfil')
      .populate('prefeitura_id', 'nome')
      .sort({ data_acesso: -1 });

    // Buscar o nome da prefeitura filtrada, se houver
    let prefeituraNome = 'Todas as Prefeituras';
    if (filtros.prefeitura_id) {
      const prefeitura = await Prefeitura.findById(filtros.prefeitura_id);
      if (prefeitura) {
        prefeituraNome = prefeitura.nome;
      }
    }

    // Gerar o PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_logs_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    // Pipe para a resposta
    doc.pipe(res);
    
    // Adicionar cabeçalho
    doc.fontSize(18).text('Relatório de Logs de Acesso', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Prefeitura: ${prefeituraNome}`, { align: 'center' });
    doc.fontSize(10).text(`Período: ${dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} a ${dataFim ? format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 'Atual'}`, { align: 'center' });
    doc.fontSize(10).text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10).text(`Total de logs encontrados: ${logs.length}`);
    doc.moveDown(2);
    
    // Adicionar tabela de dados
    const tableTop = 200;
    const tableLeft = 50;
    const colWidths = [150, 120, 80, 140];
    
    // Cabeçalhos da tabela
    doc.font('Helvetica-Bold');
    doc.text('Usuário', tableLeft, tableTop);
    doc.text('Data/Hora', tableLeft + colWidths[0], tableTop);
    doc.text('IP', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Navegador', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.moveDown();
    
    // Linhas de dados
    let y = tableTop + 20;
    doc.font('Helvetica');
    
    logs.forEach((log, index) => {
      // Verificar se precisa adicionar uma nova página
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Redesenhar cabeçalhos na nova página
        doc.font('Helvetica-Bold');
        doc.text('Usuário', tableLeft, y);
        doc.text('Data/Hora', tableLeft + colWidths[0], y);
        doc.text('IP', tableLeft + colWidths[0] + colWidths[1], y);
        doc.text('Navegador', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.moveDown();
        
        doc.font('Helvetica');
        y += 20;
      }
      
      const usuario = log.usuario_id ? `${log.usuario_id.nome} (${log.usuario_id.tipo_perfil})` : '-';
      const dataAcesso = log.data_acesso ? 
        format(new Date(log.data_acesso), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : 
        '-';
      
      doc.text(usuario, tableLeft, y, { width: colWidths[0], ellipsis: true });
      doc.text(dataAcesso, tableLeft + colWidths[0], y, { width: colWidths[1], ellipsis: true });
      doc.text(log.ip || '-', tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], ellipsis: true });
      doc.text(log.user_agent?.substring(0, 30) || '-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], ellipsis: true });
      
      y += 20;
    });
    
    // Finalizar o documento
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de logs:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de logs' });
  }
};

/**
 * Gera relatório de solicitações de TFD
 */
exports.gerarRelatorioSolicitacoesTFD = async (req, res) => {
  try {
    const { dataInicio, dataFim, prefeituraId, status, tipoAtendimento } = req.query;
    const userId = req.userId;
    const userTipo = req.userTipo;
    
    // Verificar se o usuário tem permissão
    if (!req.userPermissions.includes('gerar_relatorio_solicitacoes_tfd')) {
      return res.status(403).json({ message: 'Você não tem permissão para gerar este relatório' });
    }

    // Preparar filtros
    const filtros = {};
    
    // Se não for Super Admin, limitar pela prefeitura do usuário
    if (userTipo !== 'Super Admin') {
      filtros.prefeitura = req.userPrefeituraId;
    } else if (prefeituraId) {
      filtros.prefeitura = prefeituraId;
    }

    // Filtro por status, se informado
    if (status) {
      filtros.status = status;
    }

    // Filtro por tipo de atendimento, se informado
    if (tipoAtendimento) {
      filtros.tipo_atendimento = tipoAtendimento;
    }

    // Filtro por data de solicitação
    if (dataInicio || dataFim) {
      filtros.data_solicitacao = {};
      if (dataInicio) {
        filtros.data_solicitacao.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        filtros.data_solicitacao.$lte = dataFimObj;
      }
    }

    // Buscar solicitações conforme filtros
    const solicitacoes = await SolicitacaoTFD.find(filtros)
      .populate('paciente', 'nome cpf')
      .populate('prefeitura', 'nome')
      .sort({ data_solicitacao: -1 });

    // Buscar o nome da prefeitura filtrada, se houver
    let prefeituraNome = 'Todas as Prefeituras';
    if (filtros.prefeitura) {
      const prefeitura = await Prefeitura.findById(filtros.prefeitura);
      if (prefeitura) {
        prefeituraNome = prefeitura.nome;
      }
    }

    // Calcular estatísticas
    const estatisticas = {
      total: solicitacoes.length,
      por_status: {},
      por_tipo_atendimento: {}
    };

    // Contagem por status
    solicitacoes.forEach(s => {
      // Contar por status
      if (!estatisticas.por_status[s.status]) {
        estatisticas.por_status[s.status] = 0;
      }
      estatisticas.por_status[s.status]++;

      // Contar por tipo de atendimento
      if (!estatisticas.por_tipo_atendimento[s.tipo_atendimento]) {
        estatisticas.por_tipo_atendimento[s.tipo_atendimento] = 0;
      }
      estatisticas.por_tipo_atendimento[s.tipo_atendimento]++;
    });

    // Gerar o PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_solicitacoes_tfd_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    // Pipe para a resposta
    doc.pipe(res);
    
    // Adicionar cabeçalho
    doc.fontSize(18).text('Relatório de Solicitações de TFD', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Prefeitura: ${prefeituraNome}`, { align: 'center' });
    doc.fontSize(10).text(`Período: ${dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} a ${dataFim ? format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 'Atual'}`, { align: 'center' });
    doc.fontSize(10).text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, { align: 'center' });
    
    if (status) {
      doc.text(`Status: ${status}`, { align: 'center' });
    }
    
    if (tipoAtendimento) {
      doc.text(`Tipo de Atendimento: ${tipoAtendimento}`, { align: 'center' });
    }
    
    doc.moveDown();
    
    // Adicionar resumo estatístico
    doc.fontSize(14).text('Resumo', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Total de solicitações: ${estatisticas.total}`);
    
    // Estatísticas por status
    doc.moveDown(0.5);
    doc.text('Por status:', { underline: true });
    Object.keys(estatisticas.por_status).forEach(status => {
      const statusFormatado = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
      doc.text(`${statusFormatado}: ${estatisticas.por_status[status]}`);
    });
    
    // Estatísticas por tipo de atendimento
    doc.moveDown(0.5);
    doc.text('Por tipo de atendimento:', { underline: true });
    Object.keys(estatisticas.por_tipo_atendimento).forEach(tipo => {
      const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      doc.text(`${tipoFormatado}: ${estatisticas.por_tipo_atendimento[tipo]}`);
    });
    
    doc.moveDown(2);
    
    // Adicionar tabela de dados
    const tableTop = 300;
    const tableLeft = 50;
    const colWidths = [70, 120, 100, 90, 80];
    
    // Cabeçalhos da tabela
    doc.font('Helvetica-Bold');
    doc.text('Número', tableLeft, tableTop);
    doc.text('Paciente', tableLeft + colWidths[0], tableTop);
    doc.text('Especialidade', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Data', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
    doc.moveDown();
    
    // Linhas de dados
    let y = tableTop + 20;
    doc.font('Helvetica');
    
    solicitacoes.forEach((solicitacao, index) => {
      // Verificar se precisa adicionar uma nova página
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Redesenhar cabeçalhos na nova página
        doc.font('Helvetica-Bold');
        doc.text('Número', tableLeft, y);
        doc.text('Paciente', tableLeft + colWidths[0], y);
        doc.text('Especialidade', tableLeft + colWidths[0] + colWidths[1], y);
        doc.text('Data', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        doc.moveDown();
        
        doc.font('Helvetica');
        y += 20;
      }
      
      const dataSolicitacao = solicitacao.data_solicitacao ? 
        format(new Date(solicitacao.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR }) : 
        '-';
      
      const statusFormatado = solicitacao.status ? 
        solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1).replace(/_/g, ' ') : 
        '-';
      
      doc.text(solicitacao.numero || '-', tableLeft, y, { width: colWidths[0], ellipsis: true });
      doc.text(solicitacao.paciente?.nome || '-', tableLeft + colWidths[0], y, { width: colWidths[1], ellipsis: true });
      doc.text(solicitacao.especialidade || '-', tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], ellipsis: true });
      doc.text(dataSolicitacao, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], ellipsis: true });
      doc.text(statusFormatado, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4], ellipsis: true });
      
      y += 20;
    });
    
    // Finalizar o documento
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de solicitações TFD:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de solicitações TFD' });
  }
};

/**
 * Gera relatório de solicitações de TFD por paciente
 */
exports.gerarRelatorioSolicitacoesPorPaciente = async (req, res) => {
  try {
    const { pacienteId, dataInicio, dataFim, status, tipoAtendimento } = req.query;
    const userId = req.userId;
    const userTipo = req.userTipo;
    
    // Verificar se o usuário tem permissão
    if (!req.userPermissions.includes('gerar_relatorio_solicitacoes_tfd')) {
      return res.status(403).json({ message: 'Você não tem permissão para gerar este relatório' });
    }

    // Verificar se foi informado o ID do paciente
    if (!pacienteId) {
      return res.status(400).json({ message: 'ID do paciente é obrigatório' });
    }

    // Preparar filtros
    const filtros = { paciente: pacienteId };
    
    // Se não for Super Admin, limitar pela prefeitura do usuário
    if (userTipo !== 'Super Admin') {
      filtros.prefeitura = req.userPrefeituraId;
    }

    // Adicionar filtros opcionais
    // Filtro por status
    if (status) {
      filtros.status = status;
    }

    // Filtro por tipo de atendimento
    if (tipoAtendimento) {
      filtros.tipo_atendimento = tipoAtendimento;
    }

    // Filtro por data de solicitação
    if (dataInicio || dataFim) {
      filtros.data_solicitacao = {};
      if (dataInicio) {
        filtros.data_solicitacao.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);
        filtros.data_solicitacao.$lte = dataFimObj;
      }
    }

    // Buscar o paciente
    const Paciente = require('../models/paciente.model');
    const paciente = await Paciente.findById(pacienteId);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Verificar se o usuário tem acesso a este paciente (apenas Super Admin pode ver qualquer paciente)
    if (userTipo !== 'Super Admin' && paciente.prefeitura.toString() !== req.userPrefeituraId) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar os dados deste paciente' });
    }

    // Buscar solicitações conforme filtros
    const solicitacoes = await SolicitacaoTFD.find(filtros)
      .populate('prefeitura', 'nome')
      .sort({ data_solicitacao: -1 });

    // Buscar nome da prefeitura
    let prefeituraNome = 'Não informada';
    if (paciente.prefeitura) {
      const prefeitura = await Prefeitura.findById(paciente.prefeitura);
      if (prefeitura) {
        prefeituraNome = prefeitura.nome;
      }
    }

    // Gerar o PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_paciente_${paciente.cpf}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    // Pipe para a resposta
    doc.pipe(res);
    
    // Adicionar cabeçalho
    doc.fontSize(18).text('Relatório de Solicitações TFD por Paciente', { align: 'center' });
    doc.moveDown();
    
    // Informações do paciente
    doc.fontSize(14).text('Dados do Paciente', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Nome: ${paciente.nome}`);
    doc.fontSize(11).text(`CPF: ${paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`);
    
    // Idade ou data de nascimento formatada
    if (paciente.data_nascimento) {
      const dataNasc = new Date(paciente.data_nascimento);
      const idade = Math.floor((new Date() - dataNasc) / (365.25 * 24 * 60 * 60 * 1000));
      doc.fontSize(11).text(`Data Nascimento: ${format(dataNasc, 'dd/MM/yyyy', { locale: ptBR })} (${idade} anos)`);
    }
    
    doc.fontSize(11).text(`Cartão SUS: ${paciente.cartao_sus || 'Não informado'}`);
    doc.fontSize(11).text(`Prefeitura: ${prefeituraNome}`);
    
    if (paciente.telefone) {
      doc.fontSize(11).text(`Telefone: ${paciente.telefone}`);
    }
    
    // Verificar se há endereço completo
    if (paciente.endereco_completo) {
      doc.fontSize(11).text(`Endereço: ${paciente.endereco_completo}`);
    } else if (paciente.logradouro) {
      let endereco = `${paciente.logradouro}, ${paciente.numero}`;
      if (paciente.complemento) endereco += `, ${paciente.complemento}`;
      endereco += ` - ${paciente.bairro}, ${paciente.cidade}/${paciente.estado}`;
      if (paciente.cep) endereco += ` - CEP: ${paciente.cep}`;
      doc.fontSize(11).text(`Endereço: ${endereco}`);
    }
    
    doc.moveDown(2);
    
    // Informações de filtros aplicados
    if (status || tipoAtendimento || dataInicio || dataFim) {
      doc.fontSize(12).text('Filtros Aplicados', { underline: true });
      doc.fontSize(10);
      
      if (status) {
        const statusFormatado = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
        doc.text(`Status: ${statusFormatado}`);
      }
      
      if (tipoAtendimento) {
        const tipoFormatado = tipoAtendimento.charAt(0).toUpperCase() + tipoAtendimento.slice(1);
        doc.text(`Tipo de Atendimento: ${tipoFormatado}`);
      }
      
      if (dataInicio || dataFim) {
        const periodoTexto = `Período: ${dataInicio ? format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} a ${dataFim ? format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 'Atual'}`;
        doc.text(periodoTexto);
      }
      
      doc.moveDown(1);
    }
    
    // Informações de solicitações
    doc.fontSize(14).text('Histórico de Solicitações TFD', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Total de Solicitações Encontradas: ${solicitacoes.length}`);
    doc.moveDown();
    
    if (solicitacoes.length === 0) {
      doc.fontSize(11).text('Nenhuma solicitação encontrada para este paciente.', { italic: true });
    } else {
      // Para cada solicitação, mostrar detalhes
      solicitacoes.forEach((solicitacao, index) => {
        // Adicionar nova página se necessário
        if (index > 0 && doc.y > 650) {
          doc.addPage();
        }
        
        const dataSolicitacao = solicitacao.data_solicitacao ? 
          format(new Date(solicitacao.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR }) : 
          'Não informada';
        
        const dataAgendamento = solicitacao.data_agendamento ? 
          format(new Date(solicitacao.data_agendamento), 'dd/MM/yyyy', { locale: ptBR }) : 
          'Não agendada';
        
        const statusFormatado = solicitacao.status ? 
          solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1).replace(/_/g, ' ') : 
          'Não definido';
        
        doc.fontSize(12).text(`Solicitação #${index + 1}: ${solicitacao.numero}`, { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).text(`Data: ${dataSolicitacao} - Status: ${statusFormatado}`);
        doc.fontSize(10).text(`Especialidade: ${solicitacao.especialidade} - Tipo: ${solicitacao.tipo_atendimento}`);
        
        if (solicitacao.data_agendamento) {
          doc.fontSize(10).text(`Agendamento: ${dataAgendamento}`);
        }
        
        if (solicitacao.destino && (solicitacao.destino.cidade || solicitacao.destino.estabelecimento)) {
          doc.fontSize(10).text(`Destino: ${solicitacao.destino.estabelecimento || ''} - ${solicitacao.destino.cidade || ''}/${solicitacao.destino.estado || ''}`);
        }
        
        if (solicitacao.medico_solicitante && solicitacao.medico_solicitante.nome) {
          doc.fontSize(10).text(`Médico Solicitante: ${solicitacao.medico_solicitante.nome} - CRM: ${solicitacao.medico_solicitante.crm || 'Não informado'}`);
        }
        
        if (solicitacao.justificativa_clinica) {
          doc.fontSize(10).text(`Justificativa: ${solicitacao.justificativa_clinica.substring(0, 100)}${solicitacao.justificativa_clinica.length > 100 ? '...' : ''}`);
        }
        
        if (solicitacao.acompanhante) {
          doc.fontSize(10).text('Necessita Acompanhante: Sim');
        }
        
        doc.moveDown(1);
      });
    }
    
    // Rodapé
    const totalPages = doc.bufferedPageRange().count;
    let currentPage = 1;
    
    const addFooter = () => {
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      
      doc.fontSize(8);
      doc.text(
        `Página ${currentPage} de ${totalPages} - Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`,
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
      );
      
      doc.page.margins.bottom = oldBottomMargin;
      currentPage++;
    };
    
    // Adicionar o rodapé a todas as páginas
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      addFooter();
    }
    
    // Finalizar o documento
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório por paciente:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório por paciente' });
  }
}; 