import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Spinner,
  useToast,
  SimpleGrid,
  HStack,
  VStack,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiChevronRight, 
  FiUsers, 
  FiSearch, 
  FiCheck,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiArrowLeft,
  FiRefreshCw,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import CardPacienteViagem from '../../components/viagens/CardPacienteViagem';
import api from '../../services/api';

const GerenciarPacientesViagem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Modal para adicionar pacientes
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Estados
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [pacientesDisponiveis, setPacientesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [filtroPacientes, setFiltroPacientes] = useState('');
  const [pacientesSelecionados, setPacientesSelecionados] = useState([]);
  const [adicionandoPacientes, setAdicionandoPacientes] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  
  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    confirmados: 0,
    pendentes: 0,
    ausentes: 0,
    compareceram: 0,
    cancelados: 0
  });
  
  // Função para carregar dados da viagem
  const carregarViagem = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/viagens/${id}`);
      setViagem(response.data);
    } catch (error) {
      console.error('Erro ao carregar viagem:', error);
      toast({
        title: 'Erro ao carregar viagem',
        description: error.response?.data?.message || 'Não foi possível carregar os dados da viagem',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);
  
  // Função para carregar pacientes da viagem
  const carregarPacientes = useCallback(async () => {
    try {
      setLoadingPacientes(true);
      const response = await api.get(`/viagens/${id}/pacientes`);
      setPacientes(response.data);
      
      // Calcular estatísticas
      const stats = {
        total: response.data.length,
        confirmados: response.data.filter(p => p.status === 'CONFIRMADO').length,
        pendentes: response.data.filter(p => p.status === 'PENDENTE').length,
        ausentes: response.data.filter(p => p.status === 'AUSENTE').length,
        compareceram: response.data.filter(p => p.status === 'COMPARECEU').length,
        cancelados: response.data.filter(p => p.status === 'CANCELADO').length
      };
      
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: 'Erro ao carregar pacientes',
        description: error.response?.data?.message || 'Não foi possível carregar a lista de pacientes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingPacientes(false);
    }
  }, [id, toast]);
  
  // Função para buscar pacientes disponíveis para adicionar
  const buscarPacientesDisponiveis = useCallback(async () => {
    try {
      const response = await api.get(`/pacientes/disponiveis-para-viagem/${id}`, {
        params: { 
          termo: filtroPacientes 
        }
      });
      setPacientesDisponiveis(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes disponíveis:', error);
      toast({
        title: 'Erro ao buscar pacientes',
        description: error.response?.data?.message || 'Não foi possível buscar pacientes disponíveis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [id, filtroPacientes, toast]);
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarViagem();
    carregarPacientes();
  }, [carregarViagem, carregarPacientes]);
  
  // Buscar pacientes disponíveis quando o modal for aberto
  useEffect(() => {
    if (isOpen) {
      buscarPacientesDisponiveis();
    }
  }, [isOpen, buscarPacientesDisponiveis]);
  
  // Função para adicionar pacientes à viagem
  const adicionarPacientes = async () => {
    if (pacientesSelecionados.length === 0) {
      toast({
        title: 'Selecione pelo menos um paciente',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setAdicionandoPacientes(true);
      await api.post(`/viagens/${id}/pacientes`, {
        pacientes: pacientesSelecionados
      });
      
      toast({
        title: 'Pacientes adicionados com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Recarregar lista de pacientes e limpar seleção
      await carregarPacientes();
      setPacientesSelecionados([]);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar pacientes:', error);
      toast({
        title: 'Erro ao adicionar pacientes',
        description: error.response?.data?.message || 'Não foi possível adicionar os pacientes selecionados',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAdicionandoPacientes(false);
    }
  };
  
  // Função para realizar check-in de um paciente
  const realizarCheckIn = async (pacienteId) => {
    try {
      await api.post(`/viagens/${id}/pacientes/${pacienteId}/checkin`);
      toast({
        title: 'Check-in realizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      carregarPacientes();
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      toast({
        title: 'Erro ao realizar check-in',
        description: error.response?.data?.message || 'Não foi possível realizar o check-in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Função para realizar check-out de um paciente
  const realizarCheckOut = async (pacienteId) => {
    try {
      await api.post(`/viagens/${id}/pacientes/${pacienteId}/checkout`);
      toast({
        title: 'Check-out realizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      carregarPacientes();
    } catch (error) {
      console.error('Erro ao realizar check-out:', error);
      toast({
        title: 'Erro ao realizar check-out',
        description: error.response?.data?.message || 'Não foi possível realizar o check-out',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Função para remover paciente da viagem
  const removerPaciente = async (pacienteId) => {
    try {
      await api.delete(`/viagens/${id}/pacientes/${pacienteId}`);
      toast({
        title: 'Paciente removido com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      carregarPacientes();
    } catch (error) {
      console.error('Erro ao remover paciente:', error);
      toast({
        title: 'Erro ao remover paciente',
        description: error.response?.data?.message || 'Não foi possível remover o paciente',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Função para filtrar pacientes por status
  const filtrarPacientesPorStatus = () => {
    if (statusFiltro === 'TODOS') {
      return pacientes;
    }
    return pacientes.filter(p => p.status === statusFiltro);
  };
  
  // Manipulação de seleção de pacientes
  const toggleSelecionarPaciente = (pacienteId) => {
    if (pacientesSelecionados.includes(pacienteId)) {
      setPacientesSelecionados(pacientesSelecionados.filter(id => id !== pacienteId));
    } else {
      setPacientesSelecionados([...pacientesSelecionados, pacienteId]);
    }
  };
  
  // Renderização condicional para diferentes estados de carregamento
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="calc(100vh - 100px)">
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
      </Flex>
    );
  }
  
  if (!viagem) {
    return (
      <Alert status="error" variant="solid" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>Viagem não encontrada!</AlertTitle>
        <AlertDescription>Não foi possível encontrar os dados da viagem solicitada.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Box py={4} px={6}>
      {/* Navegação */}
      <Breadcrumb separator={<FiChevronRight color="gray.500" />} mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/viagens')}>Viagens</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate(`/viagens/${id}`)}>Detalhes da Viagem</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Gerenciar Pacientes</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Cabeçalho */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="flex-start" spacing={1}>
          <Heading size="lg">Gerenciar Pacientes da Viagem</Heading>
          <Text color="gray.600">
            {viagem.destino} - {new Date(viagem.data_ida).toLocaleDateString()}
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Button 
            leftIcon={<FiArrowLeft />} 
            onClick={() => navigate(`/viagens/${id}`)}
          >
            Voltar para Viagem
          </Button>
          <Button 
            leftIcon={<FiDownload />} 
            colorScheme="blue" 
            variant="outline"
            onClick={() => window.open(`/api/viagens/${id}/relatorio-pacientes`, '_blank')}
          >
            Relatório
          </Button>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue"
            onClick={onOpen}
            isDisabled={['FINALIZADA', 'CANCELADA'].includes(viagem.status)}
          >
            Adicionar Pacientes
          </Button>
        </HStack>
      </Flex>
      
      {/* Informações da viagem */}
      <Box 
        bg="white" 
        p={5} 
        borderRadius="md" 
        boxShadow="md" 
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <Stat>
            <StatLabel display="flex" alignItems="center">
              <FiMapPin style={{ marginRight: '8px' }} /> Destino
            </StatLabel>
            <StatNumber fontSize="lg">{viagem.destino}</StatNumber>
            <StatHelpText>{viagem.estabelecimento || 'Não especificado'}</StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel display="flex" alignItems="center">
              <FiCalendar style={{ marginRight: '8px' }} /> Data da Viagem
            </StatLabel>
            <StatNumber fontSize="lg">{new Date(viagem.data_ida).toLocaleDateString()}</StatNumber>
            <StatHelpText>
              {viagem.data_volta ? `Retorno: ${new Date(viagem.data_volta).toLocaleDateString()}` : 'Sem data de retorno'}
            </StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel display="flex" alignItems="center">
              <FiClock style={{ marginRight: '8px' }} /> Horário
            </StatLabel>
            <StatNumber fontSize="lg">
              {viagem.horario_saida ? new Date(viagem.horario_saida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Não definido'}
            </StatNumber>
            <StatHelpText>
              {viagem.local_embarque || 'Local de embarque não definido'}
            </StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel display="flex" alignItems="center">
              <FiUsers style={{ marginRight: '8px' }} /> Capacidade
            </StatLabel>
            <StatNumber fontSize="lg">{estatisticas.total} / {viagem.capacidade}</StatNumber>
            <StatHelpText color={viagem.status === 'CANCELADA' ? 'red.500' : 'green.500'}>
              <Badge colorScheme={viagem.status === 'CANCELADA' ? 'red' : 
                      viagem.status === 'FINALIZADA' ? 'gray' : 
                      viagem.status === 'EM_ANDAMENTO' ? 'green' : 
                      viagem.status === 'CONFIRMADA' ? 'blue' : 'yellow'}>
                {viagem.status.replace('_', ' ')}
              </Badge>
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </Box>
      
      {/* Estatísticas dos pacientes */}
      <Box 
        bg="white" 
        p={5} 
        borderRadius="md" 
        boxShadow="md" 
        mb={6}
      >
        <HStack spacing={6} overflowX="auto" pb={2}>
          <Stat size="sm">
            <StatLabel>Total</StatLabel>
            <StatNumber>{estatisticas.total}</StatNumber>
          </Stat>
          <Divider orientation="vertical" height="50px" />
          <Stat size="sm">
            <StatLabel color="green.500">Confirmados</StatLabel>
            <StatNumber color="green.500">{estatisticas.confirmados}</StatNumber>
          </Stat>
          <Divider orientation="vertical" height="50px" />
          <Stat size="sm">
            <StatLabel color="yellow.500">Pendentes</StatLabel>
            <StatNumber color="yellow.500">{estatisticas.pendentes}</StatNumber>
          </Stat>
          <Divider orientation="vertical" height="50px" />
          <Stat size="sm">
            <StatLabel color="blue.500">Compareceram</StatLabel>
            <StatNumber color="blue.500">{estatisticas.compareceram}</StatNumber>
          </Stat>
          <Divider orientation="vertical" height="50px" />
          <Stat size="sm">
            <StatLabel color="red.500">Ausentes</StatLabel>
            <StatNumber color="red.500">{estatisticas.ausentes}</StatNumber>
          </Stat>
          <Divider orientation="vertical" height="50px" />
          <Stat size="sm">
            <StatLabel color="gray.500">Cancelados</StatLabel>
            <StatNumber color="gray.500">{estatisticas.cancelados}</StatNumber>
          </Stat>
        </HStack>
      </Box>
      
      {/* Filtros e lista de pacientes */}
      <Box>
        <Flex mb={4} justify="space-between" align="center">
          <HStack>
            <IconButton
              icon={<FiRefreshCw />}
              aria-label="Atualizar"
              onClick={() => carregarPacientes()}
              isLoading={loadingPacientes}
            />
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Buscar paciente..."
                value={filtroPacientes}
                onChange={(e) => setFiltroPacientes(e.target.value)}
              />
            </InputGroup>
          </HStack>
          
          <HStack>
            <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
              Filtrar por status:
            </Text>
            <Select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              size="sm"
              maxW="180px"
            >
              <option value="TODOS">Todos</option>
              <option value="CONFIRMADO">Confirmados</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="COMPARECEU">Compareceram</option>
              <option value="AUSENTE">Ausentes</option>
              <option value="CANCELADO">Cancelados</option>
            </Select>
          </HStack>
        </Flex>
        
        {loadingPacientes ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        ) : (
          <>
            {pacientes.length === 0 ? (
              <Alert status="info" variant="subtle" borderRadius="md">
                <AlertIcon />
                <AlertTitle mr={2}>Nenhum paciente</AlertTitle>
                <AlertDescription>Não há pacientes registrados para esta viagem.</AlertDescription>
              </Alert>
            ) : (
              <SimpleGrid 
                columns={{ base: 1, md: 2, lg: 3, xl: 4 }} 
                spacing={4} 
                mt={4}
              >
                {filtrarPacientesPorStatus()
                  .filter(p => {
                    if (!filtroPacientes) return true;
                    const termo = filtroPacientes.toLowerCase();
                    return (
                      p.nome.toLowerCase().includes(termo) ||
                      p.cpf.includes(termo)
                    );
                  })
                  .map((paciente) => (
                    <CardPacienteViagem
                      key={paciente.id}
                      paciente={paciente}
                      statusViagem={viagem.status}
                      onCheckIn={() => realizarCheckIn(paciente.id)}
                      onCheckOut={() => realizarCheckOut(paciente.id)}
                      onRemover={() => removerPaciente(paciente.id)}
                    />
                  ))
                }
              </SimpleGrid>
            )}
          </>
        )}
      </Box>
      
      {/* Modal para adicionar pacientes */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Pacientes à Viagem</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>Selecione os pacientes que deseja adicionar à viagem:</Text>
              
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por nome, CPF..."
                  value={filtroPacientes}
                  onChange={(e) => setFiltroPacientes(e.target.value)}
                />
              </InputGroup>
              
              <Box maxH="400px" overflowY="auto" borderWidth={1} borderRadius="md">
                {pacientesDisponiveis.length === 0 ? (
                  <Flex justify="center" align="center" py={6}>
                    <Text color="gray.500">Nenhum paciente disponível encontrado</Text>
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg="white" zIndex={1}>
                      <Tr>
                        <Th width="50px"></Th>
                        <Th>Nome</Th>
                        <Th>CPF</Th>
                        <Th>Idade</Th>
                        <Th>Acompanhante</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pacientesDisponiveis.map((paciente) => (
                        <Tr 
                          key={paciente.id}
                          onClick={() => toggleSelecionarPaciente(paciente.id)}
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                          bg={pacientesSelecionados.includes(paciente.id) ? "blue.50" : "transparent"}
                        >
                          <Td>
                            <input 
                              type="checkbox" 
                              checked={pacientesSelecionados.includes(paciente.id)}
                              onChange={() => {}}
                            />
                          </Td>
                          <Td fontWeight={pacientesSelecionados.includes(paciente.id) ? "bold" : "normal"}>
                            {paciente.nome}
                          </Td>
                          <Td>{paciente.cpf}</Td>
                          <Td>
                            {paciente.data_nascimento 
                              ? new Date().getFullYear() - new Date(paciente.data_nascimento).getFullYear() 
                              : "--"}
                          </Td>
                          <Td>{paciente.necessita_acompanhante ? "Sim" : "Não"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
              
              <HStack justify="space-between">
                <Text fontSize="sm">
                  {pacientesSelecionados.length} paciente(s) selecionado(s)
                </Text>
                <Text fontSize="sm">
                  Capacidade restante: {viagem.capacidade - estatisticas.total}
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={<FiCheck />}
              onClick={adicionarPacientes}
              isLoading={adicionandoPacientes}
              isDisabled={pacientesSelecionados.length === 0 || 
                          pacientesSelecionados.length > (viagem.capacidade - estatisticas.total)}
            >
              Adicionar Selecionados
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GerenciarPacientesViagem; 