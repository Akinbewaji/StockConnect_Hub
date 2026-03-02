import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications/self');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/self/unread-count');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/self/${id}/read`);
    return response.data;
  }
};
