import api from './api';

export const authService = {
  register: async (userData: { name: string; phone: string; email: string; password: string; address?: { street: string; city: string; state: string } }) => {
    const response = await api.post('/customers/self/register', userData);
    return response.data;
  },

  getSellerProfile: async (id: number | string) => {
    const response = await api.get(`/auth/seller/${id}`);
    return response.data;
  },

  login: async (identifier: string, password: string) => {
    const response = await api.post('/customers/self/login', { identifier, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // OTP methods (commented out - using password auth instead)
  // requestOTP: async (identifier: string, channel: 'sms' | 'email' = 'sms') => { ... },
  // verifyOTP: async (identifier: string, code: string) => { ... },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
