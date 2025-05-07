import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Textarea,
  useToast,
  Icon,
  Text,
  Grid,
  GridItem,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  Divider,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  InputRightAddon,
  Checkbox,
  SimpleGrid
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  FiTruck, 
  FiCalendar, 
  FiFileText,
  FiCheckSquare,
  FiAlertTriangle
} from 'react-icons/fi';
import api from '../../services/api';

/**
 * Modal para cadastrar um novo veículo na frota
 * @param {boolean} isOpen - Estado do modal (aberto/fechado)
 * @param {Function} onClose - Função para fechar o modal
 * @param {Function} onSucesso - Callback em caso de sucesso no cadastro
 */
const CadastrarVeiculoModal = ({ isOpen, onClose, onSucesso, veiculoParaEditar = null }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  // Schema de validação com Yup
  const veiculoSchema = Yup.object().shape({
    placa: Yup.string().required('Placa é obrigatória')
      .matches(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Formato de placa inválido'),
    marca: Yup.string().required('Marca é obrigatória'),
    modelo: Yup.string().required('Modelo é obrigatório'),
    ano_fabricacao: Yup.number()
      .required('Ano de fabricação é obrigatório')
      .min(1900, 'Ano inválido')
      .max(new Date().getFullYear() + 1, 'Ano inválido'),
    ano_modelo: Yup.number()
      .required('Ano do modelo é obrigatório')
      .min(1900, 'Ano inválido')
      .max(new Date().getFullYear() + 2, 'Ano inválido'),
    tipo: Yup.string().required('Tipo é obrigatório'),
    capacidade_passageiros: Yup.number()
      .required('Capacidade é obrigatória')
      .min(1, 'Valor inválido'),
    combustivel: Yup.string().required('Combustível é obrigatório'),
    cor: Yup.string().required('Cor é obrigatória'),
    chassi: Yup.string().required('Chassi é obrigatório'),
    renavam: Yup.string().required('RENAVAM é obrigatório'),
    quilometragem_atual: Yup.number()
      .required('Quilometragem é obrigatória')
      .min(0, 'Valor inválido'),
    data_licenciamento: Yup.date()
      .required('Data de licenciamento é obrigatória'),
    possui_seguro: Yup.boolean(),
    data_vencimento_seguro: Yup.date()
      .when('possui_seguro', {
        is: true,
        then: (schema) => schema.required('Data de vencimento do seguro é obrigatória')
      }),
    observacoes: Yup.string()
  });
  
  // Valores iniciais do formulário
  const initialValues = {
    placa: '',
    marca: '',
    modelo: '',
    ano_fabricacao: new Date().getFullYear(),
    ano_modelo: new Date().getFullYear(),
    tipo: '',
    capacidade_passageiros: '',
    combustivel: '',
    cor: '',
    chassi: '',
    renavam: '',
    quilometragem_atual: 0,
    data_licenciamento: '',
    possui_seguro: false,
    data_vencimento_seguro: '',
    observacoes: ''
  };
  
  // Se estiver editando, preenche os valores iniciais
  const formValues = veiculoParaEditar ? {
    ...veiculoParaEditar,
    possui_seguro: !!veiculoParaEditar.data_vencimento_seguro,
    data_licenciamento: veiculoParaEditar.data_licenciamento 
      ? new Date(veiculoParaEditar.data_licenciamento).toISOString().split('T')[0]
      : '',
    data_vencimento_seguro: veiculoParaEditar.data_vencimento_seguro 
      ? new Date(veiculoParaEditar.data_vencimento_seguro).toISOString().split('T')[0]
      : ''
  } : initialValues;
  
  // Função para cadastrar o veículo
  const salvarVeiculo = async (values) => {
    setIsSubmitting(true);
    
    try {
      // Remove campo possui_seguro que não existe no modelo
      const dadosParaEnviar = { ...values };
      delete dadosParaEnviar.possui_seguro;
      
      // Se não possui seguro, remove campo de vencimento
      if (!values.possui_seguro) {
        dadosParaEnviar.data_vencimento_seguro = null;
      }

      let response;
      if (veiculoParaEditar) {
        // Edição de veículo existente
        response = await api.put(`/veiculos/${veiculoParaEditar.id}`, dadosParaEnviar);
        toast({
          title: 'Veículo atualizado',
          description: 'O veículo foi atualizado com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Cadastro de novo veículo
        response = await api.post('/veiculos', dadosParaEnviar);
        toast({
          title: 'Veículo cadastrado',
          description: 'O veículo foi cadastrado com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSucesso && onSucesso();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.mensagem || 'Não foi possível salvar o veículo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {veiculoParaEditar ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
        </ModalHeader>
        <ModalCloseButton />
        
        <Formik
          initialValues={formValues}
          validationSchema={veiculoSchema}
          onSubmit={salvarVeiculo}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <ModalBody>
                <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed">
                  <TabList>
                    <Tab>Dados Básicos</Tab>
                    <Tab>Documentação</Tab>
                    <Tab>Adicionais</Tab>
                  </TabList>

                  <TabPanels mt={4}>
                    {/* Tab 1 - Dados Básicos */}
                    <TabPanel p={0}>
                      <Stack spacing={4}>
                        <Field name="placa">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.placa && form.touched.placa}>
                              <FormLabel htmlFor="placa">Placa</FormLabel>
                              <Input 
                                {...field} 
                                id="placa" 
                                placeholder="AAA0A00" 
                                autoComplete="off"
                                isReadOnly={!!veiculoParaEditar}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  form.setFieldValue('placa', value);
                                }}
                                maxLength={7}
                              />
                              <FormErrorMessage>{form.errors.placa}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>

                        <SimpleGrid columns={2} spacing={4}>
                          <Field name="marca">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.marca && form.touched.marca}>
                                <FormLabel htmlFor="marca">Marca</FormLabel>
                                <Input {...field} id="marca" placeholder="Ex: Ford" />
                                <FormErrorMessage>{form.errors.marca}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name="modelo">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.modelo && form.touched.modelo}>
                                <FormLabel htmlFor="modelo">Modelo</FormLabel>
                                <Input {...field} id="modelo" placeholder="Ex: Transit" />
                                <FormErrorMessage>{form.errors.modelo}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </SimpleGrid>

                        <SimpleGrid columns={2} spacing={4}>
                          <Field name="ano_fabricacao">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.ano_fabricacao && form.touched.ano_fabricacao}>
                                <FormLabel htmlFor="ano_fabricacao">Ano de Fabricação</FormLabel>
                                <Input 
                                  {...field} 
                                  id="ano_fabricacao"
                                  type="number"
                                  min={1900}
                                  max={new Date().getFullYear() + 1}
                                />
                                <FormErrorMessage>{form.errors.ano_fabricacao}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name="ano_modelo">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.ano_modelo && form.touched.ano_modelo}>
                                <FormLabel htmlFor="ano_modelo">Ano do Modelo</FormLabel>
                                <Input 
                                  {...field} 
                                  id="ano_modelo"
                                  type="number"
                                  min={1900}
                                  max={new Date().getFullYear() + 2}
                                />
                                <FormErrorMessage>{form.errors.ano_modelo}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </SimpleGrid>

                        <SimpleGrid columns={2} spacing={4}>
                          <Field name="tipo">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.tipo && form.touched.tipo}>
                                <FormLabel htmlFor="tipo">Tipo</FormLabel>
                                <Select {...field} id="tipo" placeholder="Selecione">
                                  <option value="van">Van</option>
                                  <option value="micro_onibus">Micro-ônibus</option>
                                  <option value="onibus">Ônibus</option>
                                  <option value="carro">Carro</option>
                                  <option value="caminhonete">Caminhonete</option>
                                  <option value="ambulancia">Ambulância</option>
                                </Select>
                                <FormErrorMessage>{form.errors.tipo}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name="capacidade_passageiros">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.capacidade_passageiros && form.touched.capacidade_passageiros}>
                                <FormLabel htmlFor="capacidade_passageiros">Capacidade de Passageiros</FormLabel>
                                <InputGroup>
                                  <Input 
                                    {...field} 
                                    id="capacidade_passageiros"
                                    type="number"
                                    min={1}
                                  />
                                  <InputRightAddon children="Passageiros" />
                                </InputGroup>
                                <FormErrorMessage>{form.errors.capacidade_passageiros}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </SimpleGrid>

                        <SimpleGrid columns={2} spacing={4}>
                          <Field name="combustivel">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.combustivel && form.touched.combustivel}>
                                <FormLabel htmlFor="combustivel">Combustível</FormLabel>
                                <Select {...field} id="combustivel" placeholder="Selecione">
                                  <option value="gasolina">Gasolina</option>
                                  <option value="etanol">Etanol</option>
                                  <option value="flex">Flex</option>
                                  <option value="diesel">Diesel</option>
                                  <option value="diesel_s10">Diesel S10</option>
                                  <option value="eletrico">Elétrico</option>
                                  <option value="hibrido">Híbrido</option>
                                </Select>
                                <FormErrorMessage>{form.errors.combustivel}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>

                          <Field name="cor">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.cor && form.touched.cor}>
                                <FormLabel htmlFor="cor">Cor</FormLabel>
                                <Input {...field} id="cor" placeholder="Ex: Branco" />
                                <FormErrorMessage>{form.errors.cor}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        </SimpleGrid>
                      </Stack>
                    </TabPanel>

                    {/* Tab 2 - Documentação */}
                    <TabPanel p={0}>
                      <Stack spacing={4}>
                        <Field name="chassi">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.chassi && form.touched.chassi}>
                              <FormLabel htmlFor="chassi">Chassi</FormLabel>
                              <Input 
                                {...field} 
                                id="chassi" 
                                placeholder="Ex: 9BFZH54S6J8089776"
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  form.setFieldValue('chassi', value);
                                }}
                              />
                              <FormErrorMessage>{form.errors.chassi}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>

                        <Field name="renavam">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.renavam && form.touched.renavam}>
                              <FormLabel htmlFor="renavam">RENAVAM</FormLabel>
                              <Input {...field} id="renavam" placeholder="Ex: 00123456789" />
                              <FormErrorMessage>{form.errors.renavam}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>

                        <Field name="quilometragem_atual">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.quilometragem_atual && form.touched.quilometragem_atual}>
                              <FormLabel htmlFor="quilometragem_atual">Quilometragem Atual</FormLabel>
                              <InputGroup>
                                <Input 
                                  {...field} 
                                  id="quilometragem_atual"
                                  type="number"
                                  min={0}
                                />
                                <InputRightAddon children="Km" />
                              </InputGroup>
                              <FormErrorMessage>{form.errors.quilometragem_atual}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>

                        <Field name="data_licenciamento">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.data_licenciamento && form.touched.data_licenciamento}>
                              <FormLabel htmlFor="data_licenciamento">Data do Licenciamento</FormLabel>
                              <Input 
                                {...field} 
                                id="data_licenciamento"
                                type="date"
                              />
                              <FormErrorMessage>{form.errors.data_licenciamento}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>

                        <Field name="possui_seguro">
                          {({ field, form }) => (
                            <FormControl>
                              <Checkbox 
                                isChecked={field.value}
                                onChange={(e) => {
                                  setFieldValue('possui_seguro', e.target.checked);
                                  if (!e.target.checked) {
                                    setFieldValue('data_vencimento_seguro', '');
                                  }
                                }}
                              >
                                Possui seguro
                              </Checkbox>
                            </FormControl>
                          )}
                        </Field>

                        {values.possui_seguro && (
                          <Field name="data_vencimento_seguro">
                            {({ field, form }) => (
                              <FormControl isInvalid={form.errors.data_vencimento_seguro && form.touched.data_vencimento_seguro}>
                                <FormLabel htmlFor="data_vencimento_seguro">Vencimento do Seguro</FormLabel>
                                <Input 
                                  {...field} 
                                  id="data_vencimento_seguro"
                                  type="date"
                                />
                                <FormErrorMessage>{form.errors.data_vencimento_seguro}</FormErrorMessage>
                              </FormControl>
                            )}
                          </Field>
                        )}
                      </Stack>
                    </TabPanel>

                    {/* Tab 3 - Adicionais */}
                    <TabPanel p={0}>
                      <Stack spacing={4}>
                        <Field name="observacoes">
                          {({ field, form }) => (
                            <FormControl isInvalid={form.errors.observacoes && form.touched.observacoes}>
                              <FormLabel htmlFor="observacoes">Observações</FormLabel>
                              <Textarea 
                                {...field} 
                                id="observacoes"
                                placeholder="Informações adicionais sobre o veículo..."
                                size="md"
                                rows={5}
                              />
                              <FormErrorMessage>{form.errors.observacoes}</FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </Stack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </ModalBody>
              
              <ModalFooter>
                <Button
                  variant="outline"
                  mr={3}
                  onClick={onClose}
                  isDisabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Salvando..."
                >
                  {veiculoParaEditar ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};

export default CadastrarVeiculoModal; 