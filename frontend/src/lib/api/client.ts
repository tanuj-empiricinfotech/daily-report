import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { endpoints } from './endpoints';
import { store } from '@/store/store';
import { clearUser } from '@/store/slices/authSlice';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '@/lib/storage.service';


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

const MAX_REFRESH_RETRIES = 2;

export async function refreshAccessToken(): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_REFRESH_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = response.data.token;
      if (newToken) {
        setAuthToken(newToken);
        return newToken;
      }
    } catch {
      // On last attempt, give up
      if (attempt === MAX_REFRESH_RETRIES - 1) return null;
      // Wait briefly before retrying (500ms)
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
}

const BACKGROUND_REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes (before 15min expiry)
const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000; // Refresh if expiring within 2 minutes

/** Check if the stored access token is expired or about to expire. */
function isTokenExpiredOrExpiring(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    return Date.now() >= expiresAt - TOKEN_EXPIRY_BUFFER_MS;
  } catch {
    return true; // Malformed token — treat as expired
  }
}

/** Silently refresh the token if it's expired or about to expire. */
async function silentRefresh(): Promise<void> {
  if (!getAuthToken()) return; // Not logged in
  if (!isTokenExpiredOrExpiring()) return; // Token still valid

  await refreshAccessToken();
}

/**
 * Proactively refresh the access token on app load and set up
 * a background interval to keep the session alive.
 */
export async function refreshTokenOnLoad(): Promise<void> {
  await silentRefresh();

  // Set up periodic background refresh to keep the token alive during idle time
  setInterval(silentRefresh, BACKGROUND_REFRESH_INTERVAL_MS);
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
        clearAuthToken();
        store.dispatch(clearUser());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        processQueue(null, refreshError);
        isRefreshing = false;
        clearAuthToken();
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
