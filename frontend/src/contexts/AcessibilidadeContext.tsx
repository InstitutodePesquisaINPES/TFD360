import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import api from '../services/api';

/**
 * Interface para as configurações de acessibilidade
 */
export interface ConfiguracoesAcessibilidade {
  altoContraste: boolean;
  temaPrefererido: 'automatico' | 'claro' | 'escuro';
  fonteAumentada: boolean;
  tamanhoFonte: number;
  animacoesReduzidas: boolean;
  textoAlternativoImagens: boolean;
  navegacaoTeclado: boolean;
  tempoNotificacoes: number;
  tempoSessao: number;
}

/**
 * Interface para o contexto de acessibilidade
 */
interface AcessibilidadeContextProps {
  configuracoes: ConfiguracoesAcessibilidade;
  carregando: boolean;
  atualizarConfiguracoes: (novosValores: Partial<ConfiguracoesAcessibilidade>) => Promise<void>;
  resetarConfiguracoes: () => Promise<void>;
  salvarConfiguracoes: () => Promise<void>;
}

/**
 * Configurações padrão
 */
const configPadrao: ConfiguracoesAcessibilidade = {
  altoContraste: false,
  temaPrefererido: 'automatico',
  fonteAumentada: false,
  tamanhoFonte: 16,
  animacoesReduzidas: false,
  textoAlternativoImagens: true,
  navegacaoTeclado: true,
  tempoNotificacoes: 5000,
  tempoSessao: 30,
};

/**
 * Criação do contexto
 */
const AcessibilidadeContext = createContext<AcessibilidadeContextProps | undefined>(undefined);

/**
 * Provider component
 */
export const AcessibilidadeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesAcessibilidade>(configPadrao);
  const [carregando, setCarregando] = useState(true);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  const toast = useToast();

  /**
   * Buscar configurações na inicialização
   */
  useEffect(() => {
    const buscarConfiguracoes = async () => {
      try {
        // Primeiro tentar obter do localStorage para carregamento rápido inicial
        const configuracoesLocal = localStorage.getItem('acessibilidade_config');
        if (configuracoesLocal) {
          setConfiguracoes(JSON.parse(configuracoesLocal));
        }

        // Depois buscar dados atualizados do servidor se o usuário estiver logado
        const token = localStorage.getItem('token');
        if (token) {
          const { data } = await api.get('/usuarios/acessibilidade');
          if (data && data.config) {
            setConfiguracoes(data.config);
            // Atualizar o localStorage com os dados mais recentes
            localStorage.setItem('acessibilidade_config', JSON.stringify(data.config));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de acessibilidade:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarConfiguracoes();
  }, []);

  /**
   * Aplicar configurações
   */
  useEffect(() => {
    // Aplicar configurações visuais
    const root = document.documentElement;
    
    // Definir tamanho de fonte base
    root.style.setProperty('--font-size-base', `${configuracoes.tamanhoFonte}px`);
    
    // Aplicar alto contraste
    if (configuracoes.altoContraste) {
      document.body.classList.add('alto-contraste');
    } else {
      document.body.classList.remove('alto-contraste');
    }
    
    // Aplicar tamanho de fonte aumentado
    if (configuracoes.fonteAumentada) {
      document.body.classList.add('fonte-aumentada');
    } else {
      document.body.classList.remove('fonte-aumentada');
    }
    
    // Aplicar tema preferido
    document.body.classList.remove('tema-claro', 'tema-escuro', 'tema-auto');
    document.body.classList.add(`tema-${configuracoes.temaPrefererido}`);
    
    // Aplicar animações reduzidas
    if (configuracoes.animacoesReduzidas) {
      document.body.classList.add('animacoes-reduzidas');
    } else {
      document.body.classList.remove('animacoes-reduzidas');
    }
    
  }, [configuracoes]);

  /**
   * Atualizar configurações
   */
  const atualizarConfiguracoes = async (novosValores: Partial<ConfiguracoesAcessibilidade>) => {
    setConfiguracoes(prev => {
      const novasConfiguracoes = {
        ...prev,
        ...novosValores
      };
      
      // Atualiza o localStorage para feedback imediato
      localStorage.setItem('acessibilidade_config', JSON.stringify(novasConfiguracoes));
      
      return novasConfiguracoes;
    });
    
    setAlteracoesPendentes(true);
  };

  /**
   * Salvar configurações no servidor
   */
  const salvarConfiguracoes = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/usuarios/acessibilidade', { config: configuracoes });
        toast({
          title: 'Configurações salvas',
          description: 'Suas preferências de acessibilidade foram salvas com sucesso.',
          status: 'success',
          duration: configuracoes.tempoNotificacoes,
          isClosable: true,
        });
      }
      setAlteracoesPendentes(false);
    } catch (error) {
      console.error('Erro ao salvar configurações de acessibilidade:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas preferências de acessibilidade.',
        status: 'error',
        duration: configuracoes.tempoNotificacoes,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Resetar configurações para o padrão
   */
  const resetarConfiguracoes = async () => {
    setCarregando(true);
    try {
      setConfiguracoes(configPadrao);
      localStorage.setItem('acessibilidade_config', JSON.stringify(configPadrao));
      
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/usuarios/acessibilidade', { config: configPadrao });
      }
      
      toast({
        title: 'Configurações resetadas',
        description: 'Suas preferências de acessibilidade foram redefinidas para o padrão.',
        status: 'info',
        duration: configPadrao.tempoNotificacoes,
        isClosable: true,
      });
      
      setAlteracoesPendentes(false);
    } catch (error) {
      console.error('Erro ao resetar configurações de acessibilidade:', error);
      toast({
        title: 'Erro ao resetar',
        description: 'Não foi possível redefinir suas preferências de acessibilidade.',
        status: 'error',
        duration: configuracoes.tempoNotificacoes,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Auto-salvar ao desmontar se houver alterações pendentes
   */
  useEffect(() => {
    return () => {
      if (alteracoesPendentes) {
        const token = localStorage.getItem('token');
        if (token) {
          api.post('/usuarios/acessibilidade', { config: configuracoes })
            .catch(error => console.error('Erro ao auto-salvar configurações:', error));
        }
      }
    };
  }, [configuracoes, alteracoesPendentes]);

  return (
    <AcessibilidadeContext.Provider
      value={{
        configuracoes,
        carregando,
        atualizarConfiguracoes,
        resetarConfiguracoes,
        salvarConfiguracoes,
      }}
    >
      {children}
    </AcessibilidadeContext.Provider>
  );
};

/**
 * Hook personalizado para usar o contexto
 */
export const useAcessibilidade = () => {
  const context = useContext(AcessibilidadeContext);
  if (context === undefined) {
    throw new Error('useAcessibilidade deve ser usado dentro de um AcessibilidadeProvider');
  }
  return context;
};

export default AcessibilidadeProvider; 