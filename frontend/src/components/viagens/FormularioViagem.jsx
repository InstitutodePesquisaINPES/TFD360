import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  FormErrorMessage,
  useToast,
  Flex,
  Divider,
  Text,
  Heading
} from '@chakra-ui/react';
import { viagemService } from '../../services/viagem.service';

/**
 * Componente de formulário para criar ou editar uma viagem
 * 
 * @param {Object} props Propriedades do componente
 * @param {Object} props.viagemAtual Viagem para edição (null para nova viagem)
 * @param {Function} props.onSave Função chamada após salvar com sucesso
 * @param {Function} props.onCancel Função chamada ao clicar no botão cancelar
 */
const FormularioViagem = ({ viagemAtual = null, onSave, onCancel }) => {
  const initialData = {
    destino: '',
    data_ida: '',
    data_volta: '',
    hora_ida: '08:00',
    hora_volta: '17:00',
    status: 'agendada',
    veiculo: '',
    motorista: '',
    vagas_totais: 15,
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Carrega os dados da viagem quando está editando
  useEffect(() => {
    if (viagemAtual) {
      const { data_ida, data_volta, ...rest } = viagemAtual;

      // Formatar datas para o formato esperado pelo input type="date"
      const formatarData = (data) => {
        if (!data) return '';
        const dataObj = new Date(data);
        return dataObj.toISOString().split('T')[0];
      };

      // Extrair hora de uma data
      const extrairHora = (data) => {
        if (!data) return '';
        const dataObj = new Date(data);
        const horas = String(dataObj.getHours()).padStart(2, '0');
        const minutos = String(dataObj.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      };

      setFormData({
        ...rest,
        data_ida: formatarData(data_ida),
        data_volta: formatarData(data_volta),
        hora_ida: extrairHora(data_ida) || '08:00',
        hora_volta: extrairHora(data_volta) || '17:00',
        vagas_totais: rest.vagas_totais || 15
      });
    }
  }, [viagemAtual]);

  // Atualiza o state com os valores do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Limpa o erro quando o usuário digita
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Valida o formulário antes de enviar
  const validarFormulario = () => {
    const newErrors = {};

    // Validações básicas dos campos obrigatórios
    if (!formData.destino.trim()) {
      newErrors.destino = 'O destino é obrigatório';
    }

    if (!formData.data_ida) {
      newErrors.data_ida = 'A data de ida é obrigatória';
    }

    if (!formData.data_volta) {
      newErrors.data_volta = 'A data de volta é obrigatória';
    }

    if (!formData.hora_ida) {
      newErrors.hora_ida = 'A hora de ida é obrigatória';
    }

    if (!formData.hora_volta) {
      newErrors.hora_volta = 'A hora de volta é obrigatória';
    }

    if (!formData.status) {
      newErrors.status = 'O status é obrigatório';
    }

    // Validação de datas (data de volta deve ser posterior ou igual à data de ida)
    if (formData.data_ida && formData.data_volta) {
      const dataIda = new Date(`${formData.data_ida}T${formData.hora_ida}`);
      const dataVolta = new Date(`${formData.data_volta}T${formData.hora_volta}`);

      if (dataVolta < dataIda) {
        newErrors.data_volta = 'A data de volta deve ser posterior ou igual à data de ida';
      }
    }

    // Validação de vagas (deve ser um número positivo)
    if (formData.vagas_totais <= 0) {
      newErrors.vagas_totais = 'O número de vagas deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envia o formulário para a API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast({
        title: 'Formulário com erros',
        description: 'Por favor, corrija os erros antes de salvar.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      // Combina data e hora antes de enviar para a API
      const dataCompleta = {
        ...formData,
        data_ida: combinarDataHora(formData.data_ida, formData.hora_ida),
        data_volta: combinarDataHora(formData.data_volta, formData.hora_volta)
      };

      // Remove os campos de hora que não devem ser enviados para a API
      delete dataCompleta.hora_ida;
      delete dataCompleta.hora_volta;

      let resultado;
      if (viagemAtual?._id) {
        // Atualiza uma viagem existente
        resultado = await viagemService.atualizarViagem(viagemAtual._id, dataCompleta);
      } else {
        // Cria uma nova viagem
        resultado = await viagemService.criarViagem(dataCompleta);
      }

      toast({
        title: viagemAtual ? 'Viagem atualizada' : 'Viagem criada',
        description: viagemAtual
          ? 'A viagem foi atualizada com sucesso.'
          : 'A viagem foi criada com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Chama o callback de sucesso com o resultado
      if (onSave) {
        onSave(resultado);
      }

    } catch (err) {
      console.error('Erro ao salvar viagem:', err);
      
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro ao salvar a viagem.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para combinar data e hora
  const combinarDataHora = (data, hora) => {
    if (!data || !hora) return null;
    return `${data}T${hora}:00`;
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="md">
          {viagemAtual ? 'Editar Viagem' : 'Nova Viagem'}
        </Heading>
        
        <Divider />
        
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <FormControl isInvalid={!!errors.destino} isRequired flex="3">
            <FormLabel>Destino</FormLabel>
            <Input
              name="destino"
              placeholder="Ex: São Paulo - SP"
              value={formData.destino}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.destino}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.status} isRequired flex="1">
            <FormLabel>Status</FormLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </Select>
            <FormErrorMessage>{errors.status}</FormErrorMessage>
          </FormControl>
        </Flex>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <FormControl isInvalid={!!errors.data_ida} isRequired flex="1">
            <FormLabel>Data de Ida</FormLabel>
            <Input
              name="data_ida"
              type="date"
              value={formData.data_ida}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.data_ida}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.hora_ida} isRequired flex="1">
            <FormLabel>Hora de Ida</FormLabel>
            <Input
              name="hora_ida"
              type="time"
              value={formData.hora_ida}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.hora_ida}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.data_volta} isRequired flex="1">
            <FormLabel>Data de Volta</FormLabel>
            <Input
              name="data_volta"
              type="date"
              value={formData.data_volta}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.data_volta}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.hora_volta} isRequired flex="1">
            <FormLabel>Hora de Volta</FormLabel>
            <Input
              name="hora_volta"
              type="time"
              value={formData.hora_volta}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.hora_volta}</FormErrorMessage>
          </FormControl>
        </Flex>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <FormControl isInvalid={!!errors.veiculo} flex="2">
            <FormLabel>Veículo</FormLabel>
            <Input
              name="veiculo"
              placeholder="Ex: Van/Ônibus/Carro - Placa XXX-0000"
              value={formData.veiculo}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.veiculo}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.motorista} flex="2">
            <FormLabel>Motorista</FormLabel>
            <Input
              name="motorista"
              placeholder="Nome do motorista"
              value={formData.motorista}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.motorista}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.vagas_totais} isRequired flex="1">
            <FormLabel>Vagas Totais</FormLabel>
            <Input
              name="vagas_totais"
              type="number"
              min="1"
              value={formData.vagas_totais}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.vagas_totais}</FormErrorMessage>
          </FormControl>
        </Flex>

        <FormControl isInvalid={!!errors.observacoes}>
          <FormLabel>Observações</FormLabel>
          <Textarea
            name="observacoes"
            placeholder="Informações adicionais sobre a viagem"
            value={formData.observacoes}
            onChange={handleInputChange}
            rows={4}
          />
          <FormErrorMessage>{errors.observacoes}</FormErrorMessage>
        </FormControl>

        <Divider />

        <HStack spacing={4} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={loading}
          >
            {viagemAtual ? 'Atualizar' : 'Criar'} Viagem
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default FormularioViagem; 