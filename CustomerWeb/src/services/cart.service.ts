import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart/self');
    return response.data;
  },

  addToCart: async (productId: number, quantity: number = 1) => {
    const response = await api.post('/cart/self/items', { productId, quantity });
    return response.data;
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    const response = await api.put(`/cart/self/items/${itemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId: number) => {
    const response = await api.delete(`/cart/self/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart/self');
    return response.data;
  }
};
