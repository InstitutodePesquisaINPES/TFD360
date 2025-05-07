import React from 'react';
import { Select as ChakraSelect, SelectProps } from '@chakra-ui/react';

/**
 * Componente Select acessível que sempre inclui o atributo title
 */
const Select: React.FC<SelectProps> = (props) => {
  // Garantir que o title seja sempre definido baseado na aria-label ou placeholder
  const title = props['aria-label'] || props.placeholder || "Selecione uma opção";
  
  return <ChakraSelect {...props} title={title} />;
};

export default Select; 