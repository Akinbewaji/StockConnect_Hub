import api from './api';

export const orderService = {
  placeOrder: async (orderData: { 
    deliveryMethod: 'pickup' | 'delivery'; 
    deliveryAddressId?: number; 
    paymentMethod: 'cash' | 'card' | 'transfer';
    paymentReference?: string;
  }) => {
    const response = await api.post('/customers/self/orders', orderData);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/customers/self/orders');
    return response.data;
  },

  getOrderDetails: async (id: number) => {
    const response = await api.get(`/customers/self/orders/${id}`);
    return response.data;
  }
};
