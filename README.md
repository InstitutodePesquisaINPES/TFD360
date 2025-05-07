# TFD360 - Sistema Integrado de Gestão TFD

O TFD360 é um sistema completo para gestão de Tratamento Fora do Domicílio (TFD) desenvolvido para prefeituras e secretarias de saúde. Este sistema permite o gerenciamento eficiente de pacientes, viagens, motoristas, e todos os recursos relacionados ao TFD.

## Módulos

O sistema é composto por vários módulos:

### Módulo 1: Núcleo Administrativo, Multiusuário e Multi-prefeitura

Este módulo é a base do sistema, implementando:

- Sistema de login com autenticação segura JWT (access + refresh token)
- Perfis de usuários com diferentes permissões
- Cadastro e gerenciamento de prefeituras (multi-tenant)
- Painel administrativo adaptável ao perfil do usuário
- Layout padrão responsivo para todo o sistema
- Sistema de relatórios administrativos

## Requisitos de Sistema

- Node.js 16+
- MongoDB 4.4+
- NPM ou Yarn

## Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/tfd360.git
cd tfd360
```

### 2. Instale as dependências

#### Backend
```bash
cd TFD360/backend
npm install
```

#### Frontend
```bash
cd TFD360/frontend
npm install
```

### 3. Configure o ambiente

Crie um arquivo `.env` na raiz do diretório backend:

```env
# Configurações do servidor
PORT=3001
NODE_ENV=development

# Banco de dados
MONGODB_URI=mongodb://localhost:27017/tfd360

# JWT
JWT_SECRET=seu_secret_muito_seguro_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_muito_seguro_aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Outras configurações
UPLOAD_DIR=uploads
LOG_LEVEL=info
```

### 4. Inicialize o banco de dados

```bash
cd TFD360/backend
npm run seed
```

Este comando irá criar o primeiro usuário Super Admin:

- **Email**: admin@tfd360.com
- **Senha**: admin123

**Importante**: Altere esta senha após o primeiro login!

### 5. Inicie a aplicação

#### Para desenvolvimento:

Backend:
```bash
cd TFD360/backend
npm run dev
```

Frontend:
```bash
cd TFD360/frontend
npm run dev
```

#### Para produção:

Backend:
```bash
cd TFD360/backend
npm run build
npm start
```

Frontend:
```bash
cd TFD360/frontend
npm run build
```

Depois copie a pasta `build` para seu servidor web (Nginx, Apache, etc).

## Estrutura do Projeto

```
TFD360/
├── backend/
│   ├── config/          # Configurações da aplicação
│   ├── controllers/     # Controladores da API
│   ├── middlewares/     # Middlewares (autenticação, etc)
│   ├── models/          # Modelos do banco de dados
│   ├── routes/          # Rotas da API
│   ├── scripts/         # Scripts utilitários
│   ├── services/        # Serviços de negócio
│   └── utils/           # Funções utilitárias
│
├── frontend/
│   ├── public/          # Arquivos públicos
│   └── src/
│       ├── assets/      # Imagens, fontes, etc
│       ├── components/  # Componentes React
│       ├── contexts/    # Contextos React (Auth, etc)
│       ├── pages/       # Páginas da aplicação
│       └── services/    # Serviços para consumo da API
```

## Recursos Implementados no Módulo 1

1. **Sistema de Autenticação**
   - Login/logout com JWT
   - Refresh token para renovação de sessão
   - Bloqueio de conta após múltiplas tentativas
   - Recuperação de senha

2. **Gerenciamento de Prefeituras**
   - Cadastro completo com dados, logo e configurações
   - Controle de validade de contrato
   - Limite de usuários por prefeitura
   - Status da prefeitura (ativa, expirada, suspensa)

3. **Gerenciamento de Usuários**
   - Múltiplos perfis com diferentes permissões
   - Upload de foto de perfil
   - Vinculação com prefeitura
   - Alterar senha e dados pessoais

4. **Dashboard**
   - Estatísticas gerais adaptadas ao perfil
   - Visualização de prefeituras próximas do vencimento
   - Totais de usuários e outros recursos
   - Cards interativos com ações rápidas

5. **Relatórios**
   - Relatório de usuários
   - Relatório de prefeituras
   - Logs de acesso

## Segurança

- Senhas armazenadas com hash bcrypt
- Tokens JWT com tempo de expiração
- Verificação de permissões por middleware
- Proteção contra ataques de força bruta

## Perfis de Usuário

1. **Super Admin**
   - Acesso completo ao sistema
   - Gerencia todas as prefeituras e usuários
   - Visualiza todos os relatórios e estatísticas

2. **Admin Prefeitura**
   - Gerencia usuários da sua prefeitura
   - Configura parâmetros da prefeitura
   - Visualiza estatísticas da sua prefeitura

3. **Gestor TFD**
   - Gerencia pacientes e viagens
   - Aprova solicitações de viagem
   - Gera relatórios operacionais

4. **Secretário de Saúde**
   - Visualiza estatísticas gerais
   - Aprova solicitações especiais
   - Acesso a relatórios gerenciais

5. **Motorista**
   - Visualiza e atualiza suas viagens
   - Registra ocorrências
   - Check-in de pacientes

6. **Administrativo**
   - Cadastra e gerencia pacientes
   - Agenda viagens
   - Emite documentos

7. **Paciente**
   - Visualiza suas próprias viagens
   - Atualiza seus dados pessoais
   - Consulta histórico médico

## Contribuição

Para contribuir com o projeto, por favor:

1. Crie um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE).

## Suporte

Para suporte, entre em contato pelo email suporte@tfd360.com ou abra uma issue no GitHub. 