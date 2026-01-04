import axios from 'axios';
import { getAuthState } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Try to get token from Zustand store first
  const authState = getAuthState();
  let token = authState.accessToken;

  // If store is hydrated but no token, or if not hydrated, try localStorage
  if (!token) {
    token = localStorage.getItem('accessToken');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to get refresh token from Zustand store first
        const authState = getAuthState();
        let refreshToken = authState.refreshToken;

        // Fallback to localStorage if store isn't hydrated yet
        if (!refreshToken) {
          refreshToken = localStorage.getItem('refreshToken');
        }

        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { user, accessToken, refreshToken: newRefreshToken } = response.data;

          // Update Zustand store with new tokens
          authState.setAuth(user, accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear auth state on refresh failure
        const authState = getAuthState();
        authState.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

