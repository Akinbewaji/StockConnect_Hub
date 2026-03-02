import api from './api';

export const productService = {
  getAll: async (params: { search?: string; category?: string; page?: number; limit?: number; businessId?: number; minPrice?: number; maxPrice?: number }) => {
    const response = await api.get('/products', { params });
    // Handle both array and paginated object formats
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getById: async (id: number) => {
    const response = await api.get('/products', { params: { id } });
    const products = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return products.find((p: { id: number }) => p.id === Number(id));
  }
};
