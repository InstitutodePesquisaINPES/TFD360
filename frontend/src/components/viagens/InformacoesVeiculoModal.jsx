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
  Box,
  Flex,
  Text,
  Badge,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  HStack,
  VStack,
  Icon,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiUser,
  FiCalendar,
  FiTruck,
  FiMapPin,
  FiNavigation,
  FiClock,
  FiSettings,
  FiAlertTriangle,
  FiInfo,
  FiPhone,
  FiUsers,
  FiFileText,
  FiTool,
  FiActivity,
  FiTarget
} from 'react-icons/fi';
import { formatarData, formatarTelefone } from '../../utils/formatters';
import api from '../../services/api';

/**
 * Modal para mostrar informações detalhadas de um veículo selecionado no mapa
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Estado do modal (aberto/fechado)
 * @param {Function} props.onClose - Função para fechar o modal
 * @param {Object} props.veiculo - Dados do veículo selecionado
 */
const InformacoesVeiculoModal = ({ isOpen, onClose, veiculo }) => {
  const [detalhesVeiculo, setDetalhesVeiculo] = useState(null);
  const [motorista, setMotorista] = useState(null);
  const [viagemAtual, setViagemAtual] = useState(null);
  const [historicoViagens, setHistoricoViagens] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  const toast = useToast();
  const bgBox = useColorModeValue('gray.50', 'gray.700');
  
  useEffect(() => {
    if (isOpen && veiculo?.id) {
      carregarDadosVeiculo();
    }
  }, [isOpen, veiculo]);
  
  const carregarDadosVeiculo = async () => {
    if (!veiculo || !veiculo.id) return;
    
    setIsLoading(true);
    setErro(null);
    
    try {
      // Carregar detalhes do veículo
      const response = await api.get(`/frota/veiculos/${veiculo.id}`);
      setDetalhesVeiculo(response.data.veiculo);
      
      // Carregar motorista atual (se houver)
      if (response.data.veiculo.motorista_atual) {
        const motoristaResponse = await api.get(`/usuarios/${response.data.veiculo.motorista_atual}`);
        setMotorista(motoristaResponse.data.usuario);
      } else {
        setMotorista(null);
      }
      
      // Carregar viagem atual (se houver)
      if (response.data.veiculo.status === 'em_viagem') {
        try {
          const viagemResponse = await api.get(`/viagens`, {
            params: { 
              veiculo_id: veiculo.id,
              status: 'em_andamento',
              limite: 1
            }
          });
          
          if (viagemResponse.data.viagens && viagemResponse.data.viagens.length > 0) {
            setViagemAtual(viagemResponse.data.viagens[0]);
          } else {
            setViagemAtual(null);
          }
        } catch (erro) {
          console.error('Erro ao carregar viagem atual:', erro);
          setViagemAtual(null);
        }
      } else {
        setViagemAtual(null);
      }
      
      // Carregar últimas viagens
      try {
        const historicoResponse = await api.get(`/viagens`, {
          params: { 
            veiculo_id: veiculo.id,
            limite: 5,
            ordenar: 'data_ida:desc' 
          }
        });
        
        setHistoricoViagens(historicoResponse.data.viagens || []);
      } catch (erro) {
        console.error('Erro ao carregar histórico de viagens:', erro);
        setHistoricoViagens([]);
      }
      
      // Carregar últimas manutenções
      try {
        const manutencoesResponse = await api.get(`/frota/veiculos/${veiculo.id}/manutencoes`, {
          params: { 
            limite: 5,
            ordenar: 'data:desc' 
          }
        });
        
        setManutencoes(manutencoesResponse.data.manutencoes || []);
      } catch (erro) {
        console.error('Erro ao carregar manutenções:', erro);
        setManutencoes([]);
      }
      
    } catch (erro) {
      console.error('Erro ao carregar dados do veículo:', erro);
      setErro('Não foi possível carregar os dados completos do veículo.');
      
      toast({
        title: 'Erro ao carregar dados',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao carregar as informações do veículo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel':
        return 'green';
      case 'em_viagem':
        return 'blue';
      case 'manutencao':
        return 'orange';
      case 'inativo':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Formatar texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'em_viagem':
        return 'Em Viagem';
      case 'manutencao':
        return 'Em Manutenção';
      case 'inativo':
        return 'Inativo';
      default:
        return 'Desconhecido';
    }
  };
  
  // Calcular tempo decorrido desde a última atualização
  const calcularTempoDecorrido = (timestamp) => {
    if (!timestamp) return 'N/D';
    
    const dataAtualizada = new Date(timestamp);
    const agora = new Date();
    const diferencaMinutos = Math.floor((agora - dataAtualizada) / 60000);
    
    if (diferencaMinutos < 1) {
      return 'Agora mesmo';
    } else if (diferencaMinutos < 60) {
      return `${diferencaMinutos} minutos atrás`;
    } else if (diferencaMinutos < 60 * 24) {
      const horas = Math.floor(diferencaMinutos / 60);
      return `${horas} ${horas === 1 ? 'hora' : 'horas'} atrás`;
    } else {
      return formatarData(timestamp);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center">
            <Icon as={FiTruck} mr={2} />
            {veiculo?.placa ? `Veículo: ${veiculo.placa}` : 'Detalhes do Veículo'}
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" direction="column" my={10}>
              <Spinner size="xl" mb={4} />
              <Text>Carregando dados do veículo...</Text>
            </Flex>
          ) : erro ? (
            <Alert status="error">
              <AlertIcon />
              {erro}
            </Alert>
          ) : (
            <Box>
              {/* Cabeçalho com informações básicas */}
              <Flex 
                p={4} 
                bg={bgBox} 
                borderRadius="md" 
                direction={{ base: 'column', md: 'row' }}
                align="center"
                mb={4}
              >
                <Box mr={{ base: 0, md: 4 }} mb={{ base: 4, md: 0 }} textAlign={{ base: 'center', md: 'left' }}>
                  <Avatar 
                    size="xl" 
                    name={detalhesVeiculo?.placa} 
                    src={detalhesVeiculo?.foto_url}
                    bg={getStatusColor(detalhesVeiculo?.status) + '.500'}
                    icon={<FiTruck size={36} />}
                  />
                </Box>
                
                <Box flex="1">
                  <Badge 
                    colorScheme={getStatusColor(detalhesVeiculo?.status)}
                    px={2}
                    py={1}
                    borderRadius="md"
                    mb={2}
                  >
                    {getStatusText(detalhesVeiculo?.status)}
                  </Badge>
                  
                  <Text fontSize="xl" fontWeight="bold">{detalhesVeiculo?.marca} {detalhesVeiculo?.modelo}</Text>
                  <Text fontSize="lg">{detalhesVeiculo?.placa}</Text>
                  
                  <HStack mt={2} spacing={4}>
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Tipo</StatLabel>
                      <StatNumber fontSize="md">{detalhesVeiculo?.tipo || 'N/D'}</StatNumber>
                    </Stat>
                    
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Ano</StatLabel>
                      <StatNumber fontSize="md">{detalhesVeiculo?.ano_fabricacao || 'N/D'}</StatNumber>
                    </Stat>
                    
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Quilometragem</StatLabel>
                      <StatNumber fontSize="md">{detalhesVeiculo?.quilometragem_atual?.toLocaleString('pt-BR') || 'N/D'} km</StatNumber>
                    </Stat>
                  </HStack>
                </Box>
              </Flex>
              
              {/* Localização atual */}
              <Box p={4} bg={bgBox} borderRadius="md" mb={4}>
                <Text fontWeight="bold" mb={2} display="flex" alignItems="center">
                  <Icon as={FiTarget} mr={2} />
                  Localização Atual
                </Text>
                
                <HStack spacing={4} wrap="wrap">
                  <Stat size="sm">
                    <StatLabel fontSize="xs">Último registro</StatLabel>
                    <StatNumber fontSize="md">{calcularTempoDecorrido(veiculo?.localizacao?.timestamp)}</StatNumber>
                  </Stat>
                  
                  <Stat size="sm">
                    <StatLabel fontSize="xs">Velocidade</StatLabel>
                    <StatNumber fontSize="md">{veiculo?.localizacao?.velocidade || 0} km/h</StatNumber>
                  </Stat>
                  
                  <Stat size="sm">
                    <StatLabel fontSize="xs">Coordenadas</StatLabel>
                    <StatNumber fontSize="md">
                      {veiculo?.localizacao?.latitude 
                        ? `${veiculo.localizacao.latitude.toFixed(5)}, ${veiculo.localizacao.longitude.toFixed(5)}`
                        : 'N/D'
                      }
                    </StatNumber>
                  </Stat>
                </HStack>
                
                {veiculo?.localizacao?.endereco && (
                  <Box mt={2}>
                    <Text fontSize="sm" color="gray.500" display="flex" alignItems="center">
                      <Icon as={FiMapPin} mr={1} />
                      {veiculo.localizacao.endereco}
                    </Text>
                  </Box>
                )}
              </Box>
              
              {/* Tabs com informações adicionais */}
              <Tabs variant="enclosed" colorScheme="blue" mt={4}>
                <TabList>
                  <Tab><Icon as={FiInfo} mr={2} /> Detalhes</Tab>
                  <Tab><Icon as={FiUsers} mr={2} /> Motorista</Tab>
                  <Tab><Icon as={FiFileText} mr={2} /> Viagens</Tab>
                  <Tab><Icon as={FiTool} mr={2} /> Manutenções</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Tab de Detalhes */}
                  <TabPanel>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Chassi</Text>
                        <Text>{detalhesVeiculo?.chassi || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">RENAVAM</Text>
                        <Text>{detalhesVeiculo?.renavam || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Ano Modelo</Text>
                        <Text>{detalhesVeiculo?.ano_modelo || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Capacidade de Passageiros</Text>
                        <Text>{detalhesVeiculo?.capacidade_passageiros || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Tipo de Combustível</Text>
                        <Text>{detalhesVeiculo?.tipo_combustivel || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Cor</Text>
                        <Text>{detalhesVeiculo?.cor || 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Data de Licenciamento</Text>
                        <Text>{detalhesVeiculo?.data_licenciamento ? formatarData(detalhesVeiculo.data_licenciamento) : 'N/D'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Seguro</Text>
                        <Badge colorScheme={detalhesVeiculo?.possui_seguro ? 'green' : 'red'}>
                          {detalhesVeiculo?.possui_seguro ? 'Sim' : 'Não'}
                        </Badge>
                      </Flex>
                      
                      {detalhesVeiculo?.possui_seguro && detalhesVeiculo?.data_vencimento_seguro && (
                        <Flex justify="space-between">
                          <Text fontWeight="bold">Vencimento do Seguro</Text>
                          <Text>{formatarData(detalhesVeiculo.data_vencimento_seguro)}</Text>
                        </Flex>
                      )}
                      
                      {detalhesVeiculo?.observacoes && (
                        <Box mt={2}>
                          <Text fontWeight="bold">Observações:</Text>
                          <Box p={2} bg="gray.100" borderRadius="md" mt={1}>
                            <Text>{detalhesVeiculo.observacoes}</Text>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>
                  
                  {/* Tab de Motorista */}
                  <TabPanel>
                    {motorista ? (
                      <Box>
                        <Flex align="center" mb={4}>
                          <Avatar 
                            size="lg" 
                            name={motorista.nome} 
                            src={motorista.foto_url}
                            mr={4}
                          />
                          <Box>
                            <Text fontWeight="bold" fontSize="lg">{motorista.nome}</Text>
                            <Badge colorScheme="blue" mt={1}>{motorista.cargo || 'Motorista'}</Badge>
                          </Box>
                        </Flex>
                        
                        <VStack align="stretch" spacing={3} mt={4}>
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Telefone</Text>
                            <Text>{formatarTelefone(motorista.telefone) || 'N/D'}</Text>
                          </Flex>
                          
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Email</Text>
                            <Text>{motorista.email || 'N/D'}</Text>
                          </Flex>
                          
                          <Flex justify="space-between">
                            <Text fontWeight="bold">CNH</Text>
                            <Text>{motorista.cnh || 'N/D'}</Text>
                          </Flex>
                          
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Categoria CNH</Text>
                            <Text>{motorista.categoria_cnh || 'N/D'}</Text>
                          </Flex>
                          
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Validade CNH</Text>
                            <Text>{motorista.validade_cnh ? formatarData(motorista.validade_cnh) : 'N/D'}</Text>
                          </Flex>
                        </VStack>
                      </Box>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        Nenhum motorista está associado a este veículo atualmente.
                      </Alert>
                    )}
                  </TabPanel>
                  
                  {/* Tab de Viagens */}
                  <TabPanel>
                    {viagemAtual && (
                      <Box mb={4}>
                        <Text fontWeight="bold" mb={2}>Viagem Atual:</Text>
                        <Box p={3} borderWidth="1px" borderRadius="md" borderColor="blue.300" bg="blue.50">
                          <Flex justify="space-between" mb={2}>
                            <Text fontWeight="bold">Destino:</Text>
                            <Text>{viagemAtual.destino}</Text>
                          </Flex>
                          
                          <Flex justify="space-between" mb={2}>
                            <Text fontWeight="bold">Data Ida:</Text>
                            <Text>{formatarData(viagemAtual.data_ida)}</Text>
                          </Flex>
                          
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Previsão de Retorno:</Text>
                            <Text>{viagemAtual.data_volta ? formatarData(viagemAtual.data_volta) : 'Não definida'}</Text>
                          </Flex>
                          
                          <Flex justify="space-between" mt={2}>
                            <Text fontWeight="bold">Pacientes:</Text>
                            <Text>{viagemAtual.total_pacientes || 0}</Text>
                          </Flex>
                        </Box>
                      </Box>
                    )}
                    
                    <Text fontWeight="bold" mb={2}>Últimas Viagens:</Text>
                    {historicoViagens.length > 0 ? (
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Data</Th>
                            <Th>Destino</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {historicoViagens.map((viagem, index) => (
                            <Tr key={index}>
                              <Td>{formatarData(viagem.data_ida)}</Td>
                              <Td>{viagem.destino}</Td>
                              <Td>
                                <Badge 
                                  colorScheme={
                                    viagem.status === 'concluida' ? 'green' : 
                                    viagem.status === 'em_andamento' ? 'blue' : 
                                    viagem.status === 'cancelada' ? 'red' : 
                                    'gray'
                                  }
                                >
                                  {viagem.status.replace('_', ' ')}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        Nenhuma viagem registrada para este veículo.
                      </Alert>
                    )}
                  </TabPanel>
                  
                  {/* Tab de Manutenções */}
                  <TabPanel>
                    {manutencoes.length > 0 ? (
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Data</Th>
                            <Th>Tipo</Th>
                            <Th>Quilometragem</Th>
                            <Th>Custo</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {manutencoes.map((manutencao, index) => (
                            <Tr key={index}>
                              <Td>{formatarData(manutencao.data)}</Td>
                              <Td>
                                <Badge>
                                  {manutencao.tipo_manutencao.replace('_', ' ')}
                                </Badge>
                              </Td>
                              <Td>{manutencao.km_registrado.toLocaleString('pt-BR')} km</Td>
                              <Td>
                                {manutencao.custo 
                                  ? `R$ ${manutencao.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                                  : 'N/D'
                                }
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        Nenhuma manutenção registrada para este veículo.
                      </Alert>
                    )}
                    
                    {detalhesVeiculo?.proxima_manutencao_km && (
                      <Box mt={4} p={3} borderWidth="1px" borderRadius="md" borderColor="orange.300" bg="orange.50">
                        <Flex align="center">
                          <Icon as={FiAlertTriangle} color="orange.500" mr={2} />
                          <Box>
                            <Text fontWeight="bold">Próxima manutenção programada:</Text>
                            <Text>{detalhesVeiculo.proxima_manutencao_km.toLocaleString('pt-BR')} km</Text>
                            {detalhesVeiculo.quilometragem_atual && (
                              <Text fontSize="sm" mt={1}>
                                Faltam {(detalhesVeiculo.proxima_manutencao_km - detalhesVeiculo.quilometragem_atual).toLocaleString('pt-BR')} km
                              </Text>
                            )}
                          </Box>
                        </Flex>
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InformacoesVeiculoModal; 