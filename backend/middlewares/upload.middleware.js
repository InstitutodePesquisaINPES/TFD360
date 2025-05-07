const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Definir o diretório de destino com base no tipo de upload
    let uploadDir = 'public/uploads';
    
    // Verificar a rota atual para determinar o tipo de arquivo
    if (req.originalUrl.includes('/veiculos')) {
      uploadDir = path.join(uploadDir, 'veiculos');
    } else if (req.originalUrl.includes('/motoristas')) {
      uploadDir = path.join(uploadDir, 'motoristas');
    } else if (req.originalUrl.includes('/documentos')) {
      uploadDir = path.join(uploadDir, 'documentos');
    } else if (req.originalUrl.includes('/manutencoes')) {
      uploadDir = path.join(uploadDir, 'manutencoes');
    } else if (req.originalUrl.includes('/ocorrencias')) {
      uploadDir = path.join(uploadDir, 'ocorrencias');
    } else {
      uploadDir = path.join(uploadDir, 'outros');
    }
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome de arquivo único
    const uniquePrefix = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniquePrefix}-${timestamp}${fileExt}`);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  // Verificar tipos de arquivo permitidos
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false);
  }
};

// Configuração de tamanho máximo
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// Criar instância do multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload; 