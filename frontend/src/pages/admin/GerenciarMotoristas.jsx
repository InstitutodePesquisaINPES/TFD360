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
  Avatar,
  AvatarBadge,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiXCircle,
  FiEdit,
  FiMoreVertical,
  FiFileText,
  FiSettings,
  FiBriefcase,
  FiMessageSquare
} from 'react-icons/fi';
import api from '../../services/api';
import RegistrarOcorrenciaMotoristaModal from '../../components/shared/RegistrarOcorrenciaMotoristaModal';
import AlterarStatusMotoristaModal from '../../components/shared/AlterarStatusMotoristaModal';
import { formatarData, formatarMoeda } from '../../utils/formatters';

const GerenciarMotoristas = () => {
  // Estados
  const [motoristas, setMotoristas] = useState([]);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    ferias: 0,
    licenca: 0,
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
    isOpen: isOcorrenciaModalOpen,
    onOpen: onOcorrenciaModalOpen,
    onClose: onOcorrenciaModalClose
  } = useDisclosure();
  
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose
  } = useDisclosure();
  
  // Carregar dados dos motoristas
  const carregarMotoristas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/frota/motoristas');
      setMotoristas(response.data);
      
      // Calcular estatísticas
      const stats = {
        total: response.data.length,
        ativos: 0,
        ferias: 0,
        licenca: 0,
        inativos: 0
      };
      
      response.data.forEach(motorista => {
        switch (motorista.status) {
          case 'ativo':
            stats.ativos += 1;
            break;
          case 'ferias':
            stats.ferias += 1;
            break;
          case 'licenca':
            stats.licenca += 1;
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
      console.error('Erro ao carregar motoristas:', erro);
      toast({
        title: 'Erro ao carregar motoristas',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar os motoristas',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Carregar ocorrências de um motorista
  const carregarOcorrencias = useCallback(async (motoristaId) => {
    if (!motoristaId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/frota/motoristas/${motoristaId}/ocorrencias`);
      setOcorrencias(response.data);
    } catch (erro) {
      console.error('Erro ao carregar ocorrências:', erro);
      toast({
        title: 'Erro ao carregar ocorrências',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar o histórico de ocorrências',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setOcorrencias([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Efeito para carregar motoristas quando a página é montada
  useEffect(() => {
    carregarMotoristas();
  }, [carregarMotoristas]);
  
  // Efeito para carregar ocorrências quando um motorista é selecionado
  useEffect(() => {
    if (motoristaSelecionado && tabIndex === 1) {
      carregarOcorrencias(motoristaSelecionado.id);
    }
  }, [motoristaSelecionado, tabIndex, carregarOcorrencias]);
  
  // Handler para mudança de tab
  const handleTabChange = (index) => {
    setTabIndex(index);
  };
  
  // Handler para abrir modal de ocorrência
  const handleRegistrarOcorrencia = (motorista) => {
    setMotoristaSelecionado(motorista);
    onOcorrenciaModalOpen();
  };
  
  // Handler para abrir modal de alteração de status
  const handleAlterarStatus = (motorista) => {
    setMotoristaSelecionado(motorista);
    onStatusModalOpen();
  };
  
  // Handler para selecionar um motorista e ver detalhes
  const handleSelecionarMotorista = (motorista) => {
    setMotoristaSelecionado(motorista);
  };
  
  // Handler para atualizar a lista após alterações
  const handleSucessoAlteracao = () => {
    carregarMotoristas();
    if (motoristaSelecionado) {
      carregarOcorrencias(motoristaSelecionado.id);
    }
  };
  
  // Função para obter o ícone do status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ativo':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'ferias':
        return <Icon as={FiBriefcase} color="blue.500" />;
      case 'licenca':
        return <Icon as={FiCalendar} color="orange.500" />;
      case 'inativo':
        return <Icon as={FiXCircle} color="red.500" />;
      default:
        return <Icon as={FiAlertTriangle} />;
    }
  };
  
  // Função para obter texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'ferias':
        return 'Férias';
      case 'licenca':
        return 'Licença';
      case 'inativo':
        return 'Inativo';
      default:
        return 'Status Desconhecido';
    }
  };
  
  // Função para obter cor do badge do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'green';
      case 'ferias':
        return 'blue';
      case 'licenca':
        return 'orange';
      case 'inativo':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Função para obter a cor do badge da gravidade de ocorrência
  const getGravidadeColor = (gravidade) => {
    switch (gravidade) {
      case 'baixa':
        return 'green';
      case 'media':
        return 'yellow';
      case 'alta':
        return 'orange';
      case 'critica':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Função para obter o texto da gravidade de ocorrência
  const getGravidadeText = (gravidade) => {
    switch (gravidade) {
      case 'baixa':
        return 'Baixa';
      case 'media':
        return 'Média';
      case 'alta':
        return 'Alta';
      case 'critica':
        return 'Crítica';
      default:
        return 'Desconhecida';
    }
  };
  
  // Filtrar motoristas com base no status e pesquisa
  const motoristasFiltrados = motoristas.filter(motorista => {
    // Filtrar por status
    if (filtro !== 'todos' && motorista.status !== filtro) {
      return false;
    }
    
    // Filtrar por pesquisa
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      return (
        motorista.nome.toLowerCase().includes(termoPesquisa) ||
        (motorista.cpf && motorista.cpf.toLowerCase().includes(termoPesquisa)) ||
        (motorista.numero_cnh && motorista.numero_cnh.toLowerCase().includes(termoPesquisa))
      );
    }
    
    return true;
  });

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="lg" mb={6}>
        Gerenciamento de Motoristas
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
          <StatLabel>Total de Motoristas</StatLabel>
          <StatNumber>{estatisticas.total}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Ativos</StatLabel>
          <StatNumber color="green.500">{estatisticas.ativos}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Em Férias</StatLabel>
          <StatNumber color="blue.500">{estatisticas.ferias}</StatNumber>
        </Stat>
        
        <Stat textAlign="center">
          <StatLabel>Em Licença</StatLabel>
          <StatNumber color="orange.500">{estatisticas.licenca}</StatNumber>
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
            <option value="todos">Todos os motoristas</option>
            <option value="ativo">Ativos</option>
            <option value="ferias">Em Férias</option>
            <option value="licenca">Em Licença</option>
            <option value="inativo">Inativos</option>
          </Select>
          
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={carregarMotoristas}
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
            placeholder="Pesquisar por nome, CPF ou CNH..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </InputGroup>
      </Flex>
      
      {/* Grid de conteúdo principal - Tabela de motoristas e painel de detalhes */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '1fr 1fr' }} 
        gap={6}
      >
        {/* Tabela de motoristas */}
        <Box 
          borderRadius="md" 
          overflow="hidden" 
          bg={bgCard} 
          boxShadow="sm"
        >
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>CNH</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading && motoristasFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">Carregando...</Td>
                </Tr>
              ) : motoristasFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    Nenhum motorista encontrado com os filtros atuais
                  </Td>
                </Tr>
              ) : (
                motoristasFiltrados.map(motorista => (
                  <Tr 
                    key={motorista.id}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    bg={motoristaSelecionado?.id === motorista.id ? 'blue.50' : 'transparent'}
                    onClick={() => handleSelecionarMotorista(motorista)}
                  >
                    <Td>
                      <Flex align="center">
                        <Avatar 
                          size="sm" 
                          name={motorista.nome} 
                          src={motorista.foto_url}
                          mr={2}
                        >
                          {motorista.status !== 'ativo' && (
                            <AvatarBadge 
                              boxSize="1em" 
                              bg={getStatusColor(motorista.status)}
                            />
                          )}
                        </Avatar>
                        <Text fontWeight="medium">{motorista.nome}</Text>
                      </Flex>
                    </Td>
                    <Td>{motorista.categoria_cnh}</Td>
                    <Td>
                      <Badge 
                        colorScheme={getStatusColor(motorista.status)}
                        display="flex"
                        alignItems="center"
                        width="fit-content"
                      >
                        {getStatusIcon(motorista.status)}
                        <Text ml={2}>
                          {getStatusText(motorista.status)}
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
                              handleAlterarStatus(motorista);
                            }}
                          >
                            Alterar Status
                          </MenuItem>
                          <MenuItem 
                            icon={<FiMessageSquare />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegistrarOcorrencia(motorista);
                            }}
                          >
                            Registrar Ocorrência
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
        
        {/* Painel de detalhes do motorista */}
        {motoristaSelecionado ? (
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
                  {motoristaSelecionado.nome}
                </Heading>
                <HStack>
                  <Badge 
                    colorScheme={getStatusColor(motoristaSelecionado.status)}
                    display="flex"
                    alignItems="center"
                  >
                    {getStatusIcon(motoristaSelecionado.status)}
                    <Text ml={1} fontSize="xs">
                      {getStatusText(motoristaSelecionado.status)}
                    </Text>
                  </Badge>
                  {motoristaSelecionado.categoria_cnh && (
                    <Badge colorScheme="purple">
                      CNH {motoristaSelecionado.categoria_cnh}
                    </Badge>
                  )}
                </HStack>
              </Stack>
              
              <HStack>
                <Tooltip label="Alterar Status">
                  <IconButton
                    icon={<FiSettings />}
                    aria-label="Alterar Status"
                    size="sm"
                    onClick={() => handleAlterarStatus(motoristaSelecionado)}
                  />
                </Tooltip>
                <Tooltip label="Registrar Ocorrência">
                  <IconButton
                    icon={<FiMessageSquare />}
                    aria-label="Registrar Ocorrência"
                    size="sm"
                    onClick={() => handleRegistrarOcorrencia(motoristaSelecionado)}
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
                <Tab>Histórico de Ocorrências</Tab>
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
                        CPF
                      </Text>
                      <Text>{motoristaSelecionado.cpf || "Não informado"}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Data de Nascimento
                      </Text>
                      <Text>
                        {motoristaSelecionado.data_nascimento 
                          ? formatarData(motoristaSelecionado.data_nascimento)
                          : "Não informada"}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Telefone
                      </Text>
                      <Text>{motoristaSelecionado.telefone || "Não informado"}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        E-mail
                      </Text>
                      <Text>{motoristaSelecionado.email || "Não informado"}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Número CNH
                      </Text>
                      <Text>{motoristaSelecionado.numero_cnh || "Não informado"}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Validade CNH
                      </Text>
                      <Text>
                        {motoristaSelecionado.validade_cnh 
                          ? formatarData(motoristaSelecionado.validade_cnh)
                          : "Não informada"}
                      </Text>
                    </Box>
                  </Grid>
                  
                  {motoristaSelecionado.endereco && (
                    <Box mt={4}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Endereço
                      </Text>
                      <Text>
                        {`${motoristaSelecionado.endereco.logradouro}, ${motoristaSelecionado.endereco.numero}`}
                        {motoristaSelecionado.endereco.complemento && ` - ${motoristaSelecionado.endereco.complemento}`}
                        {`, ${motoristaSelecionado.endereco.bairro}, ${motoristaSelecionado.endereco.cidade}/${motoristaSelecionado.endereco.uf}`}
                      </Text>
                    </Box>
                  )}
                  
                  {motoristaSelecionado.observacoes && (
                    <Box mt={4}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">
                        Observações
                      </Text>
                      <Text>{motoristaSelecionado.observacoes}</Text>
                    </Box>
                  )}
                </TabPanel>
                
                {/* Tab de histórico de ocorrências */}
                <TabPanel p={0}>
                  {isLoading ? (
                    <Text textAlign="center">Carregando histórico...</Text>
                  ) : ocorrencias.length === 0 ? (
                    <Text textAlign="center">
                      Nenhum registro de ocorrência para este motorista.
                    </Text>
                  ) : (
                    <Stack spacing={4}>
                      {ocorrencias.map(ocorrencia => (
                        <Box 
                          key={ocorrencia.id}
                          p={3}
                          borderRadius="md"
                          border="1px"
                          borderColor="gray.200"
                        >
                          <Flex 
                            justifyContent="space-between" 
                            alignItems="center"
                            mb={2}
                          >
                            <Box>
                              <Text fontWeight="bold">
                                {ocorrencia.tipo_ocorrencia.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                                ocorrencia.tipo_ocorrencia.replace(/_/g, ' ').slice(1)}
                              </Text>
                              <HStack fontSize="sm" color="gray.500">
                                <Icon as={FiCalendar} />
                                <Text>{formatarData(ocorrencia.data)}</Text>
                                
                                <Badge 
                                  ml={2} 
                                  colorScheme={getGravidadeColor(ocorrencia.gravidade)}
                                >
                                  {getGravidadeText(ocorrencia.gravidade)}
                                </Badge>
                              </HStack>
                            </Box>
                            
                            <Badge 
                              colorScheme={
                                ocorrencia.status === 'resolvida' ? 'green' : 
                                ocorrencia.status === 'em_analise' ? 'blue' : 'gray'
                              }
                            >
                              {ocorrencia.status.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                              ocorrencia.status.replace(/_/g, ' ').slice(1)}
                            </Badge>
                          </Flex>
                          
                          <Text fontSize="sm" mb={2}>{ocorrencia.descricao}</Text>
                          
                          {(ocorrencia.consequencias?.advertencia || 
                            ocorrencia.consequencias?.suspensao || 
                            ocorrencia.consequencias?.multa || 
                            ocorrencia.consequencias?.afastamento) && (
                            <Box mt={2}>
                              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                                Consequências:
                              </Text>
                              <HStack wrap="wrap" spacing={2} mt={1}>
                                {ocorrencia.consequencias.advertencia && (
                                  <Badge colorScheme="yellow" size="sm">Advertência</Badge>
                                )}
                                {ocorrencia.consequencias.suspensao && (
                                  <Badge colorScheme="orange" size="sm">
                                    Suspensão ({ocorrencia.consequencias.dias_suspensao} dias)
                                  </Badge>
                                )}
                                {ocorrencia.consequencias.multa && (
                                  <Badge colorScheme="red" size="sm">
                                    Multa ({formatarMoeda(ocorrencia.consequencias.valor_multa)})
                                  </Badge>
                                )}
                                {ocorrencia.consequencias.afastamento && (
                                  <Badge colorScheme="purple" size="sm">
                                    Afastamento
                                  </Badge>
                                )}
                              </HStack>
                            </Box>
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
              <Icon as={FiUser} boxSize={12} color="gray.400" mx="auto" />
              <Text color="gray.500">
                Selecione um motorista na lista para ver detalhes
              </Text>
            </Stack>
          </Box>
        )}
      </Grid>
      
      {/* Modais */}
      {motoristaSelecionado && (
        <>
          <RegistrarOcorrenciaMotoristaModal 
            isOpen={isOcorrenciaModalOpen}
            onClose={onOcorrenciaModalClose}
            motoristaId={motoristaSelecionado.id}
            nomeMotorista={motoristaSelecionado.nome}
            onSucesso={handleSucessoAlteracao}
          />
          
          <AlterarStatusMotoristaModal 
            isOpen={isStatusModalOpen}
            onClose={onStatusModalClose}
            motoristaId={motoristaSelecionado.id}
            statusAtual={motoristaSelecionado.status}
            onSucesso={handleSucessoAlteracao}
          />
        </>
      )}
    </Container>
  );
};

export default GerenciarMotoristas; 