import { Select, SelectProps } from '@chakra-ui/react';
import { ForwardedRef, forwardRef, ReactNode } from 'react';

export type PropriedadesSelectAcessivel = SelectProps & {
  descricaoAcessivel?: string;
  children: ReactNode;
};

function SelectAcessivelBase(
  { descricaoAcessivel, children, 'aria-label': ariaLabel, ...resto }: PropriedadesSelectAcessivel,
  ref: ForwardedRef<HTMLSelectElement>
) {
  const descricao = descricaoAcessivel || ariaLabel;

  return (
    <Select
      ref={ref}
      className="componente-acessivel"
      aria-label={descricao}
      data-testid="select-acessivel"
      {...resto}
    >
      {children}
    </Select>
  );
}

export const SelectAcessivel = forwardRef(SelectAcessivelBase); 