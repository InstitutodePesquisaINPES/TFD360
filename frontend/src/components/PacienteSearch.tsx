import React, { useState, useEffect } from 'react';
import { UserIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

interface Paciente {
  _id: string;
  nome: string;
  cpf: string;
  cartao_sus?: string;
  data_nascimento?: string;
}

interface PacienteSearchProps {
  onSelectPaciente: (paciente: Paciente | null) => void;
  selectedPaciente?: Paciente | null;
}

const PacienteSearch: React.FC<PacienteSearchProps> = ({ onSelectPaciente, selectedPaciente }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Limpar resultados quando o termo de busca for vazio
  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setError(null);
    }
  }, [searchTerm]);

  // Se o paciente já estiver selecionado, preencher o campo
  useEffect(() => {
    if (selectedPaciente) {
      setSearchTerm(selectedPaciente.nome);
    }
  }, [selectedPaciente]);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      setError('Digite pelo menos 3 caracteres para pesquisar');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/pacientes/buscar', {
        params: {
          termo: searchTerm
        }
      });
      
      setResults(response.data);
      setShowResults(true);
      
      if (response.data.length === 0) {
        setError('Nenhum paciente encontrado');
      }
    } catch (err: any) {
      console.error('Erro ao buscar pacientes:', err);
      setError(err.response?.data?.message || 'Erro ao buscar pacientes');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaciente = (paciente: Paciente) => {
    onSelectPaciente(paciente);
    setSearchTerm(paciente.nome);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSelectPaciente(null);
    setResults([]);
    setError(null);
  };

  // Formatar CPF para exibição
  const formatCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Calcular idade
  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  return (
    <div className="relative">
      <div className="mt-1 flex rounded-md shadow-sm">
        <div className="relative flex-grow focus-within:z-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="block w-full rounded-l-md pl-10 py-2 sm:text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Digite o nome, CPF ou cartão SUS"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-none text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="ml-2">Buscar</span>
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Limpar</span>
        </button>
      </div>

      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="mt-1 text-sm text-gray-500">Carregando...</div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1 text-base">
            {results.map((paciente) => (
              <li
                key={paciente._id}
                onClick={() => handleSelectPaciente(paciente)}
                className="cursor-pointer hover:bg-indigo-50 px-4 py-2"
              >
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-900">{paciente.nome}</div>
                  <div className="text-sm text-gray-500">
                    {paciente.data_nascimento && `${calcularIdade(paciente.data_nascimento)} anos`}
                  </div>
                </div>
                <div className="flex space-x-4 text-xs text-gray-500">
                  <div>CPF: {formatCPF(paciente.cpf)}</div>
                  {paciente.cartao_sus && <div>SUS: {paciente.cartao_sus}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PacienteSearch; 