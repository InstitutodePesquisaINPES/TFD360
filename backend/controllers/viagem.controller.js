const viagemService = require('../services/viagem.service');
const { validarObjetoId, tratarErro } = require('../utils/controller.util');
const Viagem = require('../models/viagem.model');
const Paciente = require('../models/paciente.model');
const { ApiError } = require('../utils/ApiError');
const { validarViagem } = require('../utils/validacoes');

/**
 * Criar uma nova viagem
 */
const criarViagem = async (req, res) => {
  try {
    const dadosViagem = req.body;
    
    // Adicionar prefeitura do usuário
    dadosViagem.prefeitura = req.usuario.prefeitura;
    
    // Chamar serviço para criar a viagem
    const viagem = await viagemService.criarViagem(dadosViagem, req.usuario._id);
    
    return res.status(201).json(viagem);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Obter uma viagem por ID
 */
const obterViagemPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    validarObjetoId(id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para obter a viagem
    const viagem = await viagemService.obterViagemPorId(id, prefeitura_id);
    
    return res.status(200).json(viagem);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Listar viagens com paginação e filtros
 */
const listarViagens = async (req, res) => {
  try {
    // Obter filtros da query
    const filtros = req.query;
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para listar viagens
    const resultado = await viagemService.listarViagens(filtros, prefeitura_id);
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Atualizar uma viagem
 */
const atualizarViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para atualizar a viagem
    const viagem = await viagemService.atualizarViagem(id, dadosAtualizacao, req.usuario._id, prefeitura_id);
    
    return res.status(200).json(viagem);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Cancelar uma viagem
 */
const cancelarViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de viagem inválido');
    
    // Validar motivo
    if (!motivo) {
      return res.status(400).json({ 
        mensagem: 'Motivo do cancelamento é obrigatório' 
      });
    }
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para cancelar a viagem
    const resultado = await viagemService.cancelarViagem(id, motivo, req.usuario._id, prefeitura_id);
    
    return res.status(200).json({
      mensagem: 'Viagem cancelada com sucesso',
      viagem: resultado
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Adicionar paciente à viagem
 */
const adicionarPacienteViagem = async (req, res) => {
  try {
    const { viagem_id, paciente_id } = req.params;
    const dadosPaciente = req.body;
    
    // Validar IDs
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    validarObjetoId(paciente_id, 'ID de paciente inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para adicionar paciente
    const resultado = await viagemService.adicionarPacienteViagem(
      viagem_id, 
      paciente_id, 
      dadosPaciente, 
      req.usuario._id, 
      prefeitura_id
    );
    
    // Verificar se foi adicionado à lista de espera
    if (resultado.adicionado_lista_espera) {
      return res.status(202).json({
        mensagem: 'Paciente adicionado à lista de espera devido à falta de vagas',
        lista_espera: resultado
      });
    }
    
    return res.status(201).json({
      mensagem: 'Paciente adicionado à viagem com sucesso',
      viagem_paciente: resultado
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Adicionar paciente à lista de espera
 */
const adicionarPacienteListaEspera = async (req, res) => {
  try {
    const { viagem_id, paciente_id } = req.params;
    const dadosPaciente = req.body;
    
    // Validar IDs
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    validarObjetoId(paciente_id, 'ID de paciente inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para adicionar à lista de espera
    const resultado = await viagemService.adicionarPacienteListaEspera(
      viagem_id, 
      paciente_id, 
      dadosPaciente, 
      req.usuario._id, 
      prefeitura_id
    );
    
    return res.status(201).json({
      mensagem: 'Paciente adicionado à lista de espera com sucesso',
      lista_espera: resultado
    });
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Remover paciente da viagem
 */
const removerPacienteViagem = async (req, res) => {
  try {
    const { viagem_id, paciente_id } = req.params;
    const { chamar_lista_espera } = req.query;
    
    // Validar IDs
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    validarObjetoId(paciente_id, 'ID de paciente inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para remover paciente
    const resultado = await viagemService.removerPacienteViagem(
      viagem_id, 
      paciente_id, 
      req.usuario._id, 
      prefeitura_id,
      chamar_lista_espera !== 'false' // Por padrão, chamar da lista de espera se não for explicitamente false
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Realizar check-in de paciente
 */
const realizarCheckin = async (req, res) => {
  try {
    const { viagem_id, paciente_id } = req.params;
    const dados = req.body;
    
    // Validar IDs
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    validarObjetoId(paciente_id, 'ID de paciente inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para realizar check-in
    const resultado = await viagemService.realizarCheckin(
      viagem_id, 
      paciente_id, 
      dados, 
      req.usuario._id, 
      prefeitura_id
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Realizar check-out de paciente
 */
const realizarCheckout = async (req, res) => {
  try {
    const { viagem_id, paciente_id } = req.params;
    const dados = req.body;
    
    // Validar IDs
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    validarObjetoId(paciente_id, 'ID de paciente inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para realizar check-out
    const resultado = await viagemService.realizarCheckout(
      viagem_id, 
      paciente_id, 
      dados, 
      req.usuario._id, 
      prefeitura_id
    );
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Concluir uma viagem
 */
const concluirViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    
    // Validar ID
    validarObjetoId(id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para concluir a viagem
    const resultado = await viagemService.concluirViagem(id, dados, req.usuario._id, prefeitura_id);
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Listar pacientes de uma viagem
 */
const listarPacientesViagem = async (req, res) => {
  try {
    const { viagem_id } = req.params;
    
    // Validar ID
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para listar pacientes da viagem
    const pacientes = await viagemService.listarPacientesViagem(viagem_id, prefeitura_id);
    
    return res.status(200).json(pacientes);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Listar pacientes na lista de espera de uma viagem
 */
const listarListaEsperaViagem = async (req, res) => {
  try {
    const { viagem_id } = req.params;
    
    // Validar ID
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para listar pacientes da lista de espera
    const listaEspera = await viagemService.listarListaEsperaViagem(viagem_id, prefeitura_id);
    
    return res.status(200).json(listaEspera);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

/**
 * Buscar pacientes para adicionar à viagem
 */
const buscarPacientesParaViagem = async (req, res) => {
  try {
    const { viagem_id } = req.params;
    const filtros = req.query;
    
    // Validar ID
    validarObjetoId(viagem_id, 'ID de viagem inválido');
    
    // Obter prefeitura do usuário
    const prefeitura_id = req.usuario.prefeitura;
    
    // Chamar serviço para buscar pacientes
    const resultado = await viagemService.buscarPacientesParaViagem(viagem_id, filtros, prefeitura_id);
    
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
};

// Listar todas as viagens
exports.listar = async (req, res, next) => {
  try {
    const viagens = await Viagem.find()
      .populate('motorista', 'nome')
      .populate('veiculo', 'placa modelo')
      .sort({ data_saida: -1 });
    
    res.status(200).json(viagens);
  } catch (error) {
    next(error);
  }
};

// Obter detalhes de uma viagem específica
exports.obterPorId = async (req, res, next) => {
  try {
    const viagem = await Viagem.findById(req.params.id)
      .populate('motorista', 'nome cpf telefone')
      .populate('veiculo')
      .populate('pacientes.paciente', 'nome cpf cartao_sus telefone acompanhante');
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    res.status(200).json(viagem);
  } catch (error) {
    next(error);
  }
};

// Criar nova viagem
exports.criar = async (req, res, next) => {
  try {
    const { 
      origem, 
      destino, 
      data_saida, 
      horario_saida, 
      data_retorno, 
      horario_retorno,
      motorista,
      veiculo,
      observacoes
    } = req.body;
    
    // Validar dados da viagem
    validarViagem(req.body);
    
    const viagem = new Viagem({
      origem,
      destino,
      data_saida,
      horario_saida,
      data_retorno,
      horario_retorno,
      motorista,
      veiculo,
      observacoes,
      status: 'agendada'
    });
    
    await viagem.save();
    
    res.status(201).json({
      message: 'Viagem criada com sucesso',
      viagem: {
        _id: viagem._id,
        origem: viagem.origem,
        destino: viagem.destino,
        data_saida: viagem.data_saida
      }
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar viagem
exports.atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;
    
    // Validar dados da viagem
    validarViagem(dadosAtualizacao);
    
    const viagem = await Viagem.findByIdAndUpdate(
      id,
      dadosAtualizacao,
      { new: true, runValidators: true }
    );
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    res.status(200).json({
      message: 'Viagem atualizada com sucesso',
      viagem
    });
  } catch (error) {
    next(error);
  }
};

// Excluir viagem
exports.excluir = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const viagem = await Viagem.findByIdAndDelete(id);
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    res.status(200).json({
      message: 'Viagem excluída com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Alterar status da viagem
exports.alterarStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, motivo_cancelamento } = req.body;
    
    if (!['agendada', 'em_andamento', 'concluida', 'cancelada'].includes(status)) {
      throw new ApiError(400, 'Status inválido');
    }
    
    const atualizacao = { status };
    
    // Se o status for cancelado, exigir motivo
    if (status === 'cancelada') {
      if (!motivo_cancelamento) {
        throw new ApiError(400, 'Motivo de cancelamento é obrigatório');
      }
      atualizacao.motivo_cancelamento = motivo_cancelamento;
    }
    
    const viagem = await Viagem.findByIdAndUpdate(
      id,
      atualizacao,
      { new: true }
    );
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    res.status(200).json({
      message: `Status da viagem alterado para ${status}`,
      viagem
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar pacientes à viagem
exports.adicionarPacientes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pacientes } = req.body;
    
    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      throw new ApiError(400, 'Lista de pacientes inválida');
    }
    
    const viagem = await Viagem.findById(id);
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    if (viagem.status !== 'agendada') {
      throw new ApiError(400, 'Só é possível adicionar pacientes em viagens agendadas');
    }
    
    // Verificar se os pacientes existem
    const pacientesExistentes = await Paciente.find({
      _id: { $in: pacientes },
      status: 'ativo'
    });
    
    if (pacientesExistentes.length !== pacientes.length) {
      throw new ApiError(400, 'Um ou mais pacientes não foram encontrados ou estão inativos');
    }
    
    // Verificar quais pacientes já estão na viagem
    const pacientesIds = viagem.pacientes.map(p => p.paciente.toString());
    const novosPacientes = pacientes.filter(p => !pacientesIds.includes(p));
    
    if (novosPacientes.length === 0) {
      throw new ApiError(400, 'Todos os pacientes já estão adicionados à viagem');
    }
    
    // Adicionar os novos pacientes
    for (const pacienteId of novosPacientes) {
      viagem.pacientes.push({
        paciente: pacienteId,
        status: 'confirmado'
      });
    }
    
    await viagem.save();
    
    res.status(200).json({
      message: `${novosPacientes.length} paciente(s) adicionado(s) à viagem`,
      pacientes_adicionados: novosPacientes
    });
  } catch (error) {
    next(error);
  }
};

// Remover paciente da viagem
exports.removerPaciente = async (req, res, next) => {
  try {
    const { id, pacienteId } = req.params;
    
    const viagem = await Viagem.findById(id);
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    if (viagem.status !== 'agendada') {
      throw new ApiError(400, 'Só é possível remover pacientes de viagens agendadas');
    }
    
    const pacienteIndex = viagem.pacientes.findIndex(
      p => p.paciente.toString() === pacienteId
    );
    
    if (pacienteIndex === -1) {
      throw new ApiError(404, 'Paciente não encontrado nesta viagem');
    }
    
    viagem.pacientes.splice(pacienteIndex, 1);
    await viagem.save();
    
    res.status(200).json({
      message: 'Paciente removido da viagem com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar status do paciente na viagem
exports.atualizarStatusPaciente = async (req, res, next) => {
  try {
    const { id, pacienteId } = req.params;
    const { status, observacao } = req.body;
    
    if (!['confirmado', 'cancelado', 'ausente'].includes(status)) {
      throw new ApiError(400, 'Status inválido');
    }
    
    const viagem = await Viagem.findById(id);
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    const paciente = viagem.pacientes.find(
      p => p.paciente.toString() === pacienteId
    );
    
    if (!paciente) {
      throw new ApiError(404, 'Paciente não encontrado nesta viagem');
    }
    
    // Se o status for cancelado ou ausente, exigir observação
    if (['cancelado', 'ausente'].includes(status) && !observacao) {
      throw new ApiError(400, 'Observação é obrigatória para este status');
    }
    
    paciente.status = status;
    
    if (observacao) {
      paciente.observacao = observacao;
    }
    
    await viagem.save();
    
    res.status(200).json({
      message: `Status do paciente atualizado para ${status}`,
      paciente
    });
  } catch (error) {
    next(error);
  }
};

// Listar pacientes disponíveis para adicionar à viagem
exports.listarPacientesDisponiveis = async (req, res, next) => {
  try {
    const { viagemId } = req.query;
    
    if (!viagemId) {
      throw new ApiError(400, 'ID da viagem é obrigatório');
    }
    
    const viagem = await Viagem.findById(viagemId);
    
    if (!viagem) {
      throw new ApiError(404, 'Viagem não encontrada');
    }
    
    // Obter IDs dos pacientes já adicionados à viagem
    const pacientesNaViagem = viagem.pacientes.map(p => p.paciente);
    
    // Buscar pacientes ativos que não estão na viagem
    const pacientesDisponiveis = await Paciente.find({
      _id: { $nin: pacientesNaViagem },
      status: 'ativo'
    })
    .select('nome cpf cartao_sus telefone')
    .sort({ nome: 1 });
    
    res.status(200).json(pacientesDisponiveis);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  criarViagem,
  obterViagemPorId,
  listarViagens,
  atualizarViagem,
  cancelarViagem,
  adicionarPacienteViagem,
  adicionarPacienteListaEspera,
  removerPacienteViagem,
  realizarCheckin,
  realizarCheckout,
  concluirViagem,
  listarPacientesViagem,
  listarListaEsperaViagem,
  buscarPacientesParaViagem,
  listar,
  obterPorId,
  criar,
  atualizar,
  excluir,
  alterarStatus,
  adicionarPacientes,
  removerPaciente,
  atualizarStatusPaciente,
  listarPacientesDisponiveis
}; 