import React, { useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTruck, FiAlertTriangle, FiCheckCircle, FiTool, FiClock } from 'react-icons/fi';

/**
 * Componente para exibir estatísticas e status da frota
 * @param {Array} veiculos - Lista de veículos da frota
 */
const StatusFrota = ({ veiculos = [] }) => {
  // Calcular estatísticas da frota
  const estatisticas = useMemo(() => {
    const hoje = new Date();
    
    // Total de veículos
    const total = veiculos.length;
    
    // Veículos por status
    const disponiveis = veiculos.filter(v => v.status_operacional === 'disponivel' && v.ativo).length;
    const emViagem = veiculos.filter(v => v.status_operacional === 'em_viagem').length;
    const emManutencao = veiculos.filter(v => v.status_operacional === 'em_manutencao').length;
    const inativos = veiculos.filter(v => v.status_operacional === 'inativo' || !v.ativo).length;
    
    // Documentação
    const comDocumentosVencidos = veiculos.filter(v => {
      // Verificar licenciamento
      if (v.data_licenciamento && new Date(v.data_licenciamento) < hoje) {
        return true;
      }
      
      // Verificar outros documentos
      if (v.documentos && v.documentos.some(doc => 
        doc.data_vencimento && new Date(doc.data_vencimento) < hoje
      )) {
        return true;
      }
      
      return false;
    }).length;
    
    // Manutenção
    const precisamManutencao = veiculos.filter(v => {
      if (!v.quilometragem_atual || !v.proxima_manutencao_km) {
        return false;
      }
      
      return v.quilometragem_atual >= v.proxima_manutencao_km;
    }).length;
    
    // Percentual de disponibilidade
    const percentualDisponibilidade = total > 0 
      ? Math.round((disponiveis / total) * 100) 
      : 0;
    
    return {
      total,
      disponiveis,
      emViagem,
      emManutencao,
      inativos,
      comDocumentosVencidos,
      precisamManutencao,
      percentualDisponibilidade
    };
  }, [veiculos]);
  
  // Cores para os status
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Determinar cor do indicador de disponibilidade
  const getDisponibilidadeColor = (percentual) => {
    if (percentual >= 70) return 'green.500';
    if (percentual >= 40) return 'yellow.500';
    return 'red.500';
  };
  
  const disponibilidadeColor = getDisponibilidadeColor(estatisticas.percentualDisponibilidade);

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      boxShadow="sm"
    >
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
        {/* Total e disponibilidade */}
        <Flex direction="column" align="center" justify="center">
          <Box position="relative" width="120px" height="120px">
            {/* Círculo de fundo */}
            <Box
              position="absolute"
              width="100%"
              height="100%"
              borderRadius="50%"
              border="8px solid"
              borderColor="gray.200"
            />
            
            {/* Círculo de progresso */}
            <Box
              position="absolute"
              width="100%"
              height="100%"
              borderRadius="50%"
              border="8px solid"
              borderColor={disponibilidadeColor}
              borderLeftColor={estatisticas.percentualDisponibilidade < 50 ? 'transparent' : disponibilidadeColor}
              borderRightColor={estatisticas.percentualDisponibilidade < 75 ? 'transparent' : disponibilidadeColor}
              borderBottomColor={estatisticas.percentualDisponibilidade < 75 ? 'transparent' : disponibilidadeColor}
              transform="rotate(-45deg)"
            />
            
            {/* Texto central */}
            <Flex
              position="absolute"
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
              direction="column"
            >
              <Text fontSize="xl" fontWeight="bold">{estatisticas.percentualDisponibilidade}%</Text>
              <Text fontSize="xs">Disponível</Text>
            </Flex>
          </Box>
          
          <Text mt={2} fontWeight="medium">
            Total: {estatisticas.total} veículos
          </Text>
        </Flex>
        
        {/* Status operacional */}
        <Stat>
          <StatLabel>Status da Frota</StatLabel>
          <Flex mt={2} direction="column" gap={1}>
            <HStack status="disponivel" valor={estatisticas.disponiveis} icon={FiCheckCircle} />
            <HStack status="em_viagem" valor={estatisticas.emViagem} icon={FiTruck} />
            <HStack status="em_manutencao" valor={estatisticas.emManutencao} icon={FiTool} />
            <HStack status="inativo" valor={estatisticas.inativos} icon={FiAlertTriangle} />
          </Flex>
        </Stat>
        
        {/* Alertas de Documentação */}
        <Stat>
          <StatLabel>Documentação</StatLabel>
          <StatNumber>
            <Flex align="center" color={estatisticas.comDocumentosVencidos > 0 ? 'red.500' : 'green.500'}>
              <Icon 
                as={estatisticas.comDocumentosVencidos > 0 ? FiAlertTriangle : FiCheckCircle} 
                mr={2} 
                boxSize="24px"
              />
              {estatisticas.comDocumentosVencidos}
            </Flex>
          </StatNumber>
          <StatHelpText>
            {estatisticas.comDocumentosVencidos === 0 
              ? 'Todos os documentos em dia' 
              : `${estatisticas.comDocumentosVencidos} veículo(s) com documentos vencidos`}
          </StatHelpText>
        </Stat>
        
        {/* Alertas de Manutenção */}
        <Stat>
          <StatLabel>Manutenção</StatLabel>
          <StatNumber>
            <Flex align="center" color={estatisticas.precisamManutencao > 0 ? 'orange.500' : 'green.500'}>
              <Icon 
                as={estatisticas.precisamManutencao > 0 ? FiClock : FiCheckCircle} 
                mr={2} 
                boxSize="24px"
              />
              {estatisticas.precisamManutencao}
            </Flex>
          </StatNumber>
          <StatHelpText>
            {estatisticas.precisamManutencao === 0 
              ? 'Frota com manutenção em dia' 
              : `${estatisticas.precisamManutencao} veículo(s) precisam de manutenção`}
          </StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
};

/**
 * Componente para exibir linha do status com ícone
 */
const HStack = ({ status, valor, icon }) => {
  // Mapear status para texto e cor
  const statusMap = {
    disponivel: { texto: 'Disponíveis', cor: 'green.500' },
    em_viagem: { texto: 'Em Viagem', cor: 'blue.500' },
    em_manutencao: { texto: 'Em Manutenção', cor: 'orange.500' },
    inativo: { texto: 'Inativos', cor: 'red.500' }
  };
  
  const { texto, cor } = statusMap[status] || { texto: 'Desconhecido', cor: 'gray.500' };
  
  return (
    <Flex justify="space-between">
      <Flex align="center">
        <Icon as={icon} color={cor} mr={1} />
        <Text fontSize="sm">{texto}:</Text>
      </Flex>
      <Text fontWeight="bold">{valor}</Text>
    </Flex>
  );
};

export default StatusFrota; 