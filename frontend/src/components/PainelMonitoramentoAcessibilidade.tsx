import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  List, 
  ListItem, 
  Badge, 
  Flex, 
  Divider, 
  Button, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatGroup,
  useColorModeValue,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * Interface para definir a estrutura dos dados de acessibilidade
 */
interface DadosAcessibilidade {
  erros: number;
  avisos: number;
  componentes: {
    total: number;
    acessiveis: number;
  };
  ultimaVerificacao: Date | null;
}

/**
 * Componente para monitoramento e exibição do status de acessibilidade do sistema
 * 
 * Este painel mostra métricas importantes sobre acessibilidade e permite executar
 * verificações manuais.
 */
const PainelMonitoramentoAcessibilidade: React.FC = () => {
  // Estados para armazenar os dados de acessibilidade e status da verificação
  const [dadosAcessibilidade, setDadosAcessibilidade] = useState<DadosAcessibilidade>({
    erros: 0,
    avisos: 0,
    componentes: {
      total: 0,
      acessiveis: 0
    },
    ultimaVerificacao: null
  });
  const [carregando, setCarregando] = useState<boolean>(false);
  
  // Cores baseadas no modo atual (claro/escuro)
  const corFundo = useColorModeValue('white', 'gray.800');
  const corBorda = useColorModeValue('gray.200', 'gray.700');
  
  // Simulação de verificação de acessibilidade (em produção, isso seria conectado a uma API real)
  const executarVerificacaoAcessibilidade = () => {
    setCarregando(true);
    
    // Simulando uma requisição para verificação de acessibilidade
    setTimeout(() => {
      // Valores simulados (em produção, viriam de uma API)
      const novosDados: DadosAcessibilidade = {
        erros: Math.floor(Math.random() * 5),  // 0-4 erros
        avisos: Math.floor(Math.random() * 10), // 0-9 avisos
        componentes: {
          total: 120,
          acessiveis: 115 + Math.floor(Math.random() * 5) // 115-119 componentes acessíveis
        },
        ultimaVerificacao: new Date()
      };
      
      setDadosAcessibilidade(novosDados);
      setCarregando(false);
      
      // Salvar no localStorage para persistência entre sessões
      localStorage.setItem('dadosAcessibilidade', JSON.stringify(novosDados));
    }, 1500);
  };
  
  // Carregar dados salvos ao inicializar o componente
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('dadosAcessibilidade');
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        // Converter a string de data para objeto Date
        dados.ultimaVerificacao = dados.ultimaVerificacao ? new Date(dados.ultimaVerificacao) : null;
        setDadosAcessibilidade(dados);
      } catch (e) {
        console.error('Erro ao carregar dados de acessibilidade:', e);
      }
    }
  }, []);
  
  // Calcular a porcentagem de conformidade
  const taxaConformidade = 
    dadosAcessibilidade.componentes.total > 0
      ? Math.round((dadosAcessibilidade.componentes.acessiveis / dadosAcessibilidade.componentes.total) * 100)
      : 0;
      
  // Determinar o status geral baseado nos dados
  const determinarStatus = () => {
    if (dadosAcessibilidade.erros > 0) {
      return { icone: FiAlertCircle, texto: 'Crítico', cor: 'red' };
    } else if (dadosAcessibilidade.avisos > 0) {
      return { icone: FiAlertTriangle, texto: 'Atenção', cor: 'yellow' };
    } else {
      return { icone: FiCheckCircle, texto: 'Excelente', cor: 'green' };
    }
  };
  
  const status = determinarStatus();
  
  // Formatar data da última verificação
  const formatarData = (data: Date | null) => {
    if (!data) return 'Nunca verificado';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };
  
  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={corFundo}
      borderColor={corBorda}
      boxShadow="sm"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Monitoramento de Acessibilidade</Heading>
        <Button 
          leftIcon={<FiRefreshCw />} 
          size="sm" 
          colorScheme="blue" 
          onClick={executarVerificacaoAcessibilidade}
          isLoading={carregando}
          loadingText="Verificando..."
        >
          Verificar Agora
        </Button>
      </Flex>
      
      <Divider mb={4} />
      
      <StatGroup mb={4}>
        <Stat>
          <StatLabel>Taxa de Conformidade</StatLabel>
          <StatNumber>{taxaConformidade}%</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Status</StatLabel>
          <Flex alignItems="center" mt={1}>
            <Icon as={status.icone} color={`${status.cor}.500`} mr={1} />
            <Text fontWeight="bold" color={`${status.cor}.500`}>
              {status.texto}
            </Text>
          </Flex>
        </Stat>
        
        <Stat>
          <StatLabel>Última Verificação</StatLabel>
          <Text fontSize="sm" fontWeight="medium">
            {formatarData(dadosAcessibilidade.ultimaVerificacao)}
          </Text>
        </Stat>
      </StatGroup>
      
      <List spacing={3}>
        <ListItem>
          <Flex alignItems="center">
            <Text>Erros Críticos:</Text>
            <Badge 
              ml={2} 
              colorScheme={dadosAcessibilidade.erros > 0 ? "red" : "green"}
              fontSize="0.9em"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {dadosAcessibilidade.erros}
            </Badge>
            <Tooltip 
              label="Erros que impedem usuários com deficiência de usar o sistema"
              placement="top"
              hasArrow
            >
              <Text ml={1} fontSize="sm" color="gray.500">ⓘ</Text>
            </Tooltip>
          </Flex>
        </ListItem>
        
        <ListItem>
          <Flex alignItems="center">
            <Text>Avisos:</Text>
            <Badge 
              ml={2} 
              colorScheme={dadosAcessibilidade.avisos > 0 ? "yellow" : "green"}
              fontSize="0.9em"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {dadosAcessibilidade.avisos}
            </Badge>
            <Tooltip 
              label="Potenciais problemas que podem dificultar o uso para alguns usuários"
              placement="top"
              hasArrow
            >
              <Text ml={1} fontSize="sm" color="gray.500">ⓘ</Text>
            </Tooltip>
          </Flex>
        </ListItem>
        
        <ListItem>
          <Flex alignItems="center">
            <Text>Componentes Acessíveis:</Text>
            <Text ml={2} fontWeight="medium">
              {dadosAcessibilidade.componentes.acessiveis} / {dadosAcessibilidade.componentes.total}
            </Text>
          </Flex>
        </ListItem>
      </List>
      
      <Box mt={4} fontSize="sm" color="gray.500">
        <Text>
          A verificação de acessibilidade verifica a conformidade com as diretrizes WCAG 2.1.
          Para mais detalhes, consulte a documentação de acessibilidade no arquivo ACESSIBILIDADE.md
        </Text>
      </Box>
    </Box>
  );
};

export default PainelMonitoramentoAcessibilidade; 