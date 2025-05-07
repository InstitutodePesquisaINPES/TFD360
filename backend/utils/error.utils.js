const { StatusCodes } = require('http-status-codes');

/**
 * Cria um objeto de erro padronizado com status HTTP
 * @param {string} mensagem - Mensagem do erro
 * @param {number} statusCode - Código de status HTTP (default: 500)
 * @param {Object} detalhes - Detalhes adicionais do erro (opcional)
 * @returns {Error} - Objeto de erro com propriedades adicionais
 */
const criarError = (mensagem, statusCode = 500, detalhes = null) => {
  const erro = new Error(mensagem);
  erro.statusCode = statusCode;
  
  if (detalhes) {
    erro.detalhes = detalhes;
  }
  
  return erro;
};

/**
 * Trata erros de forma padronizada nas respostas da API
 * @param {Object} res - Objeto de resposta Express
 * @param {Error} erro - Objeto de erro
 */
const tratarErro = (res, erro) => {
  console.error('Erro na API:', erro);
  
  // Status code padrão ou o especificado no erro
  const statusCode = erro.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  
  // Resposta básica de erro
  const respostaErro = {
    mensagem: erro.message || 'Erro interno do servidor'
  };
  
  // Adicionar detalhes se existirem e não for erro 500
  if (erro.detalhes && statusCode !== StatusCodes.INTERNAL_SERVER_ERROR) {
    respostaErro.detalhes = erro.detalhes;
  }
  
  // Adicionar stack trace em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development' && statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    respostaErro.stack = erro.stack;
  }
  
  // Erros específicos do Mongoose
  if (erro.name === 'ValidationError') {
    const errosValidacao = Object.values(erro.errors).map(e => ({
      campo: e.path,
      mensagem: e.message
    }));

    return res.status(StatusCodes.BAD_REQUEST).json({
      mensagem: 'Erro de validação',
      erros: errosValidacao
    });
  }
  
  // Erro de ID não encontrado
  if (erro.name === 'CastError' && erro.kind === 'ObjectId') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      mensagem: `ID inválido: ${erro.value}`
    });
  }
  
  // Erros de duplicação única
  if (erro.code === 11000) {
    const campo = Object.keys(erro.keyValue)[0];
    const valor = erro.keyValue[campo];
    
    return res.status(StatusCodes.CONFLICT).json({
      mensagem: `Valor '${valor}' duplicado para o campo '${campo}'`
    });
  }
  
  // Retorna a resposta de erro padrão
  return res.status(statusCode).json(respostaErro);
};

module.exports = {
  criarError,
  tratarErro
}; 