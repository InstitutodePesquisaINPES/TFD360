const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { format } = require('date-fns');

/**
 * Serviço de cache para relatórios
 * Permite armazenar relatórios gerados frequentemente para reduzir o tempo de processamento
 */
class RelatorioCacheService {
  constructor() {
    this.cacheDirPath = path.join(__dirname, '../temp/relatorios-cache');
    this.cacheExpiracao = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    this.inicializarCache();
  }

  /**
   * Inicializa o diretório de cache se necessário
   */
  inicializarCache() {
    if (!fs.existsSync(this.cacheDirPath)) {
      try {
        fs.mkdirSync(this.cacheDirPath, { recursive: true });
        console.log('Diretório de cache de relatórios criado com sucesso');
      } catch (error) {
        console.error('Erro ao criar diretório de cache:', error);
      }
    }
    
    // Agendar limpeza periódica do cache
    setInterval(() => this.limparCacheExpirado(), 12 * 60 * 60 * 1000); // Limpar a cada 12 horas
  }

  /**
   * Gera uma chave única para o relatório baseado nos parâmetros
   * 
   * @param {string} tipoRelatorio - Tipo de relatório (ex: 'usuarios', 'prefeituras')
   * @param {Object} parametros - Parâmetros de filtro do relatório
   * @param {string} formato - Formato do relatório (pdf, excel, csv)
   * @returns {string} - Chave hash para o cache
   */
  gerarChaveCache(tipoRelatorio, parametros, formato) {
    // Ordenar as chaves para garantir consistência
    const paramsString = JSON.stringify(
      Object.keys(parametros || {})
        .sort()
        .reduce((obj, key) => {
          obj[key] = parametros[key];
          return obj;
        }, {})
    );
    
    // Criar hash da combinação de tipo, parâmetros e formato
    return crypto
      .createHash('md5')
      .update(`${tipoRelatorio}-${paramsString}-${formato}`)
      .digest('hex');
  }

  /**
   * Verifica se existe um relatório em cache e se ainda é válido
   * 
   * @param {string} chaveCache - Chave do cache a verificar
   * @returns {boolean} - True se o cache existir e for válido
   */
  cacheExiste(chaveCache) {
    const caminhoArquivo = path.join(this.cacheDirPath, `${chaveCache}.dat`);
    const caminhoMetadados = path.join(this.cacheDirPath, `${chaveCache}.meta.json`);
    
    if (!fs.existsSync(caminhoArquivo) || !fs.existsSync(caminhoMetadados)) {
      return false;
    }
    
    try {
      const metadados = JSON.parse(fs.readFileSync(caminhoMetadados, 'utf8'));
      const agora = new Date();
      
      // Verificar se o cache expirou
      return new Date(metadados.expiracao) > agora;
    } catch (error) {
      console.error('Erro ao verificar validade do cache:', error);
      return false;
    }
  }

  /**
   * Armazena um relatório no cache
   * 
   * @param {string} chaveCache - Chave única do relatório
   * @param {Buffer} dados - Conteúdo do relatório
   * @param {Object} metadados - Informações sobre o relatório
   * @returns {boolean} - True se o cache foi armazenado com sucesso
   */
  armazenarCache(chaveCache, dados, metadados = {}) {
    try {
      const caminhoArquivo = path.join(this.cacheDirPath, `${chaveCache}.dat`);
      const caminhoMetadados = path.join(this.cacheDirPath, `${chaveCache}.meta.json`);
      
      // Calcular data de expiração
      const agora = new Date();
      const expiracao = new Date(agora.getTime() + this.cacheExpiracao);
      
      // Armazenar o relatório
      fs.writeFileSync(caminhoArquivo, dados);
      
      // Armazenar metadados do relatório
      const metadadosSalvar = {
        ...metadados,
        dataCriacao: agora.toISOString(),
        expiracao: expiracao.toISOString(),
        tamanho: dados.length
      };
      
      fs.writeFileSync(caminhoMetadados, JSON.stringify(metadadosSalvar, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao armazenar no cache:', error);
      return false;
    }
  }

  /**
   * Recupera um relatório do cache
   * 
   * @param {string} chaveCache - Chave do cache a recuperar
   * @returns {Object|null} - Conteúdo do relatório e metadados ou null se não encontrado
   */
  recuperarCache(chaveCache) {
    try {
      // Verificar se o cache existe e é válido
      if (!this.cacheExiste(chaveCache)) {
        return null;
      }
      
      const caminhoArquivo = path.join(this.cacheDirPath, `${chaveCache}.dat`);
      const caminhoMetadados = path.join(this.cacheDirPath, `${chaveCache}.meta.json`);
      
      // Recuperar relatório e metadados
      const dados = fs.readFileSync(caminhoArquivo);
      const metadados = JSON.parse(fs.readFileSync(caminhoMetadados, 'utf8'));
      
      return { dados, metadados };
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      return null;
    }
  }

  /**
   * Remove um relatório específico do cache
   * 
   * @param {string} chaveCache - Chave do cache a remover
   * @returns {boolean} - True se removido com sucesso
   */
  removerCache(chaveCache) {
    try {
      const caminhoArquivo = path.join(this.cacheDirPath, `${chaveCache}.dat`);
      const caminhoMetadados = path.join(this.cacheDirPath, `${chaveCache}.meta.json`);
      
      if (fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
      }
      
      if (fs.existsSync(caminhoMetadados)) {
        fs.unlinkSync(caminhoMetadados);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao remover cache:', error);
      return false;
    }
  }

  /**
   * Limpa todos os caches expirados
   * 
   * @returns {number} - Número de arquivos de cache removidos
   */
  limparCacheExpirado() {
    try {
      const arquivos = fs.readdirSync(this.cacheDirPath);
      const metaArquivos = arquivos.filter(arquivo => arquivo.endsWith('.meta.json'));
      let removidos = 0;
      
      for (const metaArquivo of metaArquivos) {
        const caminhoMetadados = path.join(this.cacheDirPath, metaArquivo);
        const metadados = JSON.parse(fs.readFileSync(caminhoMetadados, 'utf8'));
        
        // Verificar se expirou
        if (new Date(metadados.expiracao) < new Date()) {
          // Remover arquivo de dados correspondente
          const chaveCache = metaArquivo.replace('.meta.json', '');
          this.removerCache(chaveCache);
          removidos++;
        }
      }
      
      console.log(`Cache de relatórios: ${removidos} arquivos expirados removidos.`);
      return removidos;
    } catch (error) {
      console.error('Erro ao limpar cache expirado:', error);
      return 0;
    }
  }

  /**
   * Lista todos os relatórios em cache
   * 
   * @returns {Array} - Lista de relatórios em cache com seus metadados
   */
  listarCache() {
    try {
      const arquivos = fs.readdirSync(this.cacheDirPath);
      const metaArquivos = arquivos.filter(arquivo => arquivo.endsWith('.meta.json'));
      const relatorios = [];
      
      for (const metaArquivo of metaArquivos) {
        const caminhoMetadados = path.join(this.cacheDirPath, metaArquivo);
        const chaveCache = metaArquivo.replace('.meta.json', '');
        
        try {
          const metadados = JSON.parse(fs.readFileSync(caminhoMetadados, 'utf8'));
          
          // Verificar se expirou
          const expirado = new Date(metadados.expiracao) < new Date();
          
          relatorios.push({
            chave: chaveCache,
            ...metadados,
            valido: !expirado
          });
        } catch (err) {
          // Ignorar arquivos de metadados corrompidos
          console.error(`Erro ao ler metadados de ${chaveCache}:`, err);
        }
      }
      
      return relatorios;
    } catch (error) {
      console.error('Erro ao listar cache:', error);
      return [];
    }
  }
}

module.exports = new RelatorioCacheService(); 