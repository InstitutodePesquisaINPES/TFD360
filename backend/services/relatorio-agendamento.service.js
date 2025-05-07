const cron = require('node-cron');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

// Modelos
const AgendamentoRelatorio = require('../models/agendamento-relatorio.model');
const User = require('../models/user.model');

// Serviços
const relatorioService = require('./relatorio.service');
const relatorioFinanceiroService = require('./relatorio-financeiro.service');
const relatorioEspecialidadeService = require('./relatorio-especialidade.service');
const relatorioTempoEsperaService = require('./relatorio-tempo-espera.service');

/**
 * Serviço para agendamento de geração automática de relatórios
 */
class RelatorioAgendamentoService {
  constructor() {
    this.tarefas = new Map();
    this.emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASS || 'password'
      }
    };
    
    this.tempDir = path.join(__dirname, '../temp/relatorios-agendados');
    
    // Garantir que diretório temporário exista
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Inicializa o serviço de agendamento
   */
  async inicializar() {
    try {
      console.log('Iniciando serviço de agendamento de relatórios...');
      await this.carregarAgendamentos();
      
      // Agendar verificação periódica de novos agendamentos
      cron.schedule('*/5 * * * *', () => this.carregarAgendamentos());
      
      console.log('Serviço de agendamento de relatórios iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar serviço de agendamento:', error);
    }
  }

  /**
   * Carrega todos os agendamentos ativos do banco de dados
   */
  async carregarAgendamentos() {
    try {
      const agendamentos = await AgendamentoRelatorio.find({ 
        ativo: true,
        proxima_execucao: { $lte: new Date(Date.now() + 1000 * 60 * 60) } // Próxima hora
      });
      
      for (const agendamento of agendamentos) {
        this.agendarTarefa(agendamento);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      return false;
    }
  }

  /**
   * Agenda uma tarefa baseada em um documento de agendamento
   * 
   * @param {Object} agendamento - Documento de agendamento
   */
  agendarTarefa(agendamento) {
    // Se já existir uma tarefa com este ID, remover
    if (this.tarefas.has(agendamento._id.toString())) {
      this.tarefas.get(agendamento._id.toString()).stop();
      this.tarefas.delete(agendamento._id.toString());
    }
    
    // Calcular quando deve executar
    const agora = new Date();
    const proximaExecucao = new Date(agendamento.proxima_execucao);
    
    // Se a próxima execução já passou, executar imediatamente
    if (proximaExecucao <= agora) {
      console.log(`Executando agendamento imediatamente: ${agendamento._id}`);
      this.executarAgendamento(agendamento);
      return;
    }
    
    // Diferença em milissegundos
    const diferencaMs = proximaExecucao.getTime() - agora.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    console.log(`Agendando relatório ${agendamento._id} para executar em ${diferencaMinutos} minutos`);
    
    // Agendar execução
    const timeout = setTimeout(() => {
      this.executarAgendamento(agendamento);
    }, diferencaMs);
    
    // Armazenar referência da tarefa
    this.tarefas.set(agendamento._id.toString(), {
      stop: () => clearTimeout(timeout),
      agendamento
    });
  }

  /**
   * Executa um agendamento de relatório
   * 
   * @param {Object} agendamento - Documento de agendamento
   */
  async executarAgendamento(agendamento) {
    console.log(`Executando agendamento de relatório: ${agendamento._id}`);
    
    try {
      let resultado = null;
      let nomeArquivo = '';
      let mimetype = '';
      
      // Determinar o tipo de relatório e gerar
      switch (agendamento.tipo_relatorio) {
        case 'financeiro':
          resultado = await relatorioFinanceiroService.gerarRelatorio(
            agendamento.parametros || {},
            agendamento.formato || 'pdf'
          );
          nomeArquivo = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}`;
          break;
          
        case 'especialidade':
          resultado = await relatorioEspecialidadeService.gerarRelatorio(
            agendamento.parametros || {},
            agendamento.formato || 'pdf'
          );
          nomeArquivo = `relatorio_especialidade_${format(new Date(), 'yyyy-MM-dd')}`;
          break;
          
        case 'tempo_espera':
          resultado = await relatorioTempoEsperaService.gerarRelatorio(
            agendamento.parametros || {},
            agendamento.formato || 'pdf'
          );
          nomeArquivo = `relatorio_tempo_espera_${format(new Date(), 'yyyy-MM-dd')}`;
          break;
          
        // Outros tipos de relatório...
        
        default:
          throw new Error(`Tipo de relatório não suportado: ${agendamento.tipo_relatorio}`);
      }
      
      // Determinar extensão e mimetype
      switch (agendamento.formato) {
        case 'excel':
          nomeArquivo += '.xlsx';
          mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          nomeArquivo += '.csv';
          mimetype = 'text/csv';
          break;
        default:
          nomeArquivo += '.pdf';
          mimetype = 'application/pdf';
      }
      
      // Salvar relatório temporariamente
      const caminhoArquivo = path.join(this.tempDir, nomeArquivo);
      fs.writeFileSync(caminhoArquivo, resultado);
      
      // Enviar relatório por e-mail para os destinatários
      if (agendamento.email_destinatarios && agendamento.email_destinatarios.length > 0) {
        await this.enviarRelatorioPorEmail(
          agendamento.email_destinatarios,
          agendamento.nome || `Relatório ${agendamento.tipo_relatorio}`,
          `Relatório gerado automaticamente em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
          caminhoArquivo,
          nomeArquivo,
          mimetype
        );
      }
      
      // Remover arquivo temporário
      fs.unlinkSync(caminhoArquivo);
      
      // Atualizar próxima execução
      const proximaExecucao = this.calcularProximaExecucao(agendamento);
      await AgendamentoRelatorio.findByIdAndUpdate(agendamento._id, {
        ultima_execucao: new Date(),
        proxima_execucao: proximaExecucao,
        ultima_execucao_status: 'sucesso'
      });
      
      // Reagendar se for periódico
      if (agendamento.periodicidade) {
        const agendamentoAtualizado = await AgendamentoRelatorio.findById(agendamento._id);
        this.agendarTarefa(agendamentoAtualizado);
      }
      
      console.log(`Agendamento ${agendamento._id} executado com sucesso.`);
      return true;
    } catch (error) {
      console.error(`Erro ao executar agendamento ${agendamento._id}:`, error);
      
      // Atualizar status de erro
      await AgendamentoRelatorio.findByIdAndUpdate(agendamento._id, {
        ultima_execucao: new Date(),
        ultima_execucao_status: 'erro',
        ultima_execucao_erro: error.message
      });
      
      return false;
    }
  }

  /**
   * Calcula a próxima execução baseada na periodicidade
   * 
   * @param {Object} agendamento - Documento de agendamento
   * @returns {Date} - Data da próxima execução
   */
  calcularProximaExecucao(agendamento) {
    const agora = new Date();
    
    if (!agendamento.periodicidade) {
      // Se não tem periodicidade, não agendar novamente
      return null;
    }
    
    switch (agendamento.periodicidade) {
      case 'diario':
        return new Date(agora.setDate(agora.getDate() + 1));
        
      case 'semanal':
        return new Date(agora.setDate(agora.getDate() + 7));
        
      case 'quinzenal':
        return new Date(agora.setDate(agora.getDate() + 15));
        
      case 'mensal':
        return new Date(agora.setMonth(agora.getMonth() + 1));
        
      case 'trimestral':
        return new Date(agora.setMonth(agora.getMonth() + 3));
        
      case 'semestral':
        return new Date(agora.setMonth(agora.getMonth() + 6));
        
      case 'anual':
        return new Date(agora.setFullYear(agora.getFullYear() + 1));
        
      default:
        return null;
    }
  }

  /**
   * Envia relatório por email para os destinatários
   * 
   * @param {Array} destinatarios - Array de emails
   * @param {string} assunto - Assunto do email
   * @param {string} mensagem - Corpo do email
   * @param {string} caminhoArquivo - Caminho do arquivo a anexar
   * @param {string} nomeArquivo - Nome do arquivo
   * @param {string} mimetype - Tipo MIME do arquivo
   * @returns {boolean} - Sucesso do envio
   */
  async enviarRelatorioPorEmail(destinatarios, assunto, mensagem, caminhoArquivo, nomeArquivo, mimetype) {
    try {
      const transporter = nodemailer.createTransport(this.emailConfig);
      
      const info = await transporter.sendMail({
        from: `"TFD360" <${this.emailConfig.auth.user}>`,
        to: destinatarios.join(', '),
        subject: assunto,
        text: mensagem,
        html: `<p>${mensagem}</p><p>Este é um email automático, por favor não responda.</p>`,
        attachments: [
          {
            filename: nomeArquivo,
            path: caminhoArquivo,
            contentType: mimetype
          }
        ]
      });
      
      console.log(`Email enviado: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Cria um novo agendamento de relatório
   * 
   * @param {Object} dadosAgendamento - Dados do agendamento
   * @returns {Object} - Agendamento criado
   */
  async criarAgendamento(dadosAgendamento) {
    try {
      // Calcular próxima execução baseada na data definida
      const proxima_execucao = dadosAgendamento.data_hora_inicial 
        ? new Date(dadosAgendamento.data_hora_inicial)
        : new Date(); // Se não informado, agendar para agora
      
      const novoAgendamento = new AgendamentoRelatorio({
        ...dadosAgendamento,
        proxima_execucao,
        criado_em: new Date(),
        ativo: true
      });
      
      await novoAgendamento.save();
      
      // Agendar tarefa imediatamente se próxima execução for breve
      const agora = new Date();
      if (proxima_execucao.getTime() - agora.getTime() < 1000 * 60 * 60) { // Menos de 1 hora
        this.agendarTarefa(novoAgendamento);
      }
      
      return novoAgendamento;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um agendamento existente
   * 
   * @param {string} id - ID do agendamento
   * @param {Object} dadosAtualizacao - Dados para atualizar
   * @returns {Object} - Agendamento atualizado
   */
  async atualizarAgendamento(id, dadosAtualizacao) {
    try {
      // Se houver alteração da data inicial, recalcular próxima execução
      if (dadosAtualizacao.data_hora_inicial) {
        dadosAtualizacao.proxima_execucao = new Date(dadosAtualizacao.data_hora_inicial);
      }
      
      const agendamentoAtualizado = await AgendamentoRelatorio.findByIdAndUpdate(
        id,
        dadosAtualizacao,
        { new: true }
      );
      
      // Se o agendamento estiver ativo, reagendar
      if (agendamentoAtualizado.ativo) {
        // Remover tarefa anterior se existir
        if (this.tarefas.has(id)) {
          this.tarefas.get(id).stop();
          this.tarefas.delete(id);
        }
        
        // Reagendar
        this.agendarTarefa(agendamentoAtualizado);
      }
      
      return agendamentoAtualizado;
    } catch (error) {
      console.error(`Erro ao atualizar agendamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ativa ou desativa um agendamento
   * 
   * @param {string} id - ID do agendamento
   * @param {boolean} ativo - Status de ativação 
   * @returns {Object} - Agendamento atualizado
   */
  async alterarStatusAgendamento(id, ativo) {
    try {
      const agendamentoAtualizado = await AgendamentoRelatorio.findByIdAndUpdate(
        id,
        { ativo },
        { new: true }
      );
      
      // Se desativou, cancelar tarefa agendada
      if (!ativo && this.tarefas.has(id)) {
        this.tarefas.get(id).stop();
        this.tarefas.delete(id);
      }
      
      // Se ativou, agendar tarefa
      if (ativo) {
        this.agendarTarefa(agendamentoAtualizado);
      }
      
      return agendamentoAtualizado;
    } catch (error) {
      console.error(`Erro ao alterar status do agendamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove um agendamento
   * 
   * @param {string} id - ID do agendamento
   * @returns {boolean} - Sucesso da remoção
   */
  async removerAgendamento(id) {
    try {
      // Remover tarefa agendada
      if (this.tarefas.has(id)) {
        this.tarefas.get(id).stop();
        this.tarefas.delete(id);
      }
      
      // Remover do banco de dados
      await AgendamentoRelatorio.findByIdAndDelete(id);
      
      return true;
    } catch (error) {
      console.error(`Erro ao remover agendamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos os agendamentos
   * 
   * @param {Object} filtros - Filtros para a busca
   * @returns {Array} - Lista de agendamentos
   */
  async listarAgendamentos(filtros = {}) {
    try {
      return await AgendamentoRelatorio.find(filtros).sort({ proxima_execucao: 1 });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      throw error;
    }
  }

  /**
   * Executa um agendamento manualmente
   * 
   * @param {string} id - ID do agendamento
   * @returns {boolean} - Sucesso da execução
   */
  async executarAgendamentoManual(id) {
    try {
      const agendamento = await AgendamentoRelatorio.findById(id);
      
      if (!agendamento) {
        throw new Error('Agendamento não encontrado');
      }
      
      return await this.executarAgendamento(agendamento);
    } catch (error) {
      console.error(`Erro ao executar agendamento manual ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new RelatorioAgendamentoService(); 