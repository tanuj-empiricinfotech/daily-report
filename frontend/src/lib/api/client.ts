import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { endpoints } from './endpoints';
import { store } from '@/store/store';
import { clearUser } from '@/store/slices/authSlice';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
      // Clear auth state in Redux
      store.dispatch(clearUser());
      // Only redirect to login if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
export { endpoints };

