import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCalendar, FiRefreshCw, FiEye } from 'react-icons/fi';

/**
 * Componente para exibir alertas de documentação de veículos
 * @param {Array} documentosVencendo - Lista de documentos vencendo ou vencidos
 * @param {Boolean} loading - Indica se está carregando os dados
 * @param {Function} onVerVeiculo - Callback para visualizar um veículo
 * @param {Function} onRefresh - Callback para atualizar a lista de documentos
 */
const AlertasDocumentos = ({ documentosVencendo = [], loading = false, onVerVeiculo, onRefresh }) => {
  // Cores e estilos
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Formatação de data
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  // Calcular se está vencido e há quantos dias
  const calcularSituacao = (dataString) => {
    if (!dataString) return { vencido: false, dias: 0 };
    
    const data = new Date(dataString);
    const hoje = new Date();
    
    // Limpar horas para comparação somente de datas
    data.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    
    // Calcular diferença em dias
    const diffTempo = data.getTime() - hoje.getTime();
    const diffDias = Math.round(diffTempo / (1000 * 3600 * 24));
    
    return { 
      vencido: diffDias < 0,
      dias: Math.abs(diffDias)
    };
  };
  
  // Obter texto de status baseado na situação
  const getStatusText = (situacao) => {
    if (situacao.vencido) {
      return `Vencido há ${situacao.dias} dia(s)`;
    } else {
      return `Vence em ${situacao.dias} dia(s)`;
    }
  };
  
  // Obter cor do badge baseado na situação
  const getStatusColor = (situacao) => {
    if (situacao.vencido) {
      return 'red';
    } else if (situacao.dias <= 7) {
      return 'orange';
    } else if (situacao.dias <= 15) {
      return 'yellow';
    } else {
      return 'blue';
    }
  };
  
  // Obter descrição do tipo de documento
  const getTipoDocumentoText = (tipo) => {
    switch (tipo) {
      case 'licenciamento':
        return 'Licenciamento';
      case 'ipva':
        return 'IPVA';
      case 'seguro':
        return 'Seguro';
      default:
        return tipo;
    }
  };
  
  // Ordenar documentos por urgência (vencidos primeiro, depois por data de vencimento)
  const documentosOrdenados = [...documentosVencendo].sort((a, b) => {
    const sitA = calcularSituacao(a.data_vencimento);
    const sitB = calcularSituacao(b.data_vencimento);
    
    // Primeiro critério: vencidos vêm antes dos não vencidos
    if (sitA.vencido && !sitB.vencido) return -1;
    if (!sitA.vencido && sitB.vencido) return 1;
    
    // Segundo critério: ordenar por número de dias (menor para maior)
    return sitA.dias - sitB.dias;
  });

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center">
          <Icon as={FiAlertTriangle} color="orange.500" boxSize={6} mr={2} />
          <Heading size="md">Alertas de Documentação</Heading>
        </Flex>
        
        <Button
          leftIcon={<Icon as={FiRefreshCw} />}
          size="sm"
          onClick={onRefresh}
          isLoading={loading}
        >
          Atualizar
        </Button>
      </Flex>
      
      {loading ? (
        <Flex justify="center" my={10}>
          <Spinner size="xl" />
        </Flex>
      ) : documentosOrdenados.length === 0 ? (
        <Box 
          textAlign="center" 
          p={10} 
          borderWidth={1} 
          borderRadius="md"
          bgColor="green.50"
          borderColor="green.200"
        >
          <Icon as={FiCalendar} boxSize={10} color="green.500" />
          <Text mt={4} fontSize="lg" color="green.700">
            Nenhum documento prestes a vencer!
          </Text>
          <Text fontSize="sm" color="green.600" mt={2}>
            Todos os documentos da frota estão em dia.
          </Text>
        </Box>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Veículo</Th>
              <Th>Documento</Th>
              <Th>Vencimento</Th>
              <Th>Situação</Th>
              <Th width="50px">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {documentosOrdenados.map((doc, index) => {
              const situacao = calcularSituacao(doc.data_vencimento);
              const statusText = getStatusText(situacao);
              const statusColor = getStatusColor(situacao);
              
              return (
                <Tr key={`${doc._id || index}-${doc.tipo_documento}`}>
                  <Td>
                    <Text fontWeight="medium">{doc.marca} {doc.modelo}</Text>
                    <Text fontSize="xs" color="gray.500">{doc.placa}</Text>
                  </Td>
                  <Td>{getTipoDocumentoText(doc.tipo_documento)}</Td>
                  <Td>{formatarData(doc.data_vencimento)}</Td>
                  <Td>
                    <Badge colorScheme={statusColor}>
                      {statusText}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="xs"
                      colorScheme="blue"
                      leftIcon={<Icon as={FiEye} />}
                      onClick={() => onVerVeiculo(doc._id)}
                    >
                      Ver
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default AlertasDocumentos; 