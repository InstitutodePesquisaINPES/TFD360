import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  HStack
} from '@chakra-ui/react';
import { FaEllipsisVertical, FaUserPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { viagemService } from '../../services/viagem.service';

/**
 * Componente que exibe uma lista de viagens com opções para gerenciamento
 * 
 * @param {Object} props Propriedades do componente
 * @param {Function} props.onEdit Função chamada ao clicar para editar uma viagem
 * @param {Function} props.onAdicionarPaciente Função chamada ao clicar para adicionar pacientes
 * @param {number} props.onReload Número que ao ser alterado, força o recarregamento da lista
 */
const ListaViagens = ({ onEdit, onAdicionarPaciente, onReload = 0 }) => {
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viagemParaExcluir, setViagemParaExcluir] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  // Status das viagens com cores correspondentes
  const statusConfig = {
    'agendada': { color: 'blue', label: 'Agendada' },
    'em_andamento': { color: 'green', label: 'Em Andamento' },
    'concluida': { color: 'gray', label: 'Concluída' },
    'cancelada': { color: 'red', label: 'Cancelada' }
  };

  // Carrega as viagens da API
  const carregarViagens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await viagemService.listarViagens();
      setViagens(response);
    } catch (err) {
      console.error('Erro ao carregar viagens:', err);
      setError('Não foi possível carregar as viagens. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega as viagens quando o componente montar ou quando onReload mudar
  useEffect(() => {
    carregarViagens();
  }, [carregarViagens, onReload]);

  // Formata a data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Abre o modal de confirmação para excluir uma viagem
  const confirmarExclusao = (viagem) => {
    setViagemParaExcluir(viagem);
    onOpen();
  };

  // Exclui a viagem após confirmação
  const excluirViagem = async () => {
    if (!viagemParaExcluir) return;
    
    try {
      setLoading(true);
      await viagemService.excluirViagem(viagemParaExcluir._id);
      
      // Atualiza a lista local removendo a viagem excluída
      setViagens(viagens.filter(v => v._id !== viagemParaExcluir._id));
      
      toast({
        title: 'Viagem excluída',
        description: 'A viagem foi excluída com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao excluir viagem',
        description: err.message || 'Ocorreu um erro ao excluir a viagem.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setViagemParaExcluir(null);
    }
  };

  // Navega para a página de detalhes da viagem
  const visualizarViagem = (id) => {
    navigate(`/viagens/${id}`);
  };

  // Renderiza o conteúdo com base no estado (carregando, erro ou dados)
  const renderConteudo = () => {
    if (loading && viagens.length === 0) {
      return (
        <Tr>
          <Td colSpan={6} textAlign="center" py={10}>
            <Flex direction="column" align="center">
              <Spinner size="xl" mb={4} color="blue.500" />
              <Text>Carregando viagens...</Text>
            </Flex>
          </Td>
        </Tr>
      );
    }

    if (error) {
      return (
        <Tr>
          <Td colSpan={6}>
            <Alert status="error">
              <AlertIcon />
              <AlertTitle mr={2}>Erro!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </Td>
        </Tr>
      );
    }

    if (viagens.length === 0) {
      return (
        <Tr>
          <Td colSpan={6} textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">
              Nenhuma viagem encontrada
            </Text>
          </Td>
        </Tr>
      );
    }

    return viagens.map((viagem) => (
      <Tr key={viagem._id} _hover={{ bg: 'gray.50' }}>
        <Td>
          <Text fontWeight="medium">{viagem.destino}</Text>
          {viagem.observacoes && (
            <Text fontSize="sm" color="gray.600" noOfLines={1}>
              {viagem.observacoes}
            </Text>
          )}
        </Td>
        <Td>{formatarData(viagem.data_ida)}</Td>
        <Td>{formatarData(viagem.data_volta)}</Td>
        <Td>
          <Badge 
            colorScheme={statusConfig[viagem.status]?.color || 'gray'} 
            px={2} 
            py={1} 
            borderRadius="md"
          >
            {statusConfig[viagem.status]?.label || viagem.status}
          </Badge>
        </Td>
        <Td>{viagem.pacientes?.length || 0}</Td>
        <Td>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Icon as={FaEllipsisVertical} />}
              variant="ghost"
              size="sm"
              aria-label="Opções"
            />
            <MenuList>
              <MenuItem 
                icon={<Icon as={FaEye} />} 
                onClick={() => visualizarViagem(viagem._id)}
              >
                Visualizar
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaEdit} />} 
                onClick={() => onEdit(viagem)}
              >
                Editar
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaUserPlus} />} 
                onClick={() => onAdicionarPaciente(viagem)}
              >
                Adicionar Pacientes
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaTrash} />} 
                color="red.500"
                onClick={() => confirmarExclusao(viagem)}
              >
                Excluir
              </MenuItem>
            </MenuList>
          </Menu>
        </Td>
      </Tr>
    ));
  };

  return (
    <>
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>Destino</Th>
            <Th>Data de Ida</Th>
            <Th>Data de Volta</Th>
            <Th>Status</Th>
            <Th>Pacientes</Th>
            <Th width="50px">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {renderConteudo()}
        </Tbody>
      </Table>
      
      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viagemParaExcluir && (
              <Text>
                Tem certeza que deseja excluir a viagem para{" "}
                <strong>{viagemParaExcluir.destino}</strong> do dia{" "}
                <strong>{formatarData(viagemParaExcluir.data_ida)}</strong>?
                {viagemParaExcluir.pacientes?.length > 0 && (
                  <Text mt={2} color="red.500">
                    Atenção: Esta viagem possui {viagemParaExcluir.pacientes.length} paciente(s) vinculado(s).
                    Eles serão desvinculados ao excluir esta viagem.
                  </Text>
                )}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={excluirViagem}
                isLoading={loading}
              >
                Excluir
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ListaViagens; 