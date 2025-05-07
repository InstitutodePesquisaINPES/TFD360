import React, { useState } from 'react';
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
  Avatar,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Divider,
  VStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  FormControl,
  FormLabel,
  Textarea,
  Switch,
  Link
} from '@chakra-ui/react';
import {
  FiUser,
  FiClock,
  FiCalendar,
  FiMoreVertical,
  FiCheckSquare,
  FiUserPlus,
  FiAlertTriangle,
  FiAlertCircle,
  FiTrash2,
  FiPhone,
  FiFileText,
  FiCheck,
  FiX,
  FiMapPin,
  FiClipboard,
  FiEdit,
  FiCornerDownRight
} from 'react-icons/fi';
import { formatarCPF, formatarTelefone, formatarData, formatarCartaoSUS, calcularIdade } from '../../utils/formatadores';

const CardPacienteViagem = ({ 
  paciente,
  statusViagem,
  onCheckIn,
  onCheckOut,
  onAlterarStatus,
  onRemover,
  podeEditar = true
}) => {
  const { isOpen: isOpenRemover, onOpen: onOpenRemover, onClose: onCloseRemover } = useDisclosure();
  const { isOpen: isOpenStatus, onOpen: onOpenStatus, onClose: onCloseStatus } = useDisclosure();
  const { isOpen: isOpenInfo, onOpen: onOpenInfo, onClose: onCloseInfo } = useDisclosure();
  const [observacao, setObservacao] = useState('');
  const [novoStatus, setNovoStatus] = useState('');
  const toast = useToast();
  const [loadingAcao, setLoadingAcao] = useState(false);
  
  // Verificações de permissão baseadas no status da viagem
  const podeCheckin = podeEditar && 
                     ['confirmada', 'em_andamento'].includes(statusViagem) && 
                     ['confirmado'].includes(paciente.status) && 
                     !paciente.horario_checkin;
  
  const podeCheckout = podeEditar && 
                      statusViagem === 'em_andamento' && 
                      paciente.horario_checkin && 
                      !paciente.horario_checkout;
  
  const podeRemover = podeEditar && 
                     ['agendada', 'confirmada'].includes(statusViagem) && 
                     !paciente.horario_checkin;
  
  const podeAlterarStatus = podeEditar && 
                           ['agendada', 'confirmada'].includes(statusViagem) && 
                           !paciente.horario_checkin;
  
  // Gerar cor do card com base no status
  const getStatusColor = () => {
    switch (paciente.status) {
      case 'confirmado':
        return 'green.50';
      case 'pendente':
        return 'yellow.50';
      case 'ausente':
        return 'red.50';
      case 'cancelado':
        return 'gray.100';
      default:
        return 'white';
    }
  };
  
  // Gerar badge com cor respectiva ao status
  const getStatusBadge = () => {
    let colorScheme, text, icon;
    
    switch (paciente.status) {
      case 'confirmado':
        colorScheme = 'green';
        text = 'Confirmado';
        icon = FiCheck;
        break;
      case 'pendente':
        colorScheme = 'yellow';
        text = 'Pendente';
        icon = FiClock;
        break;
      case 'ausente':
        colorScheme = 'red';
        text = 'Ausente';
        icon = FiX;
        break;
      case 'cancelado':
        colorScheme = 'gray';
        text = 'Cancelado';
        icon = FiX;
        break;
      default:
        colorScheme = 'gray';
        text = paciente.status;
        icon = FiClock;
    }
    
    return (
      <Tag size="sm" colorScheme={colorScheme}>
        <TagLeftIcon as={icon} />
        <TagLabel>{text}</TagLabel>
      </Tag>
    );
  };
  
  const realizarCheckIn = async () => {
    if (!onCheckIn) return;
    
    try {
      setLoadingAcao(true);
      await onCheckIn();
      toast({
        title: 'Check-in realizado',
        description: 'Check-in do paciente realizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Erro ao realizar check-in',
        description: error.message || 'Não foi possível realizar o check-in do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingAcao(false);
    }
  };
  
  const realizarCheckOut = async () => {
    if (!onCheckOut) return;
    
    try {
      setLoadingAcao(true);
      await onCheckOut();
      toast({
        title: 'Check-out realizado',
        description: 'Check-out do paciente realizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Erro ao realizar check-out',
        description: error.message || 'Não foi possível realizar o check-out do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingAcao(false);
    }
  };
  
  const executarRemocao = async () => {
    if (!onRemover) return;
    
    try {
      setLoadingAcao(true);
      await onRemover();
      onCloseRemover();
      toast({
        title: 'Paciente removido',
        description: 'Paciente removido da viagem com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover paciente',
        description: error.message || 'Não foi possível remover o paciente da viagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingAcao(false);
    }
  };
  
  const alterarStatus = async () => {
    if (!onAlterarStatus || !novoStatus) return;
    
    try {
      setLoadingAcao(true);
      
      // Se o status for 'cancelado' ou 'ausente', a observação é obrigatória
      if (['cancelado', 'ausente'].includes(novoStatus) && !observacao.trim()) {
        toast({
          title: 'Observação obrigatória',
          description: `É necessário informar o motivo para ${novoStatus === 'cancelado' ? 'cancelamento' : 'ausência'} do paciente`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      await onAlterarStatus(novoStatus, observacao);
      onCloseStatus();
      
      toast({
        title: 'Status atualizado',
        description: `Status do paciente alterado para ${novoStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Erro ao alterar status',
        description: error.message || 'Não foi possível alterar o status do paciente',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingAcao(false);
    }
  };
  
  const abrirModalStatus = (status) => {
    setNovoStatus(status);
    setObservacao('');
    onOpenStatus();
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
            <Avatar size="sm" name={paciente.nome} mr={2} bg="blue.500" />
            <Box>
              <Text fontWeight="bold" fontSize="md" isTruncated maxW="200px">{paciente.nome}</Text>
              <Text fontSize="xs" color="gray.600">
                {formatarCPF(paciente.cpf)}
              </Text>
            </Box>
          </Flex>
          <Flex align="center">
            {getStatusBadge()}
            
            {podeEditar && (
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
                  <MenuItem 
                    icon={<Icon as={FiInfo} color="blue.500" />} 
                    onClick={onOpenInfo}
                  >
                    Ver detalhes
                  </MenuItem>
                  
                  {podeCheckin && (
                    <MenuItem 
                      icon={<Icon as={FiCheckSquare} color="green.500" />} 
                      onClick={realizarCheckIn}
                    >
                      Realizar check-in
                    </MenuItem>
                  )}
                  
                  {podeCheckout && (
                    <MenuItem 
                      icon={<Icon as={FiCheckSquare} color="blue.500" />} 
                      onClick={realizarCheckOut}
                    >
                      Realizar check-out
                    </MenuItem>
                  )}
                  
                  {podeAlterarStatus && (
                    <>
                      <MenuItem 
                        icon={<Icon as={FiEdit} color="orange.500" />} 
                        onClick={() => abrirModalStatus('confirmado')}
                      >
                        Confirmar paciente
                      </MenuItem>
                      <MenuItem 
                        icon={<Icon as={FiEdit} color="red.500" />} 
                        onClick={() => abrirModalStatus('cancelado')}
                      >
                        Cancelar paciente
                      </MenuItem>
                    </>
                  )}
                  
                  {podeRemover && (
                    <MenuItem 
                      icon={<Icon as={FiTrash2} color="red.500" />} 
                      onClick={onOpenRemover}
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
              <Icon as={FiUserPlus} color={paciente.acompanhante ? "blue.500" : "gray.400"} boxSize="14px" mr={1} />
              {paciente.acompanhante ? "Com acompanhante" : "Sem acompanhante"}
            </Text>
          </Flex>
          
          {/* Check-in info */}
          {paciente.horario_checkin && (
            <Flex align="center" my={1}>
              <Icon as={FiClock} color="green.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="green.700">
                Check-in: {formatarData(paciente.horario_checkin, true)}
              </Text>
            </Flex>
          )}
          
          {/* Check-out info */}
          {paciente.horario_checkout && (
            <Flex align="center" my={1}>
              <Icon as={FiClock} color="blue.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="blue.700">
                Check-out: {formatarData(paciente.horario_checkout, true)}
              </Text>
            </Flex>
          )}
          
          {/* Telefone info */}
          {paciente.telefone && (
            <Flex align="center" my={1}>
              <Icon as={FiPhone} color="purple.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="purple.700">
                {formatarTelefone(paciente.telefone)}
              </Text>
            </Flex>
          )}
          
          {/* Necessidades especiais */}
          {paciente.necessidades_especiais && (
            <Flex align="center" my={1}>
              <Icon as={FiAlertCircle} color="red.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="red.700" isTruncated>
                <Tooltip label={paciente.descricao_necessidades || "Paciente com necessidades especiais"}>
                  Necessidades especiais
                </Tooltip>
              </Text>
            </Flex>
          )}
          
          {/* Código de passagem */}
          {paciente.codigo_passagem && (
            <Flex align="center" my={1}>
              <Icon as={FiClipboard} color="purple.500" boxSize="14px" mr={1} />
              <Text fontSize="xs" color="purple.700" isTruncated>
                <Tooltip label={`Código de passagem: ${paciente.codigo_passagem}`}>
                  Passagem: {paciente.codigo_passagem}
                </Tooltip>
              </Text>
            </Flex>
          )}
          
          {/* Observações */}
          {paciente.observacao && (
            <Tooltip label={paciente.observacao}>
              <Text 
                fontSize="xs" 
                color="gray.600" 
                mt={1} 
                noOfLines={2}
                fontStyle="italic"
              >
                <Icon as={FiCornerDownRight} color="gray.400" boxSize="12px" mr={1} />
                {paciente.observacao}
              </Text>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Modal de confirmação de remoção */}
      <Modal isOpen={isOpenRemover} onClose={onCloseRemover} isCentered size="sm">
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
              Esta ação não pode ser desfeita.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onCloseRemover}>
              Cancelar
            </Button>
            <Button 
              colorScheme="red" 
              onClick={executarRemocao}
              isLoading={loadingAcao}
            >
              Remover
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de alteração de status */}
      <Modal isOpen={isOpenStatus} onClose={onCloseStatus} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {novoStatus === 'confirmado' ? 'Confirmar Paciente' : 
             novoStatus === 'cancelado' ? 'Cancelar Paciente' : 
             'Alterar Status'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={2}>
                  Paciente: <strong>{paciente.nome}</strong>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Status atual: <Badge colorScheme={paciente.status === 'confirmado' ? 'green' : 'gray'}>{paciente.status}</Badge>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Novo status: <Badge colorScheme={novoStatus === 'confirmado' ? 'green' : 'red'}>{novoStatus}</Badge>
                </Text>
              </Box>
              
              <FormControl>
                <FormLabel>Observação {(['cancelado', 'ausente'].includes(novoStatus)) && <Text as="span" color="red.500">*</Text>}</FormLabel>
                <Textarea 
                  placeholder={novoStatus === 'cancelado' 
                    ? 'Informe o motivo do cancelamento' 
                    : novoStatus === 'ausente'
                    ? 'Informe o motivo da ausência'
                    : 'Observações (opcional)'}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onCloseStatus}>
              Cancelar
            </Button>
            <Button 
              colorScheme={novoStatus === 'confirmado' ? 'green' : 'red'} 
              onClick={alterarStatus}
              isLoading={loadingAcao}
            >
              {novoStatus === 'confirmado' ? 'Confirmar' : 'Cancelar Paciente'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de detalhes do paciente */}
      <Modal isOpen={isOpenInfo} onClose={onCloseInfo} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Paciente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center">
                <Avatar size="lg" name={paciente.nome} mr={4} bg="blue.500" />
                <Box>
                  <Text fontSize="xl" fontWeight="bold">{paciente.nome}</Text>
                  <Text color="gray.600">
                    {paciente.data_nascimento && `${calcularIdade(paciente.data_nascimento)} anos`}
                  </Text>
                </Box>
              </Flex>
              
              <Divider />
              
              <HStack>
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">CPF</Text>
                  <Text>{formatarCPF(paciente.cpf)}</Text>
                </Box>
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">Cartão SUS</Text>
                  <Text>{paciente.cartao_sus ? formatarCartaoSUS(paciente.cartao_sus) : '-'}</Text>
                </Box>
              </HStack>
              
              <HStack>
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">Telefone</Text>
                  <Text>{paciente.telefone ? formatarTelefone(paciente.telefone) : '-'}</Text>
                </Box>
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">Acompanhante</Text>
                  <Text>{paciente.acompanhante ? 'Sim' : 'Não'}</Text>
                </Box>
              </HStack>
              
              {paciente.necessidades_especiais && (
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">Necessidades Especiais</Text>
                  <Text>{paciente.descricao_necessidades || 'Sim'}</Text>
                </Box>
              )}
              
              <Divider />
              
              <Box>
                <Text fontWeight="medium" fontSize="sm" color="gray.600">Status na Viagem</Text>
                <HStack mt={1}>
                  {getStatusBadge()}
                  {paciente.observacao && (
                    <Text fontSize="sm" ml={2} color="gray.600" fontStyle="italic">
                      {paciente.observacao}
                    </Text>
                  )}
                </HStack>
              </Box>
              
              {(paciente.horario_checkin || paciente.horario_checkout) && (
                <>
                  <Divider />
                  <VStack align="stretch">
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Controle de Presença</Text>
                    
                    {paciente.horario_checkin && (
                      <HStack>
                        <Icon as={FiCheckSquare} color="green.500" />
                        <Text>Check-in: {formatarData(paciente.horario_checkin, true)}</Text>
                      </HStack>
                    )}
                    
                    {paciente.horario_checkout && (
                      <HStack>
                        <Icon as={FiCheckSquare} color="blue.500" />
                        <Text>Check-out: {formatarData(paciente.horario_checkout, true)}</Text>
                      </HStack>
                    )}
                  </VStack>
                </>
              )}
              
              {paciente.codigo_passagem && (
                <>
                  <Divider />
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Código da Passagem</Text>
                    <Text fontSize="md" fontFamily="monospace">{paciente.codigo_passagem}</Text>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onCloseInfo}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CardPacienteViagem; 