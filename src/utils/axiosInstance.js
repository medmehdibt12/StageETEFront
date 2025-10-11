// src/utils/axiosInstance.js
import axios from 'axios';
import { logout } from '../services/auth.service';

export const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://91.134.242.89/api';

const api = axios.create({
  baseURL: BACKEND_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLocked = error.response?.status === 403 && error.response?.data?.message === 'Account is locked.';

    if (isLocked) {
      logout();
      document.title = 'Bienvenue | CSO Plateforme';

      // 👇 Only force redirect if not already on login page
      if (!window.location.pathname.includes('/auth/signin')) {
        window.location.href = '/auth/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
