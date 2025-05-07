import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Stack,
  Badge,
  Image,
  Icon,
  HStack,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTruck, FiUsers, FiClock, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { FaCar, FaVan, FaBus, FaAmbulance, FaTruck } from 'react-icons/fa';

/**
 * Card para exibir informações resumidas de um veículo
 * @param {Object} veiculo - Dados do veículo
 * @param {Function} onClick - Função a ser chamada ao clicar no card
 */
const VeiculoCard = ({ veiculo, onClick }) => {
  // Definir cores baseadas no status operacional
  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel':
        return 'green';
      case 'em_viagem':
        return 'blue';
      case 'em_manutencao':
        return 'orange';
      case 'inativo':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Formatar texto de status
  const getStatusText = (status) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'em_viagem':
        return 'Em Viagem';
      case 'em_manutencao':
        return 'Em Manutenção';
      case 'inativo':
        return 'Inativo';
      default:
        return 'Desconhecido';
    }
  };

  // Definir ícone baseado no tipo de veículo
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'carro':
        return FaCar;
      case 'van':
        return FaVan;
      case 'micro_onibus':
      case 'onibus':
        return FaBus;
      case 'ambulancia':
        return FaAmbulance;
      default:
        return FiTruck;
    }
  };

  // Formatar texto de tipo
  const getTipoText = (tipo) => {
    switch (tipo) {
      case 'carro':
        return 'Carro';
      case 'van':
        return 'Van';
      case 'micro_onibus':
        return 'Micro-ônibus';
      case 'onibus':
        return 'Ônibus';
      case 'ambulancia':
        return 'Ambulância';
      default:
        return 'Outro';
    }
  };

  // Verificar se há documentos vencidos
  const hasDocumentosVencidos = () => {
    const hoje = new Date();
    
    // Verificar licenciamento
    if (veiculo.data_licenciamento && new Date(veiculo.data_licenciamento) < hoje) {
      return true;
    }
    
    // Verificar outros documentos (se existirem)
    if (veiculo.documentos && veiculo.documentos.some(doc => 
      doc.data_vencimento && new Date(doc.data_vencimento) < hoje
    )) {
      return true;
    }
    
    return false;
  };

  // Verificar se há manutenção necessária
  const needsManutencao = () => {
    if (!veiculo.quilometragem_atual || !veiculo.proxima_manutencao_km) {
      return false;
    }
    
    return veiculo.quilometragem_atual >= veiculo.proxima_manutencao_km;
  };

  // Cores e estilos
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const placaColor = useColorModeValue('blue.700', 'blue.300');
  const statusColor = getStatusColor(veiculo.status_operacional);
  const statusText = getStatusText(veiculo.status_operacional);
  const TipoIcon = getTipoIcon(veiculo.tipo);
  const tipoText = getTipoText(veiculo.tipo);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      onClick={onClick}
      cursor="pointer"
      position="relative"
    >
      {hasDocumentosVencidos() && (
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          colorScheme="red"
          borderRadius="full"
          px={2}
          zIndex={1}
        >
          <Icon as={FiAlertCircle} mr={1} />
          Documentação Vencida
        </Badge>
      )}

      {needsManutencao() && (
        <Badge 
          position="absolute" 
          top={hasDocumentosVencidos() ? 10 : 2} 
          right={2} 
          colorScheme="orange"
          borderRadius="full"
          px={2}
          zIndex={1}
        >
          <Icon as={FiClock} mr={1} />
          Manutenção Necessária
        </Badge>
      )}

      <Flex direction="column" h="100%">
        {/* Imagem ou Placeholder */}
        <Box 
          h="140px" 
          bg="gray.100" 
          position="relative"
          overflow="hidden"
        >
          {veiculo.foto_url ? (
            <Image
              src={veiculo.foto_url}
              alt={`${veiculo.marca} ${veiculo.modelo}`}
              objectFit="cover"
              w="100%"
              h="100%"
            />
          ) : (
            <Flex 
              align="center" 
              justify="center" 
              h="100%" 
              bg="gray.100"
            >
              <Icon as={TipoIcon} boxSize="60px" color="gray.400" />
            </Flex>
          )}
          
          <Badge 
            position="absolute" 
            bottom={2} 
            left={2} 
            bg={placaColor} 
            color="white"
            fontSize="lg"
            fontWeight="bold"
            px={3}
            py={1}
            borderRadius="md"
          >
            {veiculo.placa}
          </Badge>
        </Box>

        {/* Informações */}
        <Stack p={4} spacing={3} flex={1}>
          <Heading size="md" isTruncated>
            {veiculo.marca} {veiculo.modelo}
          </Heading>
          
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={TipoIcon} />
              <Text>{tipoText}</Text>
            </HStack>
            
            <Badge colorScheme={statusColor} px={2} py={1} borderRadius="full">
              {statusText}
            </Badge>
          </Flex>
          
          <Divider />
          
          <Stack spacing={1}>
            <Flex justify="space-between">
              <HStack>
                <Icon as={FiUsers} />
                <Text fontSize="sm">Capacidade:</Text>
              </HStack>
              <Text fontWeight="medium">{veiculo.capacidade_passageiros} passageiros</Text>
            </Flex>
            
            {veiculo.quilometragem_atual && (
              <Flex justify="space-between">
                <HStack>
                  <Icon as={FiTruck} />
                  <Text fontSize="sm">Quilometragem:</Text>
                </HStack>
                <Text fontWeight="medium">{veiculo.quilometragem_atual.toLocaleString()} km</Text>
              </Flex>
            )}
            
            {veiculo.ano_fabricacao && (
              <Flex justify="space-between">
                <HStack>
                  <Icon as={FiCalendar} />
                  <Text fontSize="sm">Ano:</Text>
                </HStack>
                <Text fontWeight="medium">{veiculo.ano_fabricacao}</Text>
              </Flex>
            )}
          </Stack>
        </Stack>
      </Flex>
    </Box>
  );
};

export default VeiculoCard; 