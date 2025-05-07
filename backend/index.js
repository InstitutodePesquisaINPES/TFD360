const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

// Importar rotas
const routes = require('./routes');

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diretório de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api', routes);

// Rota de teste da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      app.listen(PORT, () => {
        console.log(`Servidor TFD360 rodando na porta ${PORT}`);
        console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Acesse: http://localhost:${PORT}/api/status`);
      });
    } else {
      console.error('Não foi possível iniciar o servidor devido a falha na conexão com o banco de dados.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = app; // Para testes 