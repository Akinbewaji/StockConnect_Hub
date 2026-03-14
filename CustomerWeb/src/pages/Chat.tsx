import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import { authService } from '../services/auth.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Send, MessageSquare, Search, MoreHorizontal, Shield, Sparkles, ArrowLeft, Info, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [searchTerm, setSearchTerm] = useState('');
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

      const socket = chatService.initSocket(user.id);
      socket.emit('join_chat', selectedChat.id);

      const handleNewMessage = (msg: ChatMessage) => {
        if (msg.chat_id === selectedChat.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
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

  const filteredChats = chats.filter(chat => 
    chat.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#fcfcfc] flex flex-col overflow-hidden">
      <SEO title="Nexus Comms" description="Real-time encrypted communication hub for material procurement." />
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Left Sidebar: Chat List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-96 flex flex-col bg-white rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
        >
          {/* List Header */}
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 font-outfit tracking-tight flex items-center gap-3">
                Nexus
                <Sparkles size={20} className="text-indigo-400" />
              </h2>
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Plus size={20} />
              </button>
            </div>
            
            <div className="relative group mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search transmission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
            <div className="space-y-2">
              <AnimatePresence>
                {filteredChats.map((chat) => (
                  <motion.button
                    layout
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-5 rounded-4xl flex items-center gap-4 transition-all relative group ${
                      selectedChat?.id === chat.id 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                        : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black font-outfit shrink-0 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-50'
                    }`}>
                      {chat.business_name[0]}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold truncate text-base">{chat.business_name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedChat?.id === chat.id ? 'text-indigo-200' : 'text-slate-300'}`}>
                          {chat.last_message_at ? format(new Date(chat.last_message_at), 'HH:mm') : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${selectedChat?.id === chat.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {chat.business_owner_name || 'System Identity'}
                      </p>
                    </div>
                    {selectedChat?.id === chat.id && (
                      <motion.div layoutId="active-indicator" className="absolute right-2 w-1.5 h-10 bg-white/40 rounded-full" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar: Chat Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white rounded-5xl shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col overflow-hidden relative"
        >
          {selectedChat ? (
            <>
              {/* Window Header */}
              <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-slate-400">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-lg font-outfit">
                    {selectedChat.business_name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 font-outfit tracking-tight flex items-center gap-2">
                      {selectedChat.business_name}
                      <Shield size={14} className="text-emerald-500 fill-emerald-500" />
                    </h3>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Active Frequency
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                    <Info size={20} />
                  </button>
                  <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              {/* Message Arena */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 custom-scrollbar">
                <AnimatePresence>
                  {messages.map((msg, i) => {
                    const isSelf = msg.sender_type === 'customer';
                    return (
                      <motion.div 
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] flex items-end gap-3 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] shrink-0 font-outfit ${
                            isSelf ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 shadow-sm border border-slate-50'
                          }`}>
                            {isSelf ? 'ME' : selectedChat.business_name[0]}
                          </div>
                          
                          <div className={`p-4 md:p-5 rounded-3xl shadow-sm relative ${
                            isSelf 
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                              : 'bg-white text-slate-900 border border-slate-50 rounded-bl-none'
                          }`}>
                            <p className="text-sm md:text-base font-medium leading-relaxed">{msg.text}</p>
                            <div className={`flex items-center gap-1.5 mt-2 ${isSelf ? 'justify-end text-indigo-200' : 'text-slate-300'}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                              {isSelf && (
                                <div className="flex gap-0.5">
                                  <div className="w-1 h-1 bg-white/40 rounded-full" />
                                  <div className="w-1 h-1 bg-white/80 rounded-full" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Transmission Unit */}
              <div className="p-8 bg-white/80 backdrop-blur-md border-t border-slate-50">
                <form onSubmit={handleSendMessage} className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <button type="button" className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <Plus size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-100" />
                  </div>
                  
                  <input
                    type="text"
                    className="w-full pl-20 pr-32 py-5 bg-slate-100/50 border border-slate-50 rounded-3xl text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Enter manual override text..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                    >
                      Transmit
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="grow flex flex-col items-center justify-center bg-[#fcfcfc] overflow-hidden">
               {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center text-center p-12"
              >
                <div className="w-32 h-32 bg-indigo-50 rounded-5xl flex items-center justify-center text-indigo-400 mb-8 shadow-2xl shadow-indigo-50 border border-white">
                  <MessageSquare size={56} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight mb-3">Initialize Nexus</h3>
                <p className="max-w-sm text-slate-400 font-medium leading-relaxed">
                  Select a business frequency from the encryption grid to begin your transmission.
                </p>
                <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="p-4 bg-white rounded-3xl border border-slate-50 shadow-sm flex flex-col items-center gap-2">
                    <Shield size={20} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Encrypted</span>
                  </div>
                  <div className="p-4 bg-white rounded-3xl border border-slate-50 shadow-sm flex flex-col items-center gap-2">
                    <Sparkles size={20} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Real-time</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
