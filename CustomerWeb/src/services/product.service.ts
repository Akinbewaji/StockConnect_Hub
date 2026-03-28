import api from './api';
import { useQuery } from '@tanstack/react-query';

export const productService = {
  getAll: async (params: { search?: string; category?: string; page?: number; limit?: number; businessId?: number; minPrice?: number; maxPrice?: number } = {}) => {
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

export const useProducts = (params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getAll(params),
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
};

