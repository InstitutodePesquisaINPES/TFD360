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
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  useToast,
  HStack,
  VStack,
  Text,
  Divider,
  Badge,
  Switch,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import { FaCheck, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { formatarCPF, formatarData } from '../../utils/formatadores';

/**
 * Modal para realizar check-in e check-out de pacientes em viagens
 * 
 * @param {Object} props Propriedades do componente
 * @param {boolean} props.isOpen Define se o modal está aberto
 * @param {Function} props.onClose Função para fechar o modal
 * @param {Object} props.paciente Dados do paciente para check-in/out
 * @param {string} props.viagemId ID da viagem
 * @param {boolean} props.isCheckin Define se é check-in (true) ou check-out (false)
 * @param {Function} props.onSuccess Função chamada após sucesso na operação
 */
const CheckinCheckoutModal = ({ 
  isOpen, 
  onClose, 
  paciente, 
  viagemId, 
  isCheckin = true, 
  onSuccess 
}) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [observacao, setObservacao] = useState('');
  const toast = useToast();

  // Resetar estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setObservacao('');
      setUseLocation(false);
      setLocation(null);
      setError(null);
    }
  }, [isOpen]);

  // Funções para geolocalização
  const handleToggleLocation = () => {
    setUseLocation(!useLocation);
    if (!useLocation && !location) {
      getLocation();
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        setError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setGettingLocation(false);
        setUseLocation(false);
      }
    );
  };

  // Função para realizar check-in/check-out
  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      const dados = {
        observacao: observacao || null
      };
      
      // Adicionar localização se estiver utilizando
      if (useLocation && location) {
        dados.localizacao = location;
      }
      
      // Fazer a requisição API para check-in ou check-out
      const endpoint = isCheckin ? 'checkin' : 'checkout';
      const response = await fetch(`/api/viagens/${viagemId}/pacientes/${paciente._id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao realizar ${isCheckin ? 'check-in' : 'check-out'}`);
      }
      
      toast({
        title: isCheckin ? 'Check-in realizado' : 'Check-out realizado',
        description: `Operação realizada com sucesso para o paciente ${paciente.paciente?.nome}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error(`Erro ao realizar ${isCheckin ? 'check-in' : 'check-out'}:`, error);
      toast({
        title: `Erro ao realizar ${isCheckin ? 'check-in' : 'check-out'}`,
        description: error.message || 'Ocorreu um erro ao processar a solicitação.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o check-in/out já foi realizado
  const checkAlreadyDone = () => {
    if (isCheckin && paciente.horario_checkin) {
      return true;
    }
    if (!isCheckin && paciente.horario_checkout) {
      return true;
    }
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isCheckin ? 'Realizar Check-in' : 'Realizar Check-out'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {/* Informações do paciente */}
          <VStack align="start" spacing={3} mb={4}>
            <Text fontWeight="bold" fontSize="lg">
              {paciente?.paciente?.nome}
            </Text>
            
            <Text fontSize="sm" color="gray.600">
              CPF: {formatarCPF(paciente?.paciente?.cpf)}
            </Text>
            
            {paciente?.acompanhante && (
              <Badge colorScheme="purple">Com acompanhante</Badge>
            )}
            
            {paciente?.paciente?.necessidades_especiais && (
              <Badge colorScheme="red">Necessidades especiais</Badge>
            )}
          </VStack>
          
          <Divider my={3} />
          
          {/* Verificar se check-in/out já foi realizado */}
          {checkAlreadyDone() ? (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Operação já realizada</AlertTitle>
                <AlertDescription>
                  {isCheckin 
                    ? `Este paciente já realizou check-in em ${formatarData(paciente.horario_checkin, true)}.` 
                    : `Este paciente já realizou check-out em ${formatarData(paciente.horario_checkout, true)}.`}
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <>
              {/* Formulário */}
              <FormControl mb={4}>
                <FormLabel>Observações</FormLabel>
                <Textarea 
                  placeholder="Observações sobre o check-in/check-out..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
                <FormHelperText>Registre qualquer informação relevante sobre o paciente</FormHelperText>
              </FormControl>
              
              {/* Opção de localização */}
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="location-switch" mb="0">
                  Registrar localização atual
                </FormLabel>
                <Switch 
                  id="location-switch" 
                  isChecked={useLocation} 
                  onChange={handleToggleLocation}
                  colorScheme="blue"
                  isDisabled={gettingLocation}
                />
              </FormControl>
              
              {/* Status da localização */}
              {useLocation && (
                <Box mb={4}>
                  {gettingLocation ? (
                    <Flex align="center">
                      <Spinner size="sm" mr={2} />
                      <Text fontSize="sm">Obtendo localização...</Text>
                    </Flex>
                  ) : location ? (
                    <Flex align="center" color="green.500">
                      <Box as={FaMapMarkerAlt} mr={2} />
                      <Text fontSize="sm">
                        Localização obtida: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </Text>
                    </Flex>
                  ) : (
                    <Flex align="center" color="red.500">
                      <Box as={FaMapMarkerAlt} mr={2} />
                      <Text fontSize="sm">Não foi possível obter a localização</Text>
                    </Flex>
                  )}
                </Box>
              )}
              
              {/* Mensagem de erro se houver */}
              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Informação sobre a operação */}
              <Alert status="info" mb={2}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Informação</AlertTitle>
                  <AlertDescription>
                    {isCheckin 
                      ? 'O check-in registra a presença do paciente no embarque.' 
                      : 'O check-out registra o desembarque do paciente no retorno.'}
                  </AlertDescription>
                </Box>
              </Alert>
            </>
          )}
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FaCheck />}
              onClick={handleConfirm}
              isLoading={loading}
              loadingText={isCheckin ? "Realizando check-in..." : "Realizando check-out..."}
              isDisabled={checkAlreadyDone() || (useLocation && !location)}
            >
              Confirmar
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CheckinCheckoutModal; 