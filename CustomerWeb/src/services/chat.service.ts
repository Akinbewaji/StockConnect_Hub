import api from './api';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket: Socket | null = null;

export const chatService = {
  getChats: async () => {
    const response = await api.get('/chat/self');
    return response.data;
  },

  getMessages: async (chatId: number) => {
    const response = await api.get(`/chat/self/${chatId}/messages`);
    return response.data;
  },

  sendMessage: async (messageData: { chatId?: number; text: string; businessId?: number }) => {
    const response = await api.post('/chat/self/messages', messageData);
    return response.data;
  },

  initSocket: (userId: number) => {
    if (!socket) {
      socket = io(SOCKET_URL);
      socket.emit('join', `user_${userId}`);
    }
    return socket;
  },

  getSocket: () => socket,

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
