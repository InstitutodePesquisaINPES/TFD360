import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Switch,
  Button,
  VStack,
  HStack,
  useToast,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  Icon
} from '@chakra-ui/react';
import { FiInfo, FiRotateCcw, FiSave } from 'react-icons/fi';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';

/**
 * Componente de formulário para configurações de acessibilidade
 */
const AcessibilidadeConfigForm: React.FC = () => {
  const {
    configuracoes,
    carregando,
    erro,
    atualizarConfiguracoes,
    resetarConfiguracoes
  } = useAcessibilidade();
  
  const [formValues, setFormValues] = useState(configuracoes);
  const toast = useToast();
  
  // Atualiza o formulário quando as configurações carregam
  useEffect(() => {
    if (!carregando) {
      setFormValues(configuracoes);
    }
  }, [configuracoes, carregando]);
  
  // Handler genérico para campos boolean
  const handleSwitchChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({
      ...prev,
      [field]: e.target.checked
    }));
  };
  
  // Handler para campos select
  const handleSelectChange = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormValues(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  
  // Handler para o slider de tamanho de fonte
  const handleSliderChange = (value: number) => {
    setFormValues(prev => ({
      ...prev,
      tamanhoFonte: value
    }));
  };
  
  // Salvar alterações
  const handleSave = async () => {
    try {
      await atualizarConfiguracoes(formValues);
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de acessibilidade foram atualizadas.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };
  
  // Resetar configurações
  const handleReset = async () => {
    try {
      await resetarConfiguracoes();
      toast({
        title: 'Configurações resetadas',
        description: 'As configurações de acessibilidade foram restauradas para os valores padrão.',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: 'Erro ao resetar',
        description: 'Não foi possível resetar as configurações. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };
  
  if (carregando) {
    return (
      <Box p={5}>
        <Text>Carregando configurações...</Text>
      </Box>
    );
  }
  
  return (
    <Card shadow="md" borderRadius="md">
      <CardHeader>
        <Heading as="h2" size="lg">Configurações de Acessibilidade</Heading>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          {erro && (
            <Box p={3} bg="red.100" color="red.700" borderRadius="md">
              {erro}
            </Box>
          )}
          
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Apresentação Visual
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="alto-contraste" mb="0" flex="1">
                  Modo de alto contraste
                  <Tooltip label="Aumenta o contraste entre texto e fundo para melhor legibilidade">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="alto-contraste"
                  isChecked={formValues.altoContraste}
                  onChange={handleSwitchChange('altoContraste')}
                  colorScheme="blue"
                  aria-label="Ativar modo de alto contraste"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="tema-preferido" mb="0" flex="1">
                  Tema preferido
                  <Tooltip label="Escolha o tema de cores da interface">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Select 
                  id="tema-preferido"
                  value={formValues.temaPrefererido}
                  onChange={handleSelectChange('temaPrefererido')}
                  width="auto"
                  aria-label="Selecionar tema preferido"
                >
                  <option value="automatico">Automático (sistema)</option>
                  <option value="claro">Claro</option>
                  <option value="escuro">Escuro</option>
                </Select>
              </FormControl>
            </VStack>
          </Box>
          
          <Divider />
          
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Texto e Legibilidade
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="fonte-aumentada" mb="0" flex="1">
                  Fonte aumentada
                  <Tooltip label="Aumenta o tamanho base das fontes em toda a aplicação">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="fonte-aumentada"
                  isChecked={formValues.fonteAumentada}
                  onChange={handleSwitchChange('fonteAumentada')}
                  colorScheme="blue"
                  aria-label="Ativar fonte aumentada"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="tamanho-fonte-slider">
                  Tamanho da fonte (%)
                  <Tooltip label="Ajuste o tamanho da fonte em toda a aplicação">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <HStack>
                  <Slider
                    id="tamanho-fonte-slider"
                    min={80}
                    max={150}
                    step={5}
                    value={formValues.tamanhoFonte}
                    onChange={handleSliderChange}
                    aria-label="Ajustar tamanho da fonte"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} />
                  </Slider>
                  <Text width="50px" textAlign="right">{formValues.tamanhoFonte}%</Text>
                </HStack>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="espacamento-texto" mb="0" flex="1">
                  Espaçamento de texto
                  <Tooltip label="Ajusta o espaçamento entre linhas e letras para melhorar a legibilidade">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Select 
                  id="espacamento-texto"
                  value={formValues.espacamentoTexto}
                  onChange={handleSelectChange('espacamentoTexto')}
                  width="auto"
                  aria-label="Selecionar espaçamento de texto"
                >
                  <option value="normal">Normal</option>
                  <option value="aumentado">Aumentado</option>
                  <option value="maximo">Máximo</option>
                </Select>
              </FormControl>
            </VStack>
          </Box>
          
          <Divider />
          
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Interação e Movimento
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="animacoes-reduzidas" mb="0" flex="1">
                  Animações reduzidas
                  <Tooltip label="Reduz ou elimina animações que podem causar desconforto">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="animacoes-reduzidas"
                  isChecked={formValues.animacoesReduzidas}
                  onChange={handleSwitchChange('animacoesReduzidas')}
                  colorScheme="blue"
                  aria-label="Ativar animações reduzidas"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="foco-visivel" mb="0" flex="1">
                  Destaque visual de foco
                  <Tooltip label="Torna o foco do teclado mais visível para melhor navegação">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="foco-visivel"
                  isChecked={formValues.focoVisivel}
                  onChange={handleSwitchChange('focoVisivel')}
                  colorScheme="blue"
                  aria-label="Ativar destaque visual de foco"
                />
              </FormControl>
            </VStack>
          </Box>
          
          <Divider />
          
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Recursos Adicionais
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="leitura-automatica" mb="0" flex="1">
                  Leitura automática de textos
                  <Tooltip label="Habilita a leitura de textos importantes por leitores de tela">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="leitura-automatica"
                  isChecked={formValues.leituraAutomatica}
                  onChange={handleSwitchChange('leituraAutomatica')}
                  colorScheme="blue"
                  aria-label="Ativar leitura automática de textos"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="legendas-imagens" mb="0" flex="1">
                  Legendas para imagens
                  <Tooltip label="Mostra descrições detalhadas para imagens quando disponíveis">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="legendas-imagens"
                  isChecked={formValues.legendasImagens}
                  onChange={handleSwitchChange('legendasImagens')}
                  colorScheme="blue"
                  aria-label="Ativar legendas para imagens"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="interface-simplificada" mb="0" flex="1">
                  Interface simplificada
                  <Tooltip label="Reduz elementos visuais não essenciais para uma experiência mais simples">
                    <span>
                      <Icon as={FiInfo} ml={1} />
                    </span>
                  </Tooltip>
                </FormLabel>
                <Switch 
                  id="interface-simplificada"
                  isChecked={formValues.interfaceSimplificada}
                  onChange={handleSwitchChange('interfaceSimplificada')}
                  colorScheme="blue"
                  aria-label="Ativar interface simplificada"
                />
              </FormControl>
            </VStack>
          </Box>
          
          <HStack spacing={4} justify="flex-end" pt={4}>
            <Button 
              leftIcon={<FiRotateCcw />} 
              onClick={handleReset}
              variant="outline"
              colorScheme="red"
              aria-label="Restaurar configurações padrão"
            >
              Restaurar Padrões
            </Button>
            
            <Button 
              leftIcon={<FiSave />} 
              onClick={handleSave}
              colorScheme="blue"
              aria-label="Salvar configurações"
            >
              Salvar Configurações
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AcessibilidadeConfigForm; 