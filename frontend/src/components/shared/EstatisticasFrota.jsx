import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  SimpleGrid,
  Text,
  Icon,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  useColorModeValue,
  Skeleton,
  Badge
} from '@chakra-ui/react';
import {
  FiTruck,
  FiAlertTriangle,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiTool,
  FiClock,
  FiFileText,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import api from '../../services/api';
import { formatarData } from '../../utils/formatters';

/**
 * Componente que exibe estatísticas resumidas da frota
 * @param {Object} props - Propriedades do componente
 * @param {Number} props.diasAlerta - Número de dias para alertar sobre manutenções ou documentações próximas de vencer
 */
const EstatisticasFrota = ({ diasAlerta = 30 }) => {
  const [dados, setDados] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Cores para o modo claro/escuro
  const bgCard = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    const carregarEstatisticas = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/frota/estatisticas', {
          params: { dias_alerta: diasAlerta }
        });
        setDados(response.data);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setErro('Não foi possível carregar as estatísticas da frota.');
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarEstatisticas();
  }, [diasAlerta]);
  
  // Função para calcular a porcentagem
  const calcularPorcentagem = (valor, total) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };
  
  // Renderizar skeletons durante o carregamento
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {[...Array(4)].map((_, i) => (
          <Box key={i} p={4} borderRadius="md" borderWidth="1px" bg={bgCard}>
            <Skeleton height="20px" width="120px" mb={2} />
            <Skeleton height="40px" width="80px" mb={3} />
            <Skeleton height="15px" width="150px" />
          </Box>
        ))}
      </SimpleGrid>
    );
  }
  
  // Renderizar mensagem de erro
  if (erro) {
    return (
      <Flex 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor="red.300" 
        bg="red.50" 
        color="red.600"
        alignItems="center"
      >
        <Icon as={FiAlertTriangle} mr={2} />
        <Text>{erro}</Text>
      </Flex>
    );
  }
  
  // Exibir estatísticas
  const {
    total_veiculos,
    veiculos_por_status,
    veiculos_proximos_manutencao,
    veiculos_documentacao_vencendo,
    quilometragem_total,
    quilometragem_media,
    manutencoes_periodo
  } = dados || {};
  
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      {/* Card de disponibilidade */}
      <Box 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgCard}
      >
        <Flex justify="space-between" mb={3}>
          <Text fontWeight="medium" fontSize="sm">Disponibilidade da Frota</Text>
          <Icon as={FiTruck} color="blue.500" />
        </Flex>
        
        <Flex align="center" justify="space-between">
          <CircularProgress 
            value={calcularPorcentagem(veiculos_por_status?.disponivel || 0, total_veiculos)} 
            color="green.400" 
            size="70px"
            thickness="8px"
          >
            <CircularProgressLabel fontWeight="bold">
              {calcularPorcentagem(veiculos_por_status?.disponivel || 0, total_veiculos)}%
            </CircularProgressLabel>
          </CircularProgress>
          
          <Box>
            <Flex align="center" mb={1}>
              <Icon as={FiCheckCircle} color="green.500" mr={2} boxSize={3} />
              <Text fontSize="sm">Disponível: {veiculos_por_status?.disponivel || 0}</Text>
            </Flex>
            <Flex align="center" mb={1}>
              <Icon as={FiActivity} color="blue.500" mr={2} boxSize={3} />
              <Text fontSize="sm">Em viagem: {veiculos_por_status?.em_viagem || 0}</Text>
            </Flex>
            <Flex align="center" mb={1}>
              <Icon as={FiTool} color="orange.500" mr={2} boxSize={3} />
              <Text fontSize="sm">Manutenção: {veiculos_por_status?.manutencao || 0}</Text>
            </Flex>
            <Flex align="center">
              <Icon as={FiXCircle} color="red.500" mr={2} boxSize={3} />
              <Text fontSize="sm">Inativo: {veiculos_por_status?.inativo || 0}</Text>
            </Flex>
          </Box>
        </Flex>
        
        <Divider my={3} />
        
        <Text fontSize="xs" color="gray.500">
          Total de veículos: {total_veiculos}
        </Text>
      </Box>
      
      {/* Card de manutenções */}
      <Box 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgCard}
      >
        <Flex justify="space-between" mb={3}>
          <Text fontWeight="medium" fontSize="sm">Alertas de Manutenção</Text>
          <Icon as={FiTool} color="orange.500" />
        </Flex>
        
        <Stat>
          <StatNumber>{veiculos_proximos_manutencao?.length || 0}</StatNumber>
          <StatHelpText>
            Veículos com manutenção nos próximos {diasAlerta} dias
          </StatHelpText>
        </Stat>
        
        {veiculos_proximos_manutencao?.length > 0 ? (
          <>
            <Divider my={2} />
            <Box maxH="80px" overflowY="auto" fontSize="xs">
              {veiculos_proximos_manutencao.slice(0, 3).map((veiculo, index) => (
                <Flex key={index} mb={1} align="center">
                  <Badge
                    colorScheme={veiculo.dias_restantes <= 7 ? 'red' : 'orange'}
                    mr={2}
                    fontSize="10px"
                    variant="solid"
                  >
                    {veiculo.dias_restantes} d
                  </Badge>
                  <Text>
                    {veiculo.placa} - {veiculo.descricao}
                  </Text>
                </Flex>
              ))}
              {veiculos_proximos_manutencao.length > 3 && (
                <Text color="blue.500">
                  +{veiculos_proximos_manutencao.length - 3} veículos...
                </Text>
              )}
            </Box>
          </>
        ) : (
          <Text fontSize="xs" color="green.500" mt={2}>
            <Icon as={FiCheckCircle} mr={1} />
            Sem manutenções pendentes no período
          </Text>
        )}
      </Box>
      
      {/* Card de documentação */}
      <Box 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgCard}
      >
        <Flex justify="space-between" mb={3}>
          <Text fontWeight="medium" fontSize="sm">Documentação</Text>
          <Icon as={FiFileText} color="purple.500" />
        </Flex>
        
        <Stat>
          <StatNumber>{veiculos_documentacao_vencendo?.length || 0}</StatNumber>
          <StatHelpText>
            Documentos vencendo nos próximos {diasAlerta} dias
          </StatHelpText>
        </Stat>
        
        {veiculos_documentacao_vencendo?.length > 0 ? (
          <>
            <Divider my={2} />
            <Box maxH="80px" overflowY="auto" fontSize="xs">
              {veiculos_documentacao_vencendo.slice(0, 3).map((doc, index) => (
                <Flex key={index} mb={1} align="center">
                  <Badge
                    colorScheme={doc.dias_restantes <= 7 ? 'red' : 'purple'}
                    mr={2}
                    fontSize="10px"
                    variant="solid"
                  >
                    {doc.dias_restantes} d
                  </Badge>
                  <Text>
                    {doc.placa} - {doc.tipo_documento}
                  </Text>
                </Flex>
              ))}
              {veiculos_documentacao_vencendo.length > 3 && (
                <Text color="blue.500">
                  +{veiculos_documentacao_vencendo.length - 3} documentos...
                </Text>
              )}
            </Box>
          </>
        ) : (
          <Text fontSize="xs" color="green.500" mt={2}>
            <Icon as={FiCheckCircle} mr={1} />
            Documentação regularizada
          </Text>
        )}
      </Box>
      
      {/* Card de quilometragem */}
      <Box 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgCard}
      >
        <Flex justify="space-between" mb={3}>
          <Text fontWeight="medium" fontSize="sm">Utilização da Frota</Text>
          <Icon as={FiActivity} color="blue.500" />
        </Flex>
        
        <Stat>
          <StatNumber>{quilometragem_total?.toLocaleString('pt-BR')}</StatNumber>
          <StatHelpText>
            Quilometragem total percorrida
          </StatHelpText>
        </Stat>
        
        <Divider my={2} />
        
        <Flex align="center" justify="space-between" fontSize="xs">
          <Flex direction="column">
            <Text color="gray.500">Média por veículo:</Text>
            <Text fontWeight="bold">{quilometragem_media?.toLocaleString('pt-BR')} km</Text>
          </Flex>
          
          <Flex direction="column" align="flex-end">
            <Text color="gray.500">Manutenções no período:</Text>
            <Text fontWeight="bold">{manutencoes_periodo || 0}</Text>
          </Flex>
        </Flex>
      </Box>
    </SimpleGrid>
  );
};

export default EstatisticasFrota; 