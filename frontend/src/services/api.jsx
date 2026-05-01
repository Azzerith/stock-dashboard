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
  async (error) => {
    // Handle logout jika 401
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const config = error.config;

    if (!error.response && !config._retryCount) {
      config._retryCount = 0;
    }

    if (!error.response && config._retryCount < 3) {
      config._retryCount++;
      const delay = config._retryCount * 2000; // 2s → 4s → 6s
      console.warn(`Server belum siap, retry ke-${config._retryCount} dalam ${delay/1000}s...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;