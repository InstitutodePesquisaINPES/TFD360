import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiTruck,
  FiCheckCircle,
  FiAlertTriangle,
  FiTool,
  FiXCircle,
  FiEdit,
  FiMoreVertical,
  FiCalendar,
  FiClock,
  FiSettings
} from 'react-icons/fi';
import api from '../../services/api';
import RegistrarManutencaoModal from '../../components/shared/RegistrarManutencaoModal';
import AlterarStatusVeiculoModal from '../../components/shared/AlterarStatusVeiculoModal';
import { formatarData, formatarMoeda } from '../../utils/formatters';

const GerenciarFrota = () => {
  // Estados
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [manutencoes, setManutencoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    disponiveis: 0,
    emViagem: 0,
    emManutencao: 0,
    inativos: 0
  });
  const [filtro, setFiltro] = useState('todos');
  const [pesquisa, setPesquisa] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Hooks do Chakra UI
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.700');
  
  // Modals
  const {
    isOpen: isManutencaoModalOpen,
    onOpen: onManutencaoModalOpen,
    onClose: onManutencaoModalClose
  } = useDisclosure();
  
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose
  } = useDisclosure();
  
  // Carregar dados dos veículos
  const carregarVeiculos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/frota/veiculos');
      setVeiculos(response.data);
      
      // Calcular estatísticas
      const stats = {
        total: response.data.length,
        disponiveis: 0,
        emViagem: 0,
        emManutencao: 0,
        inativos: 0
      };
      
      response.data.forEach(veiculo => {
        switch (veiculo.status) {
          case 'disponivel':
            stats.disponiveis += 1;
            break;
          case 'em_viagem':
            stats.emViagem += 1;
            break;
          case 'em_manutencao':
            stats.emManutencao += 1;
            break;
          case 'inativo':
            stats.inativos += 1;
            break;
          default:
            break;
        }
      });
      
      setEstatisticas(stats);
      
    } catch (erro) {
      console.error('Erro ao carregar veículos:', erro);
      toast({
        title: 'Erro ao carregar veículos',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar os veículos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Carregar manutenções de um veículo
  const carregarManutencoes = useCallback(async (veiculoId) => {
    if (!veiculoId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/frota/veiculos/${veiculoId}/manutencoes`);
      setManutencoes(response.data);
    } catch (erro) {
      console.error('Erro ao carregar manutenções:', erro);
      toast({
        title: 'Erro ao carregar manutenções',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar o histórico de manutenções',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setManutencoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Efeito para carregar veículos quando a página é montada
  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos]);
  
  // Efeito para carregar manutenções quando um veículo é selecionado
  useEffect(() => {
    if (veiculoSelecionado && tabIndex === 1) {
      carregarManutencoes(veiculoSelecionado.id);
    }
  }, [veiculoSelecionado, tabIndex, carregarManutencoes]);
  
  // Handler para mudança de tab
  const handleTabChange = (index) => {
    setTabIndex(index);
  };
  
  // Handler para abrir modal de manutenção
  const handleRegistrarManutencao = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    onManutencaoModalOpen();
  };
  
  // Handler para abrir modal de alteração de status
  const handleAlterarStatus = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    onStatusModalOpen();
  };
  
  // Handler para selecionar um veículo e ver detalhes
  const handleSelecionarVeiculo = (veiculo) => {
    setVeiculoSelecionado(veiculo);
  };
  
  // Handler para atualizar a lista após alterações
  const handleSucessoAlteracao = () => {
    carregarVeiculos();
    if (veiculoSelecionado) {
      carregarManutencoes(veiculoSelecionado.id);
    }
  };
  
  // Função para obter o ícone do status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'disponivel':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'em_viagem':
        return <Icon as={FiTruck} color="blue.500" />;
      case 'em_manutencao':
        return <Icon as={FiTool} color="orange.500" />;
      case 'inativo':
        return <Icon as={FiXCircle} color="red.500" />;
      default:
        return <Icon as={FiAlertTriangle} />;
    }
  };
  
  // Função para obter texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'em_viagem':
        return 'Em Viagem';
      case 'em_manutencao':
        return 'Em Manutenção';
      case 'inativo':
        return 'Inativo';
      default:
        return 'Status Desconhecido';
    }
  };
  
  // Função para obter cor do badge do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel':
        return 'green';
      case 'em_viagem':
        return 'blue';
      case 'em_manutencao':
        return 'orange';
      case 'inativo':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Filtrar veículos com base no status e pesquisa
  const veiculosFiltrados = veiculos.filter(veiculo => {
    // Filtrar por status
    if (filtro !== 'todos' && veiculo.status !== filtro) {
      return false;
    }
    
    // Filtrar por pesquisa
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      return (
        veiculo.placa.toLowerCase().includes(termoPesquisa) ||
        veiculo.modelo.toLowerCase().includes(termoPesquisa) ||
        veiculo.marca.toLowerCase().includes(termoPesquisa)
      );
    }
    
    return true;
  });
  
  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="lg" mb={6}>
        Gerenciamento de Frota
      </Heading>
      
      {/* Resumo de estatísticas */}
      <StatGroup 
        mb={6} 
        p={4} 
        borderRadius="md" 
        bg={bgCard} 
        boxShadow="sm"
      >
        <Stat textAlign="center">
          <StatLabel>Total de Veículos</StatLabel>
          <StatNumber>{estatisticas.total}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Disponíveis</StatLabel>
          <StatNumber color="green.500">{estatisticas.disponiveis}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Em Viagem</StatLabel>
          <StatNumber color="blue.500">{estatisticas.emViagem}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Em Manutenção</StatLabel>
          <StatNumber color="orange.500">{estatisticas.emManutencao}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Inativos</StatLabel>
          <StatNumber color="red.500">{estatisticas.inativos}</StatNumber>
        </Stat>
      </StatGroup>
      
      {/* Barra de filtros e pesquisa */}
      <Flex 
        mb={6} 
        justifyContent="space-between" 
        alignItems="center"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <HStack spacing={3} w={{ base: 'full', md: 'auto' }}>
          <Select 
            value={filtro} 
            onChange={e => setFiltro(e.target.value)}
            w={{ base: 'full', md: '200px' }}
            leftIcon={<FiFilter />}
          >
            <option value="todos">Todos os veículos</option>
            <option value="disponivel">Disponíveis</option>
            <option value="em_viagem">Em Viagem</option>
            <option value="em_manutencao">Em Manutenção</option>
            <option value="inativo">Inativos</option>
          </Select>
          
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={carregarVeiculos}
            isLoading={isLoading}
            loadingText="Atualizando..."
          >
            Atualizar
          </Button>
        </HStack>
        
        <InputGroup w={{ base: 'full', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Pesquisar por placa, modelo..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </InputGroup>
      </Flex>
      
      {/* Grid de conteúdo principal - Tabela de veículos e painel de detalhes */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '1fr 1fr' }} 
        gap={6}
      >
        {/* Tabela de veículos */}
        <Box 
          borderRadius="md" 
          overflow="hidden" 
          bg={bgCard} 
          boxShadow="sm"
        >
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Placa</Th>
                <Th>Modelo</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading && veiculosFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">Carregando...</Td>
                </Tr>
              ) : veiculosFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    Nenhum veículo encontrado com os filtros atuais
                  </Td>
                </Tr>
              ) : (
                veiculosFiltrados.map(veiculo => (
                  <Tr 
                    key={veiculo.id}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    bg={veiculoSelecionado?.id === veiculo.id ? 'blue.50' : 'transparent'}
                    onClick={() => handleSelecionarVeiculo(veiculo)}
                  >
                    <Td fontWeight="medium">{veiculo.placa}</Td>
                    <Td>{`${veiculo.marca} ${veiculo.modelo}`}</Td>
                    <Td>
                      <Badge 
                        colorScheme={getStatusColor(veiculo.status)}
                        display="flex"
                        alignItems="center"
                        width="fit-content"
                      >
                        {getStatusIcon(veiculo.status)}
                        <Text ml={2}>
                          {getStatusText(veiculo.status)}
                        </Text>
                      </Badge>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton 
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <MenuList>
                          <MenuItem 
                            icon={<FiSettings />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlterarStatus(veiculo);
                            }}
                          >
                            Alterar Status
                          </MenuItem>
                          <MenuItem 
                            icon={<FiTool />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegistrarManutencao(veiculo);
                            }}
                          >
                            Registrar Manutenção
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
        
        {/* Painel de detalhes do veículo */}
        {veiculoSelecionado ? (
          <Box 
            borderRadius="md" 
            bg={bgCard} 
            boxShadow="sm"
            height="fit-content"
            p={4}
          >
            <Flex 
              justifyContent="space-between" 
              alignItems="center"
              mb={4}
            >
              <Stack>
                <Heading as="h3" size="md">
                  {veiculoSelecionado.marca} {veiculoSelecionado.modelo}
                </Heading>
                <HStack>
                  <Badge fontSize="sm" fontWeight="bold">
                    {veiculoSelecionado.placa}
                  </Badge>
                  <Badge 
                    colorScheme={getStatusColor(veiculoSelecionado.status)}
                    display="flex"
                    alignItems="center"
                  >
                    {getStatusIcon(veiculoSelecionado.status)}
                    <Text ml={1} fontSize="xs">
                      {getStatusText(veiculoSelecionado.status)}
                    </Text>
                  </Badge>
                </HStack>
              </Stack>
              
              <HStack>
                <Tooltip label="Alterar Status">
                  <IconButton
                    icon={<FiSettings />}
                    aria-label="Alterar Status"
                    size="sm"
                    onClick={() => handleAlterarStatus(veiculoSelecionado)}
                  />
                </Tooltip>
                <Tooltip label="Registrar Manutenção">
                  <IconButton
                    icon={<FiTool />}
                    aria-label="Registrar Manutenção"
                    size="sm"
                    onClick={() => handleRegistrarManutencao(veiculoSelecionado)}
                  />
                </Tooltip>
              </HStack>
            </Flex>
            
            <Divider mb={4} />
            
            <Tabs 
              variant="enclosed" 
              size="sm" 
              index={tabIndex} 
              onChange={handleTabChange}
            >
              <TabList>
                <Tab>Informações</Tab>
                <Tab>Histórico de Manutenções</Tab>
              </TabList>
              
              <TabPanels mt={4}>
                {/* Tab de informações gerais */}
                <TabPanel p={0}>
                  <Grid 
                    templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} 
                    gap={4}
                  >
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Ano
                      </Text>
                      <Text>{veiculoSelecionado.ano}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Capacidade
                      </Text>
                      <Text>{veiculoSelecionado.capacidade_passageiros} passageiros</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Quilometragem
                      </Text>
                      <Text>{veiculoSelecionado.quilometragem.toLocaleString()} km</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Tipo
                      </Text>
                      <Text>{veiculoSelecionado.tipo}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Combustível
                      </Text>
                      <Text>{veiculoSelecionado.tipo_combustivel}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Última Revisão
                      </Text>
                      <Text>
                        {veiculoSelecionado.data_ultima_revisao 
                          ? formatarData(veiculoSelecionado.data_ultima_revisao)
                          : "Não registrada"}
                      </Text>
                    </Box>
                  </Grid>
                  
                  {veiculoSelecionado.observacoes && (
                    <Box mt={4}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Observações
                      </Text>
                      <Text>{veiculoSelecionado.observacoes}</Text>
                    </Box>
                  )}
                </TabPanel>
                
                {/* Tab de histórico de manutenções */}
                <TabPanel p={0}>
                  {isLoading ? (
                    <Text textAlign="center">Carregando histórico...</Text>
                  ) : manutencoes.length === 0 ? (
                    <Text textAlign="center">
                      Nenhum registro de manutenção para este veículo.
                    </Text>
                  ) : (
                    <Stack spacing={4}>
                      {manutencoes.map(manutencao => (
                        <Box 
                          key={manutencao.id}
                          p={3}
                          borderRadius="md"
                          border="1px"
                          borderColor="gray.200"
                        >
                          <Flex 
                            justifyContent="space-between" 
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Stack>
                              <Text fontWeight="bold">
                                {manutencao.tipo}
                              </Text>
                              <HStack fontSize="sm" color="gray.500">
                                <Icon as={FiCalendar} />
                                <Text>{formatarData(manutencao.data)}</Text>
                                <Icon as={FiClock} ml={2} />
                                <Text>{manutencao.quilometragem.toLocaleString()} km</Text>
                              </HStack>
                            </Stack>
                            <Text fontWeight="bold" color="blue.500">
                              {formatarMoeda(manutencao.custo_total)}
                            </Text>
                          </Flex>
                          
                          <Text fontSize="sm" mb={2}>{manutencao.descricao}</Text>
                          
                          {manutencao.servicos_realizados && manutencao.servicos_realizados.length > 0 && (
                            <Stack>
                              <Text fontSize="xs" fontWeight="bold">Serviços Realizados:</Text>
                              {manutencao.servicos_realizados.map((servico, idx) => (
                                <Text key={idx} fontSize="xs">
                                  • {servico.descricao} - {formatarMoeda(servico.valor)}
                                </Text>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : (
          <Box 
            borderRadius="md" 
            bg={bgCard} 
            boxShadow="sm"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={8}
          >
            <Stack textAlign="center" spacing={4}>
              <Icon as={FiTruck} boxSize={12} color="gray.400" mx="auto" />
              <Text color="gray.500">
                Selecione um veículo na lista para ver detalhes
              </Text>
            </Stack>
          </Box>
        )}
      </Grid>
      
      {/* Modais */}
      {veiculoSelecionado && (
        <>
          <RegistrarManutencaoModal 
            isOpen={isManutencaoModalOpen}
            onClose={onManutencaoModalClose}
            veiculoId={veiculoSelecionado.id}
            quilometragemAtual={veiculoSelecionado.quilometragem}
            onSucesso={handleSucessoAlteracao}
          />
          
          <AlterarStatusVeiculoModal 
            isOpen={isStatusModalOpen}
            onClose={onStatusModalClose}
            veiculoId={veiculoSelecionado.id}
            statusAtual={veiculoSelecionado.status}
            onSucesso={handleSucessoAlteracao}
          />
        </>
      )}
    </Container>
  );
};

export default GerenciarFrota; 