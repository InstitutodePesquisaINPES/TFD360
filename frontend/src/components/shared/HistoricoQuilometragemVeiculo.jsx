import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Stack,
  Badge,
  Icon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  HStack,
  useColorModeValue,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Alert,
  AlertIcon,
  Progress
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiAlertTriangle,
  FiDownload,
  FiBarChart2
} from 'react-icons/fi';
import api from '../../services/api';
import { formatarData } from '../../utils/formatters';

/**
 * Componente que exibe o histórico de quilometragem de um veículo
 * @param {Object} props - Propriedades do componente
 * @param {string} props.veiculoId - ID do veículo
 * @param {number} props.quilometragemAtual - Quilometragem atual do veículo
 * @param {string} props.periodo - Período de tempo para exibição (30d, 60d, 6m, 12m, all)
 * @param {Function} props.onPeriodoChange - Handler para mudança de período
 */
const HistoricoQuilometragemVeiculo = ({
  veiculoId,
  quilometragemAtual = 0,
  periodo = '6m',
  onPeriodoChange
}) => {
  const [historico, setHistorico] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [estatisticas, setEstatisticas] = useState({
    mediaKmPorDia: 0,
    mediaKmPorMes: 0,
    totalKmPeriodo: 0,
    maiorKmDia: { data: null, valor: 0 },
    menorKmDia: { data: null, valor: 0 },
    tendencia: 'estavel' // 'crescente', 'decrescente', 'estavel'
  });
  
  // Cores e estilos
  const bgCard = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Calcular estatísticas com base no histórico de quilometragem
  const calcularEstatisticas = (dados) => {
    if (!dados || dados.length === 0) {
      return {
        mediaKmPorDia: 0,
        mediaKmPorMes: 0,
        totalKmPeriodo: 0,
        maiorKmDia: { data: null, valor: 0 },
        menorKmDia: { data: null, valor: 0 },
        tendencia: 'estavel'
      };
    }
    
    // Ordenar por data (mais recente primeiro)
    const registrosOrdenados = [...dados].sort((a, b) => 
      new Date(b.data_registro) - new Date(a.data_registro)
    );
    
    // Calcular total de KM no período
    const totalKm = registrosOrdenados.reduce((total, registro) => 
      total + (registro.km_percorridos || 0), 0
    );
    
    // Encontrar o registro com maior e menor KM em um dia
    let maiorKm = { data: null, valor: 0 };
    let menorKm = { data: null, valor: Number.MAX_SAFE_INTEGER };
    
    registrosOrdenados.forEach(registro => {
      if (registro.km_percorridos > maiorKm.valor) {
        maiorKm = { 
          data: registro.data_registro, 
          valor: registro.km_percorridos 
        };
      }
      
      if (registro.km_percorridos > 0 && registro.km_percorridos < menorKm.valor) {
        menorKm = { 
          data: registro.data_registro, 
          valor: registro.km_percorridos 
        };
      }
    });
    
    // Se não há registro com KM menor que o MAX_SAFE_INTEGER, definir como 0
    if (menorKm.valor === Number.MAX_SAFE_INTEGER) {
      menorKm = { data: null, valor: 0 };
    }
    
    // Calcular média diária e mensal
    const diasTotais = registrosOrdenados.length > 1 
      ? Math.ceil((new Date(registrosOrdenados[0].data_registro) - new Date(registrosOrdenados[registrosOrdenados.length - 1].data_registro)) / (1000 * 60 * 60 * 24))
      : 1;
    
    const mediaDiaria = diasTotais > 0 ? totalKm / diasTotais : totalKm;
    const mediaMensal = mediaDiaria * 30;
    
    // Calcular tendência
    let tendencia = 'estavel';
    if (registrosOrdenados.length >= 3) {
      const primeiroTerco = registrosOrdenados.slice(Math.floor(registrosOrdenados.length * 2/3));
      const ultimoTerco = registrosOrdenados.slice(0, Math.floor(registrosOrdenados.length * 1/3));
      
      const mediaInicial = primeiroTerco.reduce((sum, reg) => sum + (reg.km_percorridos || 0), 0) / primeiroTerco.length;
      const mediaFinal = ultimoTerco.reduce((sum, reg) => sum + (reg.km_percorridos || 0), 0) / ultimoTerco.length;
      
      if (mediaFinal > mediaInicial * 1.2) { // 20% maior
        tendencia = 'crescente';
      } else if (mediaFinal < mediaInicial * 0.8) { // 20% menor
        tendencia = 'decrescente';
      }
    }
    
    return {
      mediaKmPorDia: mediaDiaria,
      mediaKmPorMes: mediaMensal,
      totalKmPeriodo: totalKm,
      maiorKmDia: maiorKm,
      menorKmDia: menorKm,
      tendencia
    };
  };
  
  // Carregar histórico de quilometragem
  useEffect(() => {
    const carregarHistorico = async () => {
      if (!veiculoId) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/frota/veiculos/${veiculoId}/quilometragem`, {
          params: { periodo }
        });
        
        setHistorico(response.data);
        setEstatisticas(calcularEstatisticas(response.data));
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar histórico de quilometragem:', error);
        setErro('Não foi possível carregar o histórico de quilometragem.');
        setHistorico([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarHistorico();
  }, [veiculoId, periodo]);
  
  // Função para obter o ícone de tendência
  const getTendenciaIcon = () => {
    switch (estatisticas.tendencia) {
      case 'crescente':
        return <Icon as={FiTrendingUp} color="red.500" />;
      case 'decrescente':
        return <Icon as={FiTrendingDown} color="green.500" />;
      default:
        return <Icon as={FiActivity} color="blue.500" />;
    }
  };
  
  // Função para obter a mensagem de tendência
  const getTendenciaMensagem = () => {
    switch (estatisticas.tendencia) {
      case 'crescente':
        return 'Uso crescente';
      case 'decrescente':
        return 'Uso decrescente';
      default:
        return 'Uso estável';
    }
  };
  
  // Função para alternar o período
  const handlePeriodoChange = (e) => {
    const novoPeriodo = e.target.value;
    if (onPeriodoChange) {
      onPeriodoChange(novoPeriodo);
    }
  };
  
  // Renderizar esqueleto de carregamento
  if (isLoading) {
    return (
      <Box>
        <Flex justify="space-between" mb={4}>
          <Skeleton height="30px" width="200px" />
          <Skeleton height="30px" width="120px" />
        </Flex>
        <Skeleton height="100px" mb={4} />
        <Skeleton height="200px" />
      </Box>
    );
  }
  
  // Renderizar mensagem de erro
  if (erro) {
    return (
      <Alert status="error">
        <AlertIcon />
        {erro}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={4}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 0 }}
      >
        <Heading as="h3" size="md">
          Histórico de Quilometragem
        </Heading>
        
        <HStack>
          <Select 
            value={periodo}
            onChange={handlePeriodoChange}
            size="sm"
            w="150px"
          >
            <option value="30d">Últimos 30 dias</option>
            <option value="60d">Últimos 60 dias</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Último ano</option>
            <option value="all">Todo o histórico</option>
          </Select>
          
          <Button 
            leftIcon={<FiDownload />} 
            size="sm" 
            variant="outline"
            onClick={() => {
              // Implementar exportação de dados
              console.log('Exportar dados');
            }}
          >
            Exportar
          </Button>
        </HStack>
      </Flex>
      
      {/* Cards de estatísticas */}
      <StatGroup mb={6}>
        <Box 
          p={3} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          bg={bgCard}
          flex={1}
        >
          <Stat>
            <StatLabel>Quilometragem Total</StatLabel>
            <StatNumber>{quilometragemAtual.toLocaleString('pt-BR')} km</StatNumber>
            <StatHelpText>
              {estatisticas.totalKmPeriodo > 0 && (
                <Text fontSize="xs">
                  +{estatisticas.totalKmPeriodo.toLocaleString('pt-BR')} km no período
                </Text>
              )}
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box 
          p={3} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          bg={bgCard}
          flex={1}
        >
          <Stat>
            <StatLabel>Média Mensal</StatLabel>
            <StatNumber>{Math.round(estatisticas.mediaKmPorMes).toLocaleString('pt-BR')} km</StatNumber>
            <StatHelpText>
              <Flex align="center">
                {getTendenciaIcon()}
                <Text ml={1} fontSize="xs">{getTendenciaMensagem()}</Text>
              </Flex>
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box 
          p={3} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          bg={bgCard}
          flex={1}
        >
          <Stat>
            <StatLabel>Média Diária</StatLabel>
            <StatNumber>{Math.round(estatisticas.mediaKmPorDia).toLocaleString('pt-BR')} km</StatNumber>
            <StatHelpText>
              {estatisticas.maiorKmDia.valor > 0 && (
                <Text fontSize="xs">
                  Máx: {estatisticas.maiorKmDia.valor.toLocaleString('pt-BR')} km
                </Text>
              )}
            </StatHelpText>
          </Stat>
        </Box>
      </StatGroup>
      
      {/* Tabela de histórico */}
      {historico.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          Nenhum registro de quilometragem disponível para o período selecionado.
        </Alert>
      ) : (
        <Box
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          bg={bgCard}
          overflow="hidden"
        >
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th isNumeric>Km Percorridos</Th>
                <Th isNumeric>Km Acumulado</Th>
                <Th>Registrado por</Th>
              </Tr>
            </Thead>
            <Tbody>
              {historico.map((registro, index) => (
                <Tr key={index}>
                  <Td>{formatarData(registro.data_registro)}</Td>
                  <Td>
                    <Text fontSize="sm">{registro.descricao}</Text>
                    {registro.viagem_id && (
                      <Badge size="sm" colorScheme="blue" mt={1}>
                        Viagem #{registro.viagem_id}
                      </Badge>
                    )}
                  </Td>
                  <Td isNumeric>{registro.km_percorridos?.toLocaleString('pt-BR') || '-'}</Td>
                  <Td isNumeric>{registro.km_total?.toLocaleString('pt-BR')}</Td>
                  <Td>
                    {registro.usuario_nome || 'Sistema'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default HistoricoQuilometragemVeiculo; 