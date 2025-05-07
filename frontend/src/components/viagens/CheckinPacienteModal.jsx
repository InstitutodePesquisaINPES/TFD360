import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Checkbox,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Text,
  Select,
  Alert,
  AlertIcon,
  Box,
  Spinner,
  Flex,
  HStack
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import api from '../../services/api';
import { formatarCPF } from '../../utils/formatters';

const CheckinPacienteModal = ({ isOpen, onClose, viagemId, onCheckinSuccess }) => {
  const [pacientes, setPacientes] = useState([]);
  const [pacientesSelecionados, setPacientesSelecionados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [tipoPesquisa, setTipoPesquisa] = useState('nome');
  const toast = useToast();

  // Função para carregar os pacientes disponíveis para check-in
  const carregarPacientes = useCallback(async () => {
    if (!viagemId || !isOpen) return;

    setCarregando(true);
    try {
      const resposta = await api.get(`/viagens/${viagemId}/pacientes`);
      // Filtrar apenas pacientes com status 'confirmado' (ainda sem check-in)
      const pacientesDisponiveis = resposta.data.filter(p => p.status === 'confirmado');
      setPacientes(pacientesDisponiveis);
      setPacientesSelecionados([]);
    } catch (erro) {
      console.error('Erro ao carregar pacientes:', erro);
      toast({
        title: 'Erro ao carregar pacientes',
        description: erro.response?.data?.mensagem || 'Não foi possível carregar os pacientes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  }, [viagemId, isOpen, toast]);

  // Carregar pacientes quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      carregarPacientes();
    }
  }, [isOpen, carregarPacientes]);

  // Alternar seleção de paciente
  const togglePacienteSelecionado = (pacienteId) => {
    setPacientesSelecionados(prevSelecionados => {
      if (prevSelecionados.includes(pacienteId)) {
        return prevSelecionados.filter(id => id !== pacienteId);
      } else {
        return [...prevSelecionados, pacienteId];
      }
    });
  };

  // Filtrar pacientes com base na pesquisa
  const pacientesFiltrados = pacientes.filter(paciente => {
    if (!pesquisa) return true;
    
    const termoPesquisa = pesquisa.toLowerCase();
    
    switch (tipoPesquisa) {
      case 'nome':
        return paciente.paciente?.nome?.toLowerCase().includes(termoPesquisa);
      case 'cpf':
        return paciente.paciente?.cpf?.includes(termoPesquisa);
      case 'telefone':
        return paciente.paciente?.telefone?.includes(termoPesquisa);
      default:
        return true;
    }
  });

  // Realizar check-in dos pacientes selecionados
  const realizarCheckin = async () => {
    if (pacientesSelecionados.length === 0) {
      toast({
        title: 'Nenhum paciente selecionado',
        description: 'Selecione pelo menos um paciente para realizar o check-in',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setEnviando(true);
    const erros = [];
    const sucessos = [];

    try {
      // Obter a localização atual (se disponível)
      let localizacao = null;
      try {
        if (navigator.geolocation) {
          const posicao = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          localizacao = {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude
          };
        }
      } catch (erroGeo) {
        console.warn('Erro ao obter localização:', erroGeo);
      }

      // Realizar check-in para cada paciente selecionado
      for (const pacienteId of pacientesSelecionados) {
        try {
          await api.post(`/viagens/${viagemId}/pacientes/${pacienteId}/checkin`, { 
            localizacao 
          });
          sucessos.push(pacienteId);
        } catch (erro) {
          console.error(`Erro ao realizar check-in do paciente ${pacienteId}:`, erro);
          const paciente = pacientes.find(p => p.paciente._id === pacienteId);
          erros.push({
            id: pacienteId,
            nome: paciente?.paciente?.nome || 'Paciente',
            erro: erro.response?.data?.mensagem || 'Erro desconhecido'
          });
        }
      }

      // Exibir resultados
      if (sucessos.length > 0) {
        toast({
          title: 'Check-in realizado com sucesso',
          description: `${sucessos.length} paciente(s) registrado(s) com sucesso`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Notificar componente pai do sucesso
        if (onCheckinSuccess) {
          onCheckinSuccess();
        }
      }

      if (erros.length > 0) {
        toast({
          title: 'Erro em alguns check-ins',
          description: `${erros.length} paciente(s) não puderam ser registrados`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      // Se todos foram processados com sucesso, fechar o modal
      if (erros.length === 0) {
        onClose();
      } else {
        // Recarregar a lista removendo os que tiveram sucesso
        carregarPacientes();
      }
    } catch (erro) {
      console.error('Erro ao processar check-in:', erro);
      toast({
        title: 'Erro ao realizar check-in',
        description: erro.response?.data?.mensagem || 'Ocorreu um erro ao processar o check-in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Realizar Check-in de Pacientes</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Stack spacing={4}>
            <HStack>
              <Select 
                value={tipoPesquisa}
                onChange={(e) => setTipoPesquisa(e.target.value)}
                w="150px"
              >
                <option value="nome">Nome</option>
                <option value="cpf">CPF</option>
                <option value="telefone">Telefone</option>
              </Select>
              
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder={`Pesquisar por ${tipoPesquisa}`}
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                />
              </InputGroup>
            </HStack>

            {carregando ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" />
              </Flex>
            ) : pacientesFiltrados.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                {pesquisa 
                  ? 'Nenhum paciente encontrado com os critérios de pesquisa' 
                  : 'Não há pacientes disponíveis para check-in'}
              </Alert>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="50px"></Th>
                    <Th>Nome</Th>
                    <Th>CPF</Th>
                    <Th>Acompanhante</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pacientesFiltrados.map((registro) => (
                    <Tr key={registro.paciente._id}>
                      <Td>
                        <Checkbox
                          isChecked={pacientesSelecionados.includes(registro.paciente._id)}
                          onChange={() => togglePacienteSelecionado(registro.paciente._id)}
                        />
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{registro.paciente.nome}</Text>
                        {registro.necessidades_especiais && (
                          <Badge colorScheme="purple" ml={2}>Necessidades Especiais</Badge>
                        )}
                      </Td>
                      <Td>{formatarCPF(registro.paciente.cpf)}</Td>
                      <Td>
                        {registro.acompanhante ? (
                          <Badge colorScheme="green">Sim</Badge>
                        ) : (
                          <Badge colorScheme="gray">Não</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="green" 
            onClick={realizarCheckin}
            isLoading={enviando}
            isDisabled={pacientesSelecionados.length === 0 || carregando}
          >
            Realizar Check-in
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CheckinPacienteModal; 