import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Button, 
  useToast, 
  Grid, 
  Divider, 
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  Badge,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
  HStack,
  VStack,
  useDisclosure,
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  AddIcon, 
  SearchIcon,
  WarningIcon,
  CheckIcon
} from '@chakra-ui/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CardPacienteViagem from '../../components/viagens/CardPacienteViagem';
import { api } from '../../services/api';
import AdicionarPacienteModal from '../../components/viagens/AdicionarPacienteModal';
import { formatarData } from '../../utils/formatadores';

const GerenciarPacientes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isConcluirOpen, 
    onOpen: onConcluirOpen, 
    onClose: onConcluirClose 
  } = useDisclosure();
  
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroAcompanhante, setFiltroAcompanhante] = useState('todos');
  const [kmFinal, setKmFinal] = useState('');
  const [observacoesRetorno, setObservacoesRetorno] = useState('');
  
  useEffect(() => {
    carregarDados();
  }, [id]);
  
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados da viagem
      const responseViagem = await api.get(`/viagens/${id}`);
      setViagem(responseViagem.data);
      
      // Carregar pacientes da viagem
      const responsePacientes = await api.get(`/viagens/${id}/pacientes`);
      setPacientes(responsePacientes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados da viagem:', error);
      setError(error.response?.data?.message || 'Não foi possível carregar os dados da viagem');
      setLoading(false);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da viagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };
  
  const handlePacienteAdicionado = () => {
    carregarDados();
    toast({
      title: 'Pacientes adicionados',
      description: 'Pacientes adicionados à viagem com sucesso',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };
  
  const handleRemoverPaciente = async (pacienteId) => {
    try {
      setLoadingAction(true);
      await api.delete(`/viagens/${id}/pacientes/${pacienteId}`);
      
      // Atualizar a lista de pacientes
      setPacientes(prevPacientes => prevPacientes.filter(p => p.paciente._id !== pacienteId));
      
      // Atualizar os dados da viagem para refletir as vagas disponíveis
      const responseViagem = await api.get(`/viagens/${id}`);
      setViagem(responseViagem.data);
      
      setLoadingAction(false);
    } catch (error) {
      console.error('Erro ao remover paciente:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível remover o paciente da viagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoadingAction(false);
    }
  };
  
  const handleCheckIn = async (pacienteId) => {
    try {
      setLoadingAction(true);
      
      // Se for o primeiro check-in e a viagem ainda está em confirmada, perguntar se quer iniciar a viagem
      if (viagem.status === 'confirmada' && !pacientes.some(p => p.horario_checkin)) {
        // Atualizar status da viagem para 'em_andamento'
        await api.patch(`/viagens/${id}/status`, { 
          status: 'em_andamento' 
        });
      }
      
      await api.post(`/viagens/${id}/pacientes/${pacienteId}/checkin`);
      
      // Atualizar dados após o check-in
      carregarDados();
      
      setLoadingAction(false);
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível realizar o check-in do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoadingAction(false);
    }
  };
  
  const handleCheckOut = async (pacienteId) => {
    try {
      setLoadingAction(true);
      
      const response = await api.post(`/viagens/${id}/pacientes/${pacienteId}/checkout`);
      
      // Atualizar dados após o check-out
      carregarDados();
      
      // Verificar se todos os pacientes com check-in já fizeram check-out
      if (response.data.todos_concluidos) {
        onConcluirOpen();
      }
      
      setLoadingAction(false);
    } catch (error) {
      console.error('Erro ao realizar check-out:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível realizar o check-out do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoadingAction(false);
    }
  };
  
  const handleAlterarStatus = async (pacienteId, novoStatus, observacao) => {
    try {
      setLoadingAction(true);
      
      await api.patch(`/viagens/${id}/pacientes/${pacienteId}/status`, {
        status: novoStatus,
        observacao
      });
      
      // Atualizar dados após a alteração de status
      carregarDados();
      
      setLoadingAction(false);
    } catch (error) {
      console.error('Erro ao alterar status do paciente:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível alterar o status do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoadingAction(false);
    }
  };
  
  const concluirViagem = async () => {
    try {
      setLoadingAction(true);
      
      if (!kmFinal.trim()) {
        toast({
          title: 'Quilometragem obrigatória',
          description: 'A quilometragem final é obrigatória para concluir a viagem',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        setLoadingAction(false);
        return;
      }
      
      await api.patch(`/viagens/${id}/status`, {
        status: 'concluida',
        km_final: Number(kmFinal),
        observacoes_retorno: observacoesRetorno
      });
      
      onConcluirClose();
      
      toast({
        title: 'Viagem concluída',
        description: 'Viagem concluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Redirecionar para a página de detalhes da viagem
      navigate(`/viagens/${id}`);
      
    } catch (error) {
      console.error('Erro ao concluir viagem:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível concluir a viagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoadingAction(false);
    }
  };
  
  // Filtrar pacientes conforme os critérios
  const filtrarPacientes = () => {
    if (!pacientes.length) return [];
    
    return pacientes.filter(paciente => {
      // Filtro por status
      if (filtroStatus !== 'todos' && paciente.status !== filtroStatus) {
        return false;
      }
      
      // Filtro por acompanhante
      if (filtroAcompanhante === 'com' && !paciente.acompanhante) {
        return false;
      } else if (filtroAcompanhante === 'sem' && paciente.acompanhante) {
        return false;
      }
      
      // Filtro por busca
      if (busca.trim()) {
        const buscaLower = busca.toLowerCase();
        return (
          paciente.paciente.nome.toLowerCase().includes(buscaLower) ||
          paciente.paciente.cpf.includes(buscaLower) ||
          (paciente.paciente.cartao_sus && paciente.paciente.cartao_sus.includes(buscaLower))
        );
      }
      
      return true;
    });
  };
  
  // Contadores para exibir estatísticas
  const getEstatisticas = () => {
    if (!pacientes.length) return { total: 0, confirmados: 0, checkin: 0, acompanhantes: 0 };
    
    const total = pacientes.length;
    const confirmados = pacientes.filter(p => p.status === 'confirmado').length;
    const checkin = pacientes.filter(p => p.horario_checkin).length;
    const acompanhantes = pacientes.filter(p => p.acompanhante).length;
    
    return { total, confirmados, checkin, acompanhantes };
  };
  
  const pacientesFiltrados = filtrarPacientes();
  const estatisticas = getEstatisticas();
  
  if (loading) {
    return (
      <Flex justify="center" align="center" height="60vh" direction="column">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4}>Carregando informações da viagem...</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" rounded="md" my={4}>
        <AlertIcon />
        <AlertTitle>{error}</AlertTitle>
      </Alert>
    );
  }
  
  return (
    <Box p={4}>
      <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/viagens">Viagens</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to={`/viagens/${id}`}>Detalhes</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Pacientes</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {viagem && (
        <>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Heading size="lg" mb={1}>Gerenciar Pacientes</Heading>
              <Text fontSize="md" color="gray.600">
                {viagem.origem} → {viagem.destino} | {formatarData(viagem.data_viagem)}
              </Text>
              <Flex mt={1} align="center">
                <Badge 
                  colorScheme={
                    viagem.status === 'agendada' ? 'yellow' : 
                    viagem.status === 'confirmada' ? 'blue' : 
                    viagem.status === 'em_andamento' ? 'green' : 
                    viagem.status === 'concluida' ? 'purple' : 
                    viagem.status === 'cancelada' ? 'red' : 'gray'
                  }
                  mr={2}
                >
                  {viagem.status.toUpperCase().replace('_', ' ')}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                  {viagem.vagas_disponiveis} vagas disponíveis
                </Text>
              </Flex>
            </Box>
            
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="blue" 
              onClick={onOpen}
              isDisabled={['concluida', 'cancelada'].includes(viagem.status) || viagem.vagas_disponiveis <= 0}
            >
              Adicionar Pacientes
            </Button>
          </Flex>
          
          <HStack spacing={4} mb={6} wrap="wrap">
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" color="gray.500">Total de pacientes</Text>
              <Text fontSize="xl" fontWeight="bold">{estatisticas.total}</Text>
            </VStack>
            
            <Divider orientation="vertical" height="40px" />
            
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" color="gray.500">Confirmados</Text>
              <Text fontSize="xl" fontWeight="bold" color="green.500">{estatisticas.confirmados}</Text>
            </VStack>
            
            <Divider orientation="vertical" height="40px" />
            
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" color="gray.500">Check-in realizados</Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.500">{estatisticas.checkin}</Text>
            </VStack>
            
            <Divider orientation="vertical" height="40px" />
            
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" color="gray.500">Com acompanhantes</Text>
              <Text fontSize="xl" fontWeight="bold" color="purple.500">{estatisticas.acompanhantes}</Text>
            </VStack>
          </HStack>
          
          <Box mb={6}>
            <Flex mb={4} direction={{ base: "column", md: "row" }} gap={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Buscar por nome, CPF ou cartão SUS" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                placeholder="Status" 
                width={{ base: "100%", md: "200px" }}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="todos">Todos os status</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
                <option value="ausente">Ausente</option>
              </Select>
              
              <Select 
                placeholder="Acompanhante" 
                width={{ base: "100%", md: "200px" }}
                value={filtroAcompanhante}
                onChange={(e) => setFiltroAcompanhante(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="com">Com acompanhante</option>
                <option value="sem">Sem acompanhante</option>
              </Select>
            </Flex>
          </Box>
          
          <Divider mb={6} />
          
          {pacientesFiltrados.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              {busca.trim() || filtroStatus !== 'todos' || filtroAcompanhante !== 'todos' ? 
                'Nenhum paciente encontrado com os filtros selecionados.' : 
                'Nenhum paciente adicionado a esta viagem.'}
            </Alert>
          ) : (
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                md: "repeat(2, 1fr)", 
                lg: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)" 
              }} 
              gap={4}
            >
              {pacientesFiltrados.map((p) => (
                <CardPacienteViagem 
                  key={p._id}
                  paciente={{
                    ...p.paciente,
                    status: p.status,
                    horario_checkin: p.horario_checkin,
                    horario_checkout: p.horario_checkout,
                    observacao: p.observacao,
                    acompanhante: p.acompanhante,
                    necessidades_especiais: p.paciente.necessidades_especiais,
                    descricao_necessidades: p.paciente.necessidades_especiais_descricao,
                    codigo_passagem: p.codigo_passagem
                  }}
                  statusViagem={viagem.status}
                  onCheckIn={() => handleCheckIn(p.paciente._id)}
                  onCheckOut={() => handleCheckOut(p.paciente._id)}
                  onAlterarStatus={(status, observacao) => handleAlterarStatus(p.paciente._id, status, observacao)}
                  onRemover={() => handleRemoverPaciente(p.paciente._id)}
                  podeEditar={!['concluida', 'cancelada'].includes(viagem.status)}
                />
              ))}
            </Grid>
          )}
        </>
      )}
      
      <AdicionarPacienteModal 
        isOpen={isOpen}
        onClose={onClose}
        viagemId={id}
        onPacienteAdicionado={handlePacienteAdicionado}
      />
      
      {/* Modal de conclusão de viagem */}
      <Modal isOpen={isConcluirOpen} onClose={onConcluirClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Concluir Viagem</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Todos os pacientes já realizaram check-out</Text>
                  <Text fontSize="sm">Deseja concluir a viagem agora?</Text>
                </Box>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Quilometragem Final</FormLabel>
                <Input 
                  type="number"
                  placeholder="Informe a quilometragem final do veículo"
                  value={kmFinal}
                  onChange={(e) => setKmFinal(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Observações do Retorno</FormLabel>
                <Input 
                  placeholder="Observações sobre o retorno da viagem (opcional)"
                  value={observacoesRetorno}
                  onChange={(e) => setObservacoesRetorno(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onConcluirClose}>
              Mais tarde
            </Button>
            <Button 
              colorScheme="green" 
              leftIcon={<CheckIcon />}
              onClick={concluirViagem}
              isLoading={loadingAction}
              isDisabled={!kmFinal.trim()}
            >
              Concluir Viagem
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GerenciarPacientes; 