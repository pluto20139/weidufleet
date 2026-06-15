import axios from 'axios';
import { useAppStore } from '@/store/useAppStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const { token } = useAppStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const store = useAppStore.getState();
      store.setToken(null);
      store.setUser(null);
      store.setPage('login');
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;
