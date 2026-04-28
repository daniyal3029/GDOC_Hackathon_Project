import axios from 'axios';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID || 'demo-user-001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Fallback for development if no token exists
      config.headers['X-User-Id'] = DEMO_USER_ID;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    const status = error.response?.status;

    // Don't toast on cancelled requests
    if (axios.isCancel(error)) return Promise.reject(error);

    // Don't toast on 409 (idempotency conflict — handled by caller)
    if (status !== 409) {
      useNotificationStore.getState().addNotification({
        type: status && status < 500 ? 'warning' : 'error',
        title: status ? `Error ${status}` : 'Network Error',
        message: typeof message === 'string' ? message : 'Request failed',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
