import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useToast,
  Icon,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Input,
  Box
} from '@chakra-ui/react';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiBriefcase, 
  FiXCircle,
  FiCalendar
} from 'react-icons/fi';
import api from '../../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

/**
 * Modal para alterar o status de um motorista
 * @param {boolean} isOpen - Estado do modal (aberto/fechado)
 * @param {Function} onClose - Função para fechar o modal
 * @param {string} motoristaId - ID do motorista
 * @param {string} statusAtual - Status atual do motorista
 * @param {Function} onSucesso - Callback em caso de sucesso na alteração
 */
const AlterarStatusMotoristaModal = ({ isOpen, onClose, motoristaId, statusAtual, onSucesso }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Schema de validação
  const validationSchema = Yup.object({
    status: Yup.string()
      .required('Status é obrigatório'),
    motivo_inatividade: Yup.string()
      .when('status', {
        is: (status) => status === 'inativo',
        then: () => Yup.string().required('Motivo da inatividade é obrigatório'),
        otherwise: () => Yup.string()
      }),
    periodo_ferias: Yup.object()
      .when('status', {
        is: (status) => status === 'ferias',
        then: () => Yup.object({
          inicio: Yup.date().required('Data de início das férias é obrigatória'),
          fim: Yup.date()
            .required('Data de término das férias é obrigatória')
            .min(
              Yup.ref('inicio'), 
              'Data de término deve ser posterior à data de início'
            )
        }),
        otherwise: () => Yup.object()
      }),
    periodo_licenca: Yup.object()
      .when('status', {
        is: (status) => status === 'licenca',
        then: () => Yup.object({
          inicio: Yup.date().required('Data de início da licença é obrigatória'),
          fim: Yup.date()
            .required('Data de término da licença é obrigatória')
            .min(
              Yup.ref('inicio'), 
              'Data de término deve ser posterior à data de início'
            ),
          tipo: Yup.string().required('Tipo de licença é obrigatório')
        }),
        otherwise: () => Yup.object()
      })
  });
  
  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      status: statusAtual || 'ativo',
      motivo_inatividade: '',
      periodo_ferias: {
        inicio: '',
        fim: ''
      },
      periodo_licenca: {
        inicio: '',
        fim: '',
        tipo: ''
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      await alterarStatus(values);
    }
  });
  
  // Função para alterar o status na API
  const alterarStatus = async (dados) => {
    setLoading(true);
    
    try {
      await api.patch(`/frota/motoristas/${motoristaId}/status`, dados);
      
      toast({
        title: 'Status alterado',
        description: 'O status do motorista foi alterado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      if (onSucesso) {
        onSucesso();
      }
      
      onClose();
      
    } catch (erro) {
      console.error('Erro ao alterar status:', erro);
      toast({
        title: 'Erro ao alterar status',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao alterar o status do motorista',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Funções para renderizar ícones e mensagens de acordo com o status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ativo':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'ferias':
        return <Icon as={FiBriefcase} color="blue.500" />;
      case 'licenca':
        return <Icon as={FiCalendar} color="orange.500" />;
      case 'inativo':
        return <Icon as={FiXCircle} color="red.500" />;
      default:
        return <Icon as={FiAlertTriangle} />;
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'ferias':
        return 'Férias';
      case 'licenca':
        return 'Licença';
      case 'inativo':
        return 'Inativo';
      default:
        return 'Status Desconhecido';
    }
  };
  
  // Função para exibir alerta baseado no status selecionado
  const getAlertaStatus = () => {
    switch (formik.values.status) {
      case 'ativo':
        return {
          status: 'success',
          title: 'Motorista Ativo',
          message: 'O motorista estará disponível para agendamento de viagens.'
        };
      case 'ferias':
        return {
          status: 'info',
          title: 'Motorista em Férias',
          message: 'O motorista estará em férias durante o período informado e não disponível para agendamentos.'
        };
      case 'licenca':
        return {
          status: 'warning',
          title: 'Motorista em Licença',
          message: 'O motorista estará em licença durante o período informado e não disponível para agendamentos.'
        };
      case 'inativo':
        return {
          status: 'error',
          title: 'Motorista Inativo',
          message: 'O motorista será marcado como inativo e não poderá ser agendado. Use este status para motoristas que não estão mais trabalhando na instituição.'
        };
      default:
        return null;
    }
  };

  const alerta = getAlertaStatus();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Alterar Status do Motorista</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isInvalid={formik.touched.status && formik.errors.status}>
                <FormLabel>Status</FormLabel>
                <RadioGroup
                  value={formik.values.status}
                  onChange={(value) => formik.setFieldValue('status', value)}
                >
                  <Stack spacing={3}>
                    <Radio value="ativo">
                      <Stack direction="row" align="center">
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text>Ativo</Text>
                      </Stack>
                    </Radio>
                    <Radio value="ferias">
                      <Stack direction="row" align="center">
                        <Icon as={FiBriefcase} color="blue.500" />
                        <Text>Férias</Text>
                      </Stack>
                    </Radio>
                    <Radio value="licenca">
                      <Stack direction="row" align="center">
                        <Icon as={FiCalendar} color="orange.500" />
                        <Text>Licença</Text>
                      </Stack>
                    </Radio>
                    <Radio value="inativo">
                      <Stack direction="row" align="center">
                        <Icon as={FiXCircle} color="red.500" />
                        <Text>Inativo</Text>
                      </Stack>
                    </Radio>
                  </Stack>
                </RadioGroup>
                <FormErrorMessage>{formik.errors.status}</FormErrorMessage>
              </FormControl>
              
              {alerta && (
                <Alert status={alerta.status} borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    {alerta.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Campos para férias */}
              {formik.values.status === 'ferias' && (
                <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" mb={2} fontSize="sm">Período das Férias</Text>
                  <Stack spacing={3}>
                    <FormControl 
                      isRequired 
                      isInvalid={
                        formik.touched.periodo_ferias?.inicio && formik.errors.periodo_ferias?.inicio
                      }
                    >
                      <FormLabel fontSize="sm">Data de Início</FormLabel>
                      <Input
                        type="date"
                        name="periodo_ferias.inicio"
                        value={formik.values.periodo_ferias.inicio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        size="sm"
                      />
                      <FormErrorMessage>{formik.errors.periodo_ferias?.inicio}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl 
                      isRequired 
                      isInvalid={
                        formik.touched.periodo_ferias?.fim && formik.errors.periodo_ferias?.fim
                      }
                    >
                      <FormLabel fontSize="sm">Data de Término</FormLabel>
                      <Input
                        type="date"
                        name="periodo_ferias.fim"
                        value={formik.values.periodo_ferias.fim}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        size="sm"
                      />
                      <FormErrorMessage>{formik.errors.periodo_ferias?.fim}</FormErrorMessage>
                    </FormControl>
                  </Stack>
                </Box>
              )}
              
              {/* Campos para licença */}
              {formik.values.status === 'licenca' && (
                <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" mb={2} fontSize="sm">Detalhes da Licença</Text>
                  <Stack spacing={3}>
                    <FormControl 
                      isRequired 
                      isInvalid={
                        formik.touched.periodo_licenca?.tipo && formik.errors.periodo_licenca?.tipo
                      }
                    >
                      <FormLabel fontSize="sm">Tipo de Licença</FormLabel>
                      <RadioGroup
                        value={formik.values.periodo_licenca.tipo}
                        onChange={(value) => formik.setFieldValue('periodo_licenca.tipo', value)}
                      >
                        <Stack direction="row" wrap="wrap">
                          <Radio value="medica">Médica</Radio>
                          <Radio value="maternidade">Maternidade/Paternidade</Radio>
                          <Radio value="capacitacao">Capacitação</Radio>
                          <Radio value="outra">Outra</Radio>
                        </Stack>
                      </RadioGroup>
                      <FormErrorMessage>{formik.errors.periodo_licenca?.tipo}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl 
                      isRequired 
                      isInvalid={
                        formik.touched.periodo_licenca?.inicio && formik.errors.periodo_licenca?.inicio
                      }
                    >
                      <FormLabel fontSize="sm">Data de Início</FormLabel>
                      <Input
                        type="date"
                        name="periodo_licenca.inicio"
                        value={formik.values.periodo_licenca.inicio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        size="sm"
                      />
                      <FormErrorMessage>{formik.errors.periodo_licenca?.inicio}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl 
                      isRequired 
                      isInvalid={
                        formik.touched.periodo_licenca?.fim && formik.errors.periodo_licenca?.fim
                      }
                    >
                      <FormLabel fontSize="sm">Data de Término</FormLabel>
                      <Input
                        type="date"
                        name="periodo_licenca.fim"
                        value={formik.values.periodo_licenca.fim}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        size="sm"
                      />
                      <FormErrorMessage>{formik.errors.periodo_licenca?.fim}</FormErrorMessage>
                    </FormControl>
                  </Stack>
                </Box>
              )}
              
              {/* Campo para inatividade */}
              {formik.values.status === 'inativo' && (
                <FormControl 
                  isRequired
                  isInvalid={formik.touched.motivo_inatividade && formik.errors.motivo_inatividade}
                  mt={3}
                >
                  <FormLabel>Motivo da Inatividade</FormLabel>
                  <Textarea
                    name="motivo_inatividade"
                    placeholder="Descreva o motivo da inativação do motorista"
                    value={formik.values.motivo_inatividade}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                  />
                  <FormErrorMessage>{formik.errors.motivo_inatividade}</FormErrorMessage>
                </FormControl>
              )}
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme={
                formik.values.status === 'ativo' ? 'green' :
                formik.values.status === 'ferias' ? 'blue' :
                formik.values.status === 'licenca' ? 'orange' : 'red'
              }
              type="submit"
              isLoading={loading}
              leftIcon={getStatusIcon(formik.values.status)}
            >
              Confirmar Alteração
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AlterarStatusMotoristaModal; 