import api from './client';

export const authApi = {
  /** Step 1: Register — returns { success, message } and sends OTP to email */
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  /** Step 2: Verify signup OTP — returns { success, message } */
  verifySignup: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/verify-signup', { email, otp });
    return data;
  },

  /** Login — returns { success, data: { user, accessToken } }, sets refreshToken cookie */
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data; // { user, accessToken }
  },

  /** Forgot password — sends OTP to email, returns { success, message } */
  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  /** Reset password with OTP — returns { success, message } */
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
    return data;
  },

  /** Logout — clears refreshToken cookie server-side */
  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  /** Get current user profile */
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
