import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Text,
  Badge,
  Spinner,
  useToast,
  Heading,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
  HStack,
  Tag,
  TagLeftIcon,
  TagLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
  Divider,
  Grid,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  CheckIcon, 
  CloseIcon, 
  InfoIcon,
  WarningIcon
} from '@chakra-ui/icons';
import { 
  FiUserPlus, 
  FiAlertTriangle, 
  FiArrowUp, 
  FiClock, 
  FiPhone, 
  FiUser
} from 'react-icons/fi';
import { api } from '../../services/api';
import { formatarCPF, formatarData, formatarTelefone } from '../../utils/formatadores';

const ListaEsperaPacientes = ({ viagemId, vagas_disponiveis, onPacienteAdicionado }) => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingAdicionar, setLoadingAdicionar] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isOpenDetalhe, 
    onOpen: onOpenDetalhe, 
    onClose: onCloseDetalhe 
  } = useDisclosure();
  const [pacienteDetalhe, setPacienteDetalhe] = useState(null);
  const [observacao, setObservacao] = useState('');
  const [prioridade, setPrioridade] = useState('normal');
  const toast = useToast();

  useEffect(() => {
    carregarListaEspera();
  }, [viagemId]);

  const carregarListaEspera = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/viagens/${viagemId}/lista-espera`);
      setPacientes(response.data);
      setSelecionados([]);
    } catch (error) {
      console.error('Erro ao carregar lista de espera:', error);
      setError(error.response?.data?.message || 'Não foi possível carregar a lista de espera');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelecao = (pacienteId) => {
    setSelecionados(prev => {
      if (prev.includes(pacienteId)) {
        return prev.filter(id => id !== pacienteId);
      } else {
        return [...prev, pacienteId];
      }
    });
  };

  const handleVerDetalhes = (paciente) => {
    setPacienteDetalhe(paciente);
    onOpenDetalhe();
  };

  const handleAdicionar = async () => {
    if (vagas_disponiveis <= 0) {
      toast({
        title: 'Sem vagas disponíveis',
        description: 'A viagem não tem vagas disponíveis para adicionar pacientes.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selecionados.length === 0) {
      toast({
        title: 'Nenhum paciente selecionado',
        description: 'Selecione pelo menos um paciente para adicionar à viagem.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingAdicionar(true);
      
      // Verificar se há vagas suficientes
      const pacientesSelecionados = pacientes.filter(p => selecionados.includes(p._id));
      const vagasNecessarias = pacientesSelecionados.reduce((total, p) => {
        return total + (p.acompanhante ? 2 : 1);
      }, 0);
      
      if (vagasNecessarias > vagas_disponiveis) {
        toast({
          title: 'Vagas insuficientes',
          description: `Você selecionou pacientes que necessitam de ${vagasNecessarias} vagas, mas só existem ${vagas_disponiveis} disponíveis.`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoadingAdicionar(false);
        return;
      }
      
      // Adicionar pacientes da lista de espera
      await api.post(`/viagens/${viagemId}/adicionar-da-lista-espera`, {
        pacientes: selecionados
      });
      
      toast({
        title: 'Pacientes adicionados com sucesso',
        description: `${selecionados.length} paciente(s) movido(s) da lista de espera para a viagem.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de espera
      carregarListaEspera();
      
      // Notificar componente pai
      if (onPacienteAdicionado) {
        onPacienteAdicionado();
      }
    } catch (error) {
      console.error('Erro ao adicionar pacientes da lista de espera:', error);
      toast({
        title: 'Erro ao adicionar pacientes',
        description: error.response?.data?.message || 'Não foi possível adicionar os pacientes à viagem',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAdicionar(false);
    }
  };

  const handleCadastrarListaEspera = async () => {
    if (!pacienteDetalhe) return;
    
    try {
      setLoadingAdicionar(true);
      
      await api.post(`/viagens/${viagemId}/lista-espera`, {
        paciente_id: pacienteDetalhe.paciente._id,
        prioridade: prioridade,
        observacao: observacao,
        acompanhante: pacienteDetalhe.acompanhante
      });
      
      toast({
        title: 'Adicionado à lista de espera',
        description: 'Paciente adicionado à lista de espera com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
      carregarListaEspera();
    } catch (error) {
      console.error('Erro ao adicionar à lista de espera:', error);
      toast({
        title: 'Erro ao adicionar à lista de espera',
        description: error.response?.data?.message || 'Não foi possível adicionar o paciente à lista de espera',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAdicionar(false);
    }
  };

  const handleRemoverListaEspera = async (pacienteId) => {
    try {
      await api.delete(`/viagens/${viagemId}/lista-espera/${pacienteId}`);
      
      toast({
        title: 'Removido da lista de espera',
        description: 'Paciente removido da lista de espera com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      carregarListaEspera();
    } catch (error) {
      console.error('Erro ao remover da lista de espera:', error);
      toast({
        title: 'Erro ao remover da lista de espera',
        description: error.response?.data?.message || 'Não foi possível remover o paciente da lista de espera',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getPrioridadeBadge = (prioridade) => {
    switch(prioridade) {
      case 'alta':
        return <Badge colorScheme="red">ALTA</Badge>;
      case 'media':
        return <Badge colorScheme="orange">MÉDIA</Badge>;
      default:
        return <Badge colorScheme="blue">NORMAL</Badge>;
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" p={4}>
        <Spinner size="md" mr={3} />
        <Text>Carregando lista de espera...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Lista de Espera</Heading>
        {vagas_disponiveis > 0 && selecionados.length > 0 && (
          <Button
            leftIcon={<FiUserPlus />}
            colorScheme="green"
            size="sm"
            onClick={handleAdicionar}
            isLoading={loadingAdicionar}
          >
            Adicionar Selecionados ({selecionados.length})
          </Button>
        )}
      </Flex>

      {pacientes.length === 0 ? (
        <Alert status="info" rounded="md">
          <AlertIcon />
          <Text>Não há pacientes na lista de espera.</Text>
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="40px">
                  {vagas_disponiveis > 0 && <Text>#</Text>}
                </Th>
                <Th>Paciente</Th>
                <Th>CPF</Th>
                <Th>Telefone</Th>
                <Th>Acompanhante</Th>
                <Th>Prioridade</Th>
                <Th>Adicionado em</Th>
                <Th width="100px">Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pacientes.map((paciente) => (
                <Tr key={paciente._id} 
                    _hover={{ bg: "gray.50" }}
                    bg={selecionados.includes(paciente._id) ? "blue.50" : undefined}>
                  <Td>
                    {vagas_disponiveis > 0 && (
                      <Checkbox
                        isChecked={selecionados.includes(paciente._id)}
                        onChange={() => handleToggleSelecao(paciente._id)}
                        colorScheme="blue"
                      />
                    )}
                  </Td>
                  <Td fontWeight={selecionados.includes(paciente._id) ? "bold" : "normal"}>
                    <Flex align="center">
                      {paciente.paciente.nome}
                      {paciente.paciente.necessidades_especiais && (
                        <Tooltip label="Paciente com necessidades especiais">
                          <InfoIcon ml={2} color="red.500" />
                        </Tooltip>
                      )}
                    </Flex>
                  </Td>
                  <Td>{formatarCPF(paciente.paciente.cpf)}</Td>
                  <Td>{formatarTelefone(paciente.paciente.telefone)}</Td>
                  <Td>
                    <Tag size="sm" colorScheme={paciente.acompanhante ? "purple" : "gray"}>
                      <TagLeftIcon as={FiUser} />
                      <TagLabel>{paciente.acompanhante ? "Sim" : "Não"}</TagLabel>
                    </Tag>
                  </Td>
                  <Td>{getPrioridadeBadge(paciente.prioridade)}</Td>
                  <Td>{formatarData(paciente.created_at)}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <Tooltip label="Ver detalhes">
                        <IconButton
                          aria-label="Ver detalhes"
                          icon={<InfoIcon />}
                          size="xs"
                          onClick={() => handleVerDetalhes(paciente)}
                        />
                      </Tooltip>
                      
                      <Tooltip label="Remover da lista de espera">
                        <IconButton
                          aria-label="Remover da lista de espera"
                          icon={<CloseIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoverListaEspera(paciente._id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Modal de detalhes do paciente */}
      <Modal isOpen={isOpenDetalhe} onClose={onCloseDetalhe} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Paciente na Lista de Espera</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {pacienteDetalhe && (
              <Box>
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <Box>
                    <Heading size="md">{pacienteDetalhe.paciente.nome}</Heading>
                    <Text color="gray.600">{formatarCPF(pacienteDetalhe.paciente.cpf)}</Text>
                  </Box>
                  {getPrioridadeBadge(pacienteDetalhe.prioridade)}
                </Flex>
                
                <Divider mb={4} />
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Telefone:</Text>
                    <Text>{formatarTelefone(pacienteDetalhe.paciente.telefone)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Data de Nascimento:</Text>
                    <Text>{formatarData(pacienteDetalhe.paciente.data_nascimento)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Acompanhante:</Text>
                    <Text>{pacienteDetalhe.acompanhante ? "Sim" : "Não"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Cartão SUS:</Text>
                    <Text>{pacienteDetalhe.paciente.cartao_sus || "Não informado"}</Text>
                  </Box>
                </Grid>
                
                {pacienteDetalhe.paciente.necessidades_especiais && (
                  <Alert status="warning" mb={4}>
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Necessidades Especiais</Text>
                      <Text>{pacienteDetalhe.paciente.necessidades_especiais_descricao || "Não especificado"}</Text>
                    </Box>
                  </Alert>
                )}
                
                <Box mb={4}>
                  <Text fontWeight="bold" fontSize="sm">Observação na Lista de Espera:</Text>
                  <Text>{pacienteDetalhe.observacao || "Nenhuma observação"}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Adicionado em:</Text>
                  <Text>{formatarData(pacienteDetalhe.created_at, true)}</Text>
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onCloseDetalhe}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Componente auxiliar para exibir as informações em Grid
const Grid = ({ children, templateColumns, gap, ...props }) => {
  return (
    <Box 
      display="grid" 
      gridTemplateColumns={templateColumns}
      gridGap={gap}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ListaEsperaPacientes; 