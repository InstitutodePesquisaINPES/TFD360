const SolicitacaoTFD = require('../models/solicitacao-tfd.model');
const ApiError = require('../utils/api-error');
const { gerarNumeroSolicitacao } = require('../utils/geradores');

/**
 * Controller para gerenciar solicitações de TFD (Tratamento Fora do Domicílio)
 */
class SolicitacaoTFDController {
  /**
   * Lista todas as solicitações TFD com filtros opcionais
   */
  async listarSolicitacoes(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        prioridade,
        data_inicio,
        data_fim,
        municipio_origem,
        municipio_destino,
        especialidade,
        termo_busca
      } = req.query;

      const skip = (page - 1) * limit;
      const filtros = {};

      // Aplicar filtros se fornecidos
      if (status) filtros.status = status;
      if (prioridade) filtros.prioridade = prioridade;
      if (municipio_origem) filtros.municipio_origem = municipio_origem;
      if (municipio_destino) filtros.municipio_destino = municipio_destino;
      if (especialidade) filtros.especialidade = especialidade;

      // Filtro por período de data
      if (data_inicio || data_fim) {
        filtros.data_solicitacao = {};
        if (data_inicio) filtros.data_solicitacao.$gte = new Date(data_inicio);
        if (data_fim) filtros.data_solicitacao.$lte = new Date(data_fim);
      }

      // Filtro de busca por termo
      if (termo_busca) {
        filtros.$or = [
          { numero_solicitacao: { $regex: termo_busca, $options: 'i' } },
          { 'paciente.nome': { $regex: termo_busca, $options: 'i' } },
          { 'medico_solicitante.nome': { $regex: termo_busca, $options: 'i' } }
        ];
      }

      // Restringir acesso baseado no perfil do usuário
      if (req.user.tipo_perfil === 'prefeitura_admin') {
        filtros.municipio_origem = req.user.prefeitura.municipio;
      }

      const solicitacoes = await SolicitacaoTFD.find(filtros)
        .populate('paciente', 'nome cpf data_nascimento')
        .populate('medico_solicitante', 'nome crm especialidade')
        .populate('usuario_criacao', 'nome email')
        .sort({ data_solicitacao: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await SolicitacaoTFD.countDocuments(filtros);

      res.status(200).json({
        solicitacoes,
        paginacao: {
          total,
          pagina_atual: parseInt(page),
          total_paginas: Math.ceil(total / limit),
          itens_por_pagina: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma solicitação TFD pelo ID
   */
  async buscarSolicitacaoPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      const solicitacao = await SolicitacaoTFD.findById(id)
        .populate('paciente')
        .populate('medico_solicitante')
        .populate('usuario_criacao', 'nome email')
        .populate('usuario_atualizacao', 'nome email')
        .populate('comentarios.autor', 'nome email foto')
        .populate('historico.usuario', 'nome email');
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Verificar permissão para visualizar se for admin de prefeitura
      if (req.user.tipo_perfil === 'prefeitura_admin' && 
          solicitacao.municipio_origem !== req.user.prefeitura.municipio) {
        return next(new ApiError('Acesso negado: Esta solicitação não pertence ao seu município', 403));
      }
      
      res.status(200).json(solicitacao);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova solicitação TFD
   */
  async criarSolicitacao(req, res, next) {
    try {
      const {
        paciente,
        medico_solicitante,
        municipio_destino,
        especialidade,
        justificativa_clinica,
        data_agendamento,
        prioridade,
        tipo_transporte,
        acompanhante_necessario,
        justificativa_acompanhante,
        documentos,
        observacoes
      } = req.body;

      // Definir município de origem baseado no usuário ou no valor fornecido
      let municipio_origem = req.body.municipio_origem;
      if (req.user.tipo_perfil === 'prefeitura_admin') {
        municipio_origem = req.user.prefeitura.municipio;
      } else if (!municipio_origem) {
        return next(new ApiError('O município de origem é obrigatório', 400));
      }

      // Gerar número de solicitação
      const numero_solicitacao = await gerarNumeroSolicitacao();

      const novaSolicitacao = new SolicitacaoTFD({
        numero_solicitacao,
        paciente,
        medico_solicitante,
        municipio_origem,
        municipio_destino,
        especialidade,
        justificativa_clinica,
        data_agendamento,
        prioridade,
        tipo_transporte,
        acompanhante_necessario,
        justificativa_acompanhante,
        documentos,
        observacoes,
        usuario_criacao: req.user.id
      });

      // Adicionar primeiro registro ao histórico
      novaSolicitacao.historico.push({
        usuario: req.user.id,
        acao: 'criacao',
        para: {
          status: novaSolicitacao.status,
          prioridade: novaSolicitacao.prioridade
        }
      });

      await novaSolicitacao.save();

      res.status(201).json(novaSolicitacao);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma solicitação TFD existente
   */
  async atualizarSolicitacao(req, res, next) {
    try {
      const { id } = req.params;
      const {
        paciente,
        medico_solicitante,
        municipio_destino,
        especialidade,
        justificativa_clinica,
        data_agendamento,
        prioridade,
        tipo_transporte,
        acompanhante_necessario,
        justificativa_acompanhante,
        documentos,
        observacoes
      } = req.body;

      const solicitacao = await SolicitacaoTFD.findById(id);
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Verificar permissões de atualização
      if (req.user.tipo_perfil === 'prefeitura_admin' && 
          solicitacao.municipio_origem !== req.user.prefeitura.municipio) {
        return next(new ApiError('Acesso negado: Esta solicitação não pertence ao seu município', 403));
      }

      if (['realizado', 'negado', 'cancelado'].includes(solicitacao.status)) {
        return next(new ApiError('Não é possível editar uma solicitação finalizada, negada ou cancelada', 400));
      }

      // Registrar mudanças de prioridade no histórico
      if (prioridade && prioridade !== solicitacao.prioridade) {
        solicitacao.historico.push({
          usuario: req.user.id,
          acao: 'alteracao_prioridade',
          de: { prioridade: solicitacao.prioridade },
          para: { prioridade }
        });
      }

      // Atualizar campos permitidos
      if (paciente) solicitacao.paciente = paciente;
      if (medico_solicitante) solicitacao.medico_solicitante = medico_solicitante;
      if (municipio_destino) solicitacao.municipio_destino = municipio_destino;
      if (especialidade) solicitacao.especialidade = especialidade;
      if (justificativa_clinica) solicitacao.justificativa_clinica = justificativa_clinica;
      if (data_agendamento) solicitacao.data_agendamento = data_agendamento;
      if (prioridade) solicitacao.prioridade = prioridade;
      if (tipo_transporte) solicitacao.tipo_transporte = tipo_transporte;
      if (acompanhante_necessario !== undefined) solicitacao.acompanhante_necessario = acompanhante_necessario;
      if (justificativa_acompanhante) solicitacao.justificativa_acompanhante = justificativa_acompanhante;
      if (documentos) solicitacao.documentos = documentos;
      if (observacoes) solicitacao.observacoes = observacoes;

      // Atualizar informações de auditoria
      solicitacao.usuario_atualizacao = req.user.id;
      solicitacao.data_atualizacao = new Date();

      await solicitacao.save();

      res.status(200).json(solicitacao);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Altera o status de uma solicitação TFD
   */
  async alterarStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, motivo } = req.body;
      
      if (!['pendente', 'em_analise', 'aprovado', 'agendado', 'realizado', 'negado'].includes(status)) {
        return next(new ApiError('Status inválido', 400));
      }
      
      const solicitacao = await SolicitacaoTFD.findById(id);
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Verificar permissões
      if (req.user.tipo_perfil === 'prefeitura_admin' && 
          solicitacao.municipio_origem !== req.user.prefeitura.municipio) {
        return next(new ApiError('Acesso negado: Esta solicitação não pertence ao seu município', 403));
      }

      if (solicitacao.status === 'cancelado') {
        return next(new ApiError('Não é possível alterar o status de uma solicitação cancelada', 400));
      }

      // Guardar status anterior para histórico
      const statusAnterior = solicitacao.status;
      
      // Atualizar campos
      solicitacao.status = status;
      
      // Adicionar motivos específicos para negação
      if (status === 'negado' && motivo) {
        solicitacao.motivo_negacao = motivo;
      }

      // Adicionar ao histórico
      solicitacao.historico.push({
        usuario: req.user.id,
        acao: 'alteracao_status',
        de: { status: statusAnterior },
        para: { status },
        motivo
      });

      // Atualizar informações de auditoria
      solicitacao.usuario_atualizacao = req.user.id;
      solicitacao.data_atualizacao = new Date();

      await solicitacao.save();

      res.status(200).json(solicitacao);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona um comentário à solicitação TFD
   */
  async adicionarComentario(req, res, next) {
    try {
      const { id } = req.params;
      const { texto } = req.body;
      
      if (!texto) {
        return next(new ApiError('O texto do comentário é obrigatório', 400));
      }
      
      const solicitacao = await SolicitacaoTFD.findById(id);
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Verificar permissões
      if (req.user.tipo_perfil === 'prefeitura_admin' && 
          solicitacao.municipio_origem !== req.user.prefeitura.municipio) {
        return next(new ApiError('Acesso negado: Esta solicitação não pertence ao seu município', 403));
      }

      // Adicionar comentário
      solicitacao.comentarios.push({
        autor: req.user.id,
        texto,
        data: new Date()
      });

      await solicitacao.save();

      // Retornar o comentário adicionado com o autor populado
      const comentarioAdicionado = solicitacao.comentarios[solicitacao.comentarios.length - 1];
      
      await SolicitacaoTFD.populate(solicitacao, {
        path: 'comentarios.autor',
        select: 'nome email foto',
        match: { _id: comentarioAdicionado.autor }
      });

      res.status(201).json(solicitacao.comentarios[solicitacao.comentarios.length - 1]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancela uma solicitação TFD
   */
  async cancelarSolicitacao(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo_cancelamento } = req.body;
      
      if (!motivo_cancelamento) {
        return next(new ApiError('O motivo do cancelamento é obrigatório', 400));
      }
      
      const solicitacao = await SolicitacaoTFD.findById(id);
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Verificar permissões
      if (req.user.tipo_perfil === 'prefeitura_admin' && 
          solicitacao.municipio_origem !== req.user.prefeitura.municipio) {
        return next(new ApiError('Acesso negado: Esta solicitação não pertence ao seu município', 403));
      }

      if (['realizado', 'negado', 'cancelado'].includes(solicitacao.status)) {
        return next(new ApiError('Não é possível cancelar uma solicitação finalizada, negada ou já cancelada', 400));
      }

      // Guardar status anterior para histórico
      const statusAnterior = solicitacao.status;
      
      // Atualizar campos
      solicitacao.status = 'cancelado';
      solicitacao.motivo_cancelamento = motivo_cancelamento;
      
      // Adicionar ao histórico
      solicitacao.historico.push({
        usuario: req.user.id,
        acao: 'cancelamento',
        de: { status: statusAnterior },
        para: { status: 'cancelado' },
        motivo: motivo_cancelamento
      });

      // Atualizar informações de auditoria
      solicitacao.usuario_atualizacao = req.user.id;
      solicitacao.data_atualizacao = new Date();

      await solicitacao.save();

      res.status(200).json(solicitacao);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deleta uma solicitação TFD (apenas para super_admin)
   */
  async excluirSolicitacao(req, res, next) {
    try {
      const { id } = req.params;
      
      const solicitacao = await SolicitacaoTFD.findById(id);
      
      if (!solicitacao) {
        return next(new ApiError('Solicitação TFD não encontrada', 404));
      }

      // Apenas super_admin pode excluir
      if (req.user.tipo_perfil !== 'super_admin') {
        return next(new ApiError('Apenas administradores podem excluir solicitações', 403));
      }

      await SolicitacaoTFD.findByIdAndDelete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas de solicitações TFD
   */
  async estatisticasSolicitacoesTFD(req, res) {
    try {
      const userId = req.userId;
      const userTipo = req.userTipo;
      
      // Filtro base (se não for Super Admin, limita pela prefeitura do usuário)
      const filtroBase = {};
      
      if (userTipo !== 'Super Admin') {
        filtroBase.prefeitura = req.userPrefeituraId;
      }
      
      // Buscar o total de solicitações
      const total = await SolicitacaoTFD.countDocuments(filtroBase);
      
      // Contar por status
      const countPorStatus = await SolicitacaoTFD.aggregate([
        { $match: filtroBase },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      // Formatar contagem por status
      const porStatus = {};
      countPorStatus.forEach(item => {
        porStatus[item._id] = item.count;
      });
      
      // Contar por prioridade
      const countPorPrioridade = await SolicitacaoTFD.aggregate([
        { $match: filtroBase },
        { $group: { _id: '$prioridade', count: { $sum: 1 } } }
      ]);
      
      // Formatar contagem por prioridade
      const porPrioridade = {};
      countPorPrioridade.forEach(item => {
        porPrioridade[item._id] = item.count;
      });
      
      // Contar por tipo de atendimento
      const countPorTipoAtendimento = await SolicitacaoTFD.aggregate([
        { $match: filtroBase },
        { $group: { _id: '$tipo_atendimento', count: { $sum: 1 } } }
      ]);
      
      // Formatar contagem por tipo de atendimento
      const porTipoAtendimento = {};
      countPorTipoAtendimento.forEach(item => {
        porTipoAtendimento[item._id] = item.count;
      });
      
      // Calcular solicitações do mês atual
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const solicitacoesMes = await SolicitacaoTFD.countDocuments({
        ...filtroBase,
        data_solicitacao: { $gte: inicioMes, $lte: fimMes }
      });
      
      // Retornar todas as estatísticas
      res.json({
        total,
        por_status: porStatus,
        por_prioridade: porPrioridade,
        por_tipo_atendimento: porTipoAtendimento,
        solicitacoes_mes: solicitacoesMes
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas de solicitações TFD:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas de solicitações TFD' });
    }
  }
}

module.exports = new SolicitacaoTFDController(); 