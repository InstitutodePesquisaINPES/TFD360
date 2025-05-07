import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Card,
  CardHeader,
  CardBody,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiTruck,
  FiUsers,
  FiMap,
  FiCalendar,
  FiActivity,
  FiAlertTriangle,
  FiClock
} from 'react-icons/fi';
import api from '../../services/api';
import EstatisticasFrota from '../../components/shared/EstatisticasFrota';
import { formatarData } from '../../utils/formatters';

/**
 * Dashboard para administradores com visão geral do sistema
 */
const Dashboard = () => {
  const [viagensRecentes, setViagensRecentes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [isLoadingViagens, setIsLoadingViagens] = useState(true);
  const [isLoadingAlertas, setIsLoadingAlertas] = useState(true);
  
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.700');
  
  // Carregar viagens recentes
  const carregarViagensRecentes = useCallback(async () => {
    setIsLoadingViagens(true);
    try {
      const response = await api.get('/viagens/recentes?limite=5');
      setViagensRecentes(response.data);
    } catch (erro) {
      console.error('Erro ao carregar viagens recentes:', erro);
      toast({
        title: 'Erro ao carregar viagens',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar as viagens recentes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingViagens(false);
    }
  }, [toast]);
  
  // Carregar alertas do sistema
  const carregarAlertas = useCallback(async () => {
    setIsLoadingAlertas(true);
    try {
      const response = await api.get('/alertas/sistema');
      setAlertas(response.data);
    } catch (erro) {
      console.error('Erro ao carregar alertas do sistema:', erro);
      toast({
        title: 'Erro ao carregar alertas',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar os alertas do sistema',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAlertas(false);
    }
  }, [toast]);
  
  // Atualizar todos os dados
  const atualizarDados = useCallback(() => {
    carregarViagensRecentes();
    carregarAlertas();
    // Não precisamos atualizar as estatísticas explicitamente,
    // pois o componente EstatisticasFrota tem sua própria lógica de carregamento
  }, [carregarViagensRecentes, carregarAlertas]);
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    atualizarDados();
  }, [atualizarDados]);
  
  // Renderizar um alerta do sistema
  const renderAlerta = (alerta) => {
    const getAlertIcon = (tipo) => {
      switch (tipo) {
        case 'documento_vencendo':
          return FiClock;
        case 'manutencao_necessaria':
          return FiTruck;
        case 'motorista_indisponivel':
          return FiUsers;
        case 'viagem_atrasada':
          return FiMap;
        default:
          return FiAlertTriangle;
      }
    };
    
    const getAlertColor = (nivel) => {
      switch (nivel) {
        case 'baixo':
          return 'blue';
        case 'medio':
          return 'yellow';
        case 'alto':
          return 'orange';
        case 'critico':
          return 'red';
        default:
          return 'gray';
      }
    };
    
    const IconComponent = getAlertIcon(alerta.tipo);
    const colorScheme = getAlertColor(alerta.nivel);
    
    return (
      <Box 
        key={alerta.id}
        p={3}
        borderRadius="md"
        borderWidth="1px"
        borderColor={`${colorScheme}.200`}
        bg={`${colorScheme}.50`}
        color={`${colorScheme}.800`}
        mb={3}
      >
        <Flex alignItems="flex-start">
          <Icon as={IconComponent} mt={1} mr={2} />
          <Box>
            <Text fontWeight="bold">{alerta.titulo}</Text>
            <Text fontSize="sm">{alerta.mensagem}</Text>
            {alerta.data && (
              <Text fontSize="xs" mt={1} color={`${colorScheme}.600`}>
                {formatarData(alerta.data, true)}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>
    );
  };
  
  // Renderizar um card de viagem recente
  const renderViagemCard = (viagem) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'agendada':
          return 'blue';
        case 'em_andamento':
          return 'green';
        case 'concluida':
          return 'gray';
        case 'cancelada':
          return 'red';
        default:
          return 'gray';
      }
    };
    
    const statusColor = getStatusColor(viagem.status);
    
    return (
      <Box 
        key={viagem.id}
        p={3}
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        mb={3}
      >
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Text fontWeight="bold">
              {viagem.origem.cidade} → {viagem.destino.cidade}
            </Text>
            <Text fontSize="sm">
              {formatarData(viagem.data_ida)} • {viagem.pacientes?.length || 0} pacientes
            </Text>
          </Box>
          <Flex alignItems="center">
            <Icon as={FiTruck} color={`${statusColor}.500`} mr={1} />
            <Text color={`${statusColor}.500`} fontWeight="medium" fontSize="sm">
              {viagem.status?.replace(/_/g, ' ').charAt(0).toUpperCase() + viagem.status?.replace(/_/g, ' ').slice(1)}
            </Text>
          </Flex>
        </Flex>
        
        {viagem.motorista && (
          <Flex alignItems="center" mt={2}>
            <Icon as={FiUsers} size="sm" color="gray.500" mr={1} />
            <Text fontSize="sm" color="gray.600">{viagem.motorista.nome}</Text>
          </Flex>
        )}
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Painel de Controle</Heading>
        
        <Button 
          leftIcon={<Icon as={FiRefreshCw} />}
          onClick={atualizarDados}
          colorScheme="blue"
          variant="outline"
          size="sm"
        >
          Atualizar Dados
        </Button>
      </Flex>
      
      <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6}>
        <Box>
          {/* Estatísticas da Frota */}
          <Box 
            p={5} 
            bg={bgCard} 
            borderRadius="lg" 
            boxShadow="sm" 
            mb={6}
          >
            <EstatisticasFrota diasAlerta={15} />
          </Box>
          
          {/* Tabs de informações adicionais */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>
                <Icon as={FiActivity} mr={2} />
                Estatísticas
              </Tab>
              <Tab>
                <Icon as={FiCalendar} mr={2} />
                Agenda
              </Tab>
              <Tab>
                <Icon as={FiMap} mr={2} />
                Viagens
              </Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <Card>
                    <CardHeader bg="green.50" borderTopRadius="md">
                      <Heading size="sm">Total de Viagens no Mês</Heading>
                    </CardHeader>
                    <CardBody>
                      <Text fontSize="3xl" fontWeight="bold">125</Text>
                      <Text fontSize="sm" color="gray.500">+12% em relação ao mês anterior</Text>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardHeader bg="blue.50" borderTopRadius="md">
                      <Heading size="sm">Pacientes Transportados</Heading>
                    </CardHeader>
                    <CardBody>
                      <Text fontSize="3xl" fontWeight="bold">487</Text>
                      <Text fontSize="sm" color="gray.500">Média de 16,2 por dia</Text>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardHeader bg="purple.50" borderTopRadius="md">
                      <Heading size="sm">Quilometragem Total</Heading>
                    </CardHeader>
                    <CardBody>
                      <Text fontSize="3xl" fontWeight="bold">8.345 km</Text>
                      <Text fontSize="sm" color="gray.500">Média de 278,2 km por dia</Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>
              
              <TabPanel>
                <Text>Conteúdo da agenda será implementado em breve</Text>
              </TabPanel>
              
              <TabPanel>
                <Text>Conteúdo de viagens será implementado em breve</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        
        <Stack spacing={6}>
          {/* Alertas do Sistema */}
          <Box>
            <Heading size="md" mb={4}>
              <Flex align="center">
                <Icon as={FiAlertTriangle} mr={2} />
                Alertas do Sistema
              </Flex>
            </Heading>
            
            <Box 
              bg={bgCard} 
              borderRadius="md" 
              boxShadow="sm" 
              p={4}
              maxH="300px"
              overflowY="auto"
            >
              {isLoadingAlertas ? (
                <Text textAlign="center" py={4}>Carregando alertas...</Text>
              ) : alertas.length === 0 ? (
                <Text textAlign="center" py={4} color="green.500">
                  Nenhum alerta pendente no sistema
                </Text>
              ) : (
                alertas.map(alerta => renderAlerta(alerta))
              )}
            </Box>
          </Box>
          
          {/* Viagens Recentes */}
          <Box>
            <Heading size="md" mb={4}>
              <Flex align="center">
                <Icon as={FiMap} mr={2} />
                Viagens Recentes
              </Flex>
            </Heading>
            
            <Box 
              bg={bgCard} 
              borderRadius="md" 
              boxShadow="sm" 
              p={4}
              maxH="400px"
              overflowY="auto"
            >
              {isLoadingViagens ? (
                <Text textAlign="center" py={4}>Carregando viagens...</Text>
              ) : viagensRecentes.length === 0 ? (
                <Text textAlign="center" py={4} color="gray.500">
                  Nenhuma viagem recente encontrada
                </Text>
              ) : (
                viagensRecentes.map(viagem => renderViagemCard(viagem))
              )}
            </Box>
          </Box>
        </Stack>
      </Grid>
    </Container>
  );
};

export default Dashboard; 