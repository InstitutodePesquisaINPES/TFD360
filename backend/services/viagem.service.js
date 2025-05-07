const mongoose = require('mongoose');
const Viagem = require('../models/viagem.model');
const ViagemPaciente = require('../models/viagem-paciente.model');
const ListaEsperaViagem = require('../models/lista-espera-viagem.model');
const Paciente = require('../models/paciente.model');
const { criarError } = require('../utils/error.util');
const ApiError = require('../utils/api-error');

/**
 * Serviço para gerenciamento de viagens
 */
class ViagemService {
  /**
   * Criar uma nova viagem
   * @param {Object} dadosViagem - Dados da viagem
   * @param {string} usuario_id - ID do usuário que está criando
   * @returns {Promise<Object>} Viagem criada
   */
  async criarViagem(dadosViagem, usuario_id) {
    try {
      // Validar disponibilidade do veículo e motorista
      const disponibilidade = await Viagem.verificarDisponibilidade(dadosViagem);
      if (!disponibilidade.disponivel) {
        throw criarError(disponibilidade.mensagem, 400);
      }
      
      // Calcular vagas disponíveis inicialmente (igual à capacidade do veículo)
      dadosViagem.vagas_disponiveis = dadosViagem.capacidade_veiculo;
      
      // Adicionar usuário que criou
      dadosViagem.usuario_cadastro = usuario_id;
      
      // Criar a viagem
      const novaViagem = new Viagem(dadosViagem);
      await novaViagem.save();
      
      return novaViagem;
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      throw error;
    }
  }
  
  /**
   * Obter uma viagem por ID
   * @param {string} id - ID da viagem
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Viagem
   */
  async obterViagemPorId(id, prefeitura_id) {
    try {
      const viagem = await Viagem.findOne({
        _id: id,
        prefeitura: prefeitura_id
      })
      .populate('veiculo', 'placa modelo marca capacidade')
      .populate('motorista', 'nome telefone categoria_cnh')
      .populate({
        path: 'pacientes',
        select: 'paciente acompanhante status observacoes horario_checkin horario_checkout',
        populate: {
          path: 'paciente',
          select: 'nome cpf telefone data_nascimento'
        }
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      return viagem;
    } catch (error) {
      console.error(`Erro ao obter viagem ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Listar viagens com paginação e filtros
   * @param {Object} filtros - Filtros para busca
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Lista paginada de viagens
   */
  async listarViagens(filtros, prefeitura_id) {
    try {
      const {
        data_inicio, 
        data_fim, 
        status, 
        destino,
        veiculo_id,
        motorista_id,
        tipo_tratamento,
        pagina = 1,
        limite = 10
      } = filtros;
      
      // Construir query
      const query = { prefeitura: prefeitura_id };
      
      // Aplicar filtros
      if (data_inicio || data_fim) {
        query.data_viagem = {};
        if (data_inicio) query.data_viagem.$gte = new Date(data_inicio);
        if (data_fim) query.data_viagem.$lte = new Date(data_fim);
      }
      
      if (status) query.status = status;
      if (destino) query.cidade_destino = { $regex: destino, $options: 'i' };
      if (veiculo_id) query.veiculo = veiculo_id;
      if (motorista_id) query.motorista = motorista_id;
      if (tipo_tratamento) query.tipo_tratamento = tipo_tratamento;
      
      // Calcular paginação
      const skip = (pagina - 1) * limite;
      
      // Buscar viagens
      const viagens = await Viagem.find(query)
        .sort({ data_viagem: -1, horario_saida: 1 })
        .skip(skip)
        .limit(limite)
        .populate('veiculo', 'placa modelo marca')
        .populate('motorista', 'nome');
        
      // Contar total
      const total = await Viagem.countDocuments(query);
      
      return {
        viagens,
        paginacao: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          paginas: Math.ceil(total / limite)
        }
      };
    } catch (error) {
      console.error('Erro ao listar viagens:', error);
      throw error;
    }
  }
  
  /**
   * Atualizar uma viagem existente
   * @param {string} id - ID da viagem
   * @param {Object} dadosAtualizacao - Dados a atualizar
   * @param {string} usuario_id - ID do usuário que está atualizando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Viagem atualizada
   */
  async atualizarViagem(id, dadosAtualizacao, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se já foi confirmada/iniciada
      if (['confirmada', 'em_andamento', 'concluida'].includes(viagem.status)) {
        throw criarError('Não é possível alterar uma viagem que já foi confirmada ou iniciada', 400);
      }
      
      // Validar disponibilidade do veículo e motorista se estiverem sendo alterados
      if (
        (dadosAtualizacao.veiculo && dadosAtualizacao.veiculo.toString() !== viagem.veiculo.toString()) ||
        (dadosAtualizacao.motorista && dadosAtualizacao.motorista.toString() !== viagem.motorista.toString()) ||
        (dadosAtualizacao.data_viagem && new Date(dadosAtualizacao.data_viagem).toDateString() !== new Date(viagem.data_viagem).toDateString())
      ) {
        const disponibilidade = await Viagem.verificarDisponibilidade({
          data_viagem: dadosAtualizacao.data_viagem || viagem.data_viagem,
          horario_saida: dadosAtualizacao.horario_saida || viagem.horario_saida,
          veiculo: dadosAtualizacao.veiculo || viagem.veiculo,
          motorista: dadosAtualizacao.motorista || viagem.motorista
        }, id);
        
        if (!disponibilidade.disponivel) {
          throw criarError(disponibilidade.mensagem, 400);
        }
      }
      
      // Se a capacidade estiver sendo alterada, verificar se é compatível com os pacientes já confirmados
      if (dadosAtualizacao.capacidade_veiculo) {
        const pacientesConfirmados = await ViagemPaciente.find({
          viagem: id,
          status: 'confirmado'
        });
        
        // Calcular ocupação total (pacientes + acompanhantes)
        let ocupacaoTotal = 0;
        for (const paciente of pacientesConfirmados) {
          ocupacaoTotal += 1; // Paciente
          if (paciente.acompanhante) {
            ocupacaoTotal += 1; // Acompanhante
          }
        }
        
        if (dadosAtualizacao.capacidade_veiculo < ocupacaoTotal) {
          throw criarError(`A nova capacidade (${dadosAtualizacao.capacidade_veiculo}) é menor que o número de pacientes já confirmados (${ocupacaoTotal})`, 400);
        }
        
        // Atualizar vagas disponíveis
        dadosAtualizacao.vagas_disponiveis = dadosAtualizacao.capacidade_veiculo - ocupacaoTotal;
      }
      
      // Adicionar usuário que atualizou
      dadosAtualizacao.usuario_ultima_atualizacao = usuario_id;
      
      // Lista de campos que não podem ser atualizados
      const camposProtegidos = ['_id', 'prefeitura', 'usuario_cadastro', 'created_at'];
      
      // Remover campos protegidos
      camposProtegidos.forEach(campo => {
        delete dadosAtualizacao[campo];
      });
      
      // Atualizar a viagem
      const viagemAtualizada = await Viagem.findByIdAndUpdate(
        id,
        { $set: dadosAtualizacao },
        { new: true, runValidators: true }
      );
      
      return await this.obterViagemPorId(id, prefeitura_id);
    } catch (error) {
      console.error(`Erro ao atualizar viagem ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Cancelar uma viagem
   * @param {string} id - ID da viagem
   * @param {string} motivo - Motivo do cancelamento
   * @param {string} usuario_id - ID do usuário que está cancelando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Viagem cancelada
   */
  async cancelarViagem(id, motivo, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se já foi concluída
      if (viagem.status === 'concluida') {
        throw criarError('Não é possível cancelar uma viagem já concluída', 400);
      }
      
      // Atualizar status e motivo de cancelamento
      viagem.status = 'cancelada';
      viagem.motivo_cancelamento = motivo;
      viagem.usuario_ultima_atualizacao = usuario_id;
      
      await viagem.save();
      
      // Atualizar pacientes vinculados
      await ViagemPaciente.updateMany(
        { viagem: id },
        { 
          $set: { 
            status: 'cancelado',
            observacoes: `Viagem cancelada: ${motivo}`,
            usuario_ultima_atualizacao: usuario_id
          }
        }
      );
      
      // Cancelar lista de espera
      await ListaEsperaViagem.updateMany(
        { viagem: id, status: { $in: ['aguardando', 'chamado'] } },
        { 
          $set: { 
            status: 'cancelado',
            observacoes: `Viagem cancelada: ${motivo}`,
            usuario_ultima_atualizacao: usuario_id
          }
        }
      );
      
      return viagem;
    } catch (error) {
      console.error(`Erro ao cancelar viagem ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Adicionar paciente à viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} paciente_id - ID do paciente
   * @param {Object} dadosPaciente - Dados adicionais do paciente na viagem
   * @param {string} usuario_id - ID do usuário que está adicionando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Relação viagem-paciente criada
   */
  async adicionarPacienteViagem(viagem_id, paciente_id, dadosPaciente, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem já foi concluída ou cancelada
      if (['concluida', 'cancelada'].includes(viagem.status)) {
        throw criarError(`Não é possível adicionar pacientes a uma viagem ${viagem.status}`, 400);
      }
      
      // Verificar se o paciente existe e pertence à mesma prefeitura
      const paciente = await Paciente.findOne({
        _id: paciente_id,
        prefeitura: prefeitura_id
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Verificar se já existe relação viagem-paciente
      const relacaoExistente = await ViagemPaciente.findOne({
        viagem: viagem_id,
        paciente: paciente_id
      });
      
      if (relacaoExistente) {
        throw criarError('Paciente já está vinculado a esta viagem', 400);
      }
      
      // Verificar se há vagas disponíveis
      const comAcompanhante = dadosPaciente.acompanhante ? true : false;
      const vagasNecessarias = comAcompanhante ? 2 : 1;
      
      if (viagem.vagas_disponiveis < vagasNecessarias) {
        // Se não há vagas suficientes, adicionar à lista de espera
        return await this.adicionarPacienteListaEspera(
          viagem_id, 
          paciente_id, 
          {
            ...dadosPaciente,
            acompanhante: comAcompanhante
          }, 
          usuario_id, 
          prefeitura_id
        );
      }
      
      // Criar a relação viagem-paciente
      const viagemPaciente = new ViagemPaciente({
        viagem: viagem_id,
        paciente: paciente_id,
        acompanhante: dadosPaciente.acompanhante,
        status: 'confirmado',
        tipo_paciente: dadosPaciente.tipo_paciente || 'novo',
        necessidades_especiais: dadosPaciente.necessidades_especiais || false,
        descricao_necessidades: dadosPaciente.descricao_necessidades,
        observacoes: dadosPaciente.observacoes,
        prefeitura: prefeitura_id,
        usuario_cadastro: usuario_id
      });
      
      await viagemPaciente.save();
      
      // Atualizar vagas disponíveis na viagem
      viagem.vagas_disponiveis -= vagasNecessarias;
      await viagem.save();
      
      return viagemPaciente;
    } catch (error) {
      console.error(`Erro ao adicionar paciente ${paciente_id} à viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Adicionar paciente à lista de espera de uma viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} paciente_id - ID do paciente
   * @param {Object} dadosPaciente - Dados adicionais do paciente
   * @param {string} usuario_id - ID do usuário que está adicionando
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Relação lista de espera criada
   */
  async adicionarPacienteListaEspera(viagem_id, paciente_id, dadosPaciente, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem já foi concluída ou cancelada
      if (['concluida', 'cancelada'].includes(viagem.status)) {
        throw criarError(`Não é possível adicionar pacientes à lista de espera de uma viagem ${viagem.status}`, 400);
      }
      
      // Verificar se o paciente existe e pertence à mesma prefeitura
      const paciente = await Paciente.findOne({
        _id: paciente_id,
        prefeitura: prefeitura_id
      });
      
      if (!paciente) {
        throw criarError('Paciente não encontrado', 404);
      }
      
      // Verificar se já existe na lista de espera
      const listaEsperaExistente = await ListaEsperaViagem.findOne({
        viagem: viagem_id,
        paciente: paciente_id
      });
      
      if (listaEsperaExistente) {
        throw criarError('Paciente já está na lista de espera desta viagem', 400);
      }
      
      // Calcular a próxima ordem na lista de espera
      const prioridade = dadosPaciente.prioridade || 5;
      const proximaOrdem = await ListaEsperaViagem.proximaOrdem(viagem_id, prioridade);
      
      // Criar o registro na lista de espera
      const listaEspera = new ListaEsperaViagem({
        viagem: viagem_id,
        paciente: paciente_id,
        solicitacao_tfd: dadosPaciente.solicitacao_tfd,
        acompanhante: dadosPaciente.acompanhante || false,
        id_acompanhante: dadosPaciente.id_acompanhante,
        prioridade: prioridade,
        ordem: proximaOrdem,
        motivo_prioridade: dadosPaciente.motivo_prioridade,
        observacoes: dadosPaciente.observacoes,
        prefeitura: prefeitura_id,
        usuario_cadastro: usuario_id
      });
      
      await listaEspera.save();
      
      return {
        ...listaEspera.toObject(),
        adicionado_lista_espera: true,
        mensagem: 'Paciente adicionado à lista de espera devido à falta de vagas'
      };
    } catch (error) {
      console.error(`Erro ao adicionar paciente ${paciente_id} à lista de espera da viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Remover paciente da viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} paciente_id - ID do paciente
   * @param {string} usuario_id - ID do usuário que está removendo
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @param {boolean} chamarListaEspera - Se deve chamar o próximo da lista de espera
   * @returns {Promise<Object>} Resultado da operação
   */
  async removerPacienteViagem(viagem_id, paciente_id, usuario_id, prefeitura_id, chamarListaEspera = true) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem já foi concluída
      if (viagem.status === 'concluida') {
        throw criarError('Não é possível remover pacientes de uma viagem concluída', 400);
      }
      
      // Buscar a relação viagem-paciente
      const viagemPaciente = await ViagemPaciente.findOne({
        viagem: viagem_id,
        paciente: paciente_id
      });
      
      if (!viagemPaciente) {
        throw criarError('Paciente não está vinculado a esta viagem', 404);
      }
      
      // Verificar se já fez check-in
      if (viagemPaciente.horario_checkin) {
        throw criarError('Não é possível remover um paciente que já realizou check-in', 400);
      }
      
      // Salvar informações para retorno
      const comAcompanhante = viagemPaciente.acompanhante ? true : false;
      const vagasLiberadas = comAcompanhante ? 2 : 1;
      
      // Remover a relação
      await viagemPaciente.deleteOne();
      
      // Atualizar vagas disponíveis na viagem
      viagem.vagas_disponiveis += vagasLiberadas;
      await viagem.save();
      
      let proximoChamado = null;
      
      // Chamar próximo da lista de espera se solicitado
      if (chamarListaEspera && viagem.status !== 'cancelada') {
        try {
          proximoChamado = await ListaEsperaViagem.chamarProximoPaciente(viagem_id);
          
          // Atualizar vagas novamente após chamar da lista de espera
          await viagem.atualizarVagasDisponiveis();
        } catch (erro) {
          // Ignorar erros ao chamar da lista de espera (pode não haver ninguém na lista)
          console.log('Nenhum paciente disponível na lista de espera ou erro ao chamar:', erro.message);
        }
      }
      
      return {
        sucesso: true,
        mensagem: 'Paciente removido da viagem com sucesso',
        vagas_liberadas: vagasLiberadas,
        vagas_disponiveis: viagem.vagas_disponiveis,
        proximo_chamado: proximoChamado
      };
    } catch (error) {
      console.error(`Erro ao remover paciente ${paciente_id} da viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Realizar check-in de paciente na viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} paciente_id - ID do paciente
   * @param {Object} dados - Dados do check-in
   * @param {string} usuario_id - ID do usuário realizando o check-in
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Resultado do check-in
   */
  async realizarCheckin(viagem_id, paciente_id, dados, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem está em andamento ou confirmada
      if (!['confirmada', 'em_andamento'].includes(viagem.status)) {
        throw criarError(`Não é possível realizar check-in em uma viagem com status ${viagem.status}`, 400);
      }
      
      // Buscar a relação viagem-paciente
      const viagemPaciente = await ViagemPaciente.findOne({
        viagem: viagem_id,
        paciente: paciente_id
      });
      
      if (!viagemPaciente) {
        throw criarError('Paciente não está vinculado a esta viagem', 404);
      }
      
      // Verificar se já realizou check-in
      if (viagemPaciente.horario_checkin) {
        throw criarError('Paciente já realizou check-in', 400);
      }
      
      // Realizar check-in
      await viagemPaciente.realizarCheckin(dados.localizacao);
      
      // Atualizar informações
      viagemPaciente.usuario_ultima_atualizacao = usuario_id;
      if (dados.observacoes) {
        viagemPaciente.observacoes = dados.observacoes;
      }
      
      await viagemPaciente.save();
      
      // Se for o primeiro check-in, atualizar status da viagem para em_andamento
      if (viagem.status === 'confirmada') {
        viagem.status = 'em_andamento';
        await viagem.save();
      }
      
      return {
        sucesso: true,
        mensagem: 'Check-in realizado com sucesso',
        horario: viagemPaciente.horario_checkin
      };
    } catch (error) {
      console.error(`Erro ao realizar check-in do paciente ${paciente_id} na viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Realizar check-out de paciente na viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} paciente_id - ID do paciente
   * @param {Object} dados - Dados do check-out
   * @param {string} usuario_id - ID do usuário realizando o check-out
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Resultado do check-out
   */
  async realizarCheckout(viagem_id, paciente_id, dados, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem está em andamento
      if (viagem.status !== 'em_andamento') {
        throw criarError(`Não é possível realizar check-out em uma viagem com status ${viagem.status}`, 400);
      }
      
      // Buscar a relação viagem-paciente
      const viagemPaciente = await ViagemPaciente.findOne({
        viagem: viagem_id,
        paciente: paciente_id
      });
      
      if (!viagemPaciente) {
        throw criarError('Paciente não está vinculado a esta viagem', 404);
      }
      
      // Verificar se já realizou check-in
      if (!viagemPaciente.horario_checkin) {
        throw criarError('Paciente não realizou check-in', 400);
      }
      
      // Verificar se já realizou check-out
      if (viagemPaciente.horario_checkout) {
        throw criarError('Paciente já realizou check-out', 400);
      }
      
      // Realizar check-out
      await viagemPaciente.realizarCheckout(dados.localizacao);
      
      // Atualizar informações
      viagemPaciente.usuario_ultima_atualizacao = usuario_id;
      if (dados.observacoes) {
        viagemPaciente.observacoes += `\n[${new Date().toLocaleString()}] Check-out: ${dados.observacoes}`;
      }
      
      await viagemPaciente.save();
      
      // Verificar se todos os pacientes realizaram check-out
      const pacientesSemCheckout = await ViagemPaciente.countDocuments({
        viagem: viagem_id,
        horario_checkin: { $exists: true, $ne: null },
        horario_checkout: { $exists: false }
      });
      
      return {
        sucesso: true,
        mensagem: 'Check-out realizado com sucesso',
        horario: viagemPaciente.horario_checkout,
        todos_concluidos: pacientesSemCheckout === 0
      };
    } catch (error) {
      console.error(`Erro ao realizar check-out do paciente ${paciente_id} na viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Concluir uma viagem
   * @param {string} id - ID da viagem
   * @param {Object} dados - Dados de conclusão
   * @param {string} usuario_id - ID do usuário que está concluindo
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Viagem concluída
   */
  async concluirViagem(id, dados, usuario_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Verificar se a viagem pode ser concluída
      if (!['em_andamento', 'confirmada'].includes(viagem.status)) {
        throw criarError(`Não é possível concluir uma viagem com status ${viagem.status}`, 400);
      }
      
      // Atualizar km final se informado
      if (dados.km_final !== undefined && dados.km_final !== null) {
        if (viagem.km_inicial !== undefined && viagem.km_inicial !== null && dados.km_final < viagem.km_inicial) {
          throw criarError('Quilometragem final deve ser maior ou igual à quilometragem inicial', 400);
        }
        viagem.km_final = dados.km_final;
      }
      
      // Atualizar observações se informadas
      if (dados.observacoes) {
        viagem.observacoes = viagem.observacoes 
          ? `${viagem.observacoes}\n[${new Date().toLocaleString()}] Conclusão: ${dados.observacoes}`
          : `[${new Date().toLocaleString()}] Conclusão: ${dados.observacoes}`;
      }
      
      // Marcar como ausentes os pacientes que não realizaram check-in
      await ViagemPaciente.updateMany(
        {
          viagem: id,
          horario_checkin: { $exists: false },
          status: { $in: ['confirmado', 'pendente'] }
        },
        {
          $set: {
            status: 'ausente',
            usuario_ultima_atualizacao: usuario_id
          }
        }
      );
      
      // Atualizar status da viagem
      viagem.status = 'concluida';
      viagem.usuario_ultima_atualizacao = usuario_id;
      
      await viagem.save();
      
      return {
        sucesso: true,
        mensagem: 'Viagem concluída com sucesso',
        viagem
      };
    } catch (error) {
      console.error(`Erro ao concluir viagem ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Buscar pacientes para adicionar à viagem
   * @param {string} viagem_id - ID da viagem
   * @param {Object} filtros - Filtros de busca
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Object>} Lista paginada de pacientes
   */
  async buscarPacientesParaViagem(viagem_id, filtros, prefeitura_id) {
    try {
      const { 
        termo, 
        cidade_destino, 
        especialidade, 
        cid, 
        pagina = 1, 
        limite = 10 
      } = filtros;
      
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Base da query: pacientes da mesma prefeitura que estão ativos
      const query = { 
        prefeitura: prefeitura_id,
        status: 'ativo'
      };
      
      // Adicionar filtros
      if (termo) {
        query.$or = [
          { nome: { $regex: termo, $options: 'i' } },
          { cpf: { $regex: termo.replace(/\D/g, ''), $options: 'i' } },
          { cartao_sus: { $regex: termo, $options: 'i' } }
        ];
      }
      
      // Calcular paginação
      const skip = (pagina - 1) * limite;
      
      // Buscar pacientes
      const pacientes = await Paciente.find(query)
        .select('nome cpf cartao_sus data_nascimento telefone')
        .sort({ nome: 1 })
        .skip(skip)
        .limit(limite);
      
      // Contar total
      const total = await Paciente.countDocuments(query);
      
      // Para cada paciente, verificar se já está na viagem ou na lista de espera
      const pacientesComStatus = await Promise.all(pacientes.map(async (paciente) => {
        const emViagem = await ViagemPaciente.findOne({
          paciente: paciente._id,
          viagem: viagem_id
        });
        
        const emListaEspera = !emViagem ? await ListaEsperaViagem.findOne({
          paciente: paciente._id,
          viagem: viagem_id
        }) : null;
        
        return {
          ...paciente.toObject(),
          status: emViagem ? 'na_viagem' : (emListaEspera ? 'em_lista_espera' : 'disponivel')
        };
      }));
      
      return {
        pacientes: pacientesComStatus,
        paginacao: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          paginas: Math.ceil(total / limite)
        }
      };
    } catch (error) {
      console.error(`Erro ao buscar pacientes para viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Listar pacientes de uma viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Array>} Lista de pacientes da viagem
   */
  async listarPacientesViagem(viagem_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Buscar relações viagem-paciente
      const viagensPacientes = await ViagemPaciente.find({ viagem: viagem_id })
        .populate('paciente', 'nome cpf cartao_sus data_nascimento telefone')
        .populate('acompanhante', 'nome cpf relacao_paciente')
        .sort({ created_at: 1 });
      
      return viagensPacientes;
    } catch (error) {
      console.error(`Erro ao listar pacientes da viagem ${viagem_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Listar pacientes na lista de espera de uma viagem
   * @param {string} viagem_id - ID da viagem
   * @param {string} prefeitura_id - ID da prefeitura para segurança
   * @returns {Promise<Array>} Lista de pacientes em espera
   */
  async listarListaEsperaViagem(viagem_id, prefeitura_id) {
    try {
      // Verificar se viagem existe
      const viagem = await Viagem.findOne({
        _id: viagem_id,
        prefeitura: prefeitura_id
      });
      
      if (!viagem) {
        throw criarError('Viagem não encontrada', 404);
      }
      
      // Buscar lista de espera
      const listaEspera = await ListaEsperaViagem.find({
        viagem: viagem_id,
        status: { $in: ['aguardando', 'chamado'] }
      })
      .populate('paciente', 'nome cpf cartao_sus data_nascimento telefone')
      .populate('id_acompanhante', 'nome cpf relacao_paciente')
      .sort({ prioridade: 1, ordem: 1 });
      
      return listaEspera;
    } catch (error) {
      console.error(`Erro ao listar pacientes da lista de espera da viagem ${viagem_id}:`, error);
      throw error;
    }
  }

  /**
   * Adicionar pacientes à viagem
   * @param {string} viagemId - ID da viagem
   * @param {Array} pacientesIds - Lista de IDs de pacientes
   * @returns {Promise} Viagem atualizada
   */
  async adicionarPacientesViagem(viagemId, pacientesIds) {
    try {
      const viagem = await Viagem.findById(viagemId);
      
      if (!viagem) {
        throw new ApiError(404, 'Viagem não encontrada');
      }
      
      if (viagem.status !== 'agendada' && viagem.status !== 'confirmada') {
        throw new ApiError(400, 'Só é possível adicionar pacientes em viagens agendadas ou confirmadas');
      }
      
      // Verificar se os pacientes existem
      const pacientes = await Paciente.find({ 
        _id: { $in: pacientesIds },
        status: 'ativo'
      });
      
      if (pacientes.length !== pacientesIds.length) {
        throw new ApiError(400, 'Um ou mais pacientes não foram encontrados ou estão inativos');
      }
      
      // Verificar quais pacientes já estão na viagem
      const pacientesAtuais = viagem.pacientes.map(p => p.paciente.toString());
      const novosPacientes = pacientesIds.filter(p => !pacientesAtuais.includes(p));
      
      if (novosPacientes.length === 0) {
        throw new ApiError(400, 'Todos os pacientes já estão adicionados à viagem');
      }
      
      // Adicionar os pacientes um por um para validar vagas
      const pacientesAdicionados = [];
      const erros = [];
      
      for (const pacienteId of novosPacientes) {
        try {
          // Buscar informações detalhadas do paciente
          const paciente = pacientes.find(p => p._id.toString() === pacienteId);
          
          // Verificar se possui acompanhante
          const temAcompanhante = paciente.acompanhante ? true : false;
          const idAcompanhante = paciente.acompanhante;
          
          // Adicionar paciente
          await viagem.adicionarPaciente(pacienteId, temAcompanhante, idAcompanhante);
          pacientesAdicionados.push(pacienteId);
        } catch (error) {
          erros.push({ pacienteId, mensagem: error.message });
        }
      }
      
      // Salvar alterações
      await viagem.save();
      
      return {
        viagem,
        pacientesAdicionados,
        erros: erros.length > 0 ? erros : null
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao adicionar pacientes à viagem: ${error.message}`);
    }
  }

  /**
   * Remover paciente da viagem
   * @param {string} viagemId - ID da viagem
   * @param {string} pacienteId - ID do paciente
   * @returns {Promise} Resultado da operação
   */
  async removerPacienteViagem(viagemId, pacienteId) {
    try {
      const viagem = await Viagem.findById(viagemId);
      
      if (!viagem) {
        throw new ApiError(404, 'Viagem não encontrada');
      }
      
      if (viagem.status !== 'agendada' && viagem.status !== 'confirmada') {
        throw new ApiError(400, 'Só é possível remover pacientes de viagens agendadas ou confirmadas');
      }
      
      // Verificar se o paciente existe na viagem
      const pacienteIndex = viagem.pacientes.findIndex(
        p => p.paciente.toString() === pacienteId
      );
      
      if (pacienteIndex === -1) {
        throw new ApiError(404, 'Paciente não encontrado nesta viagem');
      }
      
      // Verificar se o paciente já fez check-in
      if (viagem.pacientes[pacienteIndex].horario_checkin) {
        throw new ApiError(400, 'Não é possível remover pacientes que já realizaram check-in');
      }
      
      // Remover paciente
      await viagem.removerPaciente(pacienteId);
      
      return {
        mensagem: 'Paciente removido da viagem com sucesso',
        viagem
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao remover paciente da viagem: ${error.message}`);
    }
  }

  /**
   * Realizar check-in de paciente em viagem
   * @param {string} viagemId - ID da viagem
   * @param {string} pacienteId - ID do paciente
   * @param {Object} dados - Dados adicionais do check-in
   * @returns {Promise} Resultado da operação
   */
  async realizarCheckinPaciente(viagemId, pacienteId, dados = {}) {
    try {
      const viagem = await Viagem.findById(viagemId);
      
      if (!viagem) {
        throw new ApiError(404, 'Viagem não encontrada');
      }
      
      if (viagem.status !== 'confirmada' && viagem.status !== 'em_andamento') {
        throw new ApiError(400, 'Check-in só pode ser realizado em viagens confirmadas ou em andamento');
      }
      
      // Se for a primeira vez que alguém faz check-in, atualizar status da viagem
      const algumCheckin = viagem.pacientes.some(p => p.horario_checkin);
      if (!algumCheckin && viagem.status === 'confirmada') {
        viagem.status = 'em_andamento';
        
        // Registrar quilometragem inicial se fornecida
        if (dados.km_inicial && !isNaN(dados.km_inicial)) {
          viagem.km_inicial = dados.km_inicial;
        }
      }
      
      // Realizar check-in
      await viagem.realizarCheckin(pacienteId, dados.localizacao);
      
      return {
        mensagem: 'Check-in realizado com sucesso',
        viagem
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao realizar check-in: ${error.message}`);
    }
  }

  /**
   * Realizar check-out de paciente em viagem
   * @param {string} viagemId - ID da viagem
   * @param {string} pacienteId - ID do paciente
   * @param {Object} dados - Dados adicionais do check-out
   * @returns {Promise} Resultado da operação
   */
  async realizarCheckoutPaciente(viagemId, pacienteId, dados = {}) {
    try {
      const viagem = await Viagem.findById(viagemId);
      
      if (!viagem) {
        throw new ApiError(404, 'Viagem não encontrada');
      }
      
      if (viagem.status !== 'em_andamento') {
        throw new ApiError(400, 'Check-out só pode ser realizado em viagens em andamento');
      }
      
      // Realizar check-out
      await viagem.realizarCheckout(pacienteId, dados.localizacao);
      
      // Verificar se todos os pacientes fizeram check-out
      const todosPacientes = viagem.pacientes.filter(p => p.horario_checkin);
      const todoCheckout = todosPacientes.every(p => p.horario_checkout);
      
      // Se todos fizeram check-out, preparar para concluir a viagem
      if (todoCheckout && todosPacientes.length > 0) {
        // Não concluir automaticamente, apenas notificar
        return {
          mensagem: 'Check-out realizado com sucesso. Todos os pacientes completaram o check-out.',
          todos_concluidos: true,
          viagem
        };
      }
      
      return {
        mensagem: 'Check-out realizado com sucesso',
        todos_concluidos: false,
        viagem
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao realizar check-out: ${error.message}`);
    }
  }

  /**
   * Listar pacientes disponíveis para adicionar à viagem
   * @param {string} viagemId - ID da viagem
   * @returns {Promise} Lista de pacientes disponíveis
   */
  async listarPacientesDisponiveis(viagemId) {
    try {
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
      .select('nome cpf cartao_sus telefone acompanhante')
      .sort({ nome: 1 });
      
      return pacientesDisponiveis;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao listar pacientes disponíveis: ${error.message}`);
    }
  }

  /**
   * Atualizar status do paciente na viagem
   * @param {string} viagemId - ID da viagem
   * @param {string} pacienteId - ID do paciente
   * @param {Object} dados - Dados da atualização
   * @returns {Promise} Resultado da operação
   */
  async atualizarStatusPaciente(viagemId, pacienteId, dados) {
    try {
      const { status, observacao } = dados;
      
      if (!['confirmado', 'cancelado', 'ausente'].includes(status)) {
        throw new ApiError(400, 'Status inválido');
      }
      
      const viagem = await Viagem.findById(viagemId);
      
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
      
      // Não permitir alterar pacientes que já fizeram check-in
      if (paciente.horario_checkin) {
        throw new ApiError(400, 'Não é possível alterar o status de pacientes que já realizaram check-in');
      }
      
      // Verificar vagas disponíveis ao alterar o status para confirmado
      if (status === 'confirmado' && paciente.status !== 'confirmado') {
        // Re-calcular vagas necessárias
        const vagasNecessarias = paciente.acompanhante ? 2 : 1;
        if (viagem.vagas_disponiveis < vagasNecessarias) {
          throw new ApiError(400, 'Não há vagas suficientes para confirmar este paciente');
        }
        
        // Reduzir vagas disponíveis
        viagem.vagas_disponiveis -= vagasNecessarias;
      } 
      // Liberar vagas ao cancelar um paciente confirmado
      else if (status !== 'confirmado' && paciente.status === 'confirmado') {
        const vagasLiberadas = paciente.acompanhante ? 2 : 1;
        viagem.vagas_disponiveis += vagasLiberadas;
      }
      
      // Atualizar status e observação
      paciente.status = status;
      
      if (observacao) {
        paciente.observacao = observacao;
      }
      
      await viagem.save();
      
      return {
        mensagem: `Status do paciente atualizado para ${status}`,
        paciente,
        viagem
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Erro ao atualizar status do paciente: ${error.message}`);
    }
  }
}

module.exports = new ViagemService(); 