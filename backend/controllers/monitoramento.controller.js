const monitoramentoService = require('../services/monitoramento.service');
const { ErroAPI } = require('../utils/erros');

/**
 * Controlador para gerenciar requisições de monitoramento de frota
 */
class MonitoramentoController {
  /**
   * Registra uma nova localização para um veículo
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async registrarLocalizacao(req, res, next) {
    try {
      const { veiculoId } = req.params;
      const dadosLocalizacao = req.body;
      
      // Validar dados obrigatórios
      if (!dadosLocalizacao.latitude || !dadosLocalizacao.longitude) {
        throw new ErroAPI('Latitude e longitude são obrigatórios', 400);
      }
      
      const localizacao = await monitoramentoService.registrarLocalizacao(veiculoId, dadosLocalizacao);
      
      return res.status(201).json({
        mensagem: 'Localização registrada com sucesso',
        localizacao
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Obtém a última localização de um veículo
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async obterUltimaLocalizacao(req, res, next) {
    try {
      const { veiculoId } = req.params;
      
      const localizacao = await monitoramentoService.obterUltimaLocalizacao(veiculoId);
      
      return res.json({
        localizacao
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Obtém o histórico de localizações de um veículo
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async obterHistoricoLocalizacoes(req, res, next) {
    try {
      const { veiculoId } = req.params;
      const { 
        data_inicio, 
        data_fim, 
        viagem_id, 
        limite 
      } = req.query;
      
      const opcoes = {};
      
      if (data_inicio) opcoes.dataInicio = data_inicio;
      if (data_fim) opcoes.dataFim = data_fim;
      if (viagem_id) opcoes.viagemId = viagem_id;
      if (limite) opcoes.limite = parseInt(limite, 10);
      
      const localizacoes = await monitoramentoService.obterHistoricoLocalizacoes(veiculoId, opcoes);
      
      return res.json({
        total: localizacoes.length,
        localizacoes
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Obtém a localização de todos os veículos de uma viagem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async obterLocalizacoesViagem(req, res, next) {
    try {
      const { viagemId } = req.params;
      
      const localizacoes = await monitoramentoService.obterLocalizacoesViagem(viagemId);
      
      return res.json({
        total: localizacoes.length,
        localizacoes
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Obtém a localização atual de todos os veículos da frota
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async obterLocalizacoesFrota(req, res, next) {
    try {
      const { status } = req.query;
      const filtro = {};
      
      if (status) filtro.status = status;
      
      const localizacoes = await monitoramentoService.obterLocalizacoesFrota(filtro);
      
      return res.json({
        total: localizacoes.length,
        localizacoes
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Calcula o tempo estimado de chegada entre dois pontos
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Próxima função middleware
   */
  async calcularTempoEstimado(req, res, next) {
    try {
      const { 
        origem_lat, 
        origem_lon, 
        destino_lat, 
        destino_lon, 
        velocidade_media 
      } = req.query;
      
      // Validar parâmetros
      if (!origem_lat || !origem_lon || !destino_lat || !destino_lon) {
        throw new ErroAPI('Coordenadas de origem e destino são obrigatórias', 400);
      }
      
      // Converter para números
      const origemLat = parseFloat(origem_lat);
      const origemLon = parseFloat(origem_lon);
      const destinoLat = parseFloat(destino_lat);
      const destinoLon = parseFloat(destino_lon);
      const velocidadeMedia = velocidade_media ? parseFloat(velocidade_media) : 60;
      
      // Calcular distância
      const distancia = monitoramentoService.calcularDistancia(
        origemLat, origemLon, destinoLat, destinoLon
      );
      
      // Calcular tempo estimado
      const tempoEstimado = monitoramentoService.calcularTempoEstimado(
        distancia, velocidadeMedia
      );
      
      return res.json({
        distancia: {
          km: distancia.toFixed(2),
          metros: Math.round(distancia * 1000)
        },
        tempo_estimado: {
          minutos: tempoEstimado,
          horas: (tempoEstimado / 60).toFixed(2),
          formatado: this._formatarTempoEstimado(tempoEstimado)
        },
        velocidade_media: velocidadeMedia
      });
    } catch (erro) {
      next(erro);
    }
  }
  
  /**
   * Formata o tempo estimado em horas e minutos
   * @param {number} minutos - Tempo em minutos
   * @returns {string} - Tempo formatado
   * @private
   */
  _formatarTempoEstimado(minutos) {
    if (minutos === Infinity) {
      return 'Tempo indeterminado';
    }
    
    const horas = Math.floor(minutos / 60);
    const min = Math.round(minutos % 60);
    
    if (horas === 0) {
      return `${min} minutos`;
    } else if (horas === 1) {
      return `1 hora e ${min} minutos`;
    } else {
      return `${horas} horas e ${min} minutos`;
    }
  }
}

module.exports = new MonitoramentoController(); 