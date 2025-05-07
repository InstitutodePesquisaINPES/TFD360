import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Checkbox,
  CheckboxGroup,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Badge,
  Box,
  Flex,
  Alert,
  AlertIcon,
  Spinner,
  Textarea
} from '@chakra-ui/react';
import { FaSearch, FaSignOutAlt } from 'react-icons/fa';
import { viagemService } from '../../services/viagem.service';

/**
 * Modal para realizar o checkout de pacientes em uma viagem
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Estado que controla se o modal está aberto
 * @param {function} props.onClose - Função para fechar o modal
 * @param {string} props.viagemId - ID da viagem selecionada
 * @param {function} props.onSuccess - Função chamada após o checkout ser realizado com sucesso
 */
const CheckoutPacienteModal = ({ isOpen, onClose, viagemId, onSuccess }) => {
  const [pacientes, setPacientes] = useState([]);
  const [pacientesSelecionados, setPacientesSelecionados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [tipoPesquisa, setTipoPesquisa] = useState('nome');
  const [viagem, setViagem] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  // Carrega os dados da viagem e dos pacientes quando o modal é aberto
  useEffect(() => {
    if (isOpen && viagemId) {
      carregarViagem();
    } else {
      setPacientes([]);
      setPacientesSelecionados([]);
      setPesquisa('');
      setObservacoes('');
      setError(null);
    }
  }, [isOpen, viagemId]);

  // Carrega os dados da viagem selecionada
  const carregarViagem = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await viagemService.obterViagemPorId(viagemId);
      setViagem(response.data);
      
      // Filtra os pacientes que já fizeram checkin mas não fizeram checkout
      const pacientesParaCheckout = response.data.pacientes.filter(
        p => p.data_checkin && !p.data_checkout
      );
      
      setPacientes(pacientesParaCheckout);
    } catch (err) {
      console.error('Erro ao carregar viagem:', err);
      setError('Não foi possível carregar os dados da viagem. Por favor, tente novamente.');
      toast({
        title: 'Erro ao carregar viagem',
        description: err.response?.data?.message || 'Ocorreu um erro inesperado',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Formata o CPF para exibição (000.000.000-00)
  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formata a data para dd/mm/yyyy
  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Filtra os pacientes de acordo com a pesquisa
  const pacientesFiltrados = pacientes.filter(paciente => {
    if (!pesquisa.trim()) return true;
    
    const termoPesquisa = pesquisa.toLowerCase().trim();
    
    switch (tipoPesquisa) {
      case 'nome':
        return paciente.nome?.toLowerCase().includes(termoPesquisa);
      case 'cpf':
        return paciente.cpf?.includes(termoPesquisa.replace(/\D/g, ''));
      case 'telefone':
        return paciente.telefone?.includes(termoPesquisa.replace(/\D/g, ''));
      default:
        return true;
    }
  });

  // Alterna a seleção de um paciente
  const toggleSelecaoPaciente = (pacienteId) => {
    setPacientesSelecionados(prevSelecionados => {
      if (prevSelecionados.includes(pacienteId)) {
        return prevSelecionados.filter(id => id !== pacienteId);
      } else {
        return [...prevSelecionados, pacienteId];
      }
    });
  };

  // Seleciona todos os pacientes filtrados
  const selecionarTodos = () => {
    if (pacientesFiltrados.length === pacientesSelecionados.length) {
      // Se todos já estão selecionados, desmarcar todos
      setPacientesSelecionados([]);
    } else {
      // Selecionar todos os pacientes filtrados
      setPacientesSelecionados(pacientesFiltrados.map(p => p._id));
    }
  };

  // Realiza o checkout dos pacientes selecionados
  const realizarCheckout = async () => {
    if (pacientesSelecionados.length === 0) {
      toast({
        title: 'Selecione ao menos um paciente',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await viagemService.realizarCheckoutPacientes(
        viagemId, 
        { 
          pacientes: pacientesSelecionados,
          observacoes: observacoes.trim() || undefined
        }
      );
      
      toast({
        title: 'Checkout realizado com sucesso',
        description: `${pacientesSelecionados.length} paciente(s) finalizado(s)`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao realizar checkout:', err);
      toast({
        title: 'Erro ao realizar checkout',
        description: err.response?.data?.message || 'Ocorreu um erro inesperado',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Checkout de Pacientes
          {viagem && (
            <Text fontSize="sm" fontWeight="normal" mt={1} color="gray.600">
              Viagem para {viagem.destino} - {formatarData(viagem.data_ida)}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="xl" color="teal.500" />
            </Flex>
          ) : error ? (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <>
              {/* Barra de pesquisa */}
              <HStack mb={4}>
                <FormControl>
                  <Input
                    placeholder="Pesquisar paciente"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                  />
                </FormControl>
                <FormControl width="150px">
                  <Select 
                    value={tipoPesquisa} 
                    onChange={(e) => setTipoPesquisa(e.target.value)}
                  >
                    <option value="nome">Nome</option>
                    <option value="cpf">CPF</option>
                    <option value="telefone">Telefone</option>
                  </Select>
                </FormControl>
              </HStack>
              
              {pacientesFiltrados.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  Nenhum paciente disponível para checkout
                </Alert>
              ) : (
                <>
                  <Flex justify="space-between" mb={2}>
                    <Text fontWeight="medium">
                      {pacientesFiltrados.length} paciente(s) encontrado(s)
                    </Text>
                    <Button 
                      size="sm" 
                      onClick={selecionarTodos}
                      variant="outline"
                      colorScheme="teal"
                    >
                      {pacientesFiltrados.length === pacientesSelecionados.length 
                        ? 'Desmarcar todos' 
                        : 'Selecionar todos'}
                    </Button>
                  </Flex>
                  
                  <Divider mb={4} />
                  
                  <VStack align="stretch" spacing={3}>
                    <CheckboxGroup>
                      {pacientesFiltrados.map(paciente => (
                        <Flex
                          key={paciente._id}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={pacientesSelecionados.includes(paciente._id) ? "red.500" : "gray.200"}
                          bg={pacientesSelecionados.includes(paciente._id) ? "red.50" : "white"}
                          _hover={{ bg: "gray.50" }}
                          cursor="pointer"
                          onClick={() => toggleSelecaoPaciente(paciente._id)}
                        >
                          <Checkbox 
                            isChecked={pacientesSelecionados.includes(paciente._id)}
                            colorScheme="red"
                            mr={3}
                            pointerEvents="none"
                          />
                          <Box flex="1">
                            <Text fontWeight="semibold">{paciente.nome}</Text>
                            <Text fontSize="sm" color="gray.600">
                              CPF: {formatarCPF(paciente.cpf)} | Tel: {paciente.telefone || 'Não informado'}
                            </Text>
                            <Text fontSize="xs" color="teal.600">
                              Check-in: {formatarData(paciente.data_checkin)}
                            </Text>
                          </Box>
                          <Badge colorScheme="green" variant="solid" p={1} borderRadius="md">
                            Em atendimento
                          </Badge>
                        </Flex>
                      ))}
                    </CheckboxGroup>
                  </VStack>
                  
                  {pacientesSelecionados.length > 0 && (
                    <Box mt={4}>
                      <FormControl>
                        <FormLabel>Observações do Checkout</FormLabel>
                        <Textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Registre aqui quaisquer observações sobre o atendimento ou retorno dos pacientes..."
                          rows={3}
                        />
                      </FormControl>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="red" 
            leftIcon={<FaSignOutAlt />}
            isLoading={isSubmitting}
            isDisabled={pacientesSelecionados.length === 0 || isLoading}
            onClick={realizarCheckout}
          >
            Confirmar Checkout
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CheckoutPacienteModal; 