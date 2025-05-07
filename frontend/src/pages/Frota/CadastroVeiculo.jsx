import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
  HStack,
  Image
} from '@chakra-ui/react';
import { 
  FiArrowLeft, 
  FiSave, 
  FiTruck, 
  FiCalendar, 
  FiUpload,
  FiUsers,
  FiDollarSign
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

/**
 * Componente para cadastro e edição de veículos
 */
const CadastroVeiculo = () => {
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(false);
  const [isEdicao, setIsEdicao] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  // Schema de validação do formulário
  const validationSchema = Yup.object({
    placa: Yup.string()
      .required('Placa é obrigatória')
      .matches(/^[A-Z]{3}\d[A-Z0-9]\d{2}$|^[A-Z]{3}\d{4}$/, 'Formato de placa inválido'),
    marca: Yup.string()
      .required('Marca é obrigatória'),
    modelo: Yup.string()
      .required('Modelo é obrigatório'),
    tipo: Yup.string()
      .required('Tipo de veículo é obrigatório'),
    capacidade_passageiros: Yup.number()
      .required('Capacidade de passageiros é obrigatória')
      .min(1, 'Capacidade mínima é de 1 passageiro')
      .max(100, 'Capacidade máxima é de 100 passageiros'),
    ano_fabricacao: Yup.number()
      .required('Ano de fabricação é obrigatório')
      .min(1950, 'Ano inválido')
      .max(new Date().getFullYear() + 1, 'Ano não pode ser no futuro'),
  });

  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      placa: '',
      marca: '',
      modelo: '',
      tipo: '',
      capacidade_passageiros: 5,
      ano_fabricacao: new Date().getFullYear(),
      ano_modelo: new Date().getFullYear(),
      renavam: '',
      chassi: '',
      quilometragem_atual: 0,
      cor: '',
      combustivel: '',
      adaptado_pcd: false,
      ar_condicionado: false,
      possui_maca: false,
      ativo: true,
      data_licenciamento: '',
      observacoes: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      await salvarVeiculo(values);
    }
  });

  // Carregar dados do veículo se for edição
  useEffect(() => {
    const carregarVeiculo = async () => {
      if (!id) return;
      
      setIsEdicao(true);
      setLoadingDados(true);
      
      try {
        const resposta = await api.get(`/frota/veiculos/${id}`);
        const veiculo = resposta.data.veiculo;
        
        // Formatar datas para o formato do input date
        const formatarData = (dataString) => {
          if (!dataString) return '';
          const data = new Date(dataString);
          return data.toISOString().split('T')[0];
        };
        
        // Preencher formulário com dados do veículo
        formik.setValues({
          placa: veiculo.placa || '',
          marca: veiculo.marca || '',
          modelo: veiculo.modelo || '',
          tipo: veiculo.tipo || '',
          capacidade_passageiros: veiculo.capacidade_passageiros || 5,
          ano_fabricacao: veiculo.ano_fabricacao || new Date().getFullYear(),
          ano_modelo: veiculo.ano_modelo || new Date().getFullYear(),
          renavam: veiculo.renavam || '',
          chassi: veiculo.chassi || '',
          quilometragem_atual: veiculo.quilometragem_atual || 0,
          cor: veiculo.cor || '',
          combustivel: veiculo.combustivel || '',
          adaptado_pcd: veiculo.adaptado_pcd || false,
          ar_condicionado: veiculo.ar_condicionado || false,
          possui_maca: veiculo.possui_maca || false,
          ativo: veiculo.ativo !== false, // default true
          data_licenciamento: formatarData(veiculo.data_licenciamento),
          observacoes: veiculo.observacoes || ''
        });
        
        // Se tiver foto, exibir preview
        if (veiculo.foto_url) {
          setFotoPreview(veiculo.foto_url);
        }
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
        setLoadingDados(false);
      }
    };
    
    carregarVeiculo();
  }, [id, navigate, toast]);

  // Função para salvar o veículo (criar ou atualizar)
  const salvarVeiculo = async (dados) => {
    setLoading(true);
    
    try {
      // Criar FormData para envio de arquivo
      const formData = new FormData();
      
      // Adicionar campos ao FormData
      Object.keys(dados).forEach(key => {
        if (key !== 'foto') {
          // Para campos booleanos, converter para string
          if (typeof dados[key] === 'boolean') {
            formData.append(key, dados[key] ? 'true' : 'false');
          } else {
            formData.append(key, dados[key]);
          }
        }
      });
      
      // Adicionar arquivo de foto se selecionado
      if (formik.values.foto) {
        formData.append('foto', formik.values.foto);
      }
      
      let resposta;
      
      // Criar ou atualizar veículo
      if (isEdicao) {
        resposta = await api.put(`/frota/veiculos/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        resposta = await api.post('/frota/veiculos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      toast({
        title: isEdicao ? 'Veículo atualizado' : 'Veículo cadastrado',
        description: resposta.data.mensagem,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirecionar para a lista de veículos
      navigate('/frota/veiculos');
    } catch (erro) {
      console.error('Erro ao salvar veículo:', erro);
      toast({
        title: 'Erro ao salvar',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao salvar o veículo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Atualizar campo no formulário
      formik.setFieldValue('foto', file);
      
      // Criar URL para preview
      const previewURL = URL.createObjectURL(file);
      setFotoPreview(previewURL);
    }
  };

  // Voltar para a lista de veículos
  const handleVoltar = () => {
    navigate('/frota/veiculos');
  };

  return (
    <Container maxW="container.lg" py={5}>
      <Stack spacing={6}>
        <Flex justify="space-between" align="center">
          <Heading size="lg">
            {isEdicao ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
          </Heading>
          <Button 
            leftIcon={<Icon as={FiArrowLeft} />}
            variant="outline"
            onClick={handleVoltar}
          >
            Voltar
          </Button>
        </Flex>

        {loadingDados ? (
          <Flex justify="center" my={10}>
            <Text>Carregando dados do veículo...</Text>
          </Flex>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={6} divider={<Divider />}>
              {/* Dados básicos */}
              <Box>
                <Heading size="md" mb={4}>
                  <Flex align="center">
                    <Icon as={FiTruck} mr={2} />
                    Dados Básicos
                  </Flex>
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isInvalid={formik.touched.placa && formik.errors.placa}>
                    <FormLabel>Placa</FormLabel>
                    <Input
                      name="placa"
                      value={formik.values.placa}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="AAA0A00 ou AAA0000"
                      isUppercase
                    />
                    <FormErrorMessage>{formik.errors.placa}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Renavam</FormLabel>
                    <Input
                      name="renavam"
                      value={formik.values.renavam}
                      onChange={formik.handleChange}
                      placeholder="00000000000"
                    />
                  </FormControl>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                  <FormControl isInvalid={formik.touched.marca && formik.errors.marca}>
                    <FormLabel>Marca</FormLabel>
                    <Input
                      name="marca"
                      value={formik.values.marca}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Ex: Volkswagen"
                    />
                    <FormErrorMessage>{formik.errors.marca}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={formik.touched.modelo && formik.errors.modelo}>
                    <FormLabel>Modelo</FormLabel>
                    <Input
                      name="modelo"
                      value={formik.values.modelo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Ex: Kombi"
                    />
                    <FormErrorMessage>{formik.errors.modelo}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Chassi</FormLabel>
                    <Input
                      name="chassi"
                      value={formik.values.chassi}
                      onChange={formik.handleChange}
                      placeholder="Número do chassi"
                      isUppercase
                    />
                  </FormControl>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                  <FormControl>
                    <FormLabel>Cor</FormLabel>
                    <Input
                      name="cor"
                      value={formik.values.cor}
                      onChange={formik.handleChange}
                      placeholder="Ex: Branco"
                    />
                  </FormControl>
                  
                  <FormControl isInvalid={formik.touched.ano_fabricacao && formik.errors.ano_fabricacao}>
                    <FormLabel>Ano de Fabricação</FormLabel>
                    <NumberInput
                      min={1950}
                      max={new Date().getFullYear() + 1}
                      value={formik.values.ano_fabricacao}
                      onChange={(valor) => formik.setFieldValue('ano_fabricacao', Number(valor))}
                    >
                      <NumberInputField 
                        name="ano_fabricacao"
                        onBlur={formik.handleBlur}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{formik.errors.ano_fabricacao}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Ano do Modelo</FormLabel>
                    <NumberInput
                      min={1950}
                      max={new Date().getFullYear() + 2}
                      value={formik.values.ano_modelo}
                      onChange={(valor) => formik.setFieldValue('ano_modelo', Number(valor))}
                    >
                      <NumberInputField name="ano_modelo" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Características */}
              <Box>
                <Heading size="md" mb={4}>
                  <Flex align="center">
                    <Icon as={FiUsers} mr={2} />
                    Características
                  </Flex>
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl isInvalid={formik.touched.tipo && formik.errors.tipo}>
                    <FormLabel>Tipo de Veículo</FormLabel>
                    <Select
                      name="tipo"
                      value={formik.values.tipo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">Selecione...</option>
                      <option value="carro">Carro</option>
                      <option value="van">Van</option>
                      <option value="micro_onibus">Micro-ônibus</option>
                      <option value="onibus">Ônibus</option>
                      <option value="ambulancia">Ambulância</option>
                      <option value="outro">Outro</option>
                    </Select>
                    <FormErrorMessage>{formik.errors.tipo}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Combustível</FormLabel>
                    <Select
                      name="combustivel"
                      value={formik.values.combustivel}
                      onChange={formik.handleChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diesel</option>
                      <option value="flex">Flex</option>
                      <option value="eletrico">Elétrico</option>
                      <option value="gas">Gás</option>
                      <option value="outro">Outro</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl isInvalid={formik.touched.capacidade_passageiros && formik.errors.capacidade_passageiros}>
                    <FormLabel>Capacidade de Passageiros</FormLabel>
                    <NumberInput
                      min={1}
                      max={100}
                      value={formik.values.capacidade_passageiros}
                      onChange={(valor) => formik.setFieldValue('capacidade_passageiros', Number(valor))}
                    >
                      <NumberInputField 
                        name="capacidade_passageiros"
                        onBlur={formik.handleBlur}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{formik.errors.capacidade_passageiros}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="adaptado_pcd" mb="0">
                      Adaptado para PCD
                    </FormLabel>
                    <Switch
                      id="adaptado_pcd"
                      name="adaptado_pcd"
                      isChecked={formik.values.adaptado_pcd}
                      onChange={formik.handleChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="ar_condicionado" mb="0">
                      Ar Condicionado
                    </FormLabel>
                    <Switch
                      id="ar_condicionado"
                      name="ar_condicionado"
                      isChecked={formik.values.ar_condicionado}
                      onChange={formik.handleChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="possui_maca" mb="0">
                      Possui Maca
                    </FormLabel>
                    <Switch
                      id="possui_maca"
                      name="possui_maca"
                      isChecked={formik.values.possui_maca}
                      onChange={formik.handleChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Documentação e Manutenção */}
              <Box>
                <Heading size="md" mb={4}>
                  <Flex align="center">
                    <Icon as={FiCalendar} mr={2} />
                    Documentação e Manutenção
                  </Flex>
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Quilometragem Atual</FormLabel>
                    <InputGroup>
                      <NumberInput
                        min={0}
                        value={formik.values.quilometragem_atual}
                        onChange={(valor) => formik.setFieldValue('quilometragem_atual', Number(valor))}
                        width="100%"
                      >
                        <NumberInputField name="quilometragem_atual" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Data do Licenciamento</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiCalendar} color="gray.300" />
                      </InputLeftElement>
                      <Input
                        name="data_licenciamento"
                        type="date"
                        value={formik.values.data_licenciamento}
                        onChange={formik.handleChange}
                      />
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
                
                <FormControl mt={4}>
                  <FormLabel>Observações</FormLabel>
                  <Textarea
                    name="observacoes"
                    value={formik.values.observacoes}
                    onChange={formik.handleChange}
                    placeholder="Informações adicionais sobre o veículo"
                    rows={4}
                  />
                </FormControl>
              </Box>
              
              {/* Foto do Veículo */}
              <Box>
                <Heading size="md" mb={4}>
                  <Flex align="center">
                    <Icon as={FiUpload} mr={2} />
                    Foto do Veículo
                  </Flex>
                </Heading>
                
                <HStack spacing={4} align="start">
                  <Box>
                    <FormControl>
                      <FormLabel>Selecionar Foto</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        border="none"
                        p={0}
                        sx={{
                          '::file-selector-button': {
                            border: 'none',
                            outline: 'none',
                            mr: 2,
                            color: 'white',
                            fontWeight: 'medium',
                            bg: 'blue.500',
                            padding: '8px 12px',
                            borderRadius: 'md',
                            cursor: 'pointer'
                          }
                        }}
                      />
                    </FormControl>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Formatos aceitos: JPG, PNG ou GIF. Tamanho máximo: 5MB.
                    </Text>
                  </Box>
                  
                  {fotoPreview && (
                    <Box 
                      borderWidth="1px" 
                      borderRadius="md" 
                      overflow="hidden"
                      width="150px"
                      height="150px"
                    >
                      <Image 
                        src={fotoPreview} 
                        alt="Preview da foto" 
                        objectFit="cover" 
                        width="100%" 
                        height="100%" 
                      />
                    </Box>
                  )}
                </HStack>
              </Box>
              
              {/* Status */}
              <Box>
                <Heading size="md" mb={4}>
                  <Flex align="center">
                    <Icon as={FiTruck} mr={2} />
                    Status do Veículo
                  </Flex>
                </Heading>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="ativo" mb="0">
                    Veículo Ativo
                  </FormLabel>
                  <Switch
                    id="ativo"
                    name="ativo"
                    isChecked={formik.values.ativo}
                    onChange={formik.handleChange}
                    colorScheme="green"
                    size="lg"
                  />
                </FormControl>
                
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Veículos inativos não aparecem para seleção em viagens.
                </Text>
              </Box>
              
              {/* Botões */}
              <Flex justify="flex-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  mr={3}
                  onClick={handleVoltar}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  leftIcon={<Icon as={FiSave} />}
                  isLoading={loading}
                >
                  {isEdicao ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </Flex>
            </Stack>
          </form>
        )}
      </Stack>
    </Container>
  );
};

// Componente auxiliar para grid em diferentes tamanhos de tela
const SimpleGrid = ({ children, columns, spacing }) => {
  return (
    <Flex 
      flexWrap="wrap" 
      gap={spacing} 
      justifyContent="flex-start"
    >
      {React.Children.map(children, child => {
        let width = "100%";
        
        // Cálculo do tamanho baseado nas colunas para diferentes tamanhos de tela
        if (columns.md && columns.md > 1) {
          width = { base: "100%", md: `calc(${100 / columns.md}% - ${spacing}px)` };
        }
        if (columns.lg && columns.lg > 1) {
          width = { ...width, lg: `calc(${100 / columns.lg}% - ${spacing}px)` };
        }
        
        return <Box width={width}>{child}</Box>;
      })}
    </Flex>
  );
};

export default CadastroVeiculo; 