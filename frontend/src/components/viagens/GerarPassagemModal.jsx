import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Flex,
  useToast,
  HStack,
  VStack,
  Text,
  Divider,
  Badge,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Image,
  Center
} from '@chakra-ui/react';
import { FaDownload, FaPrint, FaQrcode, FaIdCard } from 'react-icons/fa';
import { formatarCPF, formatarData } from '../../utils/formatadores';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Modal para gerar e imprimir passagens para pacientes
 * 
 * @param {Object} props Propriedades do componente
 * @param {boolean} props.isOpen Define se o modal está aberto
 * @param {Function} props.onClose Função para fechar o modal
 * @param {Object} props.paciente Dados do paciente
 * @param {Object} props.viagem Dados da viagem
 */
const GerarPassagemModal = ({ 
  isOpen, 
  onClose, 
  paciente, 
  viagem
}) => {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [error, setError] = useState(null);
  const passagemRef = useRef(null);
  const toast = useToast();

  // Gerar QR code ao abrir modal
  useEffect(() => {
    if (isOpen && paciente && viagem) {
      gerarQRCode();
    }
  }, [isOpen, paciente, viagem]);

  // Função para gerar QR code
  const gerarQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/viagens/${viagem._id}/pacientes/${paciente._id}/gerar-passagem`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar passagem');
      }
      
      const data = await response.json();
      setQrCodeData(data.qrcode);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      setError(error.message || 'Ocorreu um erro ao gerar o QR code para a passagem');
      toast({
        title: 'Erro ao gerar passagem',
        description: error.message || 'Ocorreu um erro ao gerar a passagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Imprimir passagem
  const handlePrint = () => {
    window.print();
  };

  // Baixar passagem como PDF
  const handleDownload = async () => {
    if (!passagemRef.current) return;
    
    try {
      setLoading(true);
      
      const canvas = await html2canvas(passagemRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`passagem-${paciente.paciente.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      toast({
        title: 'PDF gerado com sucesso',
        description: 'A passagem foi baixada em PDF com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o PDF da passagem',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Passagem do Paciente</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Center py={10}>
              <VStack spacing={3}>
                <Spinner size="xl" />
                <Text>Gerando passagem...</Text>
              </VStack>
            </Center>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Erro ao gerar passagem</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          ) : (
            <>
              {/* Passagem para impressão */}
              <Box 
                id="passagem-tfd"
                ref={passagemRef}
                border="1px solid" 
                borderColor="gray.200" 
                p={4} 
                borderRadius="md"
                className="print-section"
              >
                <VStack spacing={3} align="stretch">
                  {/* Cabeçalho */}
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">PASSAGEM TFD</Text>
                      <Text fontSize="sm" color="gray.600">
                        Código: {paciente.codigo_passagem || 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <FaIdCard size={30} />
                    </Box>
                  </Flex>
                  
                  <Divider />
                  
                  {/* Dados do paciente */}
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Paciente:</Text>
                    <Text>{paciente.paciente?.nome}</Text>
                    <Text fontSize="sm">CPF: {formatarCPF(paciente.paciente?.cpf)}</Text>
                    {paciente.acompanhante && (
                      <Badge colorScheme="purple">Com acompanhante</Badge>
                    )}
                  </VStack>
                  
                  {/* Dados da viagem */}
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Viagem:</Text>
                    <Text>Destino: {viagem.cidade_destino}/{viagem.estado_destino}</Text>
                    <Text>Data: {formatarData(viagem.data_viagem)}</Text>
                    <Text>Horário de saída: {viagem.horario_saida}h</Text>
                    <Text>Unidade de saúde: {viagem.unidade_saude}</Text>
                  </VStack>
                  
                  {/* QR Code */}
                  {qrCodeData && (
                    <Center py={2}>
                      <VStack>
                        <Image 
                          src={`data:image/png;base64,${qrCodeData}`} 
                          alt="QR Code da passagem"
                          boxSize="150px"
                        />
                        <Text fontSize="xs" color="gray.600">
                          Escaneie o código para check-in/check-out
                        </Text>
                      </VStack>
                    </Center>
                  )}
                  
                  <Divider />
                  
                  {/* Rodapé */}
                  <Text fontSize="xs" textAlign="center">
                    Esta passagem deve ser apresentada no embarque e no desembarque.
                  </Text>
                  <Text fontSize="xs" textAlign="center">
                    Emitida em: {formatarData(new Date(), true)}
                  </Text>
                </VStack>
              </Box>
              
              {/* Instruções */}
              <Alert status="info" mt={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Informações</AlertTitle>
                  <AlertDescription>
                    Você pode imprimir ou baixar esta passagem para o paciente.
                    O QR code pode ser utilizado para agilizar o check-in e check-out.
                  </AlertDescription>
                </Box>
              </Alert>
            </>
          )}
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              leftIcon={<FaPrint />}
              onClick={handlePrint}
              isDisabled={loading || !!error || !qrCodeData}
            >
              Imprimir
            </Button>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="blue"
              onClick={handleDownload}
              isDisabled={loading || !!error || !qrCodeData}
              isLoading={loading}
              loadingText="Gerando PDF..."
            >
              Baixar PDF
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GerarPassagemModal; 