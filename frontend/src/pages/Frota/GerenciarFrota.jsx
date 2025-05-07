import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Text,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stack,
  useDisclosure,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTruck,
  FiCalendar,
  FiMap,
  FiTool,
  FiRefreshCw,
  FiFilter,
  FiMoreVertical,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiSettings
} from 'react-icons/fi';
import api from '../../services/api';
import { formatarData, formatarPlaca } from '../../utils/formatters';
import HistoricoManutencoesTable from '../../components/Frota/HistoricoManutencoesTable';
import DetalhesManutencaoModal from '../../components/Frota/DetalhesManutencaoModal';
import RegistrarManutencaoModal from '../../components/Frota/RegistrarManutencaoModal';
import CadastrarVeiculoModal from '../../components/shared/CadastrarVeiculoModal';
import AlterarStatusVeiculoModal from '../../components/shared/AlterarStatusVeiculoModal';
import MapaRastreamentoVeiculos from '../../components/viagens/MapaRastreamentoVeiculos';

/**
 * Página para gerenciamento da frota de veículos
 */
const GerenciarFrota = () => {
  // Estados
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [recarregar, setRecarregar] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Hooks do Chakra UI
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Modais
  const {
    isOpen: isOpenCadastro,
    onOpen: onOpenCadastro,
    onClose: onCloseCadastro
  } = useDisclosure();
  
  const {
    isOpen: isOpenEditar,
    onOpen: onOpenEditar,
    onClose: onCloseEditar
  } = useDisclosure();
  
  const {
    isOpen: isOpenStatus,
    onOpen: onOpenStatus,
    onClose: onCloseStatus
  } = useDisclosure();
  
  const {
    isOpen: isOpenManutencao,
    onOpen: onOpenManutencao,
    onClose: onCloseManutencao
  } = useDisclosure();
  
  // Carregar dados dos veículos
  const carregarVeiculos = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    
    try {
      const params = {};
      if (filtroStatus !== 'todos') {
        params.status = filtroStatus;
      }
      
      const response = await api.get('/frota/veiculos', { params });
      setVeiculos(response.data.veiculos || []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setErro('Não foi possível carregar a lista de veículos. Tente novamente mais tarde.');
      
      toast({
        title: 'Erro ao carregar dados',
        description: error.response?.data?.mensagem || 'Erro ao carregar veículos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filtroStatus, toast]);
  
  // Efeito para carregar veículos
  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos, recarregar]);
  
  // Função para atualizar a lista após sucesso em operações
  const handleOperacaoSucesso = () => {
    setRecarregar(prev => prev + 1);
  };
  
  // Selecionar veículo para visualização detalhada
  const handleSelecionarVeiculo = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    setTabIndex(0); // Volta para a primeira aba
  };
  
  // Abrir modal de edição
  const handleEditarVeiculo = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    onOpenEditar();
  };
  
  // Abrir modal de alteração de status
  const handleAlterarStatus = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    onOpenStatus();
  };
  
  // Abrir modal de registro de manutenção
  const handleRegistrarManutencao = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    onOpenManutencao();
  };
  
  // Remover veículo
  const handleRemoverVeiculo = async (veiculoId) => {
    if (!window.confirm('Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await api.delete(`/frota/veiculos/${veiculoId}`);
      
      toast({
        title: 'Veículo removido',
        description: 'O veículo foi removido com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Se o veículo removido é o selecionado, limpa a seleção
      if (veiculoSelecionado && veiculoSelecionado.id === veiculoId) {
        setVeiculoSelecionado(null);
      }
      
      // Atualiza a lista de veículos
      handleOperacaoSucesso();
      
    } catch (error) {
      console.error('Erro ao remover veículo:', error);
      
      toast({
        title: 'Erro ao remover veículo',
        description: error.response?.data?.mensagem || 'Não foi possível remover o veículo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Obter cor baseada no status
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
  
  // Verificar manutenções pendentes
  const temManutencaoPendente = (veiculo) => {
    if (!veiculo) return false;
    
    // Verifica se existe próxima manutenção programada por kilometragem
    if (veiculo.proxima_manutencao_km) {
      return veiculo.quilometragem_atual >= veiculo.proxima_manutencao_km;
    }
    
    // Verifica se existe próxima manutenção programada por data
    if (veiculo.proxima_manutencao_data) {
      const hoje = new Date();
      const dataManutencao = new Date(veiculo.proxima_manutencao_data);
      return hoje >= dataManutencao;
    }
    
    return false;
  };
  
  return (
    <Container maxW="container.xl" py={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Heading as="h1" size="lg" display="flex" alignItems="center">
          <FiTruck style={{ marginRight: '10px' }} />
          Gerenciamento da Frota
        </Heading>
        
        <HStack spacing={3}>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="outline">
              <Flex align="center">
                <FiFilter style={{ marginRight: '8px' }} />
                Filtrar: {filtroStatus === 'todos' ? 'Todos' : getStatusText(filtroStatus)}
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setFiltroStatus('todos')}>Todos os veículos</MenuItem>
              <MenuItem onClick={() => setFiltroStatus('disponivel')}>Disponíveis</MenuItem>
              <MenuItem onClick={() => setFiltroStatus('em_viagem')}>Em Viagem</MenuItem>
              <MenuItem onClick={() => setFiltroStatus('manutencao')}>Em Manutenção</MenuItem>
              <MenuItem onClick={() => setFiltroStatus('inativo')}>Inativos</MenuItem>
            </MenuList>
          </Menu>
          
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar lista"
            onClick={() => handleOperacaoSucesso()}
          />
          
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue"
            onClick={onOpenCadastro}
          >
            Novo Veículo
          </Button>
        </HStack>
      </Flex>
      
      {erro && (
        <Alert status="error" mb={5}>
          <AlertIcon />
          {erro}
        </Alert>
      )}
      
      <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={5}>
        {/* Coluna de lista de veículos */}
        <GridItem
          borderWidth="1px"
          borderRadius="md"
          p={4}
          height={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
          overflowY={{ base: 'visible', lg: 'auto' }}
        >
          <Heading size="md" mb={4}>Lista de Veículos</Heading>
          
          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" color="blue.500" />
            </Flex>
          ) : veiculos.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              Nenhum veículo encontrado com os filtros selecionados.
            </Alert>
          ) : (
            <Stack spacing={3}>
              {veiculos.map(veiculo => (
                <Box
                  key={veiculo.id}
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={veiculoSelecionado?.id === veiculo.id ? 'blue.50' : bgCard}
                  borderColor={veiculoSelecionado?.id === veiculo.id ? 'blue.300' : borderColor}
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => handleSelecionarVeiculo(veiculo)}
                >
                  <Flex justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Badge
                        colorScheme={getStatusColor(veiculo.status)}
                        mb={2}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                      >
                        {getStatusText(veiculo.status)}
                      </Badge>
                      <Text fontWeight="bold">{veiculo.marca} {veiculo.modelo}</Text>
                      <Text>{formatarPlaca(veiculo.placa)}</Text>
                      
                      {temManutencaoPendente(veiculo) && (
                        <Flex alignItems="center" mt={1} color="orange.500" fontSize="sm">
                          <FiAlertCircle style={{ marginRight: '5px' }} />
                          <Text>Manutenção pendente</Text>
                        </Flex>
                      )}
                    </Box>
                    
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem 
                          icon={<FiEdit />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarVeiculo(veiculo);
                          }}
                        >
                          Editar veículo
                        </MenuItem>
                        <MenuItem 
                          icon={<FiSettings />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAlterarStatus(veiculo);
                          }}
                        >
                          Alterar status
                        </MenuItem>
                        <MenuItem 
                          icon={<FiTool />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegistrarManutencao(veiculo);
                          }}
                        >
                          Registrar manutenção
                        </MenuItem>
                        <MenuItem 
                          icon={<FiTrash2 />}
                          color="red.500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoverVeiculo(veiculo.id);
                          }}
                        >
                          Remover veículo
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </GridItem>
        
        {/* Coluna de detalhes do veículo */}
        <GridItem
          borderWidth="1px"
          borderRadius="md"
          p={4}
          height={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
          overflowY={{ base: 'visible', lg: 'auto' }}
        >
          {!veiculoSelecionado ? (
            <Flex 
              direction="column" 
              justify="center" 
              align="center" 
              height="100%"
              color="gray.500"
            >
              <FiInfo size={40} style={{ marginBottom: '16px' }} />
              <Text fontSize="lg">Selecione um veículo para visualizar seus detalhes</Text>
            </Flex>
          ) : (
            <Box>
              <Flex 
                justify="space-between" 
                align="flex-start"
                borderBottomWidth="1px"
                pb={4}
                mb={4}
              >
                <Box>
                  <Heading size="md">{veiculoSelecionado.marca} {veiculoSelecionado.modelo}</Heading>
                  <Text fontSize="xl" fontWeight="bold" mt={1}>{formatarPlaca(veiculoSelecionado.placa)}</Text>
                  <Badge
                    colorScheme={getStatusColor(veiculoSelecionado.status)}
                    mt={2}
                    px={2}
                    py={0.5}
                  >
                    {getStatusText(veiculoSelecionado.status)}
                  </Badge>
                </Box>
                
                <HStack>
                  <Button
                    leftIcon={<FiEdit />}
                    size="sm"
                    onClick={() => handleEditarVeiculo(veiculoSelecionado)}
                  >
                    Editar
                  </Button>
                  <Button
                    leftIcon={<FiTool />}
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleRegistrarManutencao(veiculoSelecionado)}
                  >
                    Manutenção
                  </Button>
                </HStack>
              </Flex>
              
              {temManutencaoPendente(veiculoSelecionado) && (
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  Este veículo possui manutenção programada pendente.
                </Alert>
              )}
              
              <Tabs 
                variant="enclosed" 
                colorScheme="blue" 
                index={tabIndex}
                onChange={setTabIndex}
              >
                <TabList>
                  <Tab><FiInfo style={{ marginRight: '8px' }} /> Informações</Tab>
                  <Tab><FiTool style={{ marginRight: '8px' }} /> Manutenções</Tab>
                  <Tab><FiMap style={{ marginRight: '8px' }} /> Localização</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Painel de informações */}
                  <TabPanel>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                      <GridItem>
                        <Heading size="sm" mb={3}>Dados do Veículo</Heading>
                        
                        <Table variant="simple" size="sm">
                          <Tbody>
                            <Tr>
                              <Th width="40%">Tipo</Th>
                              <Td>{veiculoSelecionado.tipo || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Ano Fabricação</Th>
                              <Td>{veiculoSelecionado.ano_fabricacao || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Ano Modelo</Th>
                              <Td>{veiculoSelecionado.ano_modelo || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Cor</Th>
                              <Td>{veiculoSelecionado.cor || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Capacidade</Th>
                              <Td>{veiculoSelecionado.capacidade_passageiros || 'N/D'} passageiros</Td>
                            </Tr>
                            <Tr>
                              <Th>Combustível</Th>
                              <Td>{veiculoSelecionado.tipo_combustivel || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Quilometragem</Th>
                              <Td>{veiculoSelecionado.quilometragem_atual?.toLocaleString('pt-BR') || 'N/D'} km</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </GridItem>
                      
                      <GridItem>
                        <Heading size="sm" mb={3}>Documentação</Heading>
                        
                        <Table variant="simple" size="sm">
                          <Tbody>
                            <Tr>
                              <Th width="40%">RENAVAM</Th>
                              <Td>{veiculoSelecionado.renavam || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Chassi</Th>
                              <Td>{veiculoSelecionado.chassi || 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Licenciamento</Th>
                              <Td>{veiculoSelecionado.data_licenciamento ? formatarData(veiculoSelecionado.data_licenciamento) : 'N/D'}</Td>
                            </Tr>
                            <Tr>
                              <Th>Seguro</Th>
                              <Td>
                                <Badge colorScheme={veiculoSelecionado.possui_seguro ? 'green' : 'red'}>
                                  {veiculoSelecionado.possui_seguro ? 'Sim' : 'Não'}
                                </Badge>
                              </Td>
                            </Tr>
                            {veiculoSelecionado.possui_seguro && (
                              <Tr>
                                <Th>Vencimento Seguro</Th>
                                <Td>{veiculoSelecionado.data_vencimento_seguro ? formatarData(veiculoSelecionado.data_vencimento_seguro) : 'N/D'}</Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                        
                        {veiculoSelecionado.observacoes && (
                          <Box mt={4}>
                            <Heading size="sm" mb={2}>Observações</Heading>
                            <Box p={3} bg="gray.50" borderRadius="md">
                              <Text>{veiculoSelecionado.observacoes}</Text>
                            </Box>
                          </Box>
                        )}
                      </GridItem>
                    </Grid>
                    
                    {veiculoSelecionado.status === 'em_viagem' && veiculoSelecionado.viagem_atual && (
                      <Box mt={5} p={3} borderWidth="1px" borderRadius="md" bg="blue.50">
                        <Heading size="sm" mb={2} display="flex" alignItems="center">
                          <FiCalendar style={{ marginRight: '8px' }} />
                          Viagem Atual
                        </Heading>
                        
                        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Destino:</Text>
                            <Text fontWeight="bold">{veiculoSelecionado.viagem_atual.destino}</Text>
                          </Box>
                          
                          <Box>
                            <Text fontSize="sm" color="gray.600">Data de Saída:</Text>
                            <Text fontWeight="bold">{formatarData(veiculoSelecionado.viagem_atual.data_ida)}</Text>
                          </Box>
                          
                          <Box>
                            <Text fontSize="sm" color="gray.600">Previsão de Retorno:</Text>
                            <Text fontWeight="bold">
                              {veiculoSelecionado.viagem_atual.data_volta 
                                ? formatarData(veiculoSelecionado.viagem_atual.data_volta) 
                                : 'Não definida'
                              }
                            </Text>
                          </Box>
                        </Grid>
                      </Box>
                    )}
                  </TabPanel>
                  
                  {/* Painel de manutenções */}
                  <TabPanel>
                    <HistoricoManutencoesTable
                      veiculoId={veiculoSelecionado.id}
                      onAddSuccess={handleOperacaoSucesso}
                    />
                  </TabPanel>
                  
                  {/* Painel de localização */}
                  <TabPanel>
                    <MapaRastreamentoVeiculos 
                      veiculosIds={[veiculoSelecionado.id]} 
                      atualizacaoAutomatica={true}
                      intervaloAtualizacao={60}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}
        </GridItem>
      </Grid>
      
      {/* Modais */}
      <CadastrarVeiculoModal
        isOpen={isOpenCadastro}
        onClose={onCloseCadastro}
        onSuccess={handleOperacaoSucesso}
      />
      
      {veiculoSelecionado && (
        <>
          <CadastrarVeiculoModal
            isOpen={isOpenEditar}
            onClose={onCloseEditar}
            veiculoParaEditar={veiculoSelecionado}
            onSuccess={handleOperacaoSucesso}
          />
          
          <AlterarStatusVeiculoModal
            isOpen={isOpenStatus}
            onClose={onCloseStatus}
            veiculoId={veiculoSelecionado.id}
            statusAtual={veiculoSelecionado.status}
            onSuccess={handleOperacaoSucesso}
          />
          
          <RegistrarManutencaoModal
            isOpen={isOpenManutencao}
            onClose={onCloseManutencao}
            veiculo={veiculoSelecionado}
            onSuccess={handleOperacaoSucesso}
          />
        </>
      )}
    </Container>
  );
};

export default GerenciarFrota; 