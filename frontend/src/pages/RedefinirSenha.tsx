import { useState, useEffect, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LockClosedIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import authService from '@services/auth.service';

export default function RedefinirSenha() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [verificandoToken, setVerificandoToken] = useState(true);
  
  // Verificar a validade do token ao carregar a página
  useEffect(() => {
    const verificarToken = async () => {
      if (!token) {
        setTokenValido(false);
        setVerificandoToken(false);
        return;
      }
      
      try {
        const resultado = await authService.verificarTokenRecuperacao(token);
        setTokenValido(resultado.valido);
        if (resultado.valido && resultado.email) {
          setEmail(resultado.email);
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setTokenValido(false);
      } finally {
        setVerificandoToken(false);
      }
    };
    
    verificarToken();
  }, [token]);
  
  const validarForm = (): boolean => {
    if (!senha) {
      setErro('A nova senha é obrigatória');
      return false;
    }
    
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (!confirmarSenha) {
      setErro('A confirmação de senha é obrigatória');
      return false;
    }
    
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return false;
    }
    
    setErro(null);
    return true;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validarForm() || !token) {
      return;
    }
    
    setEnviando(true);
    setErro(null);
    
    try {
      const { message } = await authService.redefinirSenha(token, senha);
      setSucesso(true);
      setSenha('');
      setConfirmarSenha('');
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setErro(
        error.response?.data?.message || 
        'Não foi possível redefinir sua senha. Tente novamente mais tarde.'
      );
    } finally {
      setEnviando(false);
    }
  };
  
  if (verificandoToken) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="TFD360"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verificando...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Estamos verificando a validade do seu link de recuperação.
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="TFD360"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Link Inválido
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O link de recuperação de senha é inválido ou expirou.
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Link inválido ou expirado</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      O link que você clicou é inválido ou expirou. Os links de recuperação de senha
                      são válidos por um período limitado de tempo por motivos de segurança.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        to="/recuperar-senha"
                        className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Solicitar novo link
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Voltar para login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.png"
          alt="TFD360"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Redefinir Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {email && `Para a conta ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {sucesso ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Senha redefinida com sucesso!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Sua senha foi redefinida com sucesso. Você será redirecionado para a página de
                      login em instantes.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        to="/login"
                        className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <ArrowLeftIcon className="h-5 w-5 inline-block mr-1" />
                        Ir para login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {erro && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{erro}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
              </div>

              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {enviando ? 'Processando...' : 'Redefinir Senha'}
                </button>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-sm">
                  <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Voltar para login
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 