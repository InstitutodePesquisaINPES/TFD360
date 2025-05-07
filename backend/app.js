// Importar as rotas
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const prefeituraRoutes = require('./routes/prefeituras.routes');
const viagensRoutes = require('./routes/viagens.routes');
const frotaRoutes = require('./routes/frota.routes');
const monitoramentoRoutes = require('./routes/monitoramento.routes');

// Registrar as rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/prefeituras', prefeituraRoutes);
app.use('/api/viagens', viagensRoutes);
app.use('/api/frota', frotaRoutes);
app.use('/api/monitoramento', monitoramentoRoutes); 