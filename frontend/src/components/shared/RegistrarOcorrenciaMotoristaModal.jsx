import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
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
  Switch,
  FormHelperText,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box,
  Collapse,
  Divider,
  Text,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FiAlertTriangle, FiFileText, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';

/**
 * Modal para registrar ocorrência de um motorista
 * @param {boolean} isOpen - Estado do modal (aberto/fechado)
 * @param {Function} onClose - Função para fechar o modal
 * @param {string} motoristaId - ID do motorista
 * @param {string} nomeMotorista - Nome do motorista (para exibição)
 * @param {Function} onSucesso - Callback em caso de sucesso no registro
 */
const RegistrarOcorrenciaMotoristaModal = ({ isOpen, onClose, motoristaId, nomeMotorista, onSucesso }) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Schema de validação com Yup
  const validationSchema = Yup.object({
    tipo_ocorrencia: Yup.string().required('Tipo de ocorrência é obrigatório'),
    data: Yup.date().required('Data é obrigatória').max(new Date(), 'Data não pode ser futura'),
    gravidade: Yup.string().required('Gravidade é obrigatória'),
    descricao: Yup.string().required('Descrição é obrigatória').min(10, 'Forneça mais detalhes (mínimo 10 caracteres)'),
    local: Yup.string(),
    medidas_tomadas: Yup.string(),
    
    // Campos condicionais para consequências
    'consequencias.advertencia': Yup.boolean(),
    'consequencias.suspensao': Yup.boolean(),
    'consequencias.dias_suspensao': Yup.number()
      .when('consequencias.suspensao', {
        is: true,
        then: Yup.number().required('Informe quantos dias de suspensão').min(1, 'Mínimo de 1 dia'),
        otherwise: Yup.number().nullable()
      }),
    'consequencias.multa': Yup.boolean(),
    'consequencias.valor_multa': Yup.number()
      .when('consequencias.multa', {
        is: true,
        then: Yup.number().required('Informe o valor da multa').min(1, 'Valor mínimo de R$ 1,00'),
        otherwise: Yup.number().nullable()
      }),
    'consequencias.afastamento': Yup.boolean(),
    'consequencias.periodo_afastamento.inicio': Yup.date()
      .when('consequencias.afastamento', {
        is: true,
        then: Yup.date().required('Data de início do afastamento é obrigatória'),
        otherwise: Yup.date().nullable()
      }),
    'consequencias.periodo_afastamento.fim': Yup.date()
      .when('consequencias.afastamento', {
        is: true,
        then: Yup.date()
          .required('Data de término do afastamento é obrigatória')
          .min(
            Yup.ref('consequencias.periodo_afastamento.inicio'), 
            'Data de término deve ser posterior à data de início'
          ),
        otherwise: Yup.date().nullable()
      }),
    'consequencias.outras': Yup.string()
  });
  
  // Valores iniciais do formulário
  const initialValues = {
    tipo_ocorrencia: '',
    data: new Date().toISOString().split('T')[0], // Data atual formatada como YYYY-MM-DD
    gravidade: 'media',
    descricao: '',
    local: '',
    medidas_tomadas: '',
    
    // Consequências
    consequencias: {
      advertencia: false,
      suspensao: false,
      dias_suspensao: '',
      multa: false,
      valor_multa: '',
      afastamento: false,
      periodo_afastamento: {
        inicio: '',
        fim: ''
      },
      outras: ''
    }
  };
  
  // Função para registrar a ocorrência
  const registrarOcorrencia = async (values) => {
    setIsSubmitting(true);
    
    try {
      await api.post(`/frota/motoristas/${motoristaId}/ocorrencias`, values);
      
      toast({
        title: 'Ocorrência registrada',
        description: 'A ocorrência foi registrada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Fechar o modal e atualizar os dados
      onClose();
      if (onSucesso) {
        onSucesso();
      }
    } catch (erro) {
      console.error('Erro ao registrar ocorrência:', erro);
      toast({
        title: 'Erro ao registrar ocorrência',
        description: erro.response?.data?.mensagem || 'Não foi possível registrar a ocorrência',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para obter o alerta de gravidade
  const getAlertaGravidade = (gravidade) => {
    switch (gravidade) {
      case 'baixa':
        return { 
          colorScheme: 'green', 
          title: 'Gravidade Baixa', 
          description: 'Ocorrência de impacto menor, mas que deve ser documentada.'
        };
      case 'media':
        return { 
          colorScheme: 'yellow', 
          title: 'Gravidade Média', 
          description: 'Ocorrência com impacto moderado que requer atenção.'
        };
      case 'alta':
        return { 
          colorScheme: 'orange', 
          title: 'Gravidade Alta', 
          description: 'Ocorrência grave que pode demandar medidas disciplinares.'
        };
      case 'critica':
        return { 
          colorScheme: 'red', 
          title: 'Gravidade Crítica', 
          description: 'Ocorrência muito grave que exige ação imediata e pode afetar a continuidade do trabalho.'
        };
      default:
        return null;
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Registrar Ocorrência - {nomeMotorista || 'Motorista'}
        </ModalHeader>
        <ModalCloseButton />
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={registrarOcorrencia}
        >
          {({ values, errors, touched, isValid, dirty }) => {
            const alertaGravidade = getAlertaGravidade(values.gravidade);
            
            return (
              <Form>
                <ModalBody>
                  <Stack spacing={4}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem colSpan={1}>
                        <FormControl isRequired isInvalid={errors.tipo_ocorrencia && touched.tipo_ocorrencia}>
                          <FormLabel>Tipo de Ocorrência</FormLabel>
                          <Field as={Select} name="tipo_ocorrencia" placeholder="Selecione o tipo">
                            <option value="atraso">Atraso</option>
                            <option value="falta">Falta</option>
                            <option value="acidente">Acidente</option>
                            <option value="avaria_veiculo">Avaria no Veículo</option>
                            <option value="multa">Multa de Trânsito</option>
                            <option value="reclamacao_passageiro">Reclamação de Passageiro</option>
                            <option value="rota_incorreta">Rota Incorreta</option>
                            <option value="problema_documentacao">Problema com Documentação</option>
                            <option value="comportamento_inadequado">Comportamento Inadequado</option>
                            <option value="uso_inadequado_veiculo">Uso Inadequado do Veículo</option>
                            <option value="elogio">Elogio</option>
                            <option value="outros">Outros</option>
                          </Field>
                          <FormErrorMessage>{errors.tipo_ocorrencia}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={1}>
                        <FormControl isRequired isInvalid={errors.data && touched.data}>
                          <FormLabel>Data da Ocorrência</FormLabel>
                          <Field as={Input} type="date" name="data" max={new Date().toISOString().split('T')[0]} />
                          <FormErrorMessage>{errors.data}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                    </Grid>
                    
                    <FormControl isRequired isInvalid={errors.gravidade && touched.gravidade}>
                      <FormLabel>Gravidade</FormLabel>
                      <Field as={Select} name="gravidade">
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </Field>
                      <FormErrorMessage>{errors.gravidade}</FormErrorMessage>
                    </FormControl>
                    
                    {alertaGravidade && (
                      <Alert status="info" colorScheme={alertaGravidade.colorScheme} borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>{alertaGravidade.title}</AlertTitle>
                          {alertaGravidade.description}
                        </Box>
                      </Alert>
                    )}
                    
                    <FormControl isRequired isInvalid={errors.descricao && touched.descricao}>
                      <FormLabel>Descrição da Ocorrência</FormLabel>
                      <Field as={Textarea} name="descricao" placeholder="Descreva em detalhes o ocorrido" rows={4} />
                      <FormErrorMessage>{errors.descricao}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={errors.local && touched.local}>
                      <FormLabel>Local</FormLabel>
                      <Field as={Input} name="local" placeholder="Local onde ocorreu o incidente (opcional)" />
                      <FormErrorMessage>{errors.local}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={errors.medidas_tomadas && touched.medidas_tomadas}>
                      <FormLabel>Medidas Tomadas</FormLabel>
                      <Field as={Textarea} name="medidas_tomadas" placeholder="Quais medidas foram tomadas após o ocorrido? (opcional)" rows={3} />
                      <FormErrorMessage>{errors.medidas_tomadas}</FormErrorMessage>
                    </FormControl>
                    
                    <Divider my={2} />
                    
                    <Text fontWeight="bold" display="flex" alignItems="center">
                      <Icon as={FiAlertTriangle} mr={2} />
                      Consequências
                    </Text>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem colSpan={1}>
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb="0">Advertência</FormLabel>
                          <Field
                            as={Switch}
                            name="consequencias.advertencia"
                            id="consequencias.advertencia"
                            colorScheme="yellow"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={1}>
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb="0">Suspensão</FormLabel>
                          <Field
                            as={Switch}
                            name="consequencias.suspensao"
                            id="consequencias.suspensao"
                            colorScheme="orange"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={2}>
                        <Collapse in={values.consequencias.suspensao} animateOpacity>
                          <Box p={3} bg="gray.50" borderRadius="md" mb={3}>
                            <FormControl 
                              isRequired={values.consequencias.suspensao} 
                              isInvalid={errors.consequencias?.dias_suspensao && touched.consequencias?.dias_suspensao}
                            >
                              <FormLabel>Dias de Suspensão</FormLabel>
                              <Field name="consequencias.dias_suspensao">
                                {({ field, form }) => (
                                  <NumberInput
                                    {...field}
                                    min={1}
                                    onChange={(val) => form.setFieldValue(field.name, val)}
                                    isDisabled={!values.consequencias.suspensao}
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                )}
                              </Field>
                              <FormErrorMessage>{errors.consequencias?.dias_suspensao}</FormErrorMessage>
                            </FormControl>
                          </Box>
                        </Collapse>
                      </GridItem>
                      
                      <GridItem colSpan={1}>
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb="0">Multa</FormLabel>
                          <Field
                            as={Switch}
                            name="consequencias.multa"
                            id="consequencias.multa"
                            colorScheme="red"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={1}>
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb="0">Afastamento</FormLabel>
                          <Field
                            as={Switch}
                            name="consequencias.afastamento"
                            id="consequencias.afastamento"
                            colorScheme="red"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={2}>
                        <Collapse in={values.consequencias.multa} animateOpacity>
                          <Box p={3} bg="gray.50" borderRadius="md" mb={3}>
                            <FormControl 
                              isRequired={values.consequencias.multa} 
                              isInvalid={errors.consequencias?.valor_multa && touched.consequencias?.valor_multa}
                            >
                              <FormLabel>Valor da Multa (R$)</FormLabel>
                              <Field name="consequencias.valor_multa">
                                {({ field, form }) => (
                                  <NumberInput
                                    {...field}
                                    min={1}
                                    precision={2}
                                    step={10}
                                    onChange={(val) => form.setFieldValue(field.name, val)}
                                    isDisabled={!values.consequencias.multa}
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                )}
                              </Field>
                              <FormErrorMessage>{errors.consequencias?.valor_multa}</FormErrorMessage>
                            </FormControl>
                          </Box>
                        </Collapse>
                      </GridItem>
                      
                      <GridItem colSpan={2}>
                        <Collapse in={values.consequencias.afastamento} animateOpacity>
                          <Box p={3} bg="gray.50" borderRadius="md" mb={3}>
                            <Stack spacing={3}>
                              <FormControl 
                                isRequired={values.consequencias.afastamento} 
                                isInvalid={
                                  errors.consequencias?.periodo_afastamento?.inicio && 
                                  touched.consequencias?.periodo_afastamento?.inicio
                                }
                              >
                                <FormLabel>Data de Início do Afastamento</FormLabel>
                                <Field 
                                  as={Input} 
                                  type="date" 
                                  name="consequencias.periodo_afastamento.inicio"
                                  isDisabled={!values.consequencias.afastamento}
                                />
                                <FormErrorMessage>
                                  {errors.consequencias?.periodo_afastamento?.inicio}
                                </FormErrorMessage>
                              </FormControl>
                              
                              <FormControl 
                                isRequired={values.consequencias.afastamento} 
                                isInvalid={
                                  errors.consequencias?.periodo_afastamento?.fim && 
                                  touched.consequencias?.periodo_afastamento?.fim
                                }
                              >
                                <FormLabel>Data de Término do Afastamento</FormLabel>
                                <Field 
                                  as={Input} 
                                  type="date" 
                                  name="consequencias.periodo_afastamento.fim"
                                  isDisabled={!values.consequencias.afastamento}
                                />
                                <FormErrorMessage>
                                  {errors.consequencias?.periodo_afastamento?.fim}
                                </FormErrorMessage>
                              </FormControl>
                            </Stack>
                          </Box>
                        </Collapse>
                      </GridItem>
                      
                      <GridItem colSpan={2}>
                        <FormControl isInvalid={errors.consequencias?.outras && touched.consequencias?.outras}>
                          <FormLabel>Outras Consequências</FormLabel>
                          <Field 
                            as={Textarea} 
                            name="consequencias.outras" 
                            placeholder="Outras consequências ou observações adicionais"
                            rows={2}
                          />
                          <FormErrorMessage>{errors.consequencias?.outras}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </Stack>
                </ModalBody>
                
                <ModalFooter>
                  <Button 
                    variant="ghost" 
                    mr={3} 
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!isValid || !dirty}
                    leftIcon={<Icon as={FiFileText} />}
                  >
                    Registrar Ocorrência
                  </Button>
                </ModalFooter>
              </Form>
            );
          }}
        </Formik>
      </ModalContent>
    </Modal>
  );
};

export default RegistrarOcorrenciaMotoristaModal; 