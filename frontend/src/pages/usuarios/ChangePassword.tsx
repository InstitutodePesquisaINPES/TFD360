import { useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationCircleIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@contexts/AuthContext';
import MainLayout from '@components/layout/MainLayout';
import usuariosService from '@services/usuarios.service';

export default function ChangePassword() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Estados para os campos do formulário
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados para controle de UI
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Determina se o usuário atual está alterando a própria senha
  const isSelfUpdate = currentUser?.id === id;
  
  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Se for o próprio usuário, a senha atual é obrigatória
    if (isSelfUpdate && !senhaAtual) {
      newErrors.senhaAtual = 'A senha atual é obrigatória';
    }
    
    if (!novaSenha) {
      newErrors.novaSenha = 'A nova senha é obrigatória';
    } else if (novaSenha.length < 6) {
      newErrors.novaSenha = 'A nova senha deve ter pelo menos 6 caracteres';
    }
    
    if (!confirmarSenha) {
      newErrors.confirmarSenha = 'A confirmação da senha é obrigatória';
    } else if (novaSenha !== confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para o envio do formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!id) {
      setErrors({ form: 'ID de usuário não especificado' });
      return;
    }
    
    setSubmitting(true);
    setSuccessMessage('');
    
    try {
      await usuariosService.alterarSenha(
        id,
        isSelfUpdate ? senhaAtual : null,
        novaSenha
      );
      
      setSuccessMessage('Senha alterada com sucesso!');
      
      // Limpar os campos do formulário
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate(isSelfUpdate ? '/dashboard' : `/usuarios/${id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao alterar senha. Tente novamente mais tarde.';
      setErrors({ form: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-md mx-auto sm:px-6 lg:px-8">
          {/* Botão de voltar */}
          <div className="mb-6">
            <Link
              to={isSelfUpdate ? '/dashboard' : `/usuarios/${id}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              {isSelfUpdate ? 'Voltar para o Dashboard' : 'Voltar para o perfil do usuário'}
            </Link>
          </div>
          
          {/* Cartão de alteração de senha */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Alterar Senha</h2>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              {/* Mensagem de sucesso */}
              {successMessage && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mensagem de erro geral */}
              {errors.form && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errors.form}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Senha atual - apenas para o próprio usuário */}
              {isSelfUpdate && (
                <div className="mb-6">
                  <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-1">
                    Senha Atual <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="senhaAtual"
                      name="senhaAtual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.senhaAtual ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                  </div>
                  {errors.senhaAtual && (
                    <p className="mt-2 text-sm text-red-600">{errors.senhaAtual}</p>
                  )}
                </div>
              )}
              
              {/* Nova senha */}
              <div className="mb-6">
                <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="novaSenha"
                    name="novaSenha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.novaSenha ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                </div>
                {errors.novaSenha ? (
                  <p className="mt-2 text-sm text-red-600">{errors.novaSenha}</p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>
              
              {/* Confirmar nova senha */}
              <div className="mb-6">
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmarSenha"
                    name="confirmarSenha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.confirmarSenha ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                </div>
                {errors.confirmarSenha && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmarSenha}</p>
                )}
              </div>
              
              {/* Botões de ação */}
              <div className="flex justify-end space-x-3">
                <Link
                  to={isSelfUpdate ? '/dashboard' : `/usuarios/${id}`}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Dicas de segurança */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700">
            <h3 className="font-medium mb-2">Dicas para uma senha segura:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use pelo menos 8 caracteres</li>
              <li>Combine letras maiúsculas e minúsculas</li>
              <li>Inclua números e símbolos especiais</li>
              <li>Evite palavras do dicionário ou informações pessoais</li>
              <li>Não reutilize senhas de outros serviços</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 