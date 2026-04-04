import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { endpoints } from './endpoints';
import { store } from '@/store/store';
import { clearUser } from '@/store/slices/authSlice';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '@/lib/storage.service';

// Re-export for backward compatibility
export const getStoredToken = getAuthToken;
export const setStoredToken = setAuthToken;
export const clearStoredToken = clearAuthToken;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(token: string | null, error?: unknown): void {
  for (const promise of failedQueue) {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  }
  failedQueue = [];
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = response.data.token;
    if (newToken) {
      setStoredToken(newToken);
    }
    return newToken;
  } catch {
    return null;
  }
}

/**
 * Proactively refresh the access token on app load.
 * Called once when the app initializes to ensure a valid token exists.
 */
export async function refreshTokenOnLoad(): Promise<void> {
  const token = getAuthToken();
  if (!token) return; // Not logged in — nothing to refresh

  // Try to decode and check expiry (without verification — just checking the exp claim)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const bufferMs = 60_000; // Refresh if expiring within 1 minute

    if (Date.now() >= expiresAt - bufferMs) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        // Refresh failed — clear auth silently (user will be redirected on next API call)
        clearStoredToken();
        store.dispatch(clearUser());
      }
    }
  } catch {
    // Token is malformed — try refreshing anyway
    await refreshAccessToken();
  }
}

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
    const token = getStoredToken();
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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(client(originalRequest));
              } else {
                reject(error);
              }
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(newToken);
        isRefreshing = false;

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }

        // Refresh failed — clear auth
        clearStoredToken();
        store.dispatch(clearUser());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        processQueue(null, refreshError);
        isRefreshing = false;
        clearStoredToken();
        store.dispatch(clearUser());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default client;
export { endpoints };
