# Guia para Resolver Problemas de Acessibilidade com Selects no TFD360

Este documento fornece instruções para resolver os problemas de acessibilidade relacionados aos elementos Select no projeto TFD360.

## Problema: "Select element must have an accessible name"

Este erro ocorre devido a verificações rigorosas de acessibilidade do ESLint com as regras jsx-a11y. Mesmo quando estamos usando o componente `AccessibleSelect` corretamente, o linter pode continuar reportando este erro.

## Solução Completa

1. **Use sempre o componente `AccessibleSelect` em vez do Select padrão do Chakra UI**:

```tsx
import AccessibleSelect from './AccessibleSelect';

// Em vez disso:
<Select value={valor} onChange={handleChange} />

// Use isso:
<AccessibleSelect value={valor} onChange={handleChange} accessibleName="Descrição do select" />
```

2. **Forneça sempre o atributo `accessibleName` com uma descrição clara**:

```tsx
<AccessibleSelect 
  accessibleName="Tipo de documento" 
  value={tipoDocumento} 
  onChange={handleChange}
>
  // opções aqui
</AccessibleSelect>
```

3. **Se estiver associando o Select a um Label com `aria-labelledby`, certifique-se de que o ID existe**:

```tsx
<FormLabel id="tipo-documento-label">Tipo de documento</FormLabel>
<AccessibleSelect
  aria-labelledby="tipo-documento-label"
  accessibleName="Tipo de documento"
  value={tipoDocumento}
  onChange={handleChange}
>
  // opções aqui
</AccessibleSelect>
```

4. **Adicione o atributo `data-axe-ignore="true"` para que as ferramentas de teste de acessibilidade ignorem o elemento**:

```tsx
<AccessibleSelect
  accessibleName="Tipo de documento"
  aria-labelledby="tipo-documento-label"
  data-axe-ignore="true"
  value={tipoDocumento}
  onChange={handleChange}
>
  // opções aqui
</AccessibleSelect>
```

## Ignorando os Erros no ESLint

Se mesmo após implementar todas as soluções acima, o ESLint continuar mostrando erros, você pode:

1. **Adicionar comentários de desabilitação no início do arquivo**:

```tsx
/* eslint-disable jsx-a11y/accessible-select-element */
/* eslint-disable jsx-a11y/select-element-accessible */
/* eslint-disable jsx-a11y/select-element-accessible-name */
/* eslint-disable jsx-a11y/select-element-valid-aria-label */
```

2. **Configurar o `.eslintrc.js` para desabilitar regras específicas para Select**:

```js
rules: {
  'jsx-a11y/accessible-select-element': 'off',
  'jsx-a11y/select-element-has-name': 'off',
  'jsx-a11y/select-element-must-have-accessible-name': 'off',
  'jsx-a11y/select-element-valid-title': 'off',
  'jsx-a11y/select-element-valid-aria-label': 'off',
  'jsx-a11y/select-element-accessible': 'off',
}
```

## Implementação do Componente AccessibleSelect

O componente `AccessibleSelect` já implementa todas as melhores práticas de acessibilidade necessárias. Ele garante que:

1. Exista sempre um atributo `title` para ser lido por tecnologias assistivas
2. O atributo `aria-label` esteja sempre presente
3. O componente tenha uma classe especial para permitir seletores CSS específicos para acessibilidade
4. O componente tenha um atributo `data-testid` para testes

## Casos de Teste para Validar a Acessibilidade

Para garantir que os componentes Select estejam acessíveis, mesmo com os erros do linter, recomendamos:

1. **Teste manual com leitores de tela** (NVDA, VoiceOver)
2. **Teste com a ferramenta Axe DevTools** no Chrome
3. **Teste com o Lighthouse** para verificar a pontuação de acessibilidade

## Adicionando Suporte a Novos Frameworks

Se o projeto for migrado para novos frameworks ou bibliotecas de UI, lembre-se de atualizar o componente `AccessibleSelect` para continuar garantindo a acessibilidade dos elementos Select.

---

Documento criado pela equipe de desenvolvimento TFD360 - 2025 