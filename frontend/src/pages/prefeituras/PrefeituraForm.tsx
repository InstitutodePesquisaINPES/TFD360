import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import {
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import api from '@services/api';

interface ModuloSistema {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
}

interface PrefeituraFormData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  endereco: string;
  cep: string;
  data_validade_contrato: string;
  limite_usuarios: number;
  modulos_ativos: string[];
  status: string;
  observacoes: string;
}

export default function PrefeituraForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEditMode = !!id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [modulosDisponiveis, setModulosDisponiveis] = useState<ModuloSistema[]>([]);
  const [formData, setFormData] = useState<PrefeituraFormData>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    cidade: '',
    estado: '',
    endereco: '',
    cep: '',
    data_validade_contrato: '',
    limite_usuarios: 10,
    modulos_ativos: ['core'],
    status: 'ativo',
    observacoes: '',
  });

  // Carregar dados da prefeitura (no modo de edição) e dos módulos do sistema
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar lista de módulos do sistema
        const modulosResponse = await api.get('/prefeituras/modulos');
        setModulosDisponiveis(modulosResponse.data);

        // Carregar dados da prefeitura (somente no modo de edição)
        if (isEditMode && id) {
          const prefeituraResponse = await api.get(`/prefeituras/${id}`);
          const prefeitura = prefeituraResponse.data;
          
          setFormData({
            nome: prefeitura.nome,
            cnpj: prefeitura.cnpj,
            telefone: prefeitura.telefone || '',
            email: prefeitura.email || '',
            cidade: prefeitura.cidade,
            estado: prefeitura.estado,
            endereco: prefeitura.endereco || '',
            cep: prefeitura.cep || '',
            data_validade_contrato: prefeitura.data_validade_contrato 
              ? new Date(prefeitura.data_validade_contrato).toISOString().split('T')[0] 
              : '',
            limite_usuarios: prefeitura.limite_usuarios,
            modulos_ativos: prefeitura.modulos_ativos,
            status: prefeitura.status,
            observacoes: prefeitura.observacoes || '',
          });

          if (prefeitura.logo) {
            setLogoPreview(prefeitura.logo);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.response?.data?.message || 'Erro ao carregar dados. Tente novamente mais tarde.');
      }
    };

    carregarDados();
  }, [id, isEditMode]);

  // Verificar se o usuário tem permissão para gerenciar prefeituras
  if (!hasPermission('gerenciar_prefeituras')) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para {isEditMode ? 'editar' : 'cadastrar'} prefeituras.
            Entre em contato com o administrador do sistema caso acredite que isso seja um erro.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Voltar
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (moduloId: string) => {
    const modulosAtualizados = formData.modulos_ativos.includes(moduloId)
      ? formData.modulos_ativos.filter(id => id !== moduloId)
      : [...formData.modulos_ativos, moduloId];
    
    // Garantir que o módulo 'core' sempre esteja selecionado
    if (moduloId === 'core' && !modulosAtualizados.includes('core')) {
      return; // Não permitir desmarcar o módulo core
    }

    setFormData({
      ...formData,
      modulos_ativos: modulosAtualizados,
    });
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      
      // Criar URL para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validar campos obrigatórios
      if (!formData.nome || !formData.cnpj || !formData.cidade || !formData.estado) {
        setError('Preencha todos os campos obrigatórios');
        setIsSubmitting(false);
        return;
      }

      // Criar FormData para upload de arquivo
      const data = new FormData();
      
      // Adicionar dados do formulário
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'modulos_ativos') {
          // Para arrays, precisamos adicionar cada item separadamente
          if (Array.isArray(value)) {
            value.forEach(item => {
              data.append('modulos_ativos', item);
            });
          }
        } else {
          data.append(key, String(value));
        }
      });
      
      // Adicionar logo se existir
      if (logo) {
        data.append('logo', logo);
      }
      
      let response;
      
      if (isEditMode) {
        // Modo de edição
        response = await api.put(`/prefeituras/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Modo de criação
        response = await api.post('/prefeituras', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Redirecionar para a página de listagem após sucesso
      navigate('/prefeituras');
    } catch (err: any) {
      console.error('Erro ao salvar prefeitura:', err);
      
      if (err.response?.data?.erros && Array.isArray(err.response.data.erros)) {
        const erros = err.response.data.erros.map((e: any) => `${e.campo}: ${e.mensagem}`).join('; ');
        setError(`Erro ao salvar prefeitura: ${erros}`);
      } else {
        setError(err.response?.data?.message || 'Erro ao salvar prefeitura. Tente novamente mais tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? 'Editar Prefeitura' : 'Nova Prefeitura'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? 'Altere os dados da prefeitura conforme necessário'
                : 'Preencha os dados para cadastrar uma nova prefeitura'}
            </p>
          </div>
          <button
            onClick={() => navigate('/prefeituras')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
            Voltar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow overflow-hidden">
          {error && (
            <div className="bg-red-50 p-4 border-l-4 border-red-400">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Seção de informações básicas */}
            <div className="sm:col-span-6">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Informações Básicas</h2>
            </div>

            {/* Logo */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Logo da Prefeitura</label>
              <div className="mt-1 flex items-center space-x-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removerLogo}
                      className="absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    {logoPreview ? 'Alterar Logo' : 'Selecionar Logo'}
                  </label>
                  <input
                    id="logo-upload"
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF até 5MB</p>
                </div>
              </div>
            </div>

            {/* Nome */}
            <div className="sm:col-span-3">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* CNPJ */}
            <div className="sm:col-span-3">
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cnpj"
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  required
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Telefone */}
            <div className="sm:col-span-3">
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="telefone"
                  id="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Email */}
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Seção de endereço */}
            <div className="sm:col-span-6 mt-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Endereço</h2>
            </div>

            {/* Endereço */}
            <div className="sm:col-span-6">
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="endereco"
                  id="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* CEP */}
            <div className="sm:col-span-2">
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                CEP
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cep"
                  id="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="XXXXX-XXX"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Cidade */}
            <div className="sm:col-span-2">
              <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
                Cidade <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cidade"
                  id="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Estado */}
            <div className="sm:col-span-2">
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                Estado <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            {/* Seção de configurações */}
            <div className="sm:col-span-6 mt-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Configurações</h2>
            </div>

            {/* Data de Validade */}
            <div className="sm:col-span-2">
              <label htmlFor="data_validade_contrato" className="block text-sm font-medium text-gray-700">
                Data de Validade do Contrato <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="data_validade_contrato"
                  id="data_validade_contrato"
                  value={formData.data_validade_contrato}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Limite de Usuários */}
            <div className="sm:col-span-2">
              <label htmlFor="limite_usuarios" className="block text-sm font-medium text-gray-700">
                Limite de Usuários <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="limite_usuarios"
                  id="limite_usuarios"
                  min="1"
                  max="1000"
                  value={formData.limite_usuarios}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Status */}
            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Módulos Ativos */}
            <div className="sm:col-span-6 mt-2">
              <fieldset>
                <legend className="text-sm font-medium text-gray-900">Módulos Ativos</legend>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {modulosDisponiveis.map((modulo) => (
                    <div key={modulo.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`modulo-${modulo.id}`}
                          name="modulos_ativos"
                          type="checkbox"
                          checked={formData.modulos_ativos.includes(modulo.id)}
                          onChange={() => handleCheckboxChange(modulo.id)}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          disabled={modulo.id === 'core'} // Módulo core sempre ativo
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`modulo-${modulo.id}`} className="font-medium text-gray-700">
                          {modulo.nome}
                        </label>
                        <p className="text-gray-500">{modulo.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Observações */}
            <div className="sm:col-span-6 mt-4">
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <div className="mt-1">
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Informações adicionais sobre a prefeitura ou o contrato.
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="px-6 py-3 bg-gray-50 text-right space-x-3">
            <button
              type="button"
              onClick={() => navigate('/prefeituras')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Atualizar' : 'Cadastrar'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 