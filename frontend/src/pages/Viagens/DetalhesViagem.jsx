import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  Badge,
  useToast,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  Tag,
  TagLeftIcon,
  TagLabel
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaCar,
  FaUserPlus,
  FaUserMinus,
  FaDownload,
  FaEdit,
  FaEllipsisVertical,
  FaPhone,
  FaIdCard,
  FaExclamationTriangle,
  FaPrint,
  FaClipboardList,
  FaUserFriends
} from 'react-icons/fa';
import { viagemService } from '../../services/viagem.service';
import { pacienteService } from '../../services/paciente.service';
import { listaEsperaService } from '../../services/listaEspera.service';
import AdicionarPacienteModal from '../../components/viagens/AdicionarPacienteModal';
import ListaEsperaPacientes from '../../components/viagens/ListaEsperaPacientes';

/**
 * Página de detalhes de uma viagem específica
 */
const DetalhesViagem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Estados
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [erro, setErro] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [refresh, setRefresh] = useState(0);
  
  // Controle dos modais
  const { 
    isOpen: isRemoverPacienteOpen, 
    onOpen: onRemoverPacienteOpen, 
    onClose: onRemoverPacienteClose 
  } = useDisclosure();
  
  const { 
    isOpen: isAdicionarPacienteOpen, 
    onOpen: onAdicionarPacienteOpen, 
    onClose: onAdicionarPacienteClose 
  } = useDisclosure();
  
  // Carregar dados da viagem
  const carregarViagem = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setErro(null);
      
      const dadosViagem = await viagemService.obterViagemPorId(id);
      setViagem(dadosViagem);
    } catch (err) {
      console.error('Erro ao carregar detalhes da viagem:', err);
      setErro('Não foi possível carregar os detalhes da viagem');
      
      toast({
        title: 'Erro ao carregar viagem',
        description: err.message || 'Ocorreu um erro ao carregar os detalhes da viagem',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);
  
  // Carregar lista de pacientes da viagem
  const carregarPacientes = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingPacientes(true);
      
      const pacientesViagem = await viagemService.obterPacientesViagem(id);
      setPacientes(pacientesViagem);
    } catch (err) {
      console.error('Erro ao carregar pacientes da viagem:', err);
      toast({
        title: 'Erro ao carregar pacientes',
        description: err.message || 'Não foi possível carregar a lista de pacientes desta viagem',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingPacientes(false);
    }
  }, [id, toast]);
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarViagem();
    carregarPacientes();
  }, [carregarViagem, carregarPacientes, refresh]);
  
  // Função para remover paciente da viagem
  const removerPaciente = async () => {
    if (!pacienteSelecionado) return;
    
    try {
      await viagemService.removerPaciente(id, pacienteSelecionado._id);
      
      toast({
        title: 'Paciente removido',
        description: 'O paciente foi removido da viagem com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Fechar modal e atualizar dados
      onRemoverPacienteClose();
      setPacienteSelecionado(null);
      setRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Erro ao remover paciente:', err);
      toast({
        title: 'Erro ao remover paciente',
        description: err.message || 'Ocorreu um erro ao remover o paciente da viagem',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };
  
  // Função para confirmar remoção de paciente
  const confirmarRemoverPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    onRemoverPacienteOpen();
  };
  
  // Função para adicionar pacientes
  const handleAdicionarPaciente = () => {
    onAdicionarPacienteOpen();
  };
  
  // Função chamada após adicionar pacientes com sucesso
  const handleAdicionarPacienteSuccess = () => {
    setRefresh(prev => prev + 1);
  };
  
  // Função para gerar relatório da viagem
  const gerarRelatorio = async (formato = 'pdf') => {
    try {
      const blobRelatorio = await viagemService.gerarRelatorioViagem(id, formato);
      
      // Criar objeto URL e link para download
      const url = URL.createObjectURL(blobRelatorio);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-viagem-${viagem.destino.replace(/\s+/g, '-').toLowerCase()}.${formato}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Relatório gerado',
        description: `O relatório da viagem foi gerado com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      toast({
        title: 'Erro ao gerar relatório',
        description: err.message || 'Ocorreu um erro ao gerar o relatório da viagem',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };
  
  // Função para editar a viagem
  const editarViagem = () => {
    navigate(`/viagens/editar/${id}`);
  };
  
  // Formatar data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + 
      data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Formatar CPF para exibição
  const formatarCPF = (cpf) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  
  // Formatar telefone para exibição
  const formatarTelefone = (telefone) => {
    if (!telefone) return '-';
    return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };
  
  // Configurações de cores para status da viagem
  const statusConfig = {
    'agendada': { color: 'blue', label: 'Agendada' },
    'em_andamento': { color: 'green', label: 'Em Andamento' },
    'concluida': { color: 'gray', label: 'Concluída' },
    'cancelada': { color: 'red', label: 'Cancelada' }
  };
  
  // Renderizar tela de carregamento
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" align="center" justify="center" py={16}>
          <Spinner size="xl" mb={4} color="blue.500" />
          <Text>Carregando detalhes da viagem...</Text>
        </Flex>
      </Container>
    );
  }
  
  // Renderizar tela de erro
  if (erro) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" variant="solid" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={8}>
          <AlertIcon boxSize={8} mr={0} mb={4} />
          <AlertTitle mb={2} fontSize="lg">Erro ao carregar a viagem</AlertTitle>
          <AlertDescription maxW="lg">{erro}</AlertDescription>
          <Button mt={4} colorScheme="red" onClick={() => navigate('/viagens')}>
            Voltar para Lista de Viagens
          </Button>
        </Alert>
      </Container>
    );
  }
  
  // Se não encontrou a viagem
  if (!viagem) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning" variant="solid" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={8}>
          <AlertIcon boxSize={8} mr={0} mb={4} />
          <AlertTitle mb={2} fontSize="lg">Viagem não encontrada</AlertTitle>
          <AlertDescription maxW="lg">A viagem solicitada não foi encontrada ou não existe.</AlertDescription>
          <Button mt={4} colorScheme="blue" onClick={() => navigate('/viagens')}>
            Voltar para Lista de Viagens
          </Button>
        </Alert>
      </Container>
    );
  }
  
  // Calcular vagas disponíveis
  const vagasUtilizadas = pacientes.length || 0;
  const vagasDisponiveis = viagem.vagas_totais - vagasUtilizadas;
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* Cabeçalho */}
      <Flex mb={6} alignItems="center" justifyContent="space-between">
        <HStack spacing={4}>
          <Button leftIcon={<Icon as={FaArrowLeft} />} onClick={() => navigate('/viagens')}>
            Voltar
          </Button>
          <Heading size="lg" noOfLines={1}>
            Viagem para {viagem.destino}
          </Heading>
          <Badge 
            colorScheme={statusConfig[viagem.status]?.color || 'gray'} 
            fontSize="md" 
            py={1} 
            px={2} 
            borderRadius="md"
          >
            {statusConfig[viagem.status]?.label || viagem.status}
          </Badge>
        </HStack>
        
        <HStack spacing={3}>
          <Button leftIcon={<Icon as={FaEdit} />} onClick={editarViagem}>
            Editar
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<Icon as={FaEllipsisVertical} />}
              variant="outline"
            >
              Ações
            </MenuButton>
            <MenuList>
              <MenuItem icon={<Icon as={FaDownload} />} onClick={() => gerarRelatorio('pdf')}>
                Exportar PDF
              </MenuItem>
              <MenuItem icon={<Icon as={FaPrint} />} onClick={() => window.print()}>
                Imprimir
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* Detalhes da viagem */}
      <Box bg="white" p={6} borderRadius="md" shadow="md" mb={6}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Destino</Text>
              <Flex align="center">
                <Icon as={FaMapMarkerAlt} mr={2} color="blue.500" />
                <Text fontWeight="medium">{viagem.destino}</Text>
              </Flex>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Data de Ida</Text>
              <Flex align="center">
                <Icon as={FaCalendarAlt} mr={2} color="green.500" />
                <Text fontWeight="medium">{formatarData(viagem.data_ida)}</Text>
              </Flex>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Data de Volta</Text>
              <Flex align="center">
                <Icon as={FaCalendarAlt} mr={2} color="red.500" />
                <Text fontWeight="medium">{formatarData(viagem.data_volta)}</Text>
              </Flex>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Vagas</Text>
              <Flex align="center">
                <Icon as={FaUserFriends} mr={2} color="purple.500" />
                <Text fontWeight="medium">
                  {vagasUtilizadas}/{viagem.vagas_totais} 
                  <Text as="span" color={vagasDisponiveis > 0 ? "green.500" : "red.500"} ml={2}>
                    ({vagasDisponiveis} disponíveis)
                  </Text>
                </Text>
              </Flex>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Motorista</Text>
              <Flex align="center">
                <Icon as={FaUser} mr={2} color="orange.500" />
                <Text fontWeight="medium">{viagem.motorista || "-"}</Text>
              </Flex>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Veículo</Text>
              <Flex align="center">
                <Icon as={FaCar} mr={2} color="blue.500" />
                <Text fontWeight="medium">{viagem.veiculo || "-"}</Text>
              </Flex>
            </VStack>
          </GridItem>
          
          {viagem.observacoes && (
            <GridItem colSpan={{ base: 1, md: 2, lg: 4 }}>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500">Observações</Text>
                <Text>{viagem.observacoes}</Text>
              </VStack>
            </GridItem>
          )}
        </Grid>
      </Box>
      
      {/* Abas para pacientes e lista de espera */}
      <Tabs variant="enclosed" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Pacientes da Viagem ({pacientes.length})</Tab>
          <Tab>Lista de Espera</Tab>
        </TabList>
        
        <TabPanels>
          {/* Aba de pacientes */}
          <TabPanel px={0} pt={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Pacientes</Heading>
              
              <HStack spacing={3}>
                <Button 
                  leftIcon={<Icon as={FaUserPlus} />}
                  onClick={handleAdicionarPaciente}
                  isDisabled={viagem.status === 'cancelada' || viagem.status === 'concluida' || vagasDisponiveis <= 0}
                  colorScheme="blue"
                >
                  Adicionar Pacientes
                </Button>
              </HStack>
            </Flex>
            
            {loadingPacientes ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="md" mr={3} />
                <Text>Carregando pacientes...</Text>
              </Flex>
            ) : pacientes.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertDescription>
                  Esta viagem ainda não possui pacientes. Use o botão "Adicionar Pacientes" para incluir pacientes na viagem.
                </AlertDescription>
              </Alert>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Nome</Th>
                      <Th>CPF</Th>
                      <Th>Telefone</Th>
                      <Th>Necessidades Especiais</Th>
                      <Th>Acompanhante</Th>
                      <Th width="80px">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pacientes.map((paciente) => (
                      <Tr key={paciente._id} _hover={{ bg: "gray.50" }}>
                        <Td fontWeight="medium">{paciente.paciente?.nome}</Td>
                        <Td>{formatarCPF(paciente.paciente?.cpf)}</Td>
                        <Td>{formatarTelefone(paciente.paciente?.telefone)}</Td>
                        <Td>
                          {paciente.paciente?.necessidades_especiais ? (
                            <Tooltip label={paciente.paciente.necessidades_especiais_descricao || "Possui necessidades especiais"}>
                              <Tag colorScheme="red">
                                <TagLeftIcon as={FaExclamationTriangle} />
                                <TagLabel>Sim</TagLabel>
                              </Tag>
                            </Tooltip>
                          ) : (
                            <Text fontSize="sm">Não</Text>
                          )}
                        </Td>
                        <Td>
                          {paciente.acompanhante ? (
                            <Tag colorScheme="purple">
                              <TagLeftIcon as={FaUserFriends} />
                              <TagLabel>Sim</TagLabel>
                            </Tag>
                          ) : (
                            <Text fontSize="sm">Não</Text>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              icon={<Icon as={FaIdCard} />}
                              aria-label="Ver detalhes"
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => navigate(`/pacientes/${paciente.paciente?._id}`)}
                            />
                            
                            <IconButton
                              icon={<Icon as={FaUserMinus} />}
                              aria-label="Remover paciente"
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => confirmarRemoverPaciente(paciente)}
                              isDisabled={viagem.status === 'cancelada' || viagem.status === 'concluida'}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>
          
          {/* Aba de lista de espera */}
          <TabPanel px={0} pt={4}>
            <ListaEsperaPacientes 
              viagemId={id} 
              vagas_disponiveis={vagasDisponiveis} 
              onPacienteAdicionado={() => setRefresh(prev => prev + 1)}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal de confirmação para remover paciente */}
      <Modal isOpen={isRemoverPacienteOpen} onClose={onRemoverPacienteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar remoção</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {pacienteSelecionado && (
              <Text>
                Tem certeza que deseja remover o paciente <strong>{pacienteSelecionado.paciente?.nome}</strong> desta viagem?
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onRemoverPacienteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={removerPaciente}>
              Remover
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de adicionar pacientes */}
      <AdicionarPacienteModal
        isOpen={isAdicionarPacienteOpen}
        onClose={onAdicionarPacienteClose}
        viagemId={id}
        onSuccess={handleAdicionarPacienteSuccess}
      />
    </Container>
  );
};

export default DetalhesViagem; 