import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Switch,
  Tooltip,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  useDisclosure,
  Box,
  SliderMark,
  Divider,
  useColorMode,
} from '@chakra-ui/react';
import { FaAccessibleIcon, FaAdjust, FaFont, FaMoon, FaSun, FaEye, FaCog, FaKeyboard, FaClock, FaImage } from 'react-icons/fa';
import { useAcessibilidade, ConfiguracoesAcessibilidade } from '../../contexts/AcessibilidadeContext';
import AccessibleSelect from '../../components/AccessibleSelect';

/**
 * Componente para acesso rápido às configurações de acessibilidade
 */
export const AccessibilityToggle: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { configuracoes, atualizarConfiguracoes, resetarConfiguracoes, salvarConfiguracoes, carregando } = useAcessibilidade();
  const { toggleColorMode } = useColorMode();
  
  // Função para alternar alto contraste
  const toggleAltoContraste = () => {
    atualizarConfiguracoes({ altoContraste: !configuracoes.altoContraste });
  };

  // Função para alternar o tamanho da fonte
  const toggleFonteAumentada = () => {
    atualizarConfiguracoes({ fonteAumentada: !configuracoes.fonteAumentada });
  };

  // Função para alternar o tema (claro/escuro)
  const toggleTema = () => {
    const novoTema = configuracoes.temaPrefererido === 'claro' 
      ? 'escuro' 
      : configuracoes.temaPrefererido === 'escuro' 
        ? 'automatico' 
        : 'claro';
    
    atualizarConfiguracoes({ temaPrefererido: novoTema as ConfiguracoesAcessibilidade['temaPrefererido'] });
    
    // Se não for automático, alterar o tema do Chakra UI diretamente
    if (novoTema !== 'automatico') {
      if ((novoTema === 'claro' && document.documentElement.dataset.theme === 'dark') ||
          (novoTema === 'escuro' && document.documentElement.dataset.theme === 'light')) {
        toggleColorMode();
      }
    }
  };

  // Renderizar ícone do tema com base na configuração atual
  const renderTemaIcon = () => {
    switch (configuracoes.temaPrefererido) {
      case 'claro':
        return <FaSun />;
      case 'escuro':
        return <FaMoon />;
      default:
        return <FaAdjust />;
    }
  };

  return (
    <>
      <Menu>
        <Tooltip label="Acessibilidade" aria-label="Menu de acessibilidade">
          <MenuButton
            as={IconButton}
            aria-label="Opções de acessibilidade"
            icon={<FaAccessibleIcon />}
            variant="outline"
          />
        </Tooltip>
        <MenuList>
          <MenuItem icon={<FaAdjust />} onClick={toggleAltoContraste}>
            {configuracoes.altoContraste ? 'Desativar alto contraste' : 'Ativar alto contraste'}
          </MenuItem>
          <MenuItem icon={<FaFont />} onClick={toggleFonteAumentada}>
            {configuracoes.fonteAumentada ? 'Tamanho de fonte normal' : 'Aumentar tamanho da fonte'}
          </MenuItem>
          <MenuItem icon={renderTemaIcon()} onClick={toggleTema}>
            {configuracoes.temaPrefererido === 'claro' 
              ? 'Tema escuro' 
              : configuracoes.temaPrefererido === 'escuro' 
                ? 'Tema automático' 
                : 'Tema claro'}
          </MenuItem>
          <MenuItem icon={<FaCog />} onClick={onOpen}>
            Configurações avançadas
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Configurações de Acessibilidade</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="lg" fontWeight="bold">Aparência</Text>
                <Divider mb={3} />
                
                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor="alto-contraste" mb="0">
                    Alto Contraste
                  </FormLabel>
                  <Switch
                    id="alto-contraste"
                    isChecked={configuracoes.altoContraste}
                    onChange={(e) => atualizarConfiguracoes({ altoContraste: e.target.checked })}
                  />
                </FormControl>

                <FormControl mb={3}>
                  <FormLabel htmlFor="tema-preferido">Tema preferido</FormLabel>
                  <AccessibleSelect
                    id="tema-preferido"
                    value={configuracoes.temaPrefererido}
                    onChange={(e) => atualizarConfiguracoes({ 
                      temaPrefererido: e.target.value as ConfiguracoesAcessibilidade['temaPrefererido'] 
                    })}
                    accessibleName="Tema preferido"
                    placeholder="Selecione o tema preferido"
                    data-testid="tema-select"
                  >
                    <option value="automatico">Automático (baseado no sistema)</option>
                    <option value="claro">Claro</option>
                    <option value="escuro">Escuro</option>
                  </AccessibleSelect>
                </FormControl>

                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor="fonte-aumentada" mb="0">
                    Fonte Aumentada
                  </FormLabel>
                  <Switch
                    id="fonte-aumentada"
                    isChecked={configuracoes.fonteAumentada}
                    onChange={(e) => atualizarConfiguracoes({ fonteAumentada: e.target.checked })}
                  />
                </FormControl>

                <FormControl mb={3}>
                  <FormLabel htmlFor="tamanho-fonte">Tamanho da Fonte: {configuracoes.tamanhoFonte}px</FormLabel>
                  <Slider
                    id="tamanho-fonte"
                    min={12}
                    max={24}
                    step={1}
                    value={configuracoes.tamanhoFonte}
                    onChange={(val) => atualizarConfiguracoes({ tamanhoFonte: val })}
                    aria-label="Ajustar tamanho da fonte"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6}>
                      <Box color="blue.500" as={FaFont} />
                    </SliderThumb>
                    <SliderMark value={12} mt={2} ml={-2.5} fontSize="sm">
                      12px
                    </SliderMark>
                    <SliderMark value={18} mt={2} ml={-2.5} fontSize="sm">
                      18px
                    </SliderMark>
                    <SliderMark value={24} mt={2} ml={-2.5} fontSize="sm">
                      24px
                    </SliderMark>
                  </Slider>
                </FormControl>
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="bold">Movimento e Interação</Text>
                <Divider mb={3} />
                
                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor="animacoes-reduzidas" mb="0">
                    Animações Reduzidas
                  </FormLabel>
                  <Switch
                    id="animacoes-reduzidas"
                    isChecked={configuracoes.animacoesReduzidas}
                    onChange={(e) => atualizarConfiguracoes({ animacoesReduzidas: e.target.checked })}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor="navegacao-teclado" mb="0">
                    Navegação por Teclado Aprimorada
                  </FormLabel>
                  <Switch
                    id="navegacao-teclado"
                    isChecked={configuracoes.navegacaoTeclado}
                    onChange={(e) => atualizarConfiguracoes({ navegacaoTeclado: e.target.checked })}
                  />
                </FormControl>
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="bold">Conteúdo</Text>
                <Divider mb={3} />

                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor="texto-alternativo" mb="0">
                    Texto Alternativo para Imagens
                  </FormLabel>
                  <Switch
                    id="texto-alternativo"
                    isChecked={configuracoes.textoAlternativoImagens}
                    onChange={(e) => atualizarConfiguracoes({ textoAlternativoImagens: e.target.checked })}
                  />
                </FormControl>
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="bold">Temporizações</Text>
                <Divider mb={3} />

                <FormControl mb={3}>
                  <FormLabel htmlFor="tempo-notificacoes">Duração das Notificações (ms): {configuracoes.tempoNotificacoes}</FormLabel>
                  <Slider
                    id="tempo-notificacoes"
                    min={2000}
                    max={10000}
                    step={1000}
                    value={configuracoes.tempoNotificacoes}
                    onChange={(val) => atualizarConfiguracoes({ tempoNotificacoes: val })}
                    aria-label="Ajustar tempo de notificações"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6}>
                      <Box color="blue.500" as={FaClock} />
                    </SliderThumb>
                    <SliderMark value={2000} mt={2} ml={-2.5} fontSize="sm">
                      2s
                    </SliderMark>
                    <SliderMark value={6000} mt={2} ml={-2.5} fontSize="sm">
                      6s
                    </SliderMark>
                    <SliderMark value={10000} mt={2} ml={-2.5} fontSize="sm">
                      10s
                    </SliderMark>
                  </Slider>
                </FormControl>

                <FormControl mb={3}>
                  <FormLabel htmlFor="tempo-sessao">Tempo de Sessão (minutos): {configuracoes.tempoSessao}</FormLabel>
                  <Slider
                    id="tempo-sessao"
                    min={5}
                    max={60}
                    step={5}
                    value={configuracoes.tempoSessao}
                    onChange={(val) => atualizarConfiguracoes({ tempoSessao: val })}
                    aria-label="Ajustar tempo de sessão"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6}>
                      <Box color="blue.500" as={FaClock} />
                    </SliderThumb>
                    <SliderMark value={5} mt={2} ml={-2.5} fontSize="sm">
                      5min
                    </SliderMark>
                    <SliderMark value={30} mt={2} ml={-2.5} fontSize="sm">
                      30min
                    </SliderMark>
                    <SliderMark value={60} mt={2} ml={-2.5} fontSize="sm">
                      60min
                    </SliderMark>
                  </Slider>
                </FormControl>
              </Box>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="red" 
              mr={3} 
              onClick={resetarConfiguracoes}
              isLoading={carregando}
            >
              Resetar
            </Button>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={salvarConfiguracoes}
              isLoading={carregando}
            >
              Salvar
            </Button>
            <Button variant="ghost" onClick={onClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AccessibilityToggle; 