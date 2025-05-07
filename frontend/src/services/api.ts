import axios from 'axios';

// Definir a URL base para as requisições
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Interceptador para requisições
api.interceptors.request.use(
  (config) => {
    // Obter o token de acesso do localStorage
    const token = localStorage.getItem('@TFD360:token');
    
    // Se houver um token, adicioná-lo aos cabeçalhos
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para respostas
api.interceptors.response.use(
  (response) => {
    // Retornar resposta normalmente se não houver erros
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Verificar se o erro é de token expirado (401) e não é uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        // Obter o refresh token do localStorage
        const refreshToken = localStorage.getItem('@TFD360:refreshToken');
        
        if (!refreshToken) {
          // Se não houver refresh token, fazer logout
          localStorage.removeItem('@TFD360:token');
          localStorage.removeItem('@TFD360:user');
          localStorage.removeItem('@TFD360:refreshToken');
          
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Tentar obter um novo token usando o refresh token
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Salvar os novos tokens
        localStorage.setItem('@TFD360:token', accessToken);
        localStorage.setItem('@TFD360:refreshToken', newRefreshToken);
        
        // Atualizar o token no cabeçalho da requisição original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Repetir a requisição original com o novo token
        return api(originalRequest);
      } catch (refreshError) {
        // Se houver erro ao atualizar o token, fazer logout
        localStorage.removeItem('@TFD360:token');
        localStorage.removeItem('@TFD360:user');
        localStorage.removeItem('@TFD360:refreshToken');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Retornar o erro original para outros casos
    return Promise.reject(error);
  }
);

export default api; 