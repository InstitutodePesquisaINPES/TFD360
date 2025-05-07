import React, { forwardRef } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

/**
 * Propriedades estendidas para o InputAcessivel
 */
export type PropriedadesInputAcessivel = InputProps & {
  /**
   * Nome acessível para o campo de entrada
   */
  nomeAcessivel?: string;
  
  /**
   * Descrição adicional para leitores de tela
   */
  descricaoAcessivel?: string;
};

/**
 * Campo de entrada acessível que garante compatibilidade com tecnologias assistivas
 * 
 * Este componente estende o Input do Chakra UI adicionando propriedades essenciais
 * para acessibilidade como aria-label, title e outros atributos.
 * 
 * @param nomeAcessivel - Nome descritivo para o campo
 * @param descricaoAcessivel - Descrição adicional para o campo
 * @param aria-label - Alternativa para o nome acessível
 * @param placeholder - Texto de placeholder
 */
const InputAcessivel = forwardRef<HTMLInputElement, PropriedadesInputAcessivel>(
  ({ nomeAcessivel, descricaoAcessivel, 'aria-label': ariaLabel, placeholder, ...props }, ref) => {
    // Garantir que o campo tenha um nome acessível
    const nomeAcessivelFinal = nomeAcessivel || ariaLabel || placeholder || 'Campo de entrada';
    
    // Configurar descrição adicional, se fornecida
    const temDescricaoAdicional = !!descricaoAcessivel;
    const descricaoId = temDescricaoAdicional ? `desc-${props.id || Math.random().toString(36).substring(2, 9)}` : undefined;
    
    return (
      <>
        <Input
          ref={ref}
          {...props}
          aria-label={nomeAcessivelFinal}
          title={nomeAcessivelFinal}
          aria-describedby={descricaoId}
          data-testid="input-acessivel"
          className={`acessibilidade-componente ${props.className || ''}`}
        />
        
        {/* Descrição acessível adicional, visível apenas para leitores de tela */}
        {temDescricaoAdicional && (
          <span
            id={descricaoId}
            style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', 
                    margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', 
                    whiteSpace: 'nowrap', border: '0' }}
          >
            {descricaoAcessivel}
          </span>
        )}
      </>
    );
  }
);

// Nome para facilitar depuração
InputAcessivel.displayName = 'InputAcessivel';

export default InputAcessivel; 