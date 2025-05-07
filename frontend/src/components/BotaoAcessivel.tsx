import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

/**
 * Propriedades estendidas para o BotaoAcessivel
 */
export type PropriedadesBotaoAcessivel = ButtonProps & {
  /**
   * Descrição acessível do botão para tecnologias assistivas
   */
  descricaoAcessivel?: string;
};

/**
 * Componente de botão acessível que garante compatibilidade com tecnologias assistivas
 * 
 * Este componente estende o Button do Chakra UI adicionando propriedades essenciais
 * para acessibilidade como aria-label e atributos para testes.
 * 
 * @param descricaoAcessivel - Texto descritivo para leitores de tela
 * @param aria-label - Alternativa para descrição acessível
 * @param children - Conteúdo do botão
 */
const BotaoAcessivel = forwardRef<HTMLButtonElement, PropriedadesBotaoAcessivel>(
  ({ descricaoAcessivel, 'aria-label': ariaLabel, children, ...props }, ref) => {
    // Garantir que o botão tenha uma descrição acessível adequada
    const descricaoFinal = descricaoAcessivel || ariaLabel || 
      (typeof children === 'string' ? children : 'Botão');
    
    return (
      <Button
        ref={ref}
        {...props}
        aria-label={descricaoFinal}
        title={descricaoFinal}
        data-testid="botao-acessivel"
        className={`acessibilidade-componente ${props.className || ''}`}
      >
        {children}
      </Button>
    );
  }
);

// Nome para facilitar depuração
BotaoAcessivel.displayName = 'BotaoAcessivel';

export default BotaoAcessivel; 