/**
 * Verifica se uma string é um ID válido no formato ObjectId do MongoDB
 * @param {string} id - ID a ser verificado
 * @returns {boolean} - True se for um ObjectId válido, False caso contrário
 */
const validarObjetoId = (id) => {
  if (!id) return false;
  
  // Regex para validar formato de ObjectId do MongoDB (24 caracteres hexadecimais)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Normaliza um texto removendo acentos, espaços extras e convertendo para minúsculas
 * @param {string} texto - Texto a ser normalizado
 * @returns {string} - Texto normalizado
 */
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')            // Remove espaços extras
    .trim()
    .toLowerCase();
};

/**
 * Valida um objeto de acordo com um esquema de validação
 * @param {Object} objeto - Objeto a ser validado
 * @param {Object} esquema - Esquema de validação (campos e regras)
 * @returns {Object} - Objeto com resultado da validação {valido, erros}
 */
const validarObjeto = (objeto, esquema) => {
  const erros = [];
  
  // Verifica campos obrigatórios e aplica validações
  Object.keys(esquema).forEach(campo => {
    const regras = esquema[campo];
    
    // Verificar se o campo é obrigatório
    if (regras.obrigatorio && (objeto[campo] === undefined || objeto[campo] === null || objeto[campo] === '')) {
      erros.push({
        campo,
        mensagem: `O campo ${campo} é obrigatório`
      });
      return;
    }
    
    // Se o campo não existe e não é obrigatório, pular validações
    if (objeto[campo] === undefined || objeto[campo] === null) {
      return;
    }
    
    // Validar tipo
    if (regras.tipo) {
      let tipoValido = true;
      
      switch (regras.tipo) {
        case 'string':
          tipoValido = typeof objeto[campo] === 'string';
          break;
        case 'number':
          tipoValido = typeof objeto[campo] === 'number' && !isNaN(objeto[campo]);
          break;
        case 'boolean':
          tipoValido = typeof objeto[campo] === 'boolean';
          break;
        case 'object':
          tipoValido = typeof objeto[campo] === 'object' && !Array.isArray(objeto[campo]);
          break;
        case 'array':
          tipoValido = Array.isArray(objeto[campo]);
          break;
        case 'date':
          tipoValido = objeto[campo] instanceof Date || !isNaN(new Date(objeto[campo]).getTime());
          break;
      }
      
      if (!tipoValido) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ser do tipo ${regras.tipo}`
        });
      }
    }
    
    // Validar expressões regulares
    if (regras.regex && typeof objeto[campo] === 'string') {
      if (!regras.regex.test(objeto[campo])) {
        erros.push({
          campo,
          mensagem: regras.mensagemRegex || `O campo ${campo} possui formato inválido`
        });
      }
    }
    
    // Validar comprimento mínimo (para strings e arrays)
    if (regras.minLength !== undefined) {
      const comprimento = Array.isArray(objeto[campo]) || typeof objeto[campo] === 'string' 
        ? objeto[campo].length
        : String(objeto[campo]).length;
        
      if (comprimento < regras.minLength) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ter no mínimo ${regras.minLength} caracteres`
        });
      }
    }
    
    // Validar comprimento máximo (para strings e arrays)
    if (regras.maxLength !== undefined) {
      const comprimento = Array.isArray(objeto[campo]) || typeof objeto[campo] === 'string' 
        ? objeto[campo].length
        : String(objeto[campo]).length;
        
      if (comprimento > regras.maxLength) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ter no máximo ${regras.maxLength} caracteres`
        });
      }
    }
    
    // Validar valor mínimo (para números)
    if (regras.min !== undefined && typeof objeto[campo] === 'number') {
      if (objeto[campo] < regras.min) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ser maior ou igual a ${regras.min}`
        });
      }
    }
    
    // Validar valor máximo (para números)
    if (regras.max !== undefined && typeof objeto[campo] === 'number') {
      if (objeto[campo] > regras.max) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ser menor ou igual a ${regras.max}`
        });
      }
    }
    
    // Validar enum (valores permitidos)
    if (regras.enum && Array.isArray(regras.enum)) {
      if (!regras.enum.includes(objeto[campo])) {
        erros.push({
          campo,
          mensagem: `O campo ${campo} deve ser um dos seguintes valores: ${regras.enum.join(', ')}`
        });
      }
    }
    
    // Validação customizada
    if (regras.validacao && typeof regras.validacao === 'function') {
      const resultadoValidacao = regras.validacao(objeto[campo], objeto);
      if (resultadoValidacao !== true) {
        erros.push({
          campo,
          mensagem: resultadoValidacao || `O campo ${campo} é inválido`
        });
      }
    }
  });
  
  return {
    valido: erros.length === 0,
    erros
  };
};

module.exports = {
  validarObjetoId,
  normalizarTexto,
  validarObjeto
}; 