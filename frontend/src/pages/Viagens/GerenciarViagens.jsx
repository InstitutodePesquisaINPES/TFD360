import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { FaPlus, FaSync } from 'react-icons/fa';
import ListaViagens from '../../components/viagens/ListaViagens';
import FormularioViagem from '../../components/viagens/FormularioViagem';
import AdicionarPacienteModal from '../../components/viagens/AdicionarPacienteModal';
import CheckinPacienteModal from '../../components/viagens/CheckinPacienteModal';
import CheckoutPacienteModal from '../../components/viagens/CheckoutPacienteModal';
import { viagemService } from '../../services/viagem.service';

/**
 * Página para gerenciamento de viagens
 * Permite listar, adicionar, editar, excluir viagens e adicionar pacientes às viagens
 */
const GerenciarViagens = () => {
  const [isAdicionarViagemModalOpen, setIsAdicionarViagemModalOpen] = useState(false);
  const [isEditarViagemModalOpen, setIsEditarViagemModalOpen] = useState(false);
  const [isAdicionarPacienteModalOpen, setIsAdicionarPacienteModalOpen] = useState(false);
  const [isCheckinPacienteModalOpen, setIsCheckinPacienteModalOpen] = useState(false);
  const [isCheckoutPacienteModalOpen, setIsCheckoutPacienteModalOpen] = useState(false);
  const [viagemSelecionada, setViagemSelecionada] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [recarregar, setRecarregar] = useState(0);
  const toast = useToast();
  
  // Controle do modal de formulário de viagem
  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();
  
  // Controle do modal de adicionar paciente
  const {
    isOpen: isAddPacienteOpen,
    onOpen: onAddPacienteOpen,
    onClose: onAddPacienteClose
  } = useDisclosure();
  
  // Referência para forçar atualização da lista de viagens
  const refreshListaRef = useRef(null);

  // Manipulador para criar uma nova viagem
  const handleNovaViagem = () => {
    setViagemSelecionada(null);
    onFormOpen();
  };

  // Manipulador para editar uma viagem existente
  const handleEditarViagem = (viagem) => {
    setViagemSelecionada(viagem);
    onFormOpen();
  };

  // Manipulador para adicionar pacientes a uma viagem
  const handleAdicionarPaciente = (viagem) => {
    setViagemSelecionada(viagem);
    onAddPacienteOpen();
  };

  // Handler para abrir modal de checkout de pacientes
  const handleCheckoutPaciente = (viagem) => {
    setViagemSelecionada(viagem);
    setIsCheckoutPacienteModalOpen(true);
  };

  // Handler para checkin de pacientes
  const handleCheckinPaciente = (viagem) => {
    setViagemSelecionada(viagem);
    setIsCheckinPacienteModalOpen(true);
  };

  // Função chamada após salvar com sucesso uma viagem
  const handleSaveSuccess = () => {
    onFormClose();
    // Forçar atualização da lista
    setRecarregar(prev => prev + 1);
    // Exibir toast de sucesso
    toast({
      title: viagemSelecionada ? 'Viagem atualizada' : 'Viagem criada',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Função chamada após adicionar pacientes com sucesso
  const handleAddPacienteSuccess = () => {
    onAddPacienteClose();
    // Forçar atualização da lista
    setRecarregar(prev => prev + 1);
    // Exibir toast de sucesso
    toast({
      title: 'Pacientes adicionados',
      description: 'Os pacientes foram adicionados à viagem com sucesso.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handler para quando checkout é realizado com sucesso
  const handleCheckoutSuccess = () => {
    setRecarregar(!recarregar);
    toast({
      title: 'Checkout realizado com sucesso',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setViagemSelecionada(null);
  };

  // Função para atualizar a lista de viagens manualmente
  const handleRefresh = () => {
    setRecarregar(prev => prev + 1);
    toast({
      title: 'Lista atualizada',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Flex mb={6} justifyContent="space-between" alignItems="center">
        <Heading size="lg" color="teal.600">Gerenciamento de Viagens</Heading>
        <Button colorScheme="teal" leftIcon={<Icon as={FaPlus} />} onClick={handleNovaViagem}>
          Nova Viagem
        </Button>
      </Flex>

      <Tabs index={tabIndex} onChange={setTabIndex} isLazy>
        <TabList>
          <Tab>Viagens Ativas</Tab>
          <Tab>Viagens Concluídas</Tab>
          <Tab>Viagens Canceladas</Tab>
        </TabList>

        <TabPanels>
          {/* Painel de lista de viagens */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" mb={5}>
              <Heading size="lg">Gerenciar Viagens</Heading>
              <HStack spacing={3}>
                <Button
                  leftIcon={<Icon as={FaSync} />}
                  variant="outline"
                  onClick={handleRefresh}
                  size="sm"
                >
                  Atualizar
                </Button>
                <Button
                  leftIcon={<Icon as={FaPlus} />}
                  colorScheme="blue"
                  onClick={handleNovaViagem}
                >
                  Nova Viagem
                </Button>
              </HStack>
            </Flex>

            <Box
              bg="white"
              shadow="md"
              borderRadius="md"
              overflow="hidden"
            >
              <ListaViagens
                onEdit={handleEditarViagem}
                onAdicionarPaciente={handleAdicionarPaciente}
                onReload={recarregar}
              />
            </Box>
          </TabPanel>

          {/* Painel de novo formulário (atalho) */}
          <TabPanel>
            <Box bg="white" p={6} shadow="md" borderRadius="md">
              <FormularioViagem
                onSuccess={() => {
                  handleSaveSuccess();
                  setTabIndex(0); // Voltar para a aba de lista
                }}
                onCancel={() => setTabIndex(0)}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal para editar/criar viagem */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {viagemSelecionada ? 'Editar Viagem' : 'Nova Viagem'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormularioViagem
              viagemId={viagemSelecionada?._id}
              onSuccess={handleSaveSuccess}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal para adicionar pacientes */}
      <Modal isOpen={isAddPacienteOpen} onClose={onAddPacienteClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Pacientes à Viagem</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {viagemSelecionada ? (
              <Box mb={4}>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <AlertDescription>
                    Viagem para <strong>{viagemSelecionada.destino}</strong> em <strong>{new Date(viagemSelecionada.data_ida).toLocaleDateString()}</strong>
                  </AlertDescription>
                </Alert>
                <AdicionarPacienteModal
                  isOpen={true}
                  viagemId={viagemSelecionada._id}
                  onSuccess={handleAddPacienteSuccess}
                  onCancel={onAddPacienteClose}
                />
              </Box>
            ) : (
              <Text>Nenhuma viagem selecionada</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de checkin de pacientes */}
      <CheckinPacienteModal
        isOpen={isCheckinPacienteModalOpen}
        onClose={() => setIsCheckinPacienteModalOpen(false)}
        viagemId={viagemSelecionada?._id}
        onSuccess={handleAddPacienteSuccess}
      />

      {/* Modal de checkout de pacientes */}
      <CheckoutPacienteModal
        isOpen={isCheckoutPacienteModalOpen}
        onClose={() => setIsCheckoutPacienteModalOpen(false)}
        viagemId={viagemSelecionada?._id}
        onSuccess={handleCheckoutSuccess}
      />
    </Container>
  );
};

export default GerenciarViagens; 