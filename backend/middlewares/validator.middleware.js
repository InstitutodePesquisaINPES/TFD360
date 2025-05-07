/**
 * Middleware para validar dados de entrada
 * @param {object} schema - O esquema de validação a ser usado
 * @param {string} source - A fonte dos dados a serem validados (body, params ou query)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Obter os dados da fonte especificada
      const data = req[source];
      
      // Validar os dados com o esquema fornecido
      const result = schema.validate(data, { abortEarly: false });
      
      // Se houver erros de validação, retornar uma resposta de erro
      if (result.error) {
        const errors = result.error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          error: true,
          message: 'Dados inválidos',
          errors
        });
      }
      
      // Se não houver erros, continuar para o próximo middleware ou controlador
      req[source] = result.value; // Substitui os dados originais pelos validados
      return next();
    } catch (error) {
      // Em caso de erro interno durante a validação
      return res.status(500).json({
        error: true,
        message: 'Erro na validação',
        details: error.message
      });
    }
  };
};

module.exports = { validate }; 