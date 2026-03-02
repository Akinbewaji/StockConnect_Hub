import api from './api';

export const quoteService = {
  requestQuote: async (data: { productId: number; requestedQuantity: number; message: string; attachmentUrl?: string }) => {
    const response = await api.post('/quotes/customer', data);
    return response.data;
  },
  
  getCustomerQuotes: async () => {
    const response = await api.get('/quotes/customer');
    return response.data;
  }
};
