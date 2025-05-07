const mongoose = require('mongoose');
const Veiculo = require('../models/veiculo.model');
const Viagem = require('../models/viagem.model');
const Localizacao = require('../models/localizacao.model');
const { ErroAPI } = require('../utils/erros');

/**
 * Classe de serviço para monitoramento da frota em tempo real
 */
class MonitoramentoService {
  /**
   * Registra uma nova localização para um veículo
   * @param {string} veiculoId - ID do veículo
   * @param {Object} dados - Dados de localização
   * @param {number} dados.latitude - Latitude
   * @param {number} dados.longitude - Longitude
   * @param {number} dados.velocidade - Velocidade em km/h
   * @param {number} dados.quilometragem - Quilometragem atual do veículo
   * @param {string} dados.viagemId - ID da viagem associada (opcional)
   * @returns {Promise<Object>} - Localização registrada
   */
  async registrarLocalizacao(veiculoId, dados) {
    try {
      // Validar se o veículo existe
      const veiculo = await Veiculo.findById(veiculoId);
      if (!veiculo) {
        throw new ErroAPI('Veículo não encontrado', 404);
      }
      
      // Validar se a viagem existe (se informada)
      if (dados.viagemId) {
        const viagem = await Viagem.findById(dados.viagemId);
        if (!viagem) {
          throw new ErroAPI('Viagem não encontrada', 404);
        }
        
        // Verificar se o veículo está associado à viagem
        if (viagem.veiculo.toString() !== veiculoId) {
          throw new ErroAPI('Este veículo não está associado a esta viagem', 400);
        }
      }
      
      // Criar o registro de localização
      const novaLocalizacao = new Localizacao({
        veiculo: veiculoId,
        viagem: dados.viagemId || null,
        latitude: dados.latitude,
        longitude: dados.longitude,
        velocidade: dados.velocidade || 0,
        timestamp: new Date(),
        quilometragem: dados.quilometragem || veiculo.quilometragem_atual
      });
      
      // Salvar a localização
      const localizacaoSalva = await novaLocalizacao.save();
      
      // Atualizar a quilometragem do veículo se for maior que a atual
      if (dados.quilometragem && dados.quilometragem > veiculo.quilometragem_atual) {
        veiculo.quilometragem_atual = dados.quilometragem;
        await veiculo.save();
      }
      
      // Se houver uma viagem, atualizar status para "em_andamento" se necessário
      if (dados.viagemId) {
        const viagem = await Viagem.findById(dados.viagemId);
        if (viagem && viagem.status === 'agendada') {
          viagem.status = 'em_andamento';
          await viagem.save();
        }
      }
      
      return localizacaoSalva;
    } catch (erro) {
      if (erro instanceof ErroAPI) {
        throw erro;
      }
      console.error('Erro ao registrar localização:', erro);
      throw new ErroAPI('Erro ao registrar localização do veículo', 500);
    }
  }
  
  /**
   * Obtém a última localização de um veículo
   * @param {string} veiculoId - ID do veículo
   * @returns {Promise<Object>} - Última localização
   */
  async obterUltimaLocalizacao(veiculoId) {
    try {
      // Validar se o veículo existe
      const veiculo = await Veiculo.findById(veiculoId);
      if (!veiculo) {
        throw new ErroAPI('Veículo não encontrado', 404);
      }
      
      // Buscar a localização mais recente
      const ultimaLocalizacao = await Localizacao.findOne({ veiculo: veiculoId })
        .sort({ timestamp: -1 })
        .populate('viagem', 'origem destino data_ida data_volta')
        .populate('veiculo', 'placa modelo marca tipo');
      
      if (!ultimaLocalizacao) {
        throw new ErroAPI('Localização não encontrada para este veículo', 404);
      }
      
      return ultimaLocalizacao;
    } catch (erro) {
      if (erro instanceof ErroAPI) {
        throw erro;
      }
      console.error('Erro ao obter última localização:', erro);
      throw new ErroAPI('Erro ao obter localização do veículo', 500);
    }
  }
  
  /**
   * Obtém o histórico de localizações de um veículo em um período
   * @param {string} veiculoId - ID do veículo
   * @param {Object} opcoes - Opções de filtragem
   * @param {Date} opcoes.dataInicio - Data inicial
   * @param {Date} opcoes.dataFim - Data final
   * @param {string} opcoes.viagemId - ID da viagem para filtrar
   * @param {number} opcoes.limite - Número máximo de registros
   * @returns {Promise<Array>} - Lista de localizações
   */
  async obterHistoricoLocalizacoes(veiculoId, opcoes = {}) {
    try {
      // Validar se o veículo existe
      const veiculo = await Veiculo.findById(veiculoId);
      if (!veiculo) {
        throw new ErroAPI('Veículo não encontrado', 404);
      }
      
      // Construir filtro de consulta
      const filtro = { veiculo: veiculoId };
      
      if (opcoes.viagemId) {
        filtro.viagem = opcoes.viagemId;
      }
      
      if (opcoes.dataInicio || opcoes.dataFim) {
        filtro.timestamp = {};
        
        if (opcoes.dataInicio) {
          filtro.timestamp.$gte = new Date(opcoes.dataInicio);
        }
        
        if (opcoes.dataFim) {
          filtro.timestamp.$lte = new Date(opcoes.dataFim);
        }
      }
      
      // Definir limite de registros (padrão 100)
      const limite = opcoes.limite || 100;
      
      // Buscar as localizações
      const localizacoes = await Localizacao.find(filtro)
        .sort({ timestamp: -1 })
        .limit(limite)
        .populate('viagem', 'origem destino data_ida data_volta')
        .populate('veiculo', 'placa modelo marca tipo');
      
      return localizacoes;
    } catch (erro) {
      if (erro instanceof ErroAPI) {
        throw erro;
      }
      console.error('Erro ao obter histórico de localizações:', erro);
      throw new ErroAPI('Erro ao obter histórico de localizações do veículo', 500);
    }
  }
  
  /**
   * Obtém a localização atual de todos os veículos em uma viagem específica
   * @param {string} viagemId - ID da viagem
   * @returns {Promise<Array>} - Lista de localizações
   */
  async obterLocalizacoesViagem(viagemId) {
    try {
      // Validar se a viagem existe
      const viagem = await Viagem.findById(viagemId);
      if (!viagem) {
        throw new ErroAPI('Viagem não encontrada', 404);
      }
      
      // Obter todos os veículos associados à viagem
      const veiculoId = viagem.veiculo;
      
      // Buscar a última localização para cada veículo
      const ultimaLocalizacao = await Localizacao.findOne({ 
        veiculo: veiculoId,
        viagem: viagemId
      })
        .sort({ timestamp: -1 })
        .populate('veiculo', 'placa modelo marca tipo');
      
      return ultimaLocalizacao ? [ultimaLocalizacao] : [];
    } catch (erro) {
      if (erro instanceof ErroAPI) {
        throw erro;
      }
      console.error('Erro ao obter localizações da viagem:', erro);
      throw new ErroAPI('Erro ao obter localizações dos veículos da viagem', 500);
    }
  }
  
  /**
   * Obtém a última localização conhecida de todos os veículos da frota
   * @param {Object} filtro - Filtros opcionais
   * @param {string} filtro.status - Filtrar por status do veículo
   * @returns {Promise<Array>} - Lista de localizações
   */
  async obterLocalizacoesFrota(filtro = {}) {
    try {
      // Buscar todos os veículos (com filtro opcional de status)
      const veiculosFiltro = {};
      if (filtro.status) {
        veiculosFiltro.status = filtro.status;
      }
      
      const veiculos = await Veiculo.find(veiculosFiltro).select('_id');
      const veiculosIds = veiculos.map(v => v._id);
      
      // Buscar a última localização para cada veículo
      const ultimasLocalizacoes = [];
      
      // Para cada veículo, buscar a última localização
      // Fazemos isso usando aggregation para melhor performance
      const resultados = await Localizacao.aggregate([
        {
          $match: {
            veiculo: { $in: veiculosIds.map(id => new mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: '$veiculo',
            doc: { $first: '$$ROOT' }
          }
        },
        {
          $replaceRoot: { newRoot: '$doc' }
        }
      ]);
      
      // Popular dados dos veículos e viagens
      if (resultados.length > 0) {
        for (const loc of resultados) {
          const veiculo = await Veiculo.findById(loc.veiculo)
            .select('placa modelo marca tipo status quilometragem_atual');
          
          let viagem = null;
          if (loc.viagem) {
            viagem = await Viagem.findById(loc.viagem)
              .select('origem destino data_ida data_volta status');
          }
          
          ultimasLocalizacoes.push({
            ...loc,
            veiculo,
            viagem
          });
        }
      }
      
      return ultimasLocalizacoes;
    } catch (erro) {
      console.error('Erro ao obter localizações da frota:', erro);
      throw new ErroAPI('Erro ao obter localizações dos veículos da frota', 500);
    }
  }
  
  /**
   * Calcula a distância estimada entre dois pontos geográficos
   * @param {number} lat1 - Latitude do ponto 1
   * @param {number} lon1 - Longitude do ponto 1
   * @param {number} lat2 - Latitude do ponto 2
   * @param {number} lon2 - Longitude do ponto 2
   * @returns {number} - Distância em quilômetros
   */
  calcularDistancia(lat1, lon1, lat2, lon2) {
    // Implementação da fórmula de Haversine para calcular distância entre coordenadas
    const R = 6371; // Raio da Terra em km
    
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    
    return distancia;
  }
  
  /**
   * Converte graus para radianos
   * @param {number} valor - Valor em graus
   * @returns {number} - Valor em radianos
   * @private
   */
  _toRad(valor) {
    return valor * Math.PI / 180;
  }
  
  /**
   * Calcula o tempo estimado de chegada com base na distância e velocidade média
   * @param {number} distancia - Distância em quilômetros
   * @param {number} velocidadeMedia - Velocidade média em km/h
   * @returns {number} - Tempo estimado em minutos
   */
  calcularTempoEstimado(distancia, velocidadeMedia = 60) {
    // Se velocidade for zero, retorna valor infinito
    if (velocidadeMedia <= 0) {
      return Infinity;
    }
    
    // Cálculo básico: tempo = distância / velocidade (em horas)
    const tempoHoras = distancia / velocidadeMedia;
    
    // Converter para minutos
    return Math.round(tempoHoras * 60);
  }
}

module.exports = new MonitoramentoService(); 