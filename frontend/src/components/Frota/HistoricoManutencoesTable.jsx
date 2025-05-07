import React, { useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Box,
  Text,
  Flex,
  Heading,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react';
import { FiAlertCircle, FiCalendar, FiChevronDown, FiEye, FiFileText, FiFilter, FiPrinter } from 'react-icons/fi';
import { formatarData, formatarMoeda } from '../../utils/formatters';
import api from '../../services/api';
import DetalhesManutencaoModal from './DetalhesManutencaoModal';

const HistoricoManutencoesTable = ({ veiculoId, onAddSuccess }) => {
  const [manutencoes, setManutencoes] = useState([]);
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const carregarManutencoes = async () => {
    if (!veiculoId) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      const response = await api.get(`/frota/veiculos/${veiculoId}/manutencoes`);
      setManutencoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
      setErro('Não foi possível carregar o histórico de manutenções. Tente novamente mais tarde.');
      toast({
        title: 'Erro ao carregar manutenções',
        description: error.response?.data?.message || 'Não foi possível carregar as manutenções',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarManutencoes();
  }, [veiculoId, onAddSuccess]);

  const handleVerDetalhes = (manutencao) => {
    setManutencaoSelecionada(manutencao);
    onOpen();
  };

  const getManutencoesFiltradas = () => {
    if (filtro === 'todos') return manutencoes;
    
    return manutencoes.filter(manutencao => manutencao.tipo_manutencao === filtro);
  };

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

  const getBadgeColorBySubtipo = (subtipo) => {
    switch (subtipo) {
      case 'troca_oleo':
        return 'yellow';
      case 'freios':
        return 'orange';
      case 'suspensao':
        return 'purple';
      case 'eletrica':
        return 'cyan';
      case 'motor':
        return 'red';
      case 'hidraulica':
        return 'teal';
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

  if (carregando) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (erro) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>{erro}</AlertTitle>
      </Alert>
    );
  }

  const manutencoesFiltradas = getManutencoesFiltradas();

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Histórico de Manutenções</Heading>
        
        <HStack>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm" colorScheme="blue" variant="outline">
              <Flex align="center">
                <FiFilter style={{ marginRight: '8px' }} />
                Filtrar por: {filtro === 'todos' ? 'Todos' : filtro === 'preventiva' ? 'Preventiva' : filtro === 'corretiva' ? 'Corretiva' : 'Revisão'}
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setFiltro('todos')}>Todos</MenuItem>
              <MenuItem onClick={() => setFiltro('preventiva')}>Preventiva</MenuItem>
              <MenuItem onClick={() => setFiltro('corretiva')}>Corretiva</MenuItem>
              <MenuItem onClick={() => setFiltro('revisao')}>Revisão</MenuItem>
            </MenuList>
          </Menu>
          
          <IconButton
            icon={<FiPrinter />}
            aria-label="Imprimir relatório"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          />
        </HStack>
      </Flex>

      {manutencoesFiltradas.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertTitle>
            {filtro === 'todos' 
              ? 'Nenhuma manutenção registrada para este veículo.' 
              : `Nenhuma manutenção do tipo "${filtro}" registrada para este veículo.`}
          </AlertTitle>
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" borderWidth="1px" borderRadius="md">
            <Thead bg="gray.50">
              <Tr>
                <Th>Data</Th>
                <Th>Tipo</Th>
                <Th>Serviço</Th>
                <Th>Local</Th>
                <Th>Km</Th>
                <Th>Custo</Th>
                <Th>Próx. Serviço</Th>
                <Th width="80px">Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {manutencoesFiltradas.map((manutencao) => (
                <Tr key={manutencao.id}>
                  <Td>{formatarData(manutencao.data)}</Td>
                  <Td>
                    <Badge colorScheme={getBadgeColorByTipo(manutencao.tipo_manutencao)}>
                      {manutencao.tipo_manutencao.charAt(0).toUpperCase() + manutencao.tipo_manutencao.slice(1)}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getBadgeColorBySubtipo(manutencao.subtipo_manutencao)}>
                      {getDescricaoSubtipo(manutencao.subtipo_manutencao)}
                    </Badge>
                  </Td>
                  <Td>{manutencao.local_realizacao}</Td>
                  <Td>{manutencao.km_registrado.toLocaleString('pt-BR')} km</Td>
                  <Td>{formatarMoeda(manutencao.custo)}</Td>
                  <Td>
                    {manutencao.proximo_servico_data && (
                      <Flex align="center">
                        <FiCalendar style={{ marginRight: '5px' }} />
                        {formatarData(manutencao.proximo_servico_data)}
                        {manutencao.proximo_servico_km && (
                          <Text fontSize="xs" ml={2} color="gray.500">
                            ou {manutencao.proximo_servico_km.toLocaleString('pt-BR')} km
                          </Text>
                        )}
                      </Flex>
                    )}
                    {!manutencao.proximo_servico_data && manutencao.proximo_servico_km && (
                      <Flex align="center">
                        <FiAlertCircle style={{ marginRight: '5px' }} />
                        {manutencao.proximo_servico_km.toLocaleString('pt-BR')} km
                      </Flex>
                    )}
                    {!manutencao.proximo_servico_data && !manutencao.proximo_servico_km && (
                      <Text color="gray.500">Não definido</Text>
                    )}
                  </Td>
                  <Td>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      icon={<FiEye />}
                      aria-label="Ver detalhes"
                      onClick={() => handleVerDetalhes(manutencao)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {isOpen && (
        <DetalhesManutencaoModal
          isOpen={isOpen}
          onClose={onClose}
          manutencao={manutencaoSelecionada}
        />
      )}
    </Box>
  );
};

export default HistoricoManutencoesTable; 