import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import usuariosService from '@services/usuarios.service';
import api from '@services/api';

interface Prefeitura {
  id: string;
  nome: string;
}

interface Perfil {
  id: string;
  nome: string;
}

interface Usuario {
  id?: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo_perfil: string;
  prefeitura_id: string;
  senha?: string;
  confirmarSenha?: string;
  ativo: boolean;
  permissoes_adicionais?: string[];
}

// Estado inicial para um novo usuário
const initialUserState: Usuario = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  tipo_perfil: '',
  prefeitura_id: '',
  senha: '',
  confirmarSenha: '',
  ativo: true,
  permissoes_adicionais: []
};

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const isEditMode = Boolean(id);
  
  const [usuario, setUsuario] = useState<Usuario>(initialUserState);
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [permissoes, setPermissoes] = useState<{ id: string; nome: string }[]>([]);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Verificar permissão para gerenciar usuários
  if (!hasPermission('gerenciar_usuarios')) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 text-center max-w-md">
            Você não possui permissão para acessar esta página. Entre em contato com o administrador do
            sistema caso acredite que isso seja um erro.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    const fetchPrefeituras = async () => {
      try {
        // Aqui deve ser implementada a chamada real para listar prefeituras
        const response = await api.get('/prefeituras?limite=100&status=ativo');
        setPrefeituras(response.data.prefeituras);
      } catch (error) {
        console.error('Erro ao buscar prefeituras:', error);
      }
    };

    const fetchPerfis = async () => {
      try {
        const perfisData = await usuariosService.listarPerfis();
        setPerfis(perfisData);
      } catch (error) {
        console.error('Erro ao buscar perfis:', error);
      }
    };

    const fetchPermissoes = async () => {
      try {
        const permissoesData = await usuariosService.listarPermissoes();
        setPermissoes(permissoesData);
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
      }
    };

    const fetchUsuario = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        const userData = await usuariosService.buscar(id!);
        
        // Preparar dados do usuário para o formulário
        setUsuario({
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          cpf: userData.cpf,
          telefone: userData.telefone,
          tipo_perfil: userData.tipo_perfil,
          prefeitura_id: userData.prefeitura?.id || '',
          ativo: userData.ativo,
          permissoes_adicionais: userData.permissoes?.filter(
            (perm: string) => !perfis.find(p => p.id === userData.tipo_perfil)?.nome.includes(perm)
          )
        });

        // Se tiver foto, mostrar preview
        if (userData.foto) {
          setFotoPreview(userData.foto);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        setLoading(false);
      }
    };

    // Carregar dados necessários
    fetchPrefeituras();
    fetchPerfis();
    fetchPermissoes();
    
    // Se for modo de edição, buscar o usuário
    if (isEditMode) {
      fetchUsuario();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!usuario.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!usuario.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(usuario.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!usuario.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(usuario.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (!usuario.tipo_perfil) {
      newErrors.tipo_perfil = 'Perfil é obrigatório';
    }
    
    // Se não for Super Admin, precisa de prefeitura
    if (usuario.tipo_perfil !== 'super_admin' && !usuario.prefeitura_id) {
      newErrors.prefeitura_id = 'Prefeitura é obrigatória para este perfil';
    }
    
    // Senha é obrigatória apenas na criação
    if (!isEditMode) {
      if (!usuario.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (usuario.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
      }
      
      if (!usuario.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
      } else if (usuario.senha !== usuario.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
    } else if (usuario.senha || usuario.confirmarSenha) {
      // Se estiver editando e senha foi preenchida
      if (usuario.senha && usuario.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
      }
      
      if (usuario.senha !== usuario.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSuccessMessage('');
    
    try {
      // Criar FormData para upload de arquivo
      const formData = new FormData();
      
      // Adicionar dados do usuário ao FormData
      formData.append('nome', usuario.nome);
      formData.append('email', usuario.email);
      formData.append('cpf', usuario.cpf);
      formData.append('telefone', usuario.telefone || '');
      formData.append('tipo_perfil', usuario.tipo_perfil);
      
      if (usuario.tipo_perfil !== 'super_admin' && usuario.prefeitura_id) {
        formData.append('prefeitura_id', usuario.prefeitura_id);
      }
      
      formData.append('ativo', String(usuario.ativo));
      
      if (usuario.permissoes_adicionais && usuario.permissoes_adicionais.length > 0) {
        formData.append('permissoes_adicionais', JSON.stringify(usuario.permissoes_adicionais));
      }
      
      // Adicionar senha apenas se estiver criando ou se houver alteração
      if (!isEditMode || usuario.senha) {
        formData.append('senha', usuario.senha || '');
      }
      
      // Adicionar foto se estiver presente
      if (foto) {
        formData.append('foto', foto);
      }
      
      // Enviar requisição
      let response;
      if (isEditMode) {
        response = await usuariosService.atualizar(id!, formData);
        setSuccessMessage('Usuário atualizado com sucesso!');
      } else {
        response = await usuariosService.criar(formData);
        setSuccessMessage('Usuário criado com sucesso!');
        
        // Limpar o formulário após criar
        setUsuario(initialUserState);
        setFoto(null);
        setFotoPreview(null);
      }
      
      // Redirecionar após um breve delay para mostrar a mensagem de sucesso
      setTimeout(() => {
        navigate('/usuarios');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar usuário. Tente novamente mais tarde.';
      setErrors(prev => ({ ...prev, form: errorMessage }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUsuario(prev => ({ ...prev, [name]: checked }));
    } else {
      setUsuario(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Verificar tamanho máximo (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, foto: 'A foto não pode ter mais de 5MB' }));
        return;
      }
      
      // Verificar tipo
      const fileType = selectedFile.type;
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(fileType)) {
        setErrors(prev => ({ ...prev, foto: 'Formato de imagem inválido. Use JPG, PNG ou GIF' }));
        return;
      }
      
      setFoto(selectedFile);
      setFotoPreview(URL.createObjectURL(selectedFile));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.foto;
        return newErrors;
      });
    }
  };

  const removerFoto = () => {
    setFoto(null);
    setFotoPreview(null);
  };

  const handlePermissaoChange = (permissaoId: string) => {
    setUsuario(prev => {
      const permissoes = prev.permissoes_adicionais || [];
      
      if (permissoes.includes(permissaoId)) {
        return {
          ...prev,
          permissoes_adicionais: permissoes.filter(id => id !== permissaoId)
        };
      } else {
        return {
          ...prev,
          permissoes_adicionais: [...permissoes, permissaoId]
        };
      }
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Link
                to="/usuarios"
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
              </h1>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-6">
            {successMessage && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {errors.form && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.form}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Foto de Perfil */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Foto de Perfil</label>
                <div className="mt-1 flex items-center">
                  {fotoPreview ? (
                    <div className="relative">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removerFoto}
                        title="Remover foto"
                        className="absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="sr-only">Remover foto</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  <div className="ml-5">
                    <div className="relative bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm flex items-center cursor-pointer hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <label htmlFor="foto-upload" className="relative text-sm font-medium text-indigo-600 pointer-events-none">
                        <span>Carregar foto</span>
                        <span className="sr-only"> do usuário</span>
                      </label>
                      <input
                        id="foto-upload"
                        name="foto-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer border-gray-300 rounded-md"
                        onChange={handleFotoChange}
                        accept="image/*"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG ou GIF. Máximo 5MB.</p>
                    {errors.foto && (
                      <p className="mt-1 text-sm text-red-600">{errors.foto}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div className="sm:col-span-3">
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    value={usuario.nome}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.nome ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                  )}
                </div>
              </div>

              {/* CPF */}
              <div className="sm:col-span-3">
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="cpf"
                    id="cpf"
                    value={usuario.cpf}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.cpf ? 'border-red-300' : ''
                    }`}
                    placeholder="Digite apenas números"
                  />
                  {errors.cpf && (
                    <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={usuario.email}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
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
                    value={usuario.telefone}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Perfil/Tipo */}
              <div className="sm:col-span-3">
                <label htmlFor="tipo_perfil" className="block text-sm font-medium text-gray-700">
                  Perfil <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="tipo_perfil"
                    name="tipo_perfil"
                    value={usuario.tipo_perfil}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.tipo_perfil ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Selecione um perfil</option>
                    {perfis.map((perfil) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </option>
                    ))}
                  </select>
                  {errors.tipo_perfil && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipo_perfil}</p>
                  )}
                </div>
              </div>

              {/* Prefeitura */}
              {usuario.tipo_perfil !== 'super_admin' && (
                <div className="sm:col-span-3">
                  <label htmlFor="prefeitura_id" className="block text-sm font-medium text-gray-700">
                    Prefeitura <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="prefeitura_id"
                      name="prefeitura_id"
                      value={usuario.prefeitura_id}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.prefeitura_id ? 'border-red-300' : ''
                      }`}
                    >
                      <option value="">Selecione uma prefeitura</option>
                      {prefeituras.map((prefeitura) => (
                        <option key={prefeitura.id} value={prefeitura.id}>
                          {prefeitura.nome}
                        </option>
                      ))}
                    </select>
                    {errors.prefeitura_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.prefeitura_id}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Senha */}
              <div className="sm:col-span-3">
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && <span className="text-xs text-gray-500 ml-1">(Deixe em branco para manter a atual)</span>}
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="senha"
                    id="senha"
                    value={usuario.senha || ''}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.senha ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.senha && (
                    <p className="mt-1 text-sm text-red-600">{errors.senha}</p>
                  )}
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="sm:col-span-3">
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="confirmarSenha"
                    id="confirmarSenha"
                    value={usuario.confirmarSenha || ''}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.confirmarSenha ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.confirmarSenha && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>
                  )}
                </div>
              </div>

              {/* Status - Ativo/Inativo */}
              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="ativo"
                      name="ativo"
                      type="checkbox"
                      checked={usuario.ativo}
                      onChange={(e) => setUsuario(prev => ({ ...prev, ativo: e.target.checked }))}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="ativo" className="font-medium text-gray-700">
                      Ativo
                    </label>
                    <p className="text-gray-500">O usuário terá acesso ao sistema se estiver ativo.</p>
                  </div>
                </div>
              </div>

              {/* Permissões adicionais */}
              {permissoes.length > 0 && (
                <div className="sm:col-span-6 border-t border-gray-200 pt-5">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-900">Permissões Adicionais</legend>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        {permissoes.map((permissao) => (
                          <div key={permissao.id} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id={`permissao-${permissao.id}`}
                                name={`permissao-${permissao.id}`}
                                type="checkbox"
                                checked={(usuario.permissoes_adicionais || []).includes(permissao.id)}
                                onChange={() => handlePermissaoChange(permissao.id)}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={`permissao-${permissao.id}`} className="font-medium text-gray-700">
                                {permissao.nome}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-200 flex justify-end space-x-3">
              <Link
                to="/usuarios"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 