import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Text,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCar,
  FaUser,
  FaSave,
  FaInfoCircle,
  FaClock,
  FaHospital,
} from 'react-icons/fa';
import { viagemService } from '../../services/viagem.service';

/**
 * Página para criar ou editar uma viagem
 */
const CriarViagem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [validacoes, setValidacoes] = useState({});
  const [veiculos, setVeiculos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  const [carregandoMotoristas, setCarregandoMotoristas] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    data_viagem: '',
    horario_saida: '',
    horario_previsto_retorno: '',
    cidade_destino: '',
    estado_destino: '',
    unidade_saude: '',
    endereco_unidade: '',
    tipo_tratamento: '',
    veiculo: '',
    motorista: '',
    capacidade_veiculo: 0,
    observacoes: ''
  });

  // Carregar viagem para edição
  const carregarViagem = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setErro(null);
      
      const viagem = await viagemService.obterViagemPorId(id);
      
      // Verificar se a viagem pode ser editada
      if (['concluida', 'cancelada'].includes(viagem.status)) {
        setErro(`Esta viagem não pode ser editada porque está ${viagem.status === 'concluida' ? 'concluída' : 'cancelada'}.`);
        return;
      }
      
      // Converter a data para o formato do input
      const dataViagem = new Date(viagem.data_viagem);
      const dataFormatada = dataViagem.toISOString().substring(0, 10);
      
      setFormData({
        data_viagem: dataFormatada,
        horario_saida: viagem.horario_saida,
        horario_previsto_retorno: viagem.horario_previsto_retorno || '',
        cidade_destino: viagem.cidade_destino,
        estado_destino: viagem.estado_destino,
        unidade_saude: viagem.unidade_saude,
        endereco_unidade: viagem.endereco_unidade || '',
        tipo_tratamento: viagem.tipo_tratamento,
        veiculo: viagem.veiculo?._id || '',
        motorista: viagem.motorista?._id || '',
        capacidade_veiculo: viagem.capacidade_veiculo,
        observacoes: viagem.observacoes || ''
      });
      
      setModoEdicao(true);
    } catch (error) {
      console.error("Erro ao carregar viagem:", error);
      setErro(error.message || "Não foi possível carregar os dados da viagem.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Carregar veículos e motoristas ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar veículos
        setCarregandoVeiculos(true);
        const fetchVeiculos = await fetch('/api/veiculos');
        const veiculosData = await fetchVeiculos.json();
        setVeiculos(veiculosData);
        setCarregandoVeiculos(false);
        
        // Carregar motoristas
        setCarregandoMotoristas(true);
        const fetchMotoristas = await fetch('/api/motoristas');
        const motoristasData = await fetchMotoristas.json();
        setMotoristas(motoristasData);
        setCarregandoMotoristas(false);
        
        // Se for edição, carregar dados da viagem
        if (id) {
          carregarViagem();
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar a lista de veículos e motoristas.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }
    };
    
    carregarDados();
  }, [id, carregarViagem, toast]);

  // Função para atualizar o estado do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar mensagem de erro do campo específico
    if (validacoes[name]) {
      setValidacoes(prev => ({ ...prev, [name]: null }));
    }
    
    // Se o veículo mudar, buscar e atualizar a capacidade
    if (name === 'veiculo' && value) {
      const veiculoSelecionado = veiculos.find(v => v._id === value);
      if (veiculoSelecionado) {
        setFormData(prev => ({ 
          ...prev, 
          capacidade_veiculo: veiculoSelecionado.capacidade 
        }));
      }
    }
  };

  // Validar o formulário antes de enviar
  const validarFormulario = () => {
    const erros = {};
    const dataAtual = new Date();
    dataAtual.setHours(0, 0, 0, 0);
    
    // Validar data
    if (!formData.data_viagem) {
      erros.data_viagem = "Data da viagem é obrigatória";
    } else {
      const dataViagem = new Date(formData.data_viagem);
      dataViagem.setHours(0, 0, 0, 0);
      
      if (dataViagem < dataAtual) {
        erros.data_viagem = "Data da viagem não pode ser no passado";
      }
    }
    
    // Validar demais campos obrigatórios
    if (!formData.horario_saida) erros.horario_saida = "Horário de saída é obrigatório";
    if (!formData.cidade_destino) erros.cidade_destino = "Cidade de destino é obrigatória";
    if (!formData.estado_destino) erros.estado_destino = "Estado de destino é obrigatório";
    if (formData.estado_destino && formData.estado_destino.length !== 2) {
      erros.estado_destino = "Use a sigla do estado com 2 caracteres";
    }
    if (!formData.unidade_saude) erros.unidade_saude = "Unidade de saúde é obrigatória";
    if (!formData.tipo_tratamento) erros.tipo_tratamento = "Tipo de tratamento é obrigatório";
    if (!formData.veiculo) erros.veiculo = "Veículo é obrigatório";
    if (!formData.motorista) erros.motorista = "Motorista é obrigatório";
    if (!formData.capacidade_veiculo || formData.capacidade_veiculo < 1) {
      erros.capacidade_veiculo = "Capacidade deve ser pelo menos 1";
    }
    
    setValidacoes(erros);
    return Object.keys(erros).length === 0;
  };

  // Função para salvar a viagem
  const salvarViagem = async () => {
    if (!validarFormulario()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, corrija os erros antes de prosseguir.",
        status: "error",
        duration: 4000,
        isClosable: true
      });
      return;
    }
    
    try {
      setSalvando(true);
      
      if (modoEdicao) {
        // Atualizar viagem existente
        await viagemService.atualizarViagem(id, formData);
        
        toast({
          title: "Viagem atualizada",
          description: "A viagem foi atualizada com sucesso.",
          status: "success",
          duration: 3000,
          isClosable: true
        });
      } else {
        // Criar nova viagem
        const novaViagem = await viagemService.criarViagem(formData);
        
        toast({
          title: "Viagem criada",
          description: "A viagem foi criada com sucesso.",
          status: "success",
          duration: 3000,
          isClosable: true
        });
        
        // Redirecionar para a página de detalhes
        navigate(`/viagens/${novaViagem._id}`);
        return;
      }
      
      // Voltar para a lista de viagens
      navigate('/viagens');
    } catch (error) {
      console.error("Erro ao salvar viagem:", error);
      toast({
        title: "Erro ao salvar viagem",
        description: error.message || "Ocorreu um erro ao salvar a viagem. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSalvando(false);
    }
  };

  // Exibir carregamento
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" align="center" justify="center" py={16}>
          <Spinner size="xl" mb={4} color="blue.500" />
          <Text>Carregando dados da viagem...</Text>
        </Flex>
      </Container>
    );
  }

  // Exibir mensagem de erro
  if (erro) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert 
          status="error" 
          variant="solid" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          textAlign="center" 
          py={8}
        >
          <AlertIcon boxSize={8} mr={0} mb={4} />
          <AlertTitle mb={2} fontSize="lg">Erro ao carregar viagem</AlertTitle>
          <AlertDescription maxW="lg">{erro}</AlertDescription>
          <Button mt={4} colorScheme="red" onClick={() => navigate('/viagens')}>
            Voltar para Lista de Viagens
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Cabeçalho */}
      <Flex mb={6} alignItems="center" justifyContent="space-between">
        <HStack spacing={4}>
          <Button leftIcon={<Icon as={FaArrowLeft} />} onClick={() => navigate('/viagens')}>
            Voltar
          </Button>
          <Heading size="lg">
            {modoEdicao ? 'Editar Viagem' : 'Nova Viagem'}
          </Heading>
        </HStack>
      </Flex>
      
      {/* Formulário */}
      <Box bg="white" p={6} borderRadius="md" shadow="md" mb={6}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          {/* Primeira coluna */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Heading size="md" mb={2}>
                Informações Básicas
              </Heading>
              
              {/* Data da Viagem */}
              <FormControl isRequired isInvalid={validacoes.data_viagem}>
                <FormLabel>Data da Viagem</FormLabel>
                <InputGroup>
                  <Input
                    type="date"
                    name="data_viagem"
                    value={formData.data_viagem}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <InputRightElement>
                    <Icon as={FaCalendarAlt} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                {validacoes.data_viagem && (
                  <FormErrorMessage>{validacoes.data_viagem}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Horário de Saída */}
              <FormControl isRequired isInvalid={validacoes.horario_saida}>
                <FormLabel>Horário de Saída</FormLabel>
                <InputGroup>
                  <Input
                    type="time"
                    name="horario_saida"
                    value={formData.horario_saida}
                    onChange={handleInputChange}
                  />
                  <InputRightElement>
                    <Icon as={FaClock} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                {validacoes.horario_saida && (
                  <FormErrorMessage>{validacoes.horario_saida}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Horário Previsto de Retorno */}
              <FormControl>
                <FormLabel>Horário Previsto de Retorno</FormLabel>
                <InputGroup>
                  <Input
                    type="time"
                    name="horario_previsto_retorno"
                    value={formData.horario_previsto_retorno}
                    onChange={handleInputChange}
                  />
                  <InputRightElement>
                    <Icon as={FaClock} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>Opcional</FormHelperText>
              </FormControl>
              
              {/* Cidade de Destino */}
              <FormControl isRequired isInvalid={validacoes.cidade_destino}>
                <FormLabel>Cidade de Destino</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    name="cidade_destino"
                    value={formData.cidade_destino}
                    onChange={handleInputChange}
                    placeholder="Ex: Salvador"
                  />
                  <InputRightElement>
                    <Icon as={FaMapMarkerAlt} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                {validacoes.cidade_destino && (
                  <FormErrorMessage>{validacoes.cidade_destino}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Estado de Destino */}
              <FormControl isRequired isInvalid={validacoes.estado_destino}>
                <FormLabel>Estado de Destino (UF)</FormLabel>
                <Select
                  name="estado_destino"
                  value={formData.estado_destino}
                  onChange={handleInputChange}
                  placeholder="Selecione o estado"
                >
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </Select>
                {validacoes.estado_destino && (
                  <FormErrorMessage>{validacoes.estado_destino}</FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </GridItem>
          
          {/* Segunda coluna */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Heading size="md" mb={2}>
                Detalhes do Tratamento e Transporte
              </Heading>
              
              {/* Unidade de Saúde */}
              <FormControl isRequired isInvalid={validacoes.unidade_saude}>
                <FormLabel>Unidade de Saúde</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    name="unidade_saude"
                    value={formData.unidade_saude}
                    onChange={handleInputChange}
                    placeholder="Ex: Hospital Universitário"
                  />
                  <InputRightElement>
                    <Icon as={FaHospital} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
                {validacoes.unidade_saude && (
                  <FormErrorMessage>{validacoes.unidade_saude}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Endereço da Unidade */}
              <FormControl>
                <FormLabel>Endereço da Unidade</FormLabel>
                <Input
                  type="text"
                  name="endereco_unidade"
                  value={formData.endereco_unidade}
                  onChange={handleInputChange}
                  placeholder="Ex: Rua das Flores, 123"
                />
                <FormHelperText>Opcional</FormHelperText>
              </FormControl>
              
              {/* Tipo de Tratamento */}
              <FormControl isRequired isInvalid={validacoes.tipo_tratamento}>
                <FormLabel>Tipo de Tratamento</FormLabel>
                <Select
                  name="tipo_tratamento"
                  value={formData.tipo_tratamento}
                  onChange={handleInputChange}
                  placeholder="Selecione o tipo de tratamento"
                >
                  <option value="consulta">Consulta</option>
                  <option value="exame">Exame</option>
                  <option value="cirurgia">Cirurgia</option>
                  <option value="retorno">Retorno</option>
                  <option value="outros">Outros</option>
                </Select>
                {validacoes.tipo_tratamento && (
                  <FormErrorMessage>{validacoes.tipo_tratamento}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Veículo */}
              <FormControl isRequired isInvalid={validacoes.veiculo}>
                <FormLabel>Veículo</FormLabel>
                <Select
                  name="veiculo"
                  value={formData.veiculo}
                  onChange={handleInputChange}
                  placeholder={carregandoVeiculos ? "Carregando veículos..." : "Selecione o veículo"}
                  isDisabled={carregandoVeiculos}
                >
                  {veiculos.map(veiculo => (
                    <option key={veiculo._id} value={veiculo._id}>
                      {veiculo.placa} - {veiculo.modelo} ({veiculo.capacidade} lugares)
                    </option>
                  ))}
                </Select>
                {validacoes.veiculo && (
                  <FormErrorMessage>{validacoes.veiculo}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Motorista */}
              <FormControl isRequired isInvalid={validacoes.motorista}>
                <FormLabel>Motorista</FormLabel>
                <Select
                  name="motorista"
                  value={formData.motorista}
                  onChange={handleInputChange}
                  placeholder={carregandoMotoristas ? "Carregando motoristas..." : "Selecione o motorista"}
                  isDisabled={carregandoMotoristas}
                >
                  {motoristas.map(motorista => (
                    <option key={motorista._id} value={motorista._id}>
                      {motorista.nome} - CNH: {motorista.categoria_cnh}
                    </option>
                  ))}
                </Select>
                {validacoes.motorista && (
                  <FormErrorMessage>{validacoes.motorista}</FormErrorMessage>
                )}
              </FormControl>
              
              {/* Capacidade do Veículo */}
              <FormControl isRequired isInvalid={validacoes.capacidade_veiculo}>
                <FormLabel>
                  Capacidade do Veículo
                  <Tooltip 
                    label="Número máximo de pessoas (pacientes + acompanhantes) que o veículo pode transportar"
                    placement="top"
                  >
                    <Icon as={FaInfoCircle} ml={2} color="blue.500" />
                  </Tooltip>
                </FormLabel>
                <NumberInput 
                  min={1} 
                  value={formData.capacidade_veiculo} 
                  onChange={(valueString) => setFormData(prev => ({ ...prev, capacidade_veiculo: parseInt(valueString) }))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                {validacoes.capacidade_veiculo && (
                  <FormErrorMessage>{validacoes.capacidade_veiculo}</FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </GridItem>
        </Grid>
        
        <Divider my={6} />
        
        {/* Observações */}
        <FormControl>
          <FormLabel>Observações</FormLabel>
          <Textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            placeholder="Informações adicionais sobre a viagem..."
            rows={4}
          />
          <FormHelperText>Opcional</FormHelperText>
        </FormControl>
        
        <Flex justify="flex-end" mt={6}>
          <Button
            leftIcon={<Icon as={FaSave} />}
            colorScheme="blue"
            size="lg"
            onClick={salvarViagem}
            isLoading={salvando}
            loadingText={modoEdicao ? "Salvando..." : "Criando..."}
          >
            {modoEdicao ? 'Salvar Alterações' : 'Criar Viagem'}
          </Button>
        </Flex>
      </Box>
      
      {/* Informações adicionais */}
      {!modoEdicao && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Próximos passos</AlertTitle>
            <AlertDescription>
              Após criar a viagem, você poderá adicionar pacientes e gerenciar a lista de espera.
            </AlertDescription>
          </Box>
        </Alert>
      )}
    </Container>
  );
};

export default CriarViagem;