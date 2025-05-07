/**
 * Formatadores para dados comuns no sistema
 */

/**
 * Formata um CPF para o padrão brasileiro (000.000.000-00)
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado
 */
export const formatarCPF = (cpf) => {
  if (!cpf) return '-';
  
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.toString().replace(/\D/g, '');
  
  // Aplica a formatação
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um CNPJ para o padrão brasileiro (00.000.000/0000-00)
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado
 */
export const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  
  // Remover caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Aplicar máscara
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata um número de telefone para o padrão brasileiro
 * @param {string} telefone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 */
export const formatarTelefone = (telefone) => {
  if (!telefone) return '-';
  
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.toString().replace(/\D/g, '');
  
  // Verifica se é celular (11 dígitos) ou fixo (10 dígitos)
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return telefoneLimpo; // Retorna sem formatação se não se encaixar nos padrões
};

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 * @param {string|Date} data - Data a ser formatada
 * @param {boolean} incluirHora - Se deve incluir a hora
 * @returns {string} Data formatada
 */
export const formatarData = (data, incluirHora = false) => {
  if (!data) return '-';
  
  const dataObj = new Date(data);
  
  // Verifica se a data é válida
  if (isNaN(dataObj.getTime())) return '-';
  
  // Formata a data
  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const ano = dataObj.getFullYear();
  
  let resultado = `${dia}/${mes}/${ano}`;
  
  // Adiciona hora se solicitado
  if (incluirHora) {
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minuto = String(dataObj.getMinutes()).padStart(2, '0');
    resultado += ` ${hora}:${minuto}`;
  }
  
  return resultado;
};

/**
 * Formata um valor monetário para o padrão brasileiro (R$ 0.000,00)
 * @param {number} valor - Valor a ser formatado
 * @param {boolean} incluirSimbolo - Se deve incluir o símbolo R$
 * @returns {string} Valor formatado
 */
export const formatarDinheiro = (valor, incluirSimbolo = true) => {
  if (valor === null || valor === undefined) return '-';
  
  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
  
  return incluirSimbolo ? `R$ ${valorFormatado}` : valorFormatado;
};

/**
 * Calcula a idade com base na data de nascimento
 * @param {string|Date} dataNascimento - Data de nascimento
 * @returns {number|string} Idade calculada ou '-' se data inválida
 */
export const calcularIdade = (dataNascimento) => {
  if (!dataNascimento) return '-';
  
  const nascimento = new Date(dataNascimento);
  
  // Verifica se a data é válida
  if (isNaN(nascimento.getTime())) return '-';
  
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  // Ajusta a idade se ainda não fez aniversário no ano corrente
  if (mesAtual < mesNascimento || 
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
};

/**
 * Formata um número de cartão SUS (18 dígitos)
 * @param {string} cartaoSus - Número do cartão SUS
 * @returns {string} Cartão SUS formatado
 */
export const formatarCartaoSUS = (cartaoSus) => {
  if (!cartaoSus) return '-';
  
  // Remove caracteres não numéricos
  const cartaoLimpo = cartaoSus.toString().replace(/\D/g, '');
  
  // Aplica a formatação para cartão SUS
  return cartaoLimpo.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
};

/**
 * Formata um CEP para o padrão brasileiro (00000-000)
 * @param {string} cep - CEP a ser formatado
 * @returns {string} CEP formatado
 */
export const formatarCEP = (cep) => {
  if (!cep) return '';
  
  // Remover caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, '');
  
  // Aplicar máscara
  return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata texto em título (primeira letra de cada palavra em maiúsculo)
 * @param {string} texto - Texto a ser formatado
 * @returns {string} Texto formatado
 */
export const formatarTitulo = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formata um texto longo para exibição encurtada, se necessário
 * @param {string} texto - Texto a ser formatado
 * @param {number} tamanhoMaximo - Tamanho máximo do texto
 * @returns {string} Texto formatado
 */
export const formatarTextoLongo = (texto, tamanhoMaximo = 100) => {
  if (!texto) return '';
  
  if (texto.length <= tamanhoMaximo) {
    return texto;
  }
  
  return texto.substring(0, tamanhoMaximo) + '...';
};

/**
 * Remove acentos de um texto
 * @param {string} texto - Texto a ser processado
 * @returns {string} Texto sem acentos
 */
export const removerAcentos = (texto) => {
  if (!texto) return '';
  
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Utilitários para formatação de dados exibidos na UI
 */

/**
 * Converte uma string para title case (primeira letra de cada palavra maiúscula)
 * @param {string} texto - Texto a ser convertido
 * @returns {string} Texto em title case
 */
export const formatarTitleCase = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}; 