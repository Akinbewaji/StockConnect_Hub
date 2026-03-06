import api from './api';
import { io, Socket } from 'socket.io-client';

// Extract the base API URL (e.g., https://stockconnect-hub.onrender.com/api)
const API_BASE_URL = api.defaults.baseURL || 'http://localhost:5000/api';

// Derive the socket URL by stripping the '/api' suffix
let SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
if (!SOCKET_URL) {
  SOCKET_URL = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL.slice(0, -4) 
    : API_BASE_URL;
}

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
