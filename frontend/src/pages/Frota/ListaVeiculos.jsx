import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiTruck, FiAlertCircle, FiCalendar, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import VeiculoCard from '../../components/shared/VeiculoCard';
import StatusFrota from '../../components/shared/StatusFrota';
import AlertasDocumentos from '../../components/shared/AlertasDocumentos';

/**
 * Página de Listagem de Veículos
 */
const ListaVeiculos = () => {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [statusOperacional, setStatusOperacional] = useState('');
  const [ordenacao, setOrdenacao] = useState('marca');
  const [documentosVencendo, setDocumentosVencendo] = useState([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  // Carregar todos os veículos
  const carregarVeiculos = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/frota/veiculos?';
      
      // Adicionar filtros à URL
      if (tipoVeiculo) {
        endpoint += `tipo=${tipoVeiculo}&`;
      }
      
      if (statusOperacional) {
        endpoint += `status_operacional=${statusOperacional}&`;
      }
      
      // Adicionar ordenação
      endpoint += `ordenar_por=${ordenacao}`;
      
      const resposta = await api.get(endpoint);
      setVeiculos(resposta.data.veiculos);
    } catch (erro) {
      console.error('Erro ao carregar veículos:', erro);
      toast({
        title: 'Erro ao carregar veículos',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao buscar os veículos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  }, [tipoVeiculo, statusOperacional, ordenacao, toast]);

  // Carregar documentos vencendo
  const carregarDocumentosVencendo = useCallback(async () => {
    setLoadingDocumentos(true);
    try {
      const resposta = await api.get('/frota/veiculos/alertas/documentos-vencendo?dias_alerta=30');
      
      // Combinar os diferentes tipos de documentos
      const todosDocumentos = [
        ...(resposta.data.veiculos_licenciamento || []).map(v => ({
          ...v,
          tipo_documento: 'licenciamento',
          data_vencimento: v.data_licenciamento
        })),
        ...(resposta.data.veiculos_ipva || []).map(v => ({
          ...v,
          tipo_documento: 'ipva'
        })),
        ...(resposta.data.veiculos_seguro || []).map(v => ({
          ...v,
          tipo_documento: 'seguro'
        }))
      ];
      
      setDocumentosVencendo(todosDocumentos);
    } catch (erro) {
      console.error('Erro ao carregar documentos vencendo:', erro);
      toast({
        title: 'Erro ao carregar alertas',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao buscar os alertas de documentos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDocumentosVencendo([]);
    } finally {
      setLoadingDocumentos(false);
    }
  }, [toast]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarVeiculos();
    carregarDocumentosVencendo();
  }, [carregarVeiculos, carregarDocumentosVencendo]);

  // Filtrar veículos pelo campo de busca
  const veiculosFiltrados = veiculos.filter(veiculo => {
    if (!filtro) return true;
    
    const termoBusca = filtro.toLowerCase();
    return (
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca)
    );
  });

  // Navegar para a página de cadastro
  const handleNovoVeiculo = () => {
    navigate('/frota/veiculos/cadastro');
  };

  // Navegar para a página de detalhes
  const handleVerDetalhes = (id) => {
    navigate(`/frota/veiculos/${id}`);
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Stack spacing={6}>
        <Flex justify="space-between" align="center">
          <Heading size="lg">Gestão de Frota</Heading>
          <Button 
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={handleNovoVeiculo}
          >
            Novo Veículo
          </Button>
        </Flex>

        <StatusFrota veiculos={veiculos} />

        <Tabs isLazy index={tabIndex} onChange={setTabIndex} variant="enclosed">
          <TabList>
            <Tab>
              <Icon as={FiTruck} mr={2} />
              Veículos
            </Tab>
            <Tab>
              <Icon as={FiAlertCircle} mr={2} />
              Alertas
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab de Listagem de Veículos */}
            <TabPanel>
              <Stack spacing={4}>
                <HStack spacing={4}>
                  <InputGroup maxW="300px">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Buscar por placa, marca ou modelo"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </InputGroup>

                  <Select 
                    placeholder="Tipo de Veículo" 
                    value={tipoVeiculo}
                    onChange={(e) => setTipoVeiculo(e.target.value)}
                    maxW="200px"
                  >
                    <option value="carro">Carro</option>
                    <option value="van">Van</option>
                    <option value="micro_onibus">Micro-ônibus</option>
                    <option value="onibus">Ônibus</option>
                    <option value="ambulancia">Ambulância</option>
                    <option value="outro">Outro</option>
                  </Select>

                  <Select 
                    placeholder="Status" 
                    value={statusOperacional}
                    onChange={(e) => setStatusOperacional(e.target.value)}
                    maxW="200px"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_viagem">Em Viagem</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </Select>

                  <Select 
                    placeholder="Ordenar por" 
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    maxW="200px"
                  >
                    <option value="marca">Marca</option>
                    <option value="placa">Placa</option>
                    <option value="capacidade_passageiros">Capacidade</option>
                    <option value="quilometragem_atual">Quilometragem</option>
                    <option value="created_at">Data de Cadastro</option>
                  </Select>
                </HStack>

                {loading ? (
                  <Flex justify="center" my={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : veiculosFiltrados.length === 0 ? (
                  <Box 
                    textAlign="center" 
                    p={10} 
                    borderWidth={1} 
                    borderRadius="md"
                    bgColor="gray.50"
                  >
                    <Icon as={FiTruck} boxSize={10} color="gray.400" />
                    <Text mt={4} fontSize="lg" color="gray.500">
                      Nenhum veículo encontrado com os filtros aplicados.
                    </Text>
                    <Button 
                      mt={4} 
                      colorScheme="blue" 
                      variant="outline"
                      onClick={() => {
                        setFiltro('');
                        setTipoVeiculo('');
                        setStatusOperacional('');
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={2}>
                    {veiculosFiltrados.map(veiculo => (
                      <VeiculoCard
                        key={veiculo._id}
                        veiculo={veiculo}
                        onClick={() => handleVerDetalhes(veiculo._id)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Stack>
            </TabPanel>

            {/* Tab de Alertas */}
            <TabPanel>
              <AlertasDocumentos 
                documentosVencendo={documentosVencendo}
                loading={loadingDocumentos}
                onVerVeiculo={handleVerDetalhes}
                onRefresh={carregarDocumentosVencendo}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default ListaVeiculos; 