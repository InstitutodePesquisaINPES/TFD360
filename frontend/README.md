# TFD360 - Frontend

Frontend da aplicação TFD360 - Sistema Modular de Gestão Pública de TFD e Logística Municipal.

## 🛠️ Tecnologias Utilizadas

- [React](https://reactjs.org/) - Biblioteca JavaScript para construção de interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado de JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [React Router](https://reactrouter.com/) - Roteamento para React
- [Axios](https://axios-http.com/) - Cliente HTTP baseado em Promises
- [Heroicons](https://heroicons.com/) - Ícones SVG

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn

## 🚀 Instalação e Execução

1. **Instalar as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Configurar variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Iniciar o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   O frontend estará rodando em http://localhost:5173

## 📦 Construção para Produção

```bash
npm run build
# ou
yarn build
```

## 📁 Estrutura de Pastas

```
src/
├── assets/        - Recursos estáticos (imagens, ícones)
├── components/    - Componentes React reutilizáveis
│   ├── auth/      - Componentes de autenticação
│   ├── layout/    - Componentes de layout (Header, Sidebar)
│   ├── shared/    - Componentes compartilhados (botões, inputs)
│   └── dashboard/ - Componentes do dashboard
├── contexts/      - Contextos React (AuthContext)
├── pages/         - Páginas da aplicação
└── services/      - Serviços (API, utils)
```

## 👤 Usuários para Teste

Os seguintes usuários estão disponíveis para teste após inicializar o backend:

### Super Admin (Administrador da Empresa)
- **Email**: admin@tfd360.com.br
- **Senha**: admin123

### Admin da Prefeitura Demo
- **Email**: admin.demo@tfd360.com.br
- **Senha**: demo123

## 🧪 Testes

```bash
npm run test
# ou
yarn test
```

## 🔄 Integração com Backend

O frontend se comunica com o backend por meio de uma API RESTful. Todas as configurações de conexão com a API estão no arquivo `src/services/api.ts`.

## 📜 Licença

Este projeto está sob licença proprietária. © 2025 TFD360 Team

## Acessibilidade

O TFD360 segue as diretrizes WCAG 2.1 para garantir que o sistema seja acessível para todos os usuários, incluindo aqueles com deficiências.

### Componentes Acessíveis

Utilizamos componentes acessíveis personalizados que garantem compatibilidade com tecnologias assistivas. Para mais informações, consulte [ACESSIBILIDADE.md](./ACESSIBILIDADE.md).

### Configuração de Acessibilidade

Para configurar o ambiente de acessibilidade, execute:

```bash
npm run accessibility
```

### Testes de Acessibilidade

Para executar testes de acessibilidade:

```bash
npm run test:a11y
```

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)
