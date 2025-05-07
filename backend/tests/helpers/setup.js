// Configurações globais para os testes

// Aumentar o tempo limite para operações assíncronas
jest.setTimeout(30000);

// Silenciar logs durante testes, exceto se DEBUG=true
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  // Mantém os erros visíveis para debug
  // global.console.error = jest.fn();
}

// Mock para requisições HTTP externas se necessário
// jest.mock('axios');

// Configuração para limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Configuração global para testes
jest.setTimeout(10000); // 10 segundos de timeout para cada teste

// Mock do console.error para não poluir os logs durante os testes
global.console.error = jest.fn();

// Mock do mongoose para os testes
jest.mock('mongoose', () => {
  const mmongoose = {
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      once: jest.fn(),
      on: jest.fn()
    },
    Schema: function(schema) {
      return schema;
    },
    model: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      create: jest.fn().mockReturnThis(),
      updateOne: jest.fn().mockReturnThis(),
      deleteOne: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue({}),
      paginate: jest.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
        limit: 10,
        totalPages: 0,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      }),
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id)
    }
  };

  return mmongoose;
});

// Mock do fs para os testes
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('conteúdo do arquivo')),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({
      isDirectory: jest.fn().mockReturnValue(true),
      isFile: jest.fn().mockReturnValue(true)
    })
  },
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis()
  }),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  }),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock do bcrypt para os testes
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash_simulado'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock do jsonwebtoken para os testes
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token_jwt_simulado'),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (token === 'token_invalido') {
      return callback(new Error('Token inválido'), null);
    }
    return callback(null, { id: 'usuario_id_simulado' });
  })
}));

// Mock do nodemailer para os testes
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mensagem_id_simulado'
    })
  })
}));

// Mock do pdfkit para os testes
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pipe: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });
}); 