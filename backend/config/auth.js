require('dotenv').config();

/**
 * Configurações para autenticação e segurança da aplicação
 */
module.exports = {
  // Configurações JWT
  secret: process.env.JWT_SECRET || 'tfd360-default-secret-key-must-be-changed-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'tfd360-refresh-secret-key-must-be-changed-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Configurações de segurança
  saltRounds: 10, // Para bcrypt
  tokenResetPasswordExpires: 3600000, // 1 hora em milissegundos
  
  // Configurações de bloqueio de conta
  maxLoginAttempts: 5,
  lockTime: 15 * 60 * 1000, // 15 minutos em milissegundos
  
  // Perfis de usuário
  perfis: {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_PREFEITURA: 'Admin Prefeitura',
    GESTOR_TFD: 'Gestor TFD',
    SECRETARIO_SAUDE: 'Secretario Saude',
    MOTORISTA: 'Motorista',
    ADMINISTRATIVO: 'Administrativo',
    PACIENTE: 'Paciente'
  },
  
  // Permissões do sistema
  permissoes: {
    // Permissões administrativas
    GERENCIAR_USUARIOS: 'users_manage',
    GERENCIAR_PREFEITURAS: 'prefeituras_manage',
    VER_LOGS: 'logs_view',
    
    // Permissões de relatórios
    GERAR_RELATORIO_USUARIOS: 'gerar_relatorio_usuarios',
    GERAR_RELATORIO_PREFEITURAS: 'gerar_relatorio_prefeituras',
    GERAR_RELATORIO_LOGS: 'gerar_relatorio_logs',
    
    // Permissões de viagens e pacientes (para módulos futuros)
    GERENCIAR_VIAGENS: 'viagens_manage',
    GERENCIAR_PACIENTES: 'pacientes_manage'
  }
}; 