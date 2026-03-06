import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import { authService } from '../services/auth.service';
import Navbar from '../components/Navbar';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_type: 'customer' | 'business';
  text: string;
  created_at: string;
  read: number;
}

interface ChatRoom {
  id: number;
  customer_id: number;
  business_id: number;
  business_name: string;
  business_owner_name?: string;
  last_message_at: string;
}

export default function Chat() {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const user = authService.getCurrentUser();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await chatService.getChats();
        setChats(data);
        if (data.length > 0) setSelectedChat(data[0]);
      } catch {
        console.error("Failed to load chats");
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const data = await chatService.getMessages(selectedChat.id);
          setMessages(data);
        } catch {
          console.error("Failed to load messages");
        }
      };
      fetchMessages();

      // Setup socket
      const socket = chatService.initSocket(user.id);
      socket.emit('join_chat', selectedChat.id);

      const handleNewMessage = (msg: ChatMessage) => {
        if (msg.chat_id === selectedChat.id) {
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new_message', handleNewMessage);
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [selectedChat, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const sentMsg = await chatService.sendMessage({
        chatId: selectedChat.id,
        text: newMessage
      });
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch {
      console.error("Failed to send message");
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="grow flex overflow-hidden">
        {/* Chat List */}
        <div className="w-80 bg-white border-r border-slate-100 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-slate-50">
            <h2 className="text-xl font-bold text-slate-900 font-outfit">Messages</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''}`}
              >
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {chat.business_name[0]}
                </div>
                <div className="text-left overflow-hidden">
                  <h3 className="font-bold text-slate-900 truncate">{chat.business_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{chat.business_owner_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="grow flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold md:hidden">
                  {selectedChat.business_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.business_name}</h3>
                  <p className="text-xs text-green-500 font-semibold tracking-wide uppercase">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, i) => (
                  <div 
                    key={msg.id || i}
                    className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${msg.sender_type === 'customer' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_type === 'customer' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grow flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-slate-900">Select a chat to start messaging</h3>
              <p className="max-w-xs mt-2">Communicate directly with business owners about your orders and materials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
