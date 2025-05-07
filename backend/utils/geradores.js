const SolicitacaoTFD = require('../models/solicitacao-tfd.model');

/**
 * Gera um número de solicitação único no formato ANO/NUMERO_SEQUENCIAL
 * Exemplo: 2023/000001
 * @returns {Promise<string>} O número de solicitação gerado
 */
exports.gerarNumeroSolicitacao = async () => {
  const anoAtual = new Date().getFullYear();
  
  // Buscar a última solicitação do ano atual
  const ultimaSolicitacao = await SolicitacaoTFD.findOne({
    numero_solicitacao: { $regex: `^${anoAtual}/` }
  })
  .sort({ numero_solicitacao: -1 })
  .select('numero_solicitacao');
  
  let proximoNumero = 1;
  
  if (ultimaSolicitacao) {
    // Extrair o número sequencial da última solicitação
    const partes = ultimaSolicitacao.numero_solicitacao.split('/');
    if (partes.length === 2) {
      proximoNumero = parseInt(partes[1]) + 1;
    }
  }
  
  // Formatar o número com zeros à esquerda (6 dígitos)
  const numeroFormatado = String(proximoNumero).padStart(6, '0');
  
  return `${anoAtual}/${numeroFormatado}`;
}; 