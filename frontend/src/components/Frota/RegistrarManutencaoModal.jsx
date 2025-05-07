import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  RadioGroup,
  Radio,
  Stack,
  Box,
  Divider,
  Flex,
  Text,
  Alert,
  AlertIcon,
  useToast,
  VStack,
  HStack,
  Grid,
  GridItem,
  Badge,
  useColorModeValue,
  Switch
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FiTool, FiDollarSign, FiCalendar, FiClock, FiAlertTriangle, FiUpload, FiX, FiPlus } from 'react-icons/fi';
import api from '../../services/api';
import InputMask from 'react-input-mask';

// Schema de validação com Yup
const manutencaoSchema = Yup.object().shape({
  tipo_manutencao: Yup.string()
    .required('O tipo de manutenção é obrigatório'),
  subtipo_manutencao: Yup.string()
    .required('O subtipo de manutenção é obrigatório'),
  data: Yup.date()
    .required('A data da manutenção é obrigatória')
    .max(new Date(), 'A data não pode ser no futuro'),
  km_registrado: Yup.number()
    .required('A quilometragem é obrigatória')
    .positive('A quilometragem deve ser um valor positivo'),
  descricao: Yup.string()
    .required('A descrição do serviço é obrigatória')
    .min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  custo: Yup.number()
    .required('O custo é obrigatório')
    .min(0, 'O custo não pode ser negativo'),
  local_realizacao: Yup.string()
    .required('O local de realização é obrigatório'),
  responsavel_tecnico: Yup.string()
    .required('O responsável técnico é obrigatório'),
  proximo_servico_km: Yup.number()
    .nullable()
    .positive('A quilometragem para o próximo serviço deve ser um valor positivo'),
  proximo_servico_data: Yup.date()
    .nullable()
    .min(new Date(), 'A data para o próximo serviço deve ser no futuro'),
  notas_adicionais: Yup.string()
});

/**
 * Modal para registro de manutenções preventivas e corretivas de veículos
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Estado do modal (aberto/fechado)
 * @param {Function} props.onClose - Função para fechar o modal
 * @param {Object} props.veiculo - Dados do veículo a receber manutenção
 * @param {Function} props.onSuccess - Callback a ser chamado após registro bem-sucedido
 */
const RegistrarManutencaoModal = ({ isOpen, onClose, veiculo, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const bgBox = useColorModeValue('gray.50', 'gray.700');
  const [mostrarProximaManutencao, setMostrarProximaManutencao] = useState(false);
  const [arquivos, setArquivos] = useState([]);
  
  // Valores iniciais do formulário
  const initialValues = {
    tipo_manutencao: '',
    subtipo_manutencao: '',
    data: new Date().toISOString().split('T')[0],
    km_registrado: veiculo?.quilometragem_atual || '',
    descricao: '',
    custo: '',
    local_realizacao: '',
    responsavel_tecnico: '',
    proximo_servico_km: '',
    proximo_servico_data: '',
    notas_adicionais: ''
  };
  
  // Opções para tipo de manutenção
  const tiposManutencao = [
    { value: 'preventiva', label: 'Preventiva' },
    { value: 'corretiva', label: 'Corretiva' },
    { value: 'revisao', label: 'Revisão Programada' }
  ];
  
  // Opções de subtipos para cada tipo de manutenção
  const subtiposManutencao = {
    preventiva: [
      { value: 'troca_oleo', label: 'Troca de Óleo' },
      { value: 'troca_filtros', label: 'Troca de Filtros' },
      { value: 'alinhamento_balanceamento', label: 'Alinhamento e Balanceamento' },
      { value: 'troca_correia', label: 'Troca de Correia' },
      { value: 'troca_pastilhas_freio', label: 'Troca de Pastilhas de Freio' },
      { value: 'outro', label: 'Outro' }
    ],
    corretiva: [
      { value: 'sistema_eletrico', label: 'Sistema Elétrico' },
      { value: 'motor', label: 'Motor' },
      { value: 'transmissao', label: 'Transmissão' },
      { value: 'suspensao', label: 'Suspensão' },
      { value: 'freios', label: 'Freios' },
      { value: 'outro', label: 'Outro' }
    ],
    revisao: [
      { value: 'revisao_10000', label: 'Revisão 10.000 Km' },
      { value: 'revisao_20000', label: 'Revisão 20.000 Km' },
      { value: 'revisao_30000', label: 'Revisão 30.000 Km' },
      { value: 'revisao_40000', label: 'Revisão 40.000 Km' },
      { value: 'revisao_50000', label: 'Revisão 50.000 Km' },
      { value: 'outro', label: 'Outro' }
    ]
  };
  
  // Função para registrar a manutenção
  const registrarManutencao = async (values, { resetForm }) => {
    setIsLoading(true);
    
    try {
      // Preparar dados para envio
      const dadosManutencao = {
        ...values,
        veiculo_id: veiculo.id,
        data: new Date(values.data).toISOString(),
        proximo_servico_data: values.proximo_servico_data 
          ? new Date(values.proximo_servico_data).toISOString() 
          : null
      };
      
      // Enviar requisição para a API
      const response = await api.post(`/frota/veiculos/${veiculo.id}/manutencoes`, dadosManutencao);
      
      toast({
        title: 'Manutenção registrada com sucesso',
        description: 'Os dados da manutenção foram salvos no sistema',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(response.data.manutencao);
      }
      
      // Resetar formulário e fechar modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Erro ao registrar manutenção:', error);
      
      toast({
        title: 'Erro ao registrar manutenção',
        description: error.response?.data?.mensagem || 'Não foi possível registrar a manutenção no sistema',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setArquivos(prevArquivos => [...prevArquivos, ...files]);
  };

  const removerArquivo = (index) => {
    setArquivos(prevArquivos => {
      const novosArquivos = [...prevArquivos];
      novosArquivos.splice(index, 1);
      return novosArquivos;
    });
  };

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    const subtipo = '';
    setIsLoading(true);
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader display="flex" alignItems="center">
          <FiTool style={{ marginRight: '8px' }} />
          Registrar Manutenção - {veiculo?.placa}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {!veiculo ? (
            <Alert status="error">
              <AlertIcon />
              Dados do veículo não disponíveis. Não é possível registrar a manutenção.
            </Alert>
          ) : (
            <Box mb={4}>
              <Flex 
                p={3} 
                bg={bgBox} 
                borderRadius="md" 
                mb={4}
                align="center"
              >
                <Box flex="1">
                  <Text fontSize="sm">Veículo: <strong>{veiculo.marca} {veiculo.modelo}</strong></Text>
                  <Text fontSize="sm">Placa: <strong>{veiculo.placa}</strong></Text>
                  <Text fontSize="sm">Quilometragem atual: <strong>{veiculo.quilometragem_atual?.toLocaleString('pt-BR') || 'N/D'} km</strong></Text>
                </Box>
                <Badge colorScheme="blue" p={2}>
                  {veiculo.tipo || 'Veículo'}
                </Badge>
              </Flex>
              
              <Formik
                initialValues={initialValues}
                validationSchema={manutencaoSchema}
                onSubmit={registrarManutencao}
              >
                {({ isSubmitting, values, errors, touched, setFieldValue }) => (
                  <Form>
                    <VStack spacing={4} align="stretch">
                      {/* Tipo e subtipo de manutenção */}
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem>
                          <Field name="tipo_manutencao">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.tipo_manutencao && form.touched.tipo_manutencao}>
                                <FormLabel>Tipo de Manutenção</FormLabel>
                                <Select 
                                  {...field} 
                                  placeholder="Selecione o tipo"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Resetar subtipo quando mudar o tipo
                                    setFieldValue('subtipo_manutencao', '');
                                  }}
                                >
                                  {tiposManutencao.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                      {tipo.label}
                                    </option>
                                  ))}
                                </Select>
                                <FormErrorMessage>{form.errors.tipo_manutencao}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                        
                        <GridItem>
                          <Field name="subtipo_manutencao">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.subtipo_manutencao && form.touched.subtipo_manutencao}>
                                <FormLabel>Subtipo</FormLabel>
                                <Select 
                                  {...field} 
                                  placeholder="Selecione o subtipo"
                                  isDisabled={!values.tipo_manutencao}
                                >
                                  {values.tipo_manutencao && subtiposManutencao[values.tipo_manutencao]?.map(subtipo => (
                                    <option key={subtipo.value} value={subtipo.value}>
                                      {subtipo.label}
                                    </option>
                                  ))}
                                </Select>
                                <FormErrorMessage>{form.errors.subtipo_manutencao}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                      </Grid>
                      
                      {/* Data e quilometragem */}
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem>
                          <Field name="data">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.data && form.touched.data}>
                                <FormLabel>Data da Manutenção</FormLabel>
                                <Input
                                  {...field}
                                  type="date"
                                  max={new Date().toISOString().split('T')[0]}
                                />
                                <FormErrorMessage>{form.errors.data}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                        
                        <GridItem>
                          <Field name="km_registrado">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.km_registrado && form.touched.km_registrado}>
                                <FormLabel>Quilometragem Registrada</FormLabel>
                                <InputGroup>
                                  <NumberInput
                                    w="100%"
                                    min={0}
                                    value={field.value}
                                    onChange={(value) => setFieldValue('km_registrado', value)}
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </InputGroup>
                                <FormErrorMessage>{form.errors.km_registrado}</FormErrorMessage>
                                {Number(values.km_registrado) < Number(veiculo.quilometragem_atual) && (
                                  <FormHelperText color="orange.500">
                                    <FiAlertTriangle style={{ display: 'inline', marginRight: '4px' }} />
                                    Valor menor que a quilometragem atual do veículo.
                                  </FormHelperText>
                                )}
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                      </Grid>
                      
                      {/* Descrição do serviço */}
                      <Field name="descricao">
                        {({ field, form }) => (
                          <FormControl isInvalid={form.errors.descricao && form.touched.descricao}>
                            <FormLabel>Descrição do Serviço</FormLabel>
                            <Textarea 
                              {...field} 
                              placeholder="Descreva detalhadamente o serviço realizado" 
                              rows={3}
                            />
                            <FormErrorMessage>{form.errors.descricao}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      {/* Custo e local */}
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem>
                          <Field name="custo">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.custo && form.touched.custo}>
                                <FormLabel>Custo (R$)</FormLabel>
                                <InputGroup>
                                  <InputLeftAddon>R$</InputLeftAddon>
                                  <NumberInput
                                    w="100%"
                                    min={0}
                                    precision={2}
                                    step={10}
                                    value={field.value}
                                    onChange={(value) => setFieldValue('custo', value)}
                                  >
                                    <NumberInputField borderLeftRadius={0} />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </InputGroup>
                                <FormErrorMessage>{form.errors.custo}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                        
                        <GridItem>
                          <Field name="local_realizacao">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.local_realizacao && form.touched.local_realizacao}>
                                <FormLabel>Local de Realização</FormLabel>
                                <Input
                                  {...field}
                                  placeholder="Nome da oficina/posto/concessionária"
                                />
                                <FormErrorMessage>{form.errors.local_realizacao}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </GridItem>
                      </Grid>
                      
                      {/* Responsável técnico */}
                      <Field name="responsavel_tecnico">
                        {({ field, form }) => (
                          <FormControl isInvalid={form.errors.responsavel_tecnico && form.touched.responsavel_tecnico}>
                            <FormLabel>Responsável Técnico</FormLabel>
                            <Input
                              {...field}
                              placeholder="Nome do mecânico ou técnico responsável"
                            />
                            <FormErrorMessage>{form.errors.responsavel_tecnico}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      
                      <Divider my={2} />
                      
                      {/* Programação do próximo serviço */}
                      <Box>
                        <Text fontWeight="bold" mb={2}>Programação do Próximo Serviço</Text>
                        
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <GridItem>
                            <Field name="proximo_servico_km">
                              {({ field, form }) => (
                                <FormControl isInvalid={form.errors.proximo_servico_km && form.touched.proximo_servico_km}>
                                  <FormLabel>Próxima Manutenção (km)</FormLabel>
                                  <NumberInput
                                    min={Number(values.km_registrado) || 0}
                                    value={field.value}
                                    onChange={(value) => setFieldValue('proximo_servico_km', value)}
                                  >
                                    <NumberInputField placeholder="Quilometragem para o próximo serviço" />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                  <FormErrorMessage>{form.errors.proximo_servico_km}</FormErrorMessage>
                                </FormControl>
                              )}
                            </Field>
                          </GridItem>
                          
                          <GridItem>
                            <Field name="proximo_servico_data">
                              {({ field, form }) => (
                                <FormControl isInvalid={form.errors.proximo_servico_data && form.touched.proximo_servico_data}>
                                  <FormLabel>Data do Próximo Serviço</FormLabel>
                                  <Input
                                    {...field}
                                    type="date"
                                    min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                                    placeholder="Data para o próximo serviço"
                                  />
                                  <FormErrorMessage>{form.errors.proximo_servico_data}</FormErrorMessage>
                                </FormControl>
                              )}
                            </Field>
                          </GridItem>
                        </Grid>
                      </Box>
                      
                      {/* Notas adicionais */}
                      <Field name="notas_adicionais">
                        {({ field, form }) => (
                          <FormControl isInvalid={form.errors.notas_adicionais && form.touched.notas_adicionais}>
                            <FormLabel>Notas Adicionais</FormLabel>
                            <Textarea 
                              {...field} 
                              placeholder="Informações adicionais ou observações sobre a manutenção"
                              rows={2}
                            />
                            <FormErrorMessage>{form.errors.notas_adicionais}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                    </VStack>
                    
                    <ModalFooter px={0}>
                      <Button mr={3} onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button 
                        colorScheme="blue" 
                        type="submit" 
                        isLoading={isSubmitting || isLoading}
                        leftIcon={<FiTool />}
                      >
                        Registrar Manutenção
                      </Button>
                    </ModalFooter>
                  </Form>
                )}
              </Formik>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RegistrarManutencaoModal; 