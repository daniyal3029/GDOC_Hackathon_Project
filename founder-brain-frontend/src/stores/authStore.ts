import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api/authApi';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifySignup: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          set({ user: res.user, token: res.accessToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          // Backend creates user (isActive: false) and sends OTP email
          await authApi.register(name, email, password);
          // No token/user set yet — OTP verification required
        } finally {
          set({ isLoading: false });
        }
      },

      verifySignup: async (email: string, otp: string) => {
        set({ isLoading: true });
        try {
          // Backend verifies OTP and sets isActive: true
          await authApi.verifySignup(email, otp);
          // User can now login — no auto-login from verify
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          await authApi.forgotPassword(email);
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (email: string, otp: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          await authApi.resetPassword(email, otp, newPassword);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (err) {
          console.error('Logout API call failed', err);
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
