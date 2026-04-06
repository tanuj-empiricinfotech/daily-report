import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { endpoints } from './endpoints';
import { store } from '@/store/store';
import { clearUser } from '@/store/slices/authSlice';
import {
  getAuthToken,
  clearAuthToken,
} from '@/lib/storage.service';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Pinggy-No-Screen': 'true'
  },
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      store.dispatch(clearUser());
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default client;
export { endpoints };
