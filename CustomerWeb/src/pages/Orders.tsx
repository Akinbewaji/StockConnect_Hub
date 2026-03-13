import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Package, Search, Filter, ChevronRight, Clock, CheckCircle2, AlertCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  payment_method: string;
  delivery_method: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': 
        return { 
          color: 'text-amber-600 bg-amber-50 border-amber-100', 
          icon: <Clock size={14} />,
          label: 'Pending'
        };
      case 'confirmed': 
        return { 
          color: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
          icon: <CheckCircle2 size={14} />,
          label: 'Confirmed'
        };
      case 'delivered': 
        return { 
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200', 
          icon: <CheckCircle2 size={14} />,
          label: 'Delivered'
        };
      case 'cancelled': 
        return { 
          color: 'text-rose-600 bg-rose-50 border-rose-100', 
          icon: <AlertCircle size={14} />,
          label: 'Cancelled'
        };
      default: 
        return { 
          color: 'text-slate-500 bg-slate-50 border-slate-100', 
          icon: <Clock size={14} />,
          label: status
        };
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching your history...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="My Orders" description="Track and manage your material procurement history." />
      {/* Background Decor */}
      <Navbar />
      
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-indigo-600">Order History</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Your Orders</h1>
              <p className="text-slate-500 mt-2 text-lg">Track and manage your material procurement history.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search orders..."
                  className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all w-64"
                />
              </div>
              <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-5xl p-20 text-center shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100">
                <Package size={48} strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-black font-outfit text-slate-900 mb-4">No orders placed yet</h2>
              <p className="text-slate-400 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
                Your procurement journey starts here. Explore our products and place your first order.
              </p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Explore Products <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => {
                const status = getStatusConfig(order.status);
                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group relative bg-white rounded-4xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8 shadow-xl shadow-slate-200/30 border border-slate-100 transition-all hover:border-indigo-100 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-indigo-50/50 transition-colors" />
                    
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                      <ShoppingBag size={28} strokeWidth={1.5} />
                    </div>

                    <div className="grow w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Order Identifier</p>
                          <h3 className="text-xl font-bold text-slate-900">#{String(order.id).padStart(5, '0')}</h3>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-300" />
                          <p className="text-sm font-bold text-slate-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-slate-300" />
                          <p className="text-sm font-bold text-slate-500">
                             {order.payment_method?.toUpperCase()} • {order.delivery_method?.toUpperCase()}
                          </p>
                        </div>
                        <div className="ml-auto sm:text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Amount</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">₦{order.total_amount.toLocaleString()}</p>
                        </div>
                        <ChevronRight className="hidden sm:block text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={24} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
