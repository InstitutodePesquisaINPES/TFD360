import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { FaSearch, FaUserPlus, FaExclamationTriangle, FaWheelchair } from 'react-icons/fa';
import { pacienteService } from '../../services/paciente.service';
import { viagemService } from '../../services/viagem.service';

/**
 * Modal para adicionar pacientes a uma viagem
 * 
 * @param {Object} props Propriedades do componente
 * @param {boolean} props.isOpen Define se o modal está aberto
 * @param {Function} props.onClose Função para fechar o modal
 * @param {string} props.viagemId ID da viagem para adicionar os pacientes
 * @param {Function} props.onSuccess Função chamada após adicionar pacientes com sucesso
 */
const AdicionarPacienteModal = ({ isOpen, onClose, viagemId, onSuccess }) => {
  // Estados para controle do componente
  const [pacientes, setPacientes] = useState([]);
  const [pacientesSelecionados, setPacientesSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdicionar, setLoadingAdicionar] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [tipoBusca, setTipoBusca] = useState('nome');
  const [erro, setErro] = useState(null);
  const [vagasDisponiveis, setVagasDisponiveis] = useState(0);
  const toast = useToast();

  // Carregar informações da viagem para verificar vagas disponíveis
  const carregarInfoViagem = useCallback(async () => {
    if (!viagemId) return;
    
    try {
      const viagem = await viagemService.obterViagemPorId(viagemId);
      
      // Calcular vagas disponíveis
      const vagasUtilizadas = viagem.pacientes?.length || 0;
      const vagasTotal = viagem.vagas_totais || 0;
      setVagasDisponiveis(vagasTotal - vagasUtilizadas);
    } catch (err) {
      console.error('Erro ao carregar informações da viagem:', err);
      setErro('Não foi possível obter informações da viagem');
    }
  }, [viagemId]);

  // Carregar informações ao abrir o modal
  useEffect(() => {
    if (isOpen && viagemId) {
      carregarInfoViagem();
      setPacientesSelecionados([]);
      setTermoBusca('');
      setPacientes([]);
      setErro(null);
    }
  }, [isOpen, viagemId, carregarInfoViagem]);

  // Função para buscar pacientes
  const buscarPacientes = async () => {
    if (!termoBusca || termoBusca.length < 3) {
      toast({
        title: 'Termo de busca muito curto',
        description: 'Digite pelo menos 3 caracteres para buscar pacientes',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      setErro(null);
      
      // Usar o serviço para buscar pacientes disponíveis para a viagem
      const pacientesEncontrados = await pacienteService.obterPacientesDisponiveisParaViagem(
        viagemId,
        termoBusca
      );
      
      setPacientes(pacientesEncontrados);
      
      if (pacientesEncontrados.length === 0) {
        toast({
          title: 'Nenhum paciente encontrado',
          description: 'Tente outro termo de busca ou verifique se o paciente já está na viagem',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
      setErro(err.message || 'Ocorreu um erro ao buscar pacientes');
      toast({
        title: 'Erro ao buscar pacientes',
        description: err.message || 'Ocorreu um erro ao buscar pacientes',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar pacientes selecionados à viagem
  const adicionarPacientes = async () => {
    if (pacientesSelecionados.length === 0) {
      toast({
        title: 'Nenhum paciente selecionado',
        description: 'Selecione pelo menos um paciente para adicionar à viagem',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingAdicionar(true);
      
      // Obter informações sobre pacientes selecionados para verificar necessidades especiais
      const pacientesParaAdicionar = pacientes.filter(p => 
        pacientesSelecionados.includes(p._id)
      );
      
      // Verificar se há vagas suficientes
      const pacientesComNecessidadesEspeciais = pacientesParaAdicionar.filter(
        p => p.necessidades_especiais
      ).length;
      
      // Considerando que cada paciente com necessidades especiais pode precisar de acompanhante
      // e cada acompanhante ocupa uma vaga adicional
      const vagasNecessarias = pacientesParaAdicionar.length + pacientesComNecessidadesEspeciais;
      
      if (vagasNecessarias > vagasDisponiveis) {
        toast({
          title: 'Vagas insuficientes',
          description: `Você precisa de ${vagasNecessarias} vagas, mas só existem ${vagasDisponiveis} disponíveis.`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoadingAdicionar(false);
        return;
      }
      
      // Adicionar pacientes à viagem
      await viagemService.adicionarPacientes(viagemId, pacientesSelecionados);
      
      toast({
        title: 'Pacientes adicionados com sucesso',
        description: `${pacientesSelecionados.length} paciente(s) adicionado(s) à viagem.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Limpar a seleção e fechar o modal
      setPacientesSelecionados([]);
      onClose();
    } catch (err) {
      console.error('Erro ao adicionar pacientes:', err);
      toast({
        title: 'Erro ao adicionar pacientes',
        description: err.message || 'Ocorreu um erro ao adicionar os pacientes à viagem',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAdicionar(false);
    }
  };

  // Função para alternar a seleção de um paciente
  const toggleSelecaoPaciente = (pacienteId) => {
    setPacientesSelecionados((prevSelecionados) => {
      if (prevSelecionados.includes(pacienteId)) {
        return prevSelecionados.filter((id) => id !== pacienteId);
      } else {
        return [...prevSelecionados, pacienteId];
      }
    });
  };

  // Formatar CPF para exibição
  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Calcular idade com base na data de nascimento
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return '-';
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adicionar Pacientes à Viagem</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Informações sobre vagas disponíveis */}
            <Flex justify="space-between" align="center">
              <Heading size="sm">Buscar Pacientes</Heading>
              <Badge 
                colorScheme={vagasDisponiveis > 0 ? 'green' : 'red'}
                fontSize="md"
                py={1}
                px={2}
                borderRadius="md"
              >
                {vagasDisponiveis} vagas disponíveis
              </Badge>
            </Flex>
            
            {vagasDisponiveis <= 0 && (
              <Alert status="warning" mb={4}>
                <AlertIcon />
                <AlertDescription>
                  Não há vagas disponíveis para adicionar pacientes. Considere aumentar o número de vagas ou remover alguns pacientes da viagem.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Campo de busca */}
            <Flex gap={2}>
              <Select 
                value={tipoBusca} 
                onChange={(e) => setTipoBusca(e.target.value)} 
                width="180px"
              >
                <option value="nome">Nome</option>
                <option value="cpf">CPF</option>
                <option value="cartao_sus">Cartão SUS</option>
              </Select>
              
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder={
                    tipoBusca === 'nome' 
                      ? 'Digite o nome do paciente' 
                      : tipoBusca === 'cpf' 
                      ? 'Digite o CPF do paciente' 
                      : 'Digite o número do cartão SUS'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      buscarPacientes();
                    }
                  }}
                />
              </InputGroup>
              
              <Button
                colorScheme="blue"
                onClick={buscarPacientes}
                isLoading={loading}
                loadingText="Buscando..."
              >
                Buscar
              </Button>
            </Flex>

            {/* Mensagem de erro caso haja falha na busca */}
            {erro && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            
            <Divider />
            
            {/* Lista de pacientes encontrados */}
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th width="40px">#</Th>
                    <Th>Nome</Th>
                    <Th>CPF</Th>
                    <Th>Idade</Th>
                    <Th>Cartão SUS</Th>
                    <Th>Necessidades Especiais</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={10}>
                        <Flex direction="column" align="center">
                          <Spinner size="md" mb={3} />
                          <Text>Buscando pacientes...</Text>
                        </Flex>
                      </Td>
                    </Tr>
                  ) : pacientes.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={8}>
                        <Text fontSize="sm" color="gray.500">
                          Nenhum paciente encontrado. Faça uma busca para exibir resultados.
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    pacientes.map((paciente) => (
                      <Tr 
                        key={paciente._id} 
                        _hover={{ bg: "gray.50" }}
                        bg={pacientesSelecionados.includes(paciente._id) ? "blue.50" : undefined}
                      >
                        <Td>
                          <Checkbox
                            isChecked={pacientesSelecionados.includes(paciente._id)}
                            onChange={() => toggleSelecaoPaciente(paciente._id)}
                            isDisabled={vagasDisponiveis <= 0}
                          />
                        </Td>
                        <Td fontWeight={pacientesSelecionados.includes(paciente._id) ? "semibold" : "normal"}>
                          {paciente.nome}
                        </Td>
                        <Td>{formatarCPF(paciente.cpf)}</Td>
                        <Td>{calcularIdade(paciente.data_nascimento)} anos</Td>
                        <Td>{paciente.cartao_sus || "-"}</Td>
                        <Td>
                          {paciente.necessidades_especiais ? (
                            <Flex align="center" color="red.500">
                              <Icon as={FaWheelchair} mr={1} />
                              <Tooltip 
                                label={paciente.necessidades_especiais_descricao || "Necessidades especiais"}
                                hasArrow
                              >
                                <Text fontSize="sm">Sim</Text>
                              </Tooltip>
                            </Flex>
                          ) : (
                            <Text fontSize="sm">Não</Text>
                          )}
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
            
            {/* Informações sobre seleção */}
            {pacientes.length > 0 && pacientesSelecionados.length > 0 && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">
                    {pacientesSelecionados.length} paciente(s) selecionado(s)
                  </Text>
                  {pacientes.filter(p => 
                    pacientesSelecionados.includes(p._id) && p.necessidades_especiais
                  ).length > 0 && (
                    <Text fontSize="sm" mt={1}>
                      <Icon as={FaExclamationTriangle} mr={1} color="orange.500" />
                      Atenção: {pacientes.filter(p => 
                        pacientesSelecionados.includes(p._id) && p.necessidades_especiais
                      ).length} paciente(s) com necessidades especiais selecionado(s)
                    </Text>
                  )}
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              leftIcon={<Icon as={FaUserPlus} />}
              colorScheme="blue"
              onClick={adicionarPacientes}
              isLoading={loadingAdicionar}
              isDisabled={pacientesSelecionados.length === 0 || vagasDisponiveis <= 0}
            >
              Adicionar {pacientesSelecionados.length > 0 ? `(${pacientesSelecionados.length})` : ''}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AdicionarPacienteModal; 