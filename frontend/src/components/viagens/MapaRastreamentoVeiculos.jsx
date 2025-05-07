import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Heading,
  Badge,
  IconButton,
  HStack,
  VStack,
  Tooltip,
  Spinner,
  Stack,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useToast,
  Alert,
  AlertIcon,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiTarget,
  FiMap,
  FiInfo,
  FiClock,
  FiAlertTriangle,
  FiTruck,
  FiFilter,
  FiEye,
  FiNavigation,
  FiMapPin,
  FiArrowRight,
  FiUsers
} from 'react-icons/fi';
import api from '../../services/api';
import { formatarData } from '../../utils/formatters';
import InformacoesVeiculoModal from './InformacoesVeiculoModal';

/**
 * Componente para visualização de localização dos veículos em tempo real
 * @param {Object} props - Propriedades do componente
 * @param {string} props.viagemId - ID da viagem (opcional)
 * @param {Array} props.veiculosIds - IDs de veículos específicos para monitorar (opcional)
 * @param {string} props.filtroStatus - Filtro por status de veículos (opcional)
 * @param {boolean} props.atualizacaoAutomatica - Se deve atualizar automaticamente
 * @param {number} props.intervaloAtualizacao - Intervalo de atualização em segundos
 */
const MapaRastreamentoVeiculos = ({
  viagemId,
  veiculosIds,
  filtroStatus,
  atualizacaoAutomatica = true,
  intervaloAtualizacao = 30
}) => {
  // Estados
  const [localizacoes, setLocalizacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [mapaCarregado, setMapaCarregado] = useState(false);
  const [mapaVisivel, setMapaVisivel] = useState(false);
  const [filtro, setFiltro] = useState(filtroStatus || 'todos');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [centroMapa, setCentroMapa] = useState(null);
  const [zoom, setZoom] = useState(12);
  
  // Refs
  const mapaRef = useRef(null);
  const marcadoresRef = useRef({});
  const intervaloRef = useRef(null);
  
  // Hooks
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Inicialização do mapa
  useEffect(() => {
    // Verificar se já temos o script do Google Maps carregado
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapaCarregado(true);
      document.head.appendChild(script);
    } else {
      setMapaCarregado(true);
    }
    
    return () => {
      // Limpar intervalo quando o componente for desmontado
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, []);
  
  // Inicializar o mapa quando estiver carregado
  useEffect(() => {
    if (mapaCarregado && !mapaRef.current && mapaVisivel) {
      inicializarMapa();
    }
  }, [mapaCarregado, mapaVisivel]);
  
  // Atualização automática
  useEffect(() => {
    if (atualizacaoAutomatica && mapaVisivel) {
      // Configurar o intervalo de atualização
      intervaloRef.current = setInterval(() => {
        carregarLocalizacoesVeiculos();
      }, intervaloAtualizacao * 1000);
    }
    
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [atualizacaoAutomatica, mapaVisivel, intervaloAtualizacao]);
  
  // Carregar localizações iniciais
  useEffect(() => {
    if (mapaVisivel) {
      carregarLocalizacoesVeiculos();
    }
  }, [mapaVisivel, filtro, viagemId, veiculosIds]);
  
  // Atualizar marcadores quando as localizações mudarem
  useEffect(() => {
    if (mapaRef.current && localizacoes.length > 0) {
      atualizarMarcadores();
    }
  }, [localizacoes]);
  
  // Funções
  const inicializarMapa = () => {
    // Se tivermos acesso à localização do usuário, centralizamos nela
    // Caso contrário, usamos uma localização padrão (Brasil central)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const opcoesMapa = {
          center: { lat: latitude, lng: longitude },
          zoom: 14,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapId: 'efb5b7ec5a1bc1c6'
        };
        
        const mapa = new window.google.maps.Map(
          document.getElementById('mapa-rastreamento'),
          opcoesMapa
        );
        
        mapaRef.current = mapa;
        setCentroMapa({ lat: latitude, lng: longitude });
        
        // Carregar localizações após inicializar o mapa
        carregarLocalizacoesVeiculos();
      },
      (erro) => {
        // Se o usuário não permitir acessar sua localização, usamos coordenadas do Brasil
        const opcoesMapa = {
          center: { lat: -15.77972, lng: -47.92972 }, // Brasília
          zoom: 5,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapId: 'efb5b7ec5a1bc1c6'
        };
        
        const mapa = new window.google.maps.Map(
          document.getElementById('mapa-rastreamento'),
          opcoesMapa
        );
        
        mapaRef.current = mapa;
        setCentroMapa({ lat: -15.77972, lng: -47.92972 });
        
        // Carregar localizações após inicializar o mapa
        carregarLocalizacoesVeiculos();
      }
    );
  };
  
  // Carregar localizações dos veículos
  const carregarLocalizacoesVeiculos = async () => {
    setIsLoading(true);
    setErro(null);
    
    try {
      let response;
      
      // Determinar qual API chamar com base nos parâmetros
      if (viagemId) {
        // Buscar localizações de veículos de uma viagem específica
        response = await api.get(`/monitoramento/viagens/${viagemId}`);
      } else if (veiculosIds && veiculosIds.length > 0) {
        // Buscar localizações de veículos específicos
        // Implementação pendente: API para consultar múltiplos veículos de uma vez
        const localizacoesPromises = veiculosIds.map(id => 
          api.get(`/monitoramento/veiculos/${id}`)
            .then(res => res.data.localizacao)
            .catch(erro => null)
        );
        
        const resultados = await Promise.all(localizacoesPromises);
        response = { data: { localizacoes: resultados.filter(loc => loc !== null) } };
      } else {
        // Buscar localizações de toda a frota
        const params = {};
        if (filtro !== 'todos') {
          params.status = filtro;
        }
        
        response = await api.get('/monitoramento/frota', { params });
      }
      
      const { localizacoes: novasLocalizacoes } = response.data;
      
      // Atualizar estado com as novas localizações
      setLocalizacoes(novasLocalizacoes);
      
      // Centralizar o mapa se tivermos localizações e nenhum veículo selecionado
      if (novasLocalizacoes.length > 0 && !veiculoSelecionado) {
        centralizarMapa(novasLocalizacoes);
      }
      
    } catch (erro) {
      console.error('Erro ao carregar localizações:', erro);
      setErro('Falha ao carregar as localizações dos veículos. Tente novamente.');
      
      toast({
        title: 'Erro ao carregar localizações',
        description: erro.response?.data?.mensagem || 'Não foi possível obter a localização dos veículos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Atualizar marcadores no mapa
  const atualizarMarcadores = () => {
    if (!mapaRef.current) return;
    
    // Remover marcadores antigos
    Object.values(marcadoresRef.current).forEach(marcador => {
      marcador.setMap(null);
    });
    
    // Limpar referência de marcadores
    marcadoresRef.current = {};
    
    // Adicionar novos marcadores
    localizacoes.forEach(loc => {
      if (!loc || !loc.latitude || !loc.longitude) return;
      
      const posicao = {
        lat: loc.latitude,
        lng: loc.longitude
      };
      
      // Determinar o ícone baseado no tipo de veículo e status
      const icone = {
        url: obterIconeMarcador(loc.veiculo?.tipo, loc.veiculo?.status),
        scaledSize: new window.google.maps.Size(32, 32),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(16, 32)
      };
      
      // Criar o marcador
      const marcador = new window.google.maps.Marker({
        position: posicao,
        map: mapaRef.current,
        title: `${loc.veiculo?.placa} - ${loc.veiculo?.modelo}`,
        icon: icone,
        optimized: true,
        animation: window.google.maps.Animation.DROP
      });
      
      // Adicionar informações ao marcador para referência
      marcador.veiculoInfo = {
        id: loc.veiculo?._id || loc.veiculo?.id,
        placa: loc.veiculo?.placa,
        modelo: loc.veiculo?.modelo,
        marca: loc.veiculo?.marca,
        status: loc.veiculo?.status,
        tipo: loc.veiculo?.tipo,
        localizacao: loc
      };
      
      // Adicionar evento de clique
      marcador.addListener('click', () => {
        setVeiculoSelecionado(marcador.veiculoInfo);
        onOpen();
        
        // Centralizar o mapa no veículo selecionado
        mapaRef.current.panTo(posicao);
        mapaRef.current.setZoom(15);
      });
      
      // Adicionar InfoWindow (janela de informação)
      const infoWindow = new window.google.maps.InfoWindow({
        content: criarConteudoInfoWindow(loc)
      });
      
      // Adicionar evento de hover para mostrar a janela de informação
      marcador.addListener('mouseover', () => {
        infoWindow.open(mapaRef.current, marcador);
      });
      
      marcador.addListener('mouseout', () => {
        infoWindow.close();
      });
      
      // Armazenar o marcador na referência
      const veiculoId = loc.veiculo?._id || loc.veiculo?.id;
      if (veiculoId) {
        marcadoresRef.current[veiculoId] = marcador;
      }
    });
  };
  
  // Centralizar o mapa baseado nas localizações disponíveis
  const centralizarMapa = (localizacoes) => {
    if (!mapaRef.current || !localizacoes || localizacoes.length === 0) return;
    
    if (localizacoes.length === 1) {
      // Se tivermos apenas uma localização, centralizar nela
      const loc = localizacoes[0];
      mapaRef.current.setCenter({
        lat: loc.latitude,
        lng: loc.longitude
      });
      mapaRef.current.setZoom(15);
    } else {
      // Se tivermos múltiplas localizações, ajustar o mapa para exibir todas
      const bounds = new window.google.maps.LatLngBounds();
      
      localizacoes.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          bounds.extend({
            lat: loc.latitude,
            lng: loc.longitude
          });
        }
      });
      
      mapaRef.current.fitBounds(bounds);
      
      // Limitar o zoom para não ser muito distante
      const listenerZoomChanged = window.google.maps.event.addListener(mapaRef.current, 'idle', () => {
        if (mapaRef.current.getZoom() > 16) {
          mapaRef.current.setZoom(16);
        }
        window.google.maps.event.removeListener(listenerZoomChanged);
      });
    }
  };
  
  // Obter ícone do marcador baseado no tipo de veículo e status
  const obterIconeMarcador = (tipo, status) => {
    // Definir cores baseadas no status
    let cor;
    switch (status) {
      case 'disponivel':
        cor = 'green';
        break;
      case 'em_viagem':
        cor = 'blue';
        break;
      case 'manutencao':
        cor = 'orange';
        break;
      case 'inativo':
        cor = 'red';
        break;
      default:
        cor = 'gray';
    }
    
    // Definir ícone baseado no tipo de veículo
    let icone;
    switch (tipo) {
      case 'onibus':
        icone = `https://maps.google.com/mapfiles/ms/icons/${cor}-dot.png`;
        break;
      case 'van':
        icone = `https://maps.google.com/mapfiles/ms/icons/${cor}-dot.png`;
        break;
      case 'ambulancia':
        icone = `https://maps.google.com/mapfiles/ms/icons/${cor}-dot.png`;
        break;
      case 'carro':
        icone = `https://maps.google.com/mapfiles/ms/icons/${cor}-dot.png`;
        break;
      default:
        icone = `https://maps.google.com/mapfiles/ms/icons/${cor}-dot.png`;
    }
    
    return icone;
  };
  
  // Criar conteúdo da janela de informação do marcador
  const criarConteudoInfoWindow = (loc) => {
    const veiculo = loc.veiculo;
    const dataAtualizada = new Date(loc.timestamp);
    const tempoDecorrido = Math.floor((new Date() - dataAtualizada) / 60000); // em minutos
    
    return `
      <div style="padding: 10px; max-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${veiculo?.placa} - ${veiculo?.modelo}</div>
        <div style="font-size: 12px; margin-bottom: 3px;">
          <strong>Velocidade:</strong> ${loc.velocidade || 0} km/h
        </div>
        <div style="font-size: 12px; margin-bottom: 3px;">
          <strong>Última atualização:</strong> ${tempoDecorrido} min atrás
        </div>
        ${loc.viagem ? `
          <div style="font-size: 12px; margin-top: 5px; padding-top: 5px; border-top: 1px solid #eee;">
            <strong>Em viagem para:</strong> ${loc.viagem.destino}
          </div>
        ` : ''}
      </div>
    `;
  };
  
  // Centralizar mapa em um veículo específico
  const centralizarEmVeiculo = (veiculoId) => {
    const marcador = marcadoresRef.current[veiculoId];
    if (marcador) {
      mapaRef.current.panTo(marcador.getPosition());
      mapaRef.current.setZoom(15);
      
      // Animar o marcador para destacá-lo
      marcador.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marcador.setAnimation(null);
      }, 2100);
    }
  };
  
  // Renderizar localização
  const renderizarLocalizacao = (loc) => {
    if (!loc || !loc.veiculo) return null;
    
    const veiculo = loc.veiculo;
    const dataAtualizada = new Date(loc.timestamp);
    const tempoDecorrido = Math.floor((new Date() - dataAtualizada) / 60000); // em minutos
    const estaDesatualizado = tempoDecorrido > 30; // Considera desatualizado se > 30 minutos
    
    return (
      <Flex
        key={veiculo._id || veiculo.id}
        p={3}
        borderWidth="1px"
        borderRadius="md"
        borderColor={estaDesatualizado ? 'orange.300' : 'gray.200'}
        bg={estaDesatualizado ? 'orange.50' : bgCard}
        _hover={{ bg: estaDesatualizado ? 'orange.100' : 'gray.50' }}
        direction="column"
        cursor="pointer"
        onClick={() => centralizarEmVeiculo(veiculo._id || veiculo.id)}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Badge
            colorScheme={getStatusColor(veiculo.status)}
            fontSize="sm"
            p={1}
            borderRadius="md"
          >
            {veiculo.placa}
          </Badge>
          
          <HStack>
            <Tooltip label="Visualizar no mapa" placement="top">
              <IconButton
                icon={<FiTarget />}
                size="sm"
                variant="ghost"
                aria-label="Localizar no mapa"
                onClick={(e) => {
                  e.stopPropagation();
                  centralizarEmVeiculo(veiculo._id || veiculo.id);
                }}
              />
            </Tooltip>
            
            <Tooltip label="Informações do veículo" placement="top">
              <IconButton
                icon={<FiInfo />}
                size="sm"
                variant="ghost"
                aria-label="Informações do veículo"
                onClick={(e) => {
                  e.stopPropagation();
                  setVeiculoSelecionado({
                    id: veiculo._id || veiculo.id,
                    placa: veiculo.placa,
                    modelo: veiculo.modelo,
                    marca: veiculo.marca,
                    status: veiculo.status,
                    tipo: veiculo.tipo,
                    localizacao: loc
                  });
                  onOpen();
                }}
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        <Text fontSize="sm" fontWeight="medium">{veiculo.modelo}</Text>
        
        <HStack spacing={1} mt={1} fontSize="xs" color="gray.500">
          <Icon as={FiClock} />
          <Text>
            {tempoDecorrido <= 0
              ? 'Agora'
              : `${tempoDecorrido} min atrás`
            }
          </Text>
        </HStack>
        
        <HStack spacing={1} mt={1} fontSize="xs" color="gray.500">
          <Icon as={FiNavigation} />
          <Text>{loc.velocidade || 0} km/h</Text>
        </HStack>
        
        {loc.viagem && (
          <HStack spacing={1} mt={1} fontSize="xs" color="blue.600">
            <Icon as={FiMapPin} />
            <Text>{loc.viagem.destino}</Text>
          </HStack>
        )}
        
        {estaDesatualizado && (
          <Flex align="center" mt={2} fontSize="xs" color="orange.500">
            <Icon as={FiAlertTriangle} mr={1} />
            <Text>Localização desatualizada</Text>
          </Flex>
        )}
      </Flex>
    );
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

  return (
    <Box>
      <Flex 
        justify="space-between" 
        align="center" 
        mb={4}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 0 }}
      >
        <Heading as="h3" size="md" display="flex" alignItems="center">
          <Icon as={FiMap} mr={2} />
          Monitoramento da Frota
        </Heading>
        
        <HStack>
          <Select 
            size="sm"
            width="150px"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            isDisabled={viagemId || isLoading}
          >
            <option value="todos">Todos os veículos</option>
            <option value="disponivel">Disponíveis</option>
            <option value="em_viagem">Em viagem</option>
            <option value="manutencao">Em manutenção</option>
            <option value="inativo">Inativos</option>
          </Select>
          
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar localização"
            onClick={carregarLocalizacoesVeiculos}
            isLoading={isLoading}
          />
          
          <Button 
            leftIcon={<FiEye />}
            onClick={() => setMapaVisivel(!mapaVisivel)}
          >
            {mapaVisivel ? 'Ocultar Mapa' : 'Mostrar Mapa'}
          </Button>
        </HStack>
      </Flex>
      
      {/* Exibir erro, se houver */}
      {erro && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {erro}
        </Alert>
      )}
      
      {/* Grid para mapa e lista de veículos */}
      <Flex 
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        height={mapaVisivel ? 'calc(100vh - 250px)' : 'auto'}
      >
        {/* Mapa (condicional) */}
        {mapaVisivel && (
          <Box 
            id="mapa-rastreamento"
            flex="3"
            borderRadius="md"
            overflow="hidden"
            borderWidth="1px"
            height="100%"
            position="relative"
          >
            {!mapaCarregado && (
              <Flex 
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(255, 255, 255, 0.8)"
                align="center"
                justify="center"
                zIndex="10"
                direction="column"
              >
                <Spinner size="xl" mb={4} />
                <Text>Carregando mapa...</Text>
              </Flex>
            )}
          </Box>
        )}
        
        {/* Lista de veículos */}
        <Stack 
          spacing={2}
          flex="1"
          height={mapaVisivel ? '100%' : 'auto'}
          overflowY={mapaVisivel ? 'auto' : 'visible'}
          pr={2}
        >
          {isLoading && localizacoes.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={10}>
              <Spinner size="lg" mb={4} />
              <Text>Carregando localizações...</Text>
            </Flex>
          ) : localizacoes.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              Nenhum veículo encontrado com os filtros atuais.
            </Alert>
          ) : (
            localizacoes.map(loc => renderizarLocalizacao(loc))
          )}
        </Stack>
      </Flex>
      
      {/* Modal de informações do veículo */}
      {veiculoSelecionado && (
        <InformacoesVeiculoModal 
          isOpen={isOpen}
          onClose={onClose}
          veiculo={veiculoSelecionado}
        />
      )}
    </Box>
  );
};

export default MapaRastreamentoVeiculos; 