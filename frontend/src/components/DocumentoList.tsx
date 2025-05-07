/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/accessible-select-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Text,
  Flex,
  HStack,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Textarea
} from '@chakra-ui/react';
import AccessibleSelect from './AccessibleSelect';
import { 
  FiMoreVertical, 
  FiDownload, 
  FiCheckCircle, 
  FiXCircle, 
  FiArchive, 
  FiTrash2,
  FiFilter,
  FiRefreshCw,
  FiUpload
} from 'react-icons/fi';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface Documento {
  _id: string;
  nome_arquivo: string;
  tipo_documento: string;
  formato: string;
  descricao?: string;
  data_emissao?: string;
  data_vencimento?: string;
  status: 'pendente_validacao' | 'ativo' | 'rejeitado' | 'arquivado';
  tipo_ref: string;
  ref_id: string;
  created_at: string;
  usuario_cadastro: {
    _id: string;
    nome: string;
  };
}

interface DocumentoListProps {
  tipoRef?: 'paciente' | 'acompanhante' | 'solicitacao_tfd';
  refId?: string;
  showFilters?: boolean;
  onUploadClick?: () => void;
  refreshTrigger?: number;
}

/**
 * Componente para listagem de documentos
 */
const DocumentoList: React.FC<DocumentoListProps> = ({
  tipoRef,
  refId,
  showFilters = true,
  onUploadClick,
  refreshTrigger = 0
}) => {
  const toast = useToast();
  const { getToken, usuario } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  
  // Estado para diálogos
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const cancelRef = React.useRef(null);
  
  // Listar documentos
  const fetchDocumentos = async () => {
    try {
      setIsLoading(true);
      
      // Construir parâmetros da query
      let params: any = {
        page,
        limit: 10
      };
      
      // Adicionar filtros específicos
      if (tipoRef && refId) {
        params.tipo_ref = tipoRef;
        params.ref_id = refId;
      }
      
      if (tipoDocumento) {
        params.tipo_documento = tipoDocumento;
      }
      
      if (status) {
        params.status = status;
      }
      
      // Fazer requisição
      const response = await axios.get('/api/documentos', {
        params,
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      // Atualizar estado
      setDocumentos(response.data.docs);
      setTotalPages(response.data.totalPages);
      setTotalDocs(response.data.totalDocs);
    } catch (error) {
      toast({
        title: 'Erro ao carregar documentos',
        description: error.response?.data?.erro || 'Ocorreu um erro ao carregar os documentos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para carregar documentos
  useEffect(() => {
    fetchDocumentos();
  }, [page, tipoDocumento, status, tipoRef, refId, refreshTrigger]);
  
  // Funções para manipulação de documentos
  const handleDownload = async (docId: string) => {
    try {
      const response = await axios.get(`/api/documentos/${docId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      // Criar URL para o blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obter nome do arquivo a partir dos headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'documento';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Erro ao baixar documento',
        description: error.response?.data?.erro || 'Ocorreu um erro ao baixar o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleAprovar = async (docId: string) => {
    try {
      await axios.put(
        `/api/documentos/${docId}/aprovar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      toast({
        title: 'Documento aprovado',
        description: 'O documento foi aprovado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchDocumentos();
    } catch (error) {
      toast({
        title: 'Erro ao aprovar documento',
        description: error.response?.data?.erro || 'Ocorreu um erro ao aprovar o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const openRejectDialog = (docId: string) => {
    setSelectedDocId(docId);
    setRejectReason('');
    onRejectOpen();
  };
  
  const handleRejeitar = async () => {
    try {
      await axios.put(
        `/api/documentos/${selectedDocId}/rejeitar`,
        { motivo: rejectReason },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      toast({
        title: 'Documento rejeitado',
        description: 'O documento foi rejeitado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onRejectClose();
      fetchDocumentos();
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar documento',
        description: error.response?.data?.erro || 'Ocorreu um erro ao rejeitar o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleArquivar = async (docId: string) => {
    try {
      await axios.put(
        `/api/documentos/${docId}/arquivar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      toast({
        title: 'Documento arquivado',
        description: 'O documento foi arquivado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchDocumentos();
    } catch (error) {
      toast({
        title: 'Erro ao arquivar documento',
        description: error.response?.data?.erro || 'Ocorreu um erro ao arquivar o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleRemover = async (docId: string) => {
    try {
      if (confirm('Tem certeza que deseja remover este documento? Esta ação não pode ser desfeita.')) {
        await axios.delete(`/api/documentos/${docId}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
        
        toast({
          title: 'Documento removido',
          description: 'O documento foi removido com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchDocumentos();
      }
    } catch (error) {
      toast({
        title: 'Erro ao remover documento',
        description: error.response?.data?.erro || 'Ocorreu um erro ao remover o documento.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Formatar tipo de documento
  const formatarTipoDocumento = (tipo: string) => {
    const tiposFormatados: Record<string, string> = {
      rg: 'RG',
      cpf: 'CPF',
      cartao_sus: 'Cartão SUS',
      comprovante_residencia: 'Comprovante de Residência',
      laudo_medico: 'Laudo Médico',
      exame: 'Exame',
      receita: 'Receita Médica',
      declaracao: 'Declaração',
      autorizacao: 'Autorização',
      procuracao: 'Procuração',
      termo_responsabilidade: 'Termo de Responsabilidade',
      documentacao_complementar: 'Documentação Complementar',
      outros: 'Outros'
    };
    
    return tiposFormatados[tipo] || tipo;
  };
  
  // Formatar data
  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'N/A';
    
    try {
      const data = new Date(dataStr);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Renderizar badge de status
  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pendente_validacao: { color: 'yellow', label: 'Pendente' },
      ativo: { color: 'green', label: 'Ativo' },
      rejeitado: { color: 'red', label: 'Rejeitado' },
      arquivado: { color: 'gray', label: 'Arquivado' }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status };
    
    return (
      <Badge colorScheme={config.color} variant="subtle" px={2} py={1} borderRadius="full">
        {config.label}
      </Badge>
    );
  };
  
  // Verificar se o usuário é admin ou gestor
  const isAdminOuGestor = () => {
    return usuario?.perfil === 'admin' || usuario?.perfil === 'gestor';
  };
  
  return (
    <Box width="100%">
      {/* Filtros */}
      {showFilters && (
        <Box bg="gray.50" p={4} borderRadius="md" mb={4}>
          <Flex direction={{ base: 'column', md: 'row' }} wrap="wrap" gap={4}>
            <FormControl width={{ base: '100%', md: '220px' }}>
              <FormLabel fontSize="sm">Tipo de documento</FormLabel>
              <AccessibleSelect
                size="sm"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                placeholder="Todos os tipos"
                accessibleName="Filtrar por tipo de documento"
              >
                <option value="rg">RG</option>
                <option value="cpf">CPF</option>
                <option value="cartao_sus">Cartão SUS</option>
                <option value="comprovante_residencia">Comprovante de Residência</option>
                <option value="laudo_medico">Laudo Médico</option>
                <option value="exame">Exame</option>
                <option value="receita">Receita Médica</option>
                <option value="declaracao">Declaração</option>
                <option value="outros">Outros</option>
              </AccessibleSelect>
            </FormControl>
            
            <FormControl width={{ base: '100%', md: '220px' }}>
              <FormLabel fontSize="sm">Status</FormLabel>
              <AccessibleSelect
                size="sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Todos os status"
                accessibleName="Filtrar por status do documento"
              >
                <option value="pendente_validacao">Pendente</option>
                <option value="ativo">Ativo</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="arquivado">Arquivado</option>
              </AccessibleSelect>
            </FormControl>
            
            <Flex align="flex-end" ml="auto" gap={2} mt={{ base: 2, md: 0 }}>
              <IconButton
                aria-label="Limpar filtros"
                icon={<FiRefreshCw />}
                size="sm"
                onClick={() => {
                  setTipoDocumento('');
                  setStatus('');
                  setPage(1);
                }}
              />
              
              {onUploadClick && (
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={onUploadClick}
                >
                  Adicionar documento
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      )}
      
      {/* Tabela de documentos */}
      {isLoading ? (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      ) : documentos.length === 0 ? (
        <Flex 
          direction="column" 
          justify="center" 
          align="center" 
          py={10} 
          bg="gray.50" 
          borderRadius="md"
        >
          <Text fontSize="lg" mb={2}>Nenhum documento encontrado</Text>
          <Text color="gray.500" mb={4}>
            {(tipoDocumento || status) 
              ? 'Tente ajustar os filtros para encontrar o que procura.'
              : tipoRef && refId 
                ? 'Ainda não foram cadastrados documentos para este registro.'
                : 'Não há documentos disponíveis.'
            }
          </Text>
          
          {onUploadClick && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={onUploadClick}
              leftIcon={<FiUpload />}
            >
              Adicionar documento
            </Button>
          )}
        </Flex>
      ) : (
        <>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Nome do arquivo</Th>
                  <Th>Tipo</Th>
                  <Th>Data de envio</Th>
                  <Th>Vencimento</Th>
                  <Th>Status</Th>
                  <Th width="80px">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {documentos.map((doc) => (
                  <Tr key={doc._id}>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">{doc.nome_arquivo}</Text>
                        {doc.descricao && (
                          <Text fontSize="xs" color="gray.600">{doc.descricao}</Text>
                        )}
                      </Box>
                    </Td>
                    <Td>{formatarTipoDocumento(doc.tipo_documento)}</Td>
                    <Td>{formatarData(doc.created_at)}</Td>
                    <Td>{doc.data_vencimento ? formatarData(doc.data_vencimento) : 'N/A'}</Td>
                    <Td>{renderStatus(doc.status)}</Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Opções"
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                          title="Opções do documento"
                        />
                        <MenuList>
                          <MenuItem icon={<FiDownload />} onClick={() => handleDownload(doc._id)}>
                            Download
                          </MenuItem>
                          
                          {isAdminOuGestor() && doc.status === 'pendente_validacao' && (
                            <>
                              <MenuItem 
                                icon={<FiCheckCircle color="green" />} 
                                onClick={() => handleAprovar(doc._id)}
                              >
                                Aprovar
                              </MenuItem>
                              <MenuItem 
                                icon={<FiXCircle color="red" />} 
                                onClick={() => openRejectDialog(doc._id)}
                              >
                                Rejeitar
                              </MenuItem>
                            </>
                          )}
                          
                          {isAdminOuGestor() && doc.status !== 'arquivado' && (
                            <MenuItem 
                              icon={<FiArchive />} 
                              onClick={() => handleArquivar(doc._id)}
                            >
                              Arquivar
                            </MenuItem>
                          )}
                          
                          {isAdminOuGestor() && (
                            <MenuItem 
                              icon={<FiTrash2 color="red" />} 
                              onClick={() => handleRemover(doc._id)}
                            >
                              Remover
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontSize="sm" color="gray.600">
                Mostrando {documentos.length} de {totalDocs} documentos
              </Text>
              
              <HStack>
                <Button
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  isDisabled={page === 1}
                  variant="outline"
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                
                <Text fontSize="sm">{page} de {totalPages}</Text>
                
                <Button
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  isDisabled={page === totalPages}
                  variant="outline"
                  aria-label="Próxima página"
                >
                  Próxima
                </Button>
              </HStack>
            </Flex>
          )}
        </>
      )}
      
      {/* Diálogo de rejeição */}
      <AlertDialog
        isOpen={isRejectOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRejectClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Rejeitar documento
            </AlertDialogHeader>

            <AlertDialogBody>
              <FormControl isRequired>
                <FormLabel>Motivo da rejeição</FormLabel>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Informe o motivo da rejeição do documento"
                  rows={4}
                />
              </FormControl>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRejectClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleRejeitar} 
                ml={3}
                isDisabled={!rejectReason.trim()}
              >
                Rejeitar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default DocumentoList;