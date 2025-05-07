import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { 
  FiArrowLeft,
  FiEdit,
  FiTruck,
  FiCalendar,
  FiSettings,
  FiAlertTriangle,
  FiClock,
  FiList,
  FiUsers,
  FiPlusCircle
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import RegistrarManutencaoModal from '../../components/shared/RegistrarManutencaoModal';
import AlterarStatusVeiculoModal from '../../components/shared/AlterarStatusVeiculoModal';
import HistoricoManutencao from '../../components/shared/HistoricoManutencao';
import HistoricoViagens from '../../components/shared/HistoricoViagens';

/**
 * Página de detalhes do veículo
 */
const DetalhesVeiculo = () => {
  const [veiculo, setVeiculo] = useState(null);
  const [manutencoes, setManutencoes] = useState([]);
  const [viagensRecentes, setViagensRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingManutencoes, setLoadingManutencoes] = useState(false);
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Modal de manutenção
  const {
    isOpen: isManutencaoModalOpen,
    onOpen: onManutencaoModalOpen,
    onClose: onManutencaoModalClose
  } = useDisclosure();
  
  // Modal de alteração de status
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose
  } = useDisclosure();
  
  // Função para carregar dados do veículo
  const carregarVeiculo = useCallback(async () => {
    setLoading(true);
    try {
      const resposta = await api.get(`/frota/veiculos/${id}`);
      setVeiculo(resposta.data.veiculo);
      setManutencoes(resposta.data.manutencoes || []);
      setViagensRecentes(resposta.data.viagensRecentes || []);
    } catch (erro) {
      console.error('Erro ao carregar veículo:', erro);
      toast({
        title: 'Erro ao carregar dados',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao buscar os dados do veículo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/frota/veiculos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarVeiculo();
  }, [carregarVeiculo]);
  
  // Formatar data
  const formatarData = (dataString) => {
    if (!dataString) return 'Não informado';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  // Verificar se a documentação está vencida
  const isDocumentoVencido = (dataString) => {
    if (!dataString) return false;
    
    const data = new Date(dataString);
    return data < new Date();
  };
  
  // Verificar se precisa de manutenção
  const precisaManutencao = () => {
    if (!veiculo) return false;
    
    if (veiculo.quilometragem_atual && veiculo.proxima_manutencao_km) {
      return veiculo.quilometragem_atual >= veiculo.proxima_manutencao_km;
    }
    
    return false;
  };
  
  // Obter cor baseada no status operacional
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
  
  // Obter texto do status operacional
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
  
  // Função para recarregar manutenções
  const recarregarManutencoes = async () => {
    setLoadingManutencoes(true);
    try {
      const resposta = await api.get(`/frota/veiculos/${id}/manutencoes`);
      setManutencoes(resposta.data.manutencoes || []);
    } catch (erro) {
      console.error('Erro ao carregar manutenções:', erro);
      toast({
        title: 'Erro ao carregar manutenções',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao buscar as manutenções',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingManutencoes(false);
    }
  };
  
  // Função chamada após cadastro de manutenção
  const handleManutencaoCadastrada = () => {
    // Recarregar os dados do veículo e manutenções
    carregarVeiculo();
    toast({
      title: 'Manutenção registrada',
      description: 'A manutenção foi registrada com sucesso',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // Função chamada após alteração de status
  const handleStatusAlterado = () => {
    // Recarregar os dados do veículo
    carregarVeiculo();
    toast({
      title: 'Status alterado',
      description: 'O status do veículo foi alterado com sucesso',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // Navegar para edição
  const handleEditar = () => {
    navigate(`/frota/veiculos/editar/${id}`);
  };
  
  // Voltar para a lista de veículos
  const handleVoltar = () => {
    navigate('/frota/veiculos');
  };
  
  if (loading) {
    return (
      <Container maxW="container.xl" py={5}>
        <Flex direction="column" align="center" justify="center" minH="50vh">
          <Spinner size="xl" mb={4} />
          <Text>Carregando dados do veículo...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (!veiculo) {
    return (
      <Container maxW="container.xl" py={5}>
        <Flex direction="column" align="center" justify="center" minH="50vh">
          <Icon as={FiAlertTriangle} boxSize={12} color="red.500" mb={4} />
          <Heading size="md" mb={2}>Veículo não encontrado</Heading>
          <Text mb={4}>Não foi possível encontrar o veículo solicitado.</Text>
          <Button 
            leftIcon={<Icon as={FiArrowLeft} />}
            colorScheme="blue"
            onClick={handleVoltar}
          >
            Voltar para Lista
          </Button>
        </Flex>
      </Container>
    );
  }
  
  const statusColor = getStatusColor(veiculo.status_operacional);
  const statusText = getStatusText(veiculo.status_operacional);

  return (
    <Container maxW="container.xl" py={5}>
      <Stack spacing={6}>
        {/* Cabeçalho */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">Detalhes do Veículo</Heading>
          <Flex gap={2}>
            <Button 
              leftIcon={<Icon as={FiArrowLeft} />}
              variant="outline"
              onClick={handleVoltar}
            >
              Voltar
            </Button>
            <Button
              leftIcon={<Icon as={FiEdit} />}
              colorScheme="blue"
              onClick={handleEditar}
            >
              Editar
            </Button>
          </Flex>
        </Flex>
        
        {/* Resumo do veículo */}
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          bg="white"
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
        >
          {/* Foto do veículo */}
          <Box 
            width={{ base: '100%', md: '300px' }}
            height={{ base: '200px', md: '100%' }}
            bg="gray.100"
            position="relative"
          >
            {veiculo.foto_url ? (
              <Image
                src={veiculo.foto_url}
                alt={`${veiculo.marca} ${veiculo.modelo}`}
                objectFit="cover"
                width="100%"
                height="100%"
              />
            ) : (
              <Flex 
                align="center" 
                justify="center" 
                height="100%"
                bg="gray.100"
              >
                <Icon as={FiTruck} boxSize={16} color="gray.400" />
              </Flex>
            )}
          </Box>
          
          {/* Informações básicas */}
          <Box p={6} flex="1">
            <Flex 
              justify="space-between" 
              align={{ base: 'flex-start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              mb={4}
            >
              <Box>
                <Heading size="lg">
                  {veiculo.marca} {veiculo.modelo}
                </Heading>
                <Heading size="md" color="gray.500" mt={1}>
                  {veiculo.placa}
                </Heading>
              </Box>
              
              <Flex gap={2} mt={{ base: 4, md: 0 }}>
                <Tag size="lg" colorScheme={statusColor} borderRadius="full" px={4}>
                  <Icon as={FiTruck} mr={2} />
                  {statusText}
                </Tag>
                
                <Button
                  size="sm"
                  leftIcon={<Icon as={FiSettings} />}
                  onClick={onStatusModalOpen}
                >
                  Alterar Status
                </Button>
              </Flex>
            </Flex>
            
            <Divider mb={4} />
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InfoItem 
                icon={FiTruck} 
                label="Tipo" 
                value={veiculo.tipo === 'micro_onibus' ? 'Micro-ônibus' : veiculo.tipo.charAt(0).toUpperCase() + veiculo.tipo.slice(1)} 
              />
              
              <InfoItem 
                icon={FiCalendar} 
                label="Ano" 
                value={`${veiculo.ano_fabricacao}/${veiculo.ano_modelo || veiculo.ano_fabricacao}`} 
              />
              
              <InfoItem 
                icon={FiUsers} 
                label="Capacidade" 
                value={`${veiculo.capacidade_passageiros} passageiros`} 
              />
              
              <InfoItem 
                icon={FiSettings} 
                label="Quilometragem" 
                value={veiculo.quilometragem_atual ? `${veiculo.quilometragem_atual.toLocaleString()} km` : 'Não informado'} 
              />
              
              <InfoItem 
                icon={FiCalendar} 
                label="Licenciamento" 
                value={formatarData(veiculo.data_licenciamento)}
                isAlert={isDocumentoVencido(veiculo.data_licenciamento)}
              />
              
              <InfoItem 
                icon={FiClock} 
                label="Próxima Manutenção" 
                value={veiculo.proxima_manutencao_km ? `${veiculo.proxima_manutencao_km.toLocaleString()} km` : 'Não definida'}
                isAlert={precisaManutencao()}
              />
            </SimpleGrid>
            
            <Flex mt={6} gap={2} direction={{ base: 'column', md: 'row' }}>
              <Button
                leftIcon={<Icon as={FiPlusCircle} />}
                colorScheme="green"
                onClick={onManutencaoModalOpen}
              >
                Registrar Manutenção
              </Button>
            </Flex>
          </Box>
        </Flex>
        
        {/* Abas com detalhes */}
        <Tabs colorScheme="blue" isLazy>
          <TabList>
            <Tab>
              <Icon as={FiList} mr={2} />
              Detalhes
            </Tab>
            <Tab>
              <Icon as={FiSettings} mr={2} />
              Manutenções
            </Tab>
            <Tab>
              <Icon as={FiTruck} mr={2} />
              Viagens
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Aba de Detalhes */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                {/* Características */}
                <Box
                  bg="white"
                  p={5}
                  borderRadius="md"
                  boxShadow="sm"
                  borderWidth="1px"
                >
                  <Heading size="md" mb={4}>
                    <Flex align="center">
                      <Icon as={FiTruck} mr={2} />
                      Características
                    </Flex>
                  </Heading>
                  
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Item label="Renavam" value={veiculo.renavam || 'Não informado'} />
                    <Item label="Chassi" value={veiculo.chassi || 'Não informado'} />
                    <Item label="Cor" value={veiculo.cor || 'Não informado'} />
                    <Item label="Combustível" value={veiculo.combustivel ? (veiculo.combustivel.charAt(0).toUpperCase() + veiculo.combustivel.slice(1)) : 'Não informado'} />
                    <Item label="Ar Condicionado" value={veiculo.ar_condicionado ? 'Sim' : 'Não'} />
                    <Item label="Adaptado para PCD" value={veiculo.adaptado_pcd ? 'Sim' : 'Não'} />
                    <Item label="Possui Maca" value={veiculo.possui_maca ? 'Sim' : 'Não'} />
                    <Item label="Cadastrado em" value={formatarData(veiculo.created_at)} />
                  </Grid>
                </Box>
                
                {/* Observações */}
                <Box
                  bg="white"
                  p={5}
                  borderRadius="md"
                  boxShadow="sm"
                  borderWidth="1px"
                >
                  <Heading size="md" mb={4}>
                    <Flex align="center">
                      <Icon as={FiList} mr={2} />
                      Observações
                    </Flex>
                  </Heading>
                  
                  <Box 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md" 
                    minHeight="150px"
                    whiteSpace="pre-wrap"
                  >
                    {veiculo.observacoes || 'Nenhuma observação registrada para este veículo.'}
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            {/* Aba de Manutenções */}
            <TabPanel>
              <HistoricoManutencao
                veiculoId={id}
                manutencoes={manutencoes}
                loading={loadingManutencoes}
                onRefresh={recarregarManutencoes}
                onRegistroSucesso={handleManutencaoCadastrada}
              />
            </TabPanel>
            
            {/* Aba de Viagens */}
            <TabPanel>
              <HistoricoViagens 
                viagens={viagensRecentes}
                emptyMessage="Este veículo ainda não realizou viagens."
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
      
      {/* Modal de Manutenção */}
      <RegistrarManutencaoModal 
        isOpen={isManutencaoModalOpen}
        onClose={onManutencaoModalClose}
        veiculoId={id}
        quilometragemAtual={veiculo.quilometragem_atual}
        onSucesso={handleManutencaoCadastrada}
      />
      
      {/* Modal de Alteração de Status */}
      <AlterarStatusVeiculoModal
        isOpen={isStatusModalOpen}
        onClose={onStatusModalClose}
        veiculo={veiculo}
        onSucesso={handleStatusAlterado}
      />
    </Container>
  );
};

// Componente para exibir item de informação com ícone
const InfoItem = ({ icon, label, value, isAlert = false }) => {
  return (
    <Flex align="center">
      <Icon 
        as={icon} 
        boxSize={5} 
        color={isAlert ? 'red.500' : 'blue.500'} 
        mr={2} 
      />
      <Box>
        <Text fontSize="sm" color="gray.500">{label}</Text>
        <Text fontWeight="medium" color={isAlert ? 'red.500' : 'inherit'}>
          {isAlert && <Icon as={FiAlertTriangle} mr={1} />}
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

// Componente para exibir item na lista de detalhes
const Item = ({ label, value }) => {
  return (
    <Box>
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontWeight="medium">{value}</Text>
    </Box>
  );
};

export default DetalhesVeiculo; 