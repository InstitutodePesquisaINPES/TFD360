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
  AlertDescription
} from '@chakra-ui/react';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiTool, 
  FiXCircle,
  FiTruck
} from 'react-icons/fi';
import api from '../../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

/**
 * Modal para alterar o status de um veículo
 * @param {boolean} isOpen - Estado do modal (aberto/fechado)
 * @param {Function} onClose - Função para fechar o modal
 * @param {string} veiculoId - ID do veículo
 * @param {string} statusAtual - Status atual do veículo
 * @param {Function} onSucesso - Callback em caso de sucesso na alteração
 */
const AlterarStatusVeiculoModal = ({ isOpen, onClose, veiculoId, statusAtual, onSucesso }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Schema de validação
  const validationSchema = Yup.object({
    status: Yup.string()
      .required('Status é obrigatório'),
    motivo: Yup.string()
      .when('status', {
        is: (status) => ['em_manutencao', 'inativo'].includes(status),
        then: () => Yup.string().required('Motivo é obrigatório para este status'),
        otherwise: () => Yup.string()
      })
  });
  
  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      status: statusAtual || 'disponivel',
      motivo: ''
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
      await api.patch(`/frota/veiculos/${veiculoId}/status`, dados);
      
      toast({
        title: 'Status alterado',
        description: 'O status do veículo foi alterado com sucesso.',
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
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao alterar o status do veículo',
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
      case 'disponivel':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'em_viagem':
        return <Icon as={FiTruck} color="blue.500" />;
      case 'em_manutencao':
        return <Icon as={FiTool} color="orange.500" />;
      case 'inativo':
        return <Icon as={FiXCircle} color="red.500" />;
      default:
        return <Icon as={FiAlertTriangle} />;
    }
  };
  
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
        return 'Status Desconhecido';
    }
  };
  
  // Função para determinar se precisa mostrar campo de motivo
  const mostrarCampoMotivo = () => {
    return ['em_manutencao', 'inativo'].includes(formik.values.status);
  };
  
  // Função para exibir alerta baseado no status selecionado
  const getAlertaStatus = () => {
    switch (formik.values.status) {
      case 'disponivel':
        return {
          status: 'success',
          title: 'Veículo Disponível',
          message: 'O veículo estará disponível para agendamento de viagens.'
        };
      case 'em_viagem':
        return {
          status: 'info',
          title: 'Veículo em Viagem',
          message: 'O veículo está em viagem e não estará disponível para outros agendamentos até retornar.'
        };
      case 'em_manutencao':
        return {
          status: 'warning',
          title: 'Veículo em Manutenção',
          message: 'O veículo será marcado como em manutenção e não estará disponível para viagens.'
        };
      case 'inativo':
        return {
          status: 'error',
          title: 'Veículo Inativo',
          message: 'O veículo será marcado como inativo e não poderá ser agendado. Use este status para veículos fora de operação por tempo indeterminado.'
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
        <ModalHeader>Alterar Status do Veículo</ModalHeader>
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
                    <Radio value="disponivel">
                      <Stack direction="row" align="center">
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text>Disponível</Text>
                      </Stack>
                    </Radio>
                    <Radio value="em_viagem">
                      <Stack direction="row" align="center">
                        <Icon as={FiTruck} color="blue.500" />
                        <Text>Em Viagem</Text>
                      </Stack>
                    </Radio>
                    <Radio value="em_manutencao">
                      <Stack direction="row" align="center">
                        <Icon as={FiTool} color="orange.500" />
                        <Text>Em Manutenção</Text>
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
              
              {mostrarCampoMotivo() && (
                <FormControl 
                  isInvalid={formik.touched.motivo && formik.errors.motivo}
                  mt={3}
                >
                  <FormLabel>
                    Motivo 
                    {formik.values.status === 'em_manutencao' ? ' da Manutenção' : ' da Inativação'}
                  </FormLabel>
                  <Textarea
                    name="motivo"
                    placeholder={formik.values.status === 'em_manutencao' 
                      ? "Descreva o motivo da manutenção" 
                      : "Descreva o motivo da inativação"
                    }
                    value={formik.values.motivo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                  />
                  <FormErrorMessage>{formik.errors.motivo}</FormErrorMessage>
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
                formik.values.status === 'disponivel' ? 'green' :
                formik.values.status === 'em_viagem' ? 'blue' :
                formik.values.status === 'em_manutencao' ? 'orange' : 'red'
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

export default AlterarStatusVeiculoModal; 