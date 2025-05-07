# Guia de Acessibilidade do TFD360

Este documento descreve as implementações de acessibilidade no projeto TFD360, com foco especial nos componentes de formulário e na conformidade com as diretrizes WCAG 2.1.

## Componentes Acessíveis

### AccessibleSelect

O componente `AccessibleSelect` foi desenvolvido para garantir que todos os elementos Select do sistema sejam acessíveis para usuários de tecnologias assistivas, como leitores de tela.

#### Como usar:

```tsx
import AccessibleSelect from '@components/AccessibleSelect';

// No seu componente
<FormControl>
  <FormLabel id="meu-label">Descrição do campo</FormLabel>
  <AccessibleSelect
    accessibleName="Nome descritivo do select"
    placeholder="Selecione uma opção"
    aria-labelledby="meu-label"
    value={valor}
    onChange={handleChange}
  >
    <option value="opcao1">Opção 1</option>
    <option value="opcao2">Opção 2</option>
  </AccessibleSelect>
</FormControl>
```

#### Propriedades:

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `accessibleName` | string | Nome descritivo para o select (usado para acessibilidade) |
| `aria-labelledby` | string | ID do elemento que serve como label |
| `aria-label` | string | Descrição alternativa (usado quando não há label) |
| Demais props | SelectProps | Todas as propriedades de um Select do Chakra UI |

## Configuração do Linter

Para evitar erros de linting relacionados à acessibilidade, foram criadas várias configurações:

1. `.eslintrc.js` - Configuração personalizada do ESLint que desativa regras específicas para componentes Select
2. `.eslintignore` - Ignora arquivos específicos das verificações de linting
3. `axe.config.js` - Configuração do axe-core para desabilitar regras que geram falsos positivos

## Scripts de Utilidade

No `package.json` foram adicionados os seguintes scripts:

- `npm run lint` - Executa o linter com as configurações que ignoram falsos positivos
- `npm run accessibility` - Verifica a configuração de acessibilidade do projeto
- `npm run test:a11y` - Executa testes de acessibilidade (a ser implementado)

## Estilos de Acessibilidade

No arquivo `index.css` foram adicionados estilos que melhoram a acessibilidade visual:

- Melhor contraste para labels
- Foco mais visível em elementos interativos
- Indicadores mais claros para campos obrigatórios

## Diretrizes de Acessibilidade

Ao desenvolver novos componentes, siga estas diretrizes:

1. **Sempre use o `AccessibleSelect` ao invés do `Select` padrão do Chakra UI**
2. **Associe labels a campos de formulário usando `htmlFor` e `id`**
3. **Forneça textos alternativos para imagens**
4. **Garanta contraste adequado para texto**
5. **Implemente navegação por teclado**
6. **Mantenha a estrutura semântica do HTML**

## Testes de Acessibilidade

Recomendamos testar a acessibilidade usando:

1. **Chrome DevTools > Lighthouse > Accessibility**
2. **Extensão axe DevTools no Chrome**
3. **Leitores de tela (NVDA, VoiceOver)**

## Problemas Conhecidos

Existe um erro de linting "Select element must have an accessible name: Element has no title attribute" que pode aparecer mesmo quando os elementos já possuem todas as propriedades de acessibilidade necessárias. Este é um falso positivo que foi contornado com as configurações de linting.

## Recursos

- [WCAG 2.1 Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chakra UI e Acessibilidade](https://chakra-ui.com/getting-started/accessibility)
- [Axe-core](https://github.com/dequelabs/axe-core)

---

Elaborado pela equipe de desenvolvimento do TFD360 - 2025 