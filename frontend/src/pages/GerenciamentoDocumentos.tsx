import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import DocumentoList from '../components/DocumentoList';
import DocumentoUpload from '../components/DocumentoUpload';
import MainLayout from '../components/layout/MainLayout';

/**
 * Página de gerenciamento de documentos
 */
const GerenciamentoDocumentos = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tipoRefAtual, setTipoRefAtual] = useState<'paciente' | 'acompanhante'>('paciente');
  
  // Função para atualizar a lista após upload
  const handleUploadSuccess = () => {
    onClose();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <MainLayout>
      <Box p={4} maxW="1200px" mx="auto">
        <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Heading as="h1" size="lg">Gerenciamento de Documentos</Heading>
            <Text color="gray.600" mt={1}>
              Gerencie todos os documentos do sistema
            </Text>
          </Box>
          
          <Button
            colorScheme="blue"
            leftIcon={<FiPlus />}
            onClick={onOpen}
          >
            Adicionar Documento
          </Button>
        </Box>
        
        <Tabs variant="enclosed" colorScheme="blue" isLazy>
          <TabList>
            <Tab onClick={() => setTipoRefAtual('paciente')}>Documentos de Pacientes</Tab>
            <Tab onClick={() => setTipoRefAtual('acompanhante')}>Documentos de Acompanhantes</Tab>
          </TabList>
          
          <TabPanels>
            {/* Documentos de Pacientes */}
            <TabPanel px={0} py={4}>
              <DocumentoList 
                tipoRef="paciente"
                showFilters={true}
                onUploadClick={onOpen}
                refreshTrigger={refreshTrigger}
              />
            </TabPanel>
            
            {/* Documentos de Acompanhantes */}
            <TabPanel px={0} py={4}>
              <DocumentoList 
                tipoRef="acompanhante"
                showFilters={true}
                onUploadClick={onOpen}
                refreshTrigger={refreshTrigger}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Drawer para upload de documento */}
        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          size="md"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              Adicionar novo documento
            </DrawerHeader>
            
            <DrawerBody p={6}>
              <Box mb={4}>
                <Text fontWeight="medium" mb={2}>
                  {tipoRefAtual === 'paciente' 
                    ? 'Enviando documento para um paciente' 
                    : 'Enviando documento para um acompanhante'}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Selecione um paciente específico para associar este documento ou utilize a busca para encontrar o registro.
                </Text>
                
                {/* Aqui viria um componente de busca para selecionar o paciente ou acompanhante */}
                <Text color="blue.600" fontSize="sm" mb={6}>
                  Nota: Para este exemplo, você precisaria selecionar um paciente ou acompanhante para
                  associar o documento. Um componente de busca e seleção seria necessário aqui.
                </Text>
              </Box>
              
              {/* Formulário de upload com ID simulado */}
              <DocumentoUpload
                tipoRef={tipoRefAtual}
                refId="60d21b4667d0d8992e610c85" // ID simulado para exemplo
                onSuccess={handleUploadSuccess}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </MainLayout>
  );
};

export default GerenciamentoDocumentos; 