import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minimize2, Paperclip, Loader2 } from 'lucide-react';
import { chatService } from '../services/chat.service';
import { authService } from '../services/auth.service';
import { format } from 'date-fns';

interface ChatWidgetProps {
  businessId: number;
  businessName: string;
  onClose: () => void;
}

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
  last_message_at: string;
}

export default function ChatWidget({ businessId, businessName, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = authService.getCurrentUser();

  const loadInitialChat = useCallback(async () => {
    setIsLoading(true);
    try {
      // Find out if the user already has a chat with this business
      const data = await chatService.getChats();
      const existingChat = data.find((c: ChatRoom) => c.business_id === businessId);
      
      if (existingChat) {
        setActiveChatId(existingChat.id);
        const msgs = await chatService.getMessages(existingChat.id);
        setMessages(msgs);
      }
    } catch (error) {
      console.error("Failed to load initial chat:", error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    // Attempt to load existing chat history with this business
    loadInitialChat();
  }, [loadInitialChat]);

  useEffect(() => {
    if (activeChatId) {
      const socket = chatService.initSocket(user.id);
      
      // Explicitly tell the backend we are opening this specific chat room
      socket.emit('join_chat', activeChatId);
      
      const handleNewMessage = (msg: ChatMessage) => {
        if (msg.chat_id === activeChatId) {
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new_message', handleNewMessage);
      
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    } else {
      // Listen for socket events when the chat is fully new
      const socket = chatService.initSocket(user.id);
      
      const handleNewChatMsg = (msg: ChatMessage) => {
          setMessages(prev => [...prev, msg]);
          setActiveChatId(msg.chat_id);
      };

      socket.on('new_chat_message', handleNewChatMsg);

      return () => {
         socket.off('new_chat_message', handleNewChatMsg);
      };
    }
  }, [activeChatId, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // optimistic clear
    
    // Optimistic UI update could go here, but for simplicity we rely on the DB response

    try {
      const payload: { text: string; chatId?: number; businessId?: number } = { text: messageText };
      if (activeChatId) {
        payload.chatId = activeChatId;
      } else {
        payload.businessId = businessId; // Triggers new chat creation in backend
      }

      const sentMsg = await chatService.sendMessage(payload);
      
      if (!activeChatId && sentMsg.chat_id) {
         setActiveChatId(sentMsg.chat_id); // we got newly created chat info!
      }
      
      setMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      console.error("Failed to send message", error);
      // Might want to add error toast here in production
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          height: isMinimized ? 'auto' : '500px'
        }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden glass ${isMinimized ? 'h-auto' : 'h-[500px]'}`}
      >
        {/* Header - Glassmorphic with gradient */}
        <div className="bg-linear-to-r from-indigo-600 to-indigo-800 p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-0 right-16 -mb-6 w-12 h-12 rounded-full bg-white opacity-10"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="relative">
              <div className="h-10 w-10 text-xl font-bold rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 truncate shadow-sm">
                {businessName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-indigo-700"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide break-all max-w-[150px] truncate">{businessName}</h3>
              <p className="text-xs text-indigo-200">Usually replies instantly</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 relative z-10">
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100%", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grow flex flex-col bg-slate-50 relative overflow-hidden"
            >
              <div className="grow overflow-y-auto p-4 space-y-4 smooth-scroll">
                
                {/* Intro message */}
                <div className="text-center my-4">
                  <span className="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
                    Say hi to {businessName}!
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                     <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                     <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👋</span>
                     </div>
                     <p className="text-sm text-slate-500 max-w-[80%]">Ask about bulk orders, shipping times, or request custom quotas.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isCustomer = msg.sender_type === 'customer';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={msg.id || idx}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm wrap-break-word relative group ${isCustomer ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'}`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <div className={`text-[10px] mt-1 text-right block ${isCustomer ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.created_at ? format(new Date(msg.created_at), 'hh:mm a') : 'Now'}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-100">
                <form 
                  onSubmit={handleSendMessage} 
                  className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-inner"
                >
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your message..."
                    className="grow bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-slate-800 placeholder-slate-400"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className={`p-2.5 rounded-full flex items-center justify-center transition-all ${newMessage.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:scale-105 btn-press' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
