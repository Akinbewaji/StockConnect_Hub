import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  Brain, Send, Sparkles, TrendingUp, AlertTriangle, 
  ShoppingBag, Zap, RefreshCw, BarChart3, PieChart as PieChartIcon,
  MessageSquare, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../../utils/api';
import socket from '../../utils/socket';

// Types for business data
interface BusinessInsightData {
  sales: any[];
  inventory: any[];
  customers: any[];
  recentOrders: any[];
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Insights() {
  const [data, setData] = useState<BusinessInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await authFetch('/api/insights/summary');
      const jsonData = await res.json();
      setData(jsonData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch insights data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time updates
    socket.on("sale_completed", () => {
      fetchData();
    });

    return () => {
      socket.off("sale_completed");
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setIsTyping(true);

    try {
      const res = await authFetch('/api/insights/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      const result = await res.json();
      
      if (result.insights) {
        setChatHistory(prev => [...prev, { role: 'ai', content: result.insights }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that query. Please try again." }]);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "An error occurred while connecting to the AI Advisor." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="text-indigo-600" size={40} />
        </motion.div>
      </div>
    );
  }

  // Process data for charts
  const salesChartData = data?.recentOrders.map((o, i) => ({
    name: `Order ${i + 1}`,
    amount: o.total_amount
  })) || [];

  const inventoryChartData = [
    { name: 'Healthy', value: (data?.inventory.length || 0) * 2 }, // Mocking proportions for visual
    { name: 'Low Stock', value: data?.inventory.length || 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Brain className="text-indigo-600" size={32} />
            Business Insights Control Room
          </h1>
          <p className="text-slate-500 mt-1">Real-time analysis and AI-powered decision making</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-bold text-sm">
          <Zap size={16} className="animate-pulse" />
          Live Action Mode Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Sales Velocity Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-50 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-500" />
                Sales Velocity
              </h2>
              <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Real-time Feed</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4F46E5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Distribution */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-purple-500" />
                Inventory Health
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {inventoryChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Performance Stats */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-500" />
                Product Performance
              </h3>
              <div className="space-y-4">
                {data?.recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{order.status}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">₦{order.total_amount}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors">
                View Full Report
              </button>
            </motion.div>
          </div>
        </div>

        {/* Right Column: AI Business Advisor */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-3xl h-[calc(100vh-12rem)] flex flex-col shadow-2xl overflow-hidden border border-slate-800"
          >
            {/* AI Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white ring-4 ring-indigo-900/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="font-bold text-white">AI Business Advisor</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gemini 1.5 Powered</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <p className="text-white font-bold">How can I help you today?</p>
                    <p className="text-slate-500 text-xs px-6">Ask me about your sales trends, inventory optimization, or growth strategies.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 p-2">
                    <button onClick={() => setQuery("What are my top 3 selling products?")} className="text-[10px] py-1.5 px-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                      Top selling products?
                    </button>
                    <button onClick={() => setQuery("Should I reorder stock now?")} className="text-[10px] py-1.5 px-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                      Inventory advice?
                    </button>
                  </div>
                </div>
              )}

              {chatHistory.map((msg, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask your AI Advisor..."
                  className="w-full bg-slate-800 border-none text-white text-sm rounded-2xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-500"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
