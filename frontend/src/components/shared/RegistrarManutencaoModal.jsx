import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  IconButton,
  HStack,
  VStack,
  Flex,
  Text,
  Icon,
  useToast,
  Stack,
  Divider,
  Checkbox,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  FiCalendar, 
  FiSettings, 
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiTool
} from 'react-icons/fi';
import api from '../../services/api';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { formatarMoeda } from '../../utils/formatters';

/**
 * Modal para registrar manutenção de veículo
 * @param {boolean} isOpen - Estado do modal (aberto/fechado)
 * @param {Function} onClose - Função para fechar o modal
 * @param {string} veiculoId - ID do veículo
 * @param {number} quilometragemAtual - Quilometragem atual do veículo
 * @param {Function} onSucesso - Callback em caso de sucesso no registro
 */
const RegistrarManutencaoModal = ({ isOpen, onClose, veiculoId, quilometragemAtual, onSucesso }) => {
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState([{ descricao: '', valor: 0 }]);
  const [pecas, setPecas] = useState([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);
  const toast = useToast();
  
  // Schema de validação
  const validationSchema = Yup.object({
    tipo_manutencao: Yup.string()
      .required('Tipo de manutenção é obrigatório'),
    data: Yup.date()
      .required('Data da manutenção é obrigatória')
      .max(new Date(), 'Data não pode ser no futuro'),
    km_registrado: Yup.number()
      .required('Quilometragem registrada é obrigatória')
      .min(0, 'Quilometragem não pode ser negativa')
      .min(quilometragemAtual || 0, 'Quilometragem deve ser maior ou igual à atual'),
    descricao: Yup.string()
      .required('Descrição da manutenção é obrigatória')
  });
  
  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      tipo_manutencao: '',
      data: new Date().toISOString().split('T')[0],
      km_registrado: quilometragemAtual || 0,
      proxima_manutencao_km: '',
      descricao: '',
      local: '',
      custo: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      await registrarManutencao(values);
    }
  });
  
  // Função para registrar manutenção na API
  const registrarManutencao = async (dados) => {
    setLoading(true);
    
    try {
      // Calcular valor total se não estiver definido
      if (!dados.custo || dados.custo === '') {
        let valorTotal = 0;
        
        // Somar valor dos serviços
        servicos.forEach(servico => {
          if (servico.valor) {
            valorTotal += Number(servico.valor);
          }
        });
        
        // Somar valor das peças
        pecas.forEach(peca => {
          if (peca.quantidade && peca.valor_unitario) {
            valorTotal += Number(peca.quantidade) * Number(peca.valor_unitario);
          }
        });
        
        dados.custo = valorTotal;
      }
      
      // Incluir serviços e peças no payload
      const payload = {
        ...dados,
        servicos_realizados: servicos.filter(s => s.descricao),
        pecas_substituidas: pecas.filter(p => p.descricao),
      };
      
      // Enviar para a API
      await api.post(`/frota/veiculos/${veiculoId}/manutencoes`, payload);
      
      // Notificar sucesso
      toast({
        title: 'Manutenção registrada',
        description: 'Os dados da manutenção foram registrados com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Resetar formulário
      formik.resetForm();
      setServicos([{ descricao: '', valor: 0 }]);
      setPecas([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);
      
      // Chamar callback de sucesso
      if (onSucesso) {
        onSucesso();
      }
      
      // Fechar modal
      onClose();
      
    } catch (erro) {
      console.error('Erro ao registrar manutenção:', erro);
      toast({
        title: 'Erro ao registrar manutenção',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao registrar a manutenção',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Adicionar novo serviço
  const adicionarServico = () => {
    setServicos([...servicos, { descricao: '', valor: 0 }]);
  };
  
  // Remover serviço
  const removerServico = (index) => {
    const novosServicos = [...servicos];
    novosServicos.splice(index, 1);
    setServicos(novosServicos);
  };
  
  // Atualizar serviço
  const atualizarServico = (index, campo, valor) => {
    const novosServicos = [...servicos];
    novosServicos[index][campo] = valor;
    setServicos(novosServicos);
  };
  
  // Adicionar nova peça
  const adicionarPeca = () => {
    setPecas([...pecas, { descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };
  
  // Remover peça
  const removerPeca = (index) => {
    const novasPecas = [...pecas];
    novasPecas.splice(index, 1);
    setPecas(novasPecas);
  };
  
  // Atualizar peça
  const atualizarPeca = (index, campo, valor) => {
    const novasPecas = [...pecas];
    novasPecas[index][campo] = valor;
    setPecas(novasPecas);
  };
  
  // Calcular valor total
  const calcularValorTotal = () => {
    let valorTotal = 0;
    
    // Somar valor dos serviços
    servicos.forEach(servico => {
      if (servico.valor) {
        valorTotal += Number(servico.valor);
      }
    });
    
    // Somar valor das peças
    pecas.forEach(peca => {
      if (peca.quantidade && peca.valor_unitario) {
        valorTotal += Number(peca.quantidade) * Number(peca.valor_unitario);
      }
    });
    
    return valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Formatar valor para exibição
  const formatarValor = (valor) => {
    if (!valor) return '';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Registrar Manutenção</ModalHeader>
        <ModalCloseButton />
        
        <Formik
          initialValues={{ ...formik.initialValues, quilometragem: quilometragemAtual }}
          validationSchema={validationSchema}
          onSubmit={registrarManutencao}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <ModalBody>
                <Stack spacing={4}>
                  {/* Tipo de manutenção */}
                  <Field name="tipo_manutencao">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.tipo_manutencao && form.touched.tipo_manutencao}>
                        <FormLabel htmlFor="tipo_manutencao">Tipo de Manutenção</FormLabel>
                        <Select
                          {...field}
                          id="tipo_manutencao"
                          placeholder="Selecione o tipo"
                          icon={<FiTool />}
                        >
                          <option value="preventiva">Preventiva</option>
                          <option value="corretiva">Corretiva</option>
                          <option value="revisao_periodica">Revisão Periódica</option>
                          <option value="troca_oleo">Troca de Óleo</option>
                          <option value="troca_pneus">Troca de Pneus</option>
                          <option value="higienizacao">Higienização</option>
                          <option value="manutencao_ar_condicionado">Manutenção do Ar-condicionado</option>
                          <option value="manutencao_eletrica">Manutenção Elétrica</option>
                          <option value="conclusao_manutencao">Conclusão de Manutenção</option>
                          <option value="outros">Outros</option>
                        </Select>
                        <FormErrorMessage>{form.errors.tipo_manutencao}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  
                  {/* Data da manutenção */}
                  <Field name="data">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.data && form.touched.data}>
                        <FormLabel htmlFor="data">Data da Manutenção</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiCalendar} color="gray.300" />
                          </InputLeftElement>
                          <Input
                            {...field}
                            id="data"
                            type="date"
                          />
                        </InputGroup>
                        <FormErrorMessage>{form.errors.data}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  
                  {/* Quilometragem */}
                  <Field name="km_registrado">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.km_registrado && form.touched.km_registrado}>
                        <FormLabel htmlFor="km_registrado">Quilometragem Registrada</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiSettings} color="gray.300" />
                          </InputLeftElement>
                          <NumberInput
                            min={0}
                            value={field.value}
                            onChange={(valor) => form.setFieldValue(field.name, Number(valor))}
                            width="100%"
                          >
                            <NumberInputField
                              id="km_registrado"
                              onBlur={field.onBlur}
                              pl={10}
                            />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                        <FormErrorMessage>{form.errors.km_registrado}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  
                  {/* Próxima manutenção */}
                  <Field name="proxima_manutencao_km">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.proxima_manutencao_km && form.touched.proxima_manutencao_km}>
                        <FormLabel htmlFor="proxima_manutencao_km">Próxima Manutenção (KM)</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiClock} color="gray.300" />
                          </InputLeftElement>
                          <NumberInput
                            min={values.km_registrado}
                            value={field.value}
                            onChange={(valor) => form.setFieldValue(field.name, Number(valor))}
                            width="100%"
                          >
                            <NumberInputField
                              id="proxima_manutencao_km"
                              pl={10}
                            />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                        <FormErrorMessage>{form.errors.proxima_manutencao_km}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  
                  {/* Descrição */}
                  <Field name="descricao">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.descricao && form.touched.descricao}>
                        <FormLabel htmlFor="descricao">Descrição da Manutenção</FormLabel>
                        <Textarea
                          {...field}
                          id="descricao"
                          placeholder="Descreva o serviço realizado"
                          rows={3}
                        />
                        <FormErrorMessage>{form.errors.descricao}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  
                  {/* Local e custo */}
                  <Flex 
                    direction={{ base: 'column', md: 'row' }}
                    gap={4}
                  >
                    <Field name="local">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.local && form.touched.local}>
                          <FormLabel htmlFor="local">Local</FormLabel>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none">
                              <Icon as={FiMapPin} color="gray.300" />
                            </InputLeftElement>
                            <Input
                              {...field}
                              id="local"
                              placeholder="Oficina ou local da manutenção"
                            />
                          </InputGroup>
                          <FormErrorMessage>{form.errors.local}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    
                    <Field name="custo">
                      {({ field, form }) => (
                        <FormControl isInvalid={form.errors.custo && form.touched.custo}>
                          <FormLabel htmlFor="custo">Custo Total (R$)</FormLabel>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none">
                              <Icon as={FiDollarSign} color="gray.300" />
                            </InputLeftElement>
                            <NumberInput
                              min={0}
                              value={field.value}
                              onChange={(valor) => form.setFieldValue(field.name, Number(valor))}
                              width="100%"
                            >
                              <NumberInputField
                                id="custo"
                                placeholder="Opcional"
                                pl={10}
                              />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </InputGroup>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Se não informado, será calculado pela soma dos serviços e peças
                          </Text>
                          <FormErrorMessage>{form.errors.custo}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Flex>
                  
                  {/* Serviços Realizados */}
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <FormLabel m={0}>Serviços Realizados</FormLabel>
                      <Button
                        size="xs"
                        leftIcon={<Icon as={FiPlus} />}
                        colorScheme="blue"
                        onClick={adicionarServico}
                      >
                        Adicionar Serviço
                      </Button>
                    </Flex>
                    
                    <VStack spacing={2} align="stretch">
                      {servicos.map((servico, index) => (
                        <Flex key={index} gap={2}>
                          <FormControl flex="2">
                            <Input
                              placeholder="Descrição do serviço"
                              value={servico.descricao}
                              onChange={(e) => atualizarServico(index, 'descricao', e.target.value)}
                              size="sm"
                            />
                          </FormControl>
                          
                          <FormControl flex="1">
                            <NumberInput
                              min={0}
                              value={servico.valor}
                              onChange={(valor) => atualizarServico(index, 'valor', Number(valor))}
                              size="sm"
                            >
                              <NumberInputField
                                placeholder="R$ Valor"
                                textAlign="right"
                              />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          
                          <IconButton
                            aria-label="Remover serviço"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            isDisabled={servicos.length <= 1}
                            onClick={() => removerServico(index)}
                          />
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                  
                  {/* Peças Substituídas */}
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <FormLabel m={0}>Peças Substituídas</FormLabel>
                      <Button
                        size="xs"
                        leftIcon={<Icon as={FiPlus} />}
                        colorScheme="blue"
                        onClick={adicionarPeca}
                      >
                        Adicionar Peça
                      </Button>
                    </Flex>
                    
                    <VStack spacing={2} align="stretch">
                      {pecas.map((peca, index) => (
                        <Flex key={index} gap={2}>
                          <FormControl flex="3">
                            <Input
                              placeholder="Descrição da peça"
                              value={peca.descricao}
                              onChange={(e) => atualizarPeca(index, 'descricao', e.target.value)}
                              size="sm"
                            />
                          </FormControl>
                          
                          <FormControl flex="1">
                            <NumberInput
                              min={1}
                              value={peca.quantidade}
                              onChange={(valor) => atualizarPeca(index, 'quantidade', Number(valor))}
                              size="sm"
                            >
                              <NumberInputField
                                placeholder="Qtd"
                                textAlign="center"
                              />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          
                          <FormControl flex="1">
                            <NumberInput
                              min={0}
                              value={peca.valor_unitario}
                              onChange={(valor) => atualizarPeca(index, 'valor_unitario', Number(valor))}
                              size="sm"
                            >
                              <NumberInputField
                                placeholder="R$ Unit."
                                textAlign="right"
                              />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          
                          <IconButton
                            aria-label="Remover peça"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            isDisabled={pecas.length <= 1}
                            onClick={() => removerPeca(index)}
                          />
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                  
                  {/* Valor Total Calculado */}
                  {(!values.custo || values.custo === '') && (
                    <Box textAlign="right">
                      <Text fontSize="sm" fontWeight="medium">
                        Valor Total Calculado: <Text as="span" fontWeight="bold">{calcularValorTotal()}</Text>
                      </Text>
                    </Box>
                  )}
                </Stack>
              </ModalBody>
              
              <ModalFooter>
                <Button variant="outline" mr={3} onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={loading}
                  leftIcon={<Icon as={FiTool} />}
                >
                  Registrar Manutenção
                </Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};

export default RegistrarManutencaoModal; 