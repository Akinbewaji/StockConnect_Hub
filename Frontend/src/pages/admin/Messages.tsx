import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../utils/api';
import socket from '../../utils/socket';
import { Send, MessageSquare, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function Messages() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadChats();
    // Join user room for notifications
    if (user?.id) {
      socket.emit('join', `user_${user.id}`);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      // Join chat room
      socket.emit('join_chat', selectedChat.id);
      
      const handleNewMessage = (msg: any) => {
        if (msg.chat_id === selectedChat.id) {
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new_message', handleNewMessage);
      
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const res = await authFetch('/api/chat/self');
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedChat(data[0]);
    } catch (error) {
      console.error("Failed to load chats");
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const res = await authFetch(`/api/chat/self/${chatId}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load messages");
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const res = await authFetch('/api/chat/self/messages', {
        method: 'POST',
        body: JSON.stringify({
          chatId: selectedChat.id,
          text: newMessage
        })
      });
      const sentMsg = await res.json();
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden">
      {/* Chat List */}
      <div className="w-80 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Customer Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No customer chats yet.</p>
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
              >
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <User size={20} />
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <h3 className="font-bold text-slate-900 truncate">{chat.customer_name}</h3>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <Phone size={10} /> {chat.customer_phone}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.customer_name}</h3>
                  <p className="text-xs text-green-500 font-semibold tracking-wide uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((msg, i) => (
                <div 
                  key={msg.id || i}
                  className={`flex ${msg.sender_type === 'business' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${msg.sender_type === 'business' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 flex justify-end ${msg.sender_type === 'business' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_at || Date.now()), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Select a conversation</h3>
            <p className="max-w-xs mt-2 text-sm">Respond to customer inquiries and build relationships with your buyers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
