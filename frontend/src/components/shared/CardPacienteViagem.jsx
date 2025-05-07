import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  Button,
  Icon,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Avatar,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import {
  FiUser,
  FiClock,
  FiCalendar,
  FiMoreVertical,
  FiCheckSquare,
  FiXSquare,
  FiUserPlus,
  FiAlertTriangle,
  FiInfo,
  FiTrash2,
  FiAlertCircle
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const formatarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const calcularIdade = (dataNascimento) => {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
};

const CardPacienteViagem = ({ 
  viagemPaciente, 
  viagem,
  onUpdate,
  onRemove,
  onCheckin,
  onCheckout,
  editable = true
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { getToken } = useAuth();
  
  // Dados do paciente e relacionamento
  const { 
    paciente, 
    acompanhante, 
    status, 
    observacoes, 
    horario_checkin, 
    horario_checkout,
    necessidades_especiais,
    descricao_necessidades,
    codigo_passagem,
    qrcode_base64
  } = viagemPaciente;
  
  // Status da viagem
  const podeCheckin = ['confirmada', 'em_andamento'].includes(viagem?.status) && 
                      ['confirmado', 'pendente'].includes(status) && 
                      !horario_checkin;
  
  const podeCheckout = viagem?.status === 'em_andamento' && 
                       horario_checkin && 
                       !horario_checkout;
  
  const podeRemover = editable && ['agendada', 'confirmada'].includes(viagem?.status) && !horario_checkin;
  
  // Confirmação de remoção
  const confirmarRemocao = () => {
    onOpen();
  };
  
  // Executar remoção
  const executarRemocao = async () => {
    try {
      onClose();
      if (onRemove) {
        await onRemove(paciente._id);
      }
    } catch (error) {
      console.error('Erro ao remover paciente da viagem:', error);
      toast({
        title: "Erro ao remover paciente",
        description: error.response?.data?.message || "Ocorreu um erro ao remover o paciente",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Realizar checkin
  const realizarCheckin = async () => {
    try {
      if (onCheckin) {
        await onCheckin(paciente._id);
      }
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      toast({
        title: "Erro ao realizar check-in",
        description: error.response?.data?.message || "Ocorreu um erro ao fazer check-in",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Realizar checkout
  const realizarCheckout = async () => {
    try {
      if (onCheckout) {
        await onCheckout(paciente._id);
      }
    } catch (error) {
      console.error('Erro ao realizar check-out:', error);
      toast({
        title: "Erro ao realizar check-out",
        description: error.response?.data?.message || "Ocorreu um erro ao fazer check-out",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Gerar cor do card com base no status
  const getStatusColor = () => {
    switch (status) {
      case 'confirmado':
        return 'green.50';
      case 'pendente':
        return 'yellow.50';
      case 'ausente':
        return 'red.50';
      case 'compareceu':
        return 'blue.50';
      case 'cancelado':
        return 'gray.50';
      default:
        return 'white';
    }
  };
  
  // Gerar badge com cor respectiva ao status
  const getStatusBadge = () => {
    let colorScheme, text;
    
    switch (status) {
      case 'confirmado':
        colorScheme = 'green';
        text = 'Confirmado';
        break;
      case 'pendente':
        colorScheme = 'yellow';
        text = 'Pendente';
        break;
      case 'ausente':
        colorScheme = 'red';
        text = 'Ausente';
        break;
      case 'compareceu':
        colorScheme = 'blue';
        text = 'Compareceu';
        break;
      case 'cancelado':
        colorScheme = 'gray';
        text = 'Cancelado';
        break;
      default:
        colorScheme = 'gray';
        text = status;
    }
    
    return <Badge colorScheme={colorScheme}>{text}</Badge>;
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={getStatusColor()}
        p={4}
        boxShadow="sm"
        position="relative"
        transition="all 0.2s"
        _hover={{ boxShadow: "md" }}
      >
        {/* Cabeçalho com dados do paciente */}
        <Flex justify="space-between" mb={2}>
          <Flex align="center">
            <Avatar size="sm" name={paciente.nome} mr={2} />
            <Box>
              <Text fontWeight="bold" fontSize="md" isTruncated maxW="200px">{paciente.nome}</Text>
              <Text fontSize="xs" color="gray.600">
                {formatarCPF(paciente.cpf)}
              </Text>
            </Box>
          </Flex>
          <Flex align="center">
            {getStatusBadge()}
            
            {editable && (
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  variant="ghost"
                  ml={2}
                  aria-label="Mais opções"
                >
                  <Icon as={FiMoreVertical} />
                </MenuButton>
                <MenuList>
                  {podeCheckin && (
                    <MenuItem 
                      icon={<Icon as={FiCheckSquare} color="green.500" />} 
                      onClick={realizarCheckin}
                    >
                      Realizar check-in
                    </MenuItem>
                  )}
                  {podeCheckout && (
                    <MenuItem 
                      icon={<Icon as={FiCheckSquare} color="blue.500" />} 
                      onClick={realizarCheckout}
                    >
                      Realizar check-out
                    </MenuItem>
                  )}
                  {podeRemover && (
                    <MenuItem 
                      icon={<Icon as={FiTrash2} color="red.500" />} 
                      onClick={confirmarRemocao}
                    >
                      Remover paciente
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            )}
          </Flex>
        </Flex>
        
        {/* Dados adicionais */}
        <Box mt={3}>
          <Flex justify="space-between" mb={1}>
            <HStack spacing={1}>
              <Icon as={FiUser} color="gray.500" boxSize="14px" />
              <Text fontSize="xs" color="gray.700">
                {paciente.data_nascimento && `${calcularIdade(paciente.data_nascimento)} anos`}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.700">
              <Icon as={FiUserPlus} color={acompanhante ? "blue.500" : "gray.400"} boxSize="14px" mr={1} />
              {acompanhante ? "Com acompanhante" : "Sem acompanhante"}
            </Text>
          </Flex>
          
          {/* Check-in info */}
          {horario_checkin && (
            <Flex align="center" my={1}>
              <Icon as={FiClock} color="green.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="green.700">
                Check-in: {new Date(horario_checkin).toLocaleString()}
              </Text>
            </Flex>
          )}
          
          {/* Check-out info */}
          {horario_checkout && (
            <Flex align="center" my={1}>
              <Icon as={FiClock} color="blue.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="blue.700">
                Check-out: {new Date(horario_checkout).toLocaleString()}
              </Text>
            </Flex>
          )}
          
          {/* Necessidades especiais */}
          {necessidades_especiais && (
            <Flex align="center" my={1}>
              <Icon as={FiAlertCircle} color="red.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="red.700" isTruncated>
                <Tooltip label={descricao_necessidades || "Paciente com necessidades especiais"}>
                  Necessidades especiais
                </Tooltip>
              </Text>
            </Flex>
          )}
          
          {/* Código de passagem */}
          {codigo_passagem && (
            <Flex align="center" my={1}>
              <Icon as={FiCalendar} color="purple.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="purple.700" isTruncated>
                <Tooltip label={`Código de passagem: ${codigo_passagem}`}>
                  Passagem: {codigo_passagem}
                </Tooltip>
              </Text>
            </Flex>
          )}
          
          {/* Observações */}
          {observacoes && (
            <Tooltip label={observacoes}>
              <Text 
                fontSize="xs" 
                color="gray.600" 
                mt={1} 
                noOfLines={2}
                fontStyle="italic"
              >
                {observacoes}
              </Text>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Modal de confirmação de remoção */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remover Paciente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex align="center" mb={4}>
              <Icon as={FiAlertTriangle} color="red.500" boxSize={6} mr={2} />
              <Text>
                Tem certeza que deseja remover <strong>{paciente.nome}</strong> desta viagem?
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              Se houver pacientes na lista de espera, o próximo será chamado automaticamente.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={executarRemocao}>
              Remover
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CardPacienteViagem; 