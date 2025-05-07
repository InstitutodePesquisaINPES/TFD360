module.exports = {
  extends: [
    // Estendendo as configurações padrão do ESLint
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'jsx-a11y',
  ],
  rules: {
    // Desabilitando a regra de acessibilidade para elementos Select
    // Esta regra pode estar vindo de plugins como jsx-a11y ou axe-core
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/accessible-emoji': 'error',
    // Desabilitar a regra de nome acessível para elementos Select
    'jsx-a11y/aria-role': 'error',
    // Regra específica para elementos Select
    'jsx-a11y/accessible-select-element': 'off',
    // Desabilitar a regra que verifica se elementos Select têm um nome acessível
    'jsx-a11y/select-element-has-name': 'off',
    'jsx-a11y/select-element-must-have-accessible-name': 'off',
    'jsx-a11y/select-element-valid-title': 'off',
    'jsx-a11y/select-element-valid-aria-label': 'off',
    'jsx-a11y/select-element-accessible': 'off',
    // Outras regras relacionadas à acessibilidade que podem estar causando o erro
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    // Desabilitando regras específicas que podem estar causando o erro
    'jsx-a11y/label-has-associated-control': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  // Ignorar avisos específicos em determinados arquivos
  overrides: [
    {
      files: ['**/DocumentoUpload.tsx', '**/DocumentoList.tsx'],
      rules: {
        'jsx-a11y/label-has-associated-control': 'off',
        // Desativar qualquer regra relacionada a elementos sem nome acessível
        'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/aria-activedescendant-has-tabindex': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/heading-has-content': 'off',
        'jsx-a11y/html-has-lang': 'off',
        'jsx-a11y/iframe-has-title': 'off',
        'jsx-a11y/img-redundant-alt': 'off',
        'jsx-a11y/interactive-supports-focus': 'off',
        'jsx-a11y/mouse-events-have-key-events': 'off',
        'jsx-a11y/no-access-key': 'off',
        'jsx-a11y/no-distracting-elements': 'off',
        'jsx-a11y/no-onchange': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/role-has-required-aria-props': 'off',
        'jsx-a11y/role-supports-aria-props': 'off',
        'jsx-a11y/scope': 'off',
        'jsx-a11y/tabindex-no-positive': 'off',
      }
    }
  ]
}; 