import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Flex,
  Grid,
  GridItem,
  Image,
  IconButton
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiDollarSign, FiFileText, FiMapPin, FiTool, FiTruck, FiUser } from 'react-icons/fi';
import { formatarData, formatarMoeda } from '../../utils/formatters';

const DetalhesManutencaoModal = ({ isOpen, onClose, manutencao }) => {
  if (!manutencao) return null;

  const getBadgeColorByTipo = (tipo) => {
    switch (tipo) {
      case 'preventiva':
        return 'blue';
      case 'corretiva':
        return 'red';
      case 'revisao':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getDescricaoSubtipo = (subtipo) => {
    const descricoes = {
      troca_oleo: 'Troca de Óleo',
      freios: 'Sistema de Freios',
      suspensao: 'Suspensão',
      eletrica: 'Sistema Elétrico',
      motor: 'Motor',
      hidraulica: 'Direção Hidráulica',
      pneus: 'Pneus',
      alinhamento: 'Alinhamento e Balanceamento',
      ar_condicionado: 'Ar Condicionado',
      bateria: 'Bateria',
      filtros: 'Filtros',
      outros: 'Outros'
    };
    
    return descricoes[subtipo] || subtipo;
  };

  const StatusProximoServico = () => {
    const hoje = new Date();
    
    if (manutencao.proximo_servico_data) {
      const dataProximo = new Date(manutencao.proximo_servico_data);
      const diasRestantes = Math.floor((dataProximo - hoje) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) {
        return (
          <Badge colorScheme="red" fontSize="sm">
            Vencido há {Math.abs(diasRestantes)} dias
          </Badge>
        );
      } else if (diasRestantes < 15) {
        return (
          <Badge colorScheme="orange" fontSize="sm">
            Próximo de vencer ({diasRestantes} dias)
          </Badge>
        );
      } else {
        return (
          <Badge colorScheme="green" fontSize="sm">
            Em dia (faltam {diasRestantes} dias)
          </Badge>
        );
      }
    }
    
    return null;
  };

  const kmFormattedValue = manutencao.km_registrado ? 
    `${manutencao.km_registrado.toLocaleString('pt-BR')} km` : 
    'Não informado';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex alignItems="center" justifyContent="space-between">
            <Text>Detalhes da Manutenção</Text>
            <Badge colorScheme={getBadgeColorByTipo(manutencao.tipo_manutencao)} fontSize="md" px={2} py={1}>
              {manutencao.tipo_manutencao.charAt(0).toUpperCase() + manutencao.tipo_manutencao.slice(1)}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiCalendar />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Data da Manutenção</Text>
                    <Text fontWeight="medium">{formatarData(manutencao.data)}</Text>
                  </Box>
                </Flex>
              </GridItem>

              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiTool />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Serviço Realizado</Text>
                    <Text fontWeight="medium">{getDescricaoSubtipo(manutencao.subtipo_manutencao)}</Text>
                  </Box>
                </Flex>
              </GridItem>

              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiMapPin />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Local da Manutenção</Text>
                    <Text fontWeight="medium">{manutencao.local_realizacao || 'Não informado'}</Text>
                  </Box>
                </Flex>
              </GridItem>

              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiTruck />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Quilometragem</Text>
                    <Text fontWeight="medium">{kmFormattedValue}</Text>
                  </Box>
                </Flex>
              </GridItem>

              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiDollarSign />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Custo</Text>
                    <Text fontWeight="medium">{formatarMoeda(manutencao.custo)}</Text>
                  </Box>
                </Flex>
              </GridItem>

              <GridItem>
                <Flex alignItems="center">
                  <Box color="blue.500" mr={2}>
                    <FiUser />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Responsável</Text>
                    <Text fontWeight="medium">{manutencao.responsavel || 'Não informado'}</Text>
                  </Box>
                </Flex>
              </GridItem>
            </Grid>

            <Divider />

            {(manutencao.proximo_servico_data || manutencao.proximo_servico_km) && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Próximo Serviço</Text>
                <HStack spacing={4}>
                  {manutencao.proximo_servico_data && (
                    <Flex alignItems="center" bg="gray.50" p={2} borderRadius="md" flex={1}>
                      <Box color="orange.500" mr={2}>
                        <FiCalendar />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Data</Text>
                        <Flex alignItems="center">
                          <Text fontWeight="medium" mr={2}>{formatarData(manutencao.proximo_servico_data)}</Text>
                          <StatusProximoServico />
                        </Flex>
                      </Box>
                    </Flex>
                  )}
                  
                  {manutencao.proximo_servico_km && (
                    <Flex alignItems="center" bg="gray.50" p={2} borderRadius="md" flex={1}>
                      <Box color="orange.500" mr={2}>
                        <FiTruck />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Quilometragem</Text>
                        <Text fontWeight="medium">{manutencao.proximo_servico_km.toLocaleString('pt-BR')} km</Text>
                      </Box>
                    </Flex>
                  )}
                </HStack>
              </Box>
            )}

            <Box>
              <Text fontWeight="semibold" mb={2}>Descrição</Text>
              <Box bg="gray.50" p={3} borderRadius="md">
                <Text whiteSpace="pre-wrap">{manutencao.descricao || 'Nenhuma descrição fornecida.'}</Text>
              </Box>
            </Box>

            {manutencao.observacoes && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Observações</Text>
                <Box bg="gray.50" p={3} borderRadius="md">
                  <Text whiteSpace="pre-wrap">{manutencao.observacoes}</Text>
                </Box>
              </Box>
            )}

            {manutencao.imagens && manutencao.imagens.length > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Imagens</Text>
                <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                  {manutencao.imagens.map((imagem, index) => (
                    <Box key={index} borderRadius="md" overflow="hidden">
                      <Image 
                        src={imagem.url} 
                        alt={`Imagem ${index + 1}`} 
                        fallbackSrc="https://via.placeholder.com/150?text=Sem+Imagem"
                        objectFit="cover"
                        height="120px"
                        width="100%"
                        cursor="pointer"
                        onClick={() => window.open(imagem.url, '_blank')}
                      />
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}

            {manutencao.documentos && manutencao.documentos.length > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Documentos</Text>
                <VStack spacing={2} align="stretch">
                  {manutencao.documentos.map((documento, index) => (
                    <Flex 
                      key={index}
                      alignItems="center" 
                      justifyContent="space-between"
                      bg="gray.50"
                      p={2}
                      borderRadius="md"
                    >
                      <Flex alignItems="center">
                        <Box color="blue.500" mr={2}>
                          <FiFileText />
                        </Box>
                        <Text>{documento.nome}</Text>
                      </Flex>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        variant="ghost"
                        onClick={() => window.open(documento.url, '_blank')}
                      >
                        Visualizar
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DetalhesManutencaoModal; 