import axios from 'axios';
import { message } from 'antd';
import { useAppStore } from '@/store';

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
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || '';
      if (msg.includes('服务已过期') || msg.includes('expired')) {
        message.error('当前租户服务已过期，请联系管理员续费');
      }
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;
