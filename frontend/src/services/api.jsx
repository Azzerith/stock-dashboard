import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  if (config.method === 'get' && !config.url.includes('_t=')) {
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${Date.now()}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default api;