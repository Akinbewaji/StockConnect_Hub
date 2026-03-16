import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ChevronRight,
  Eye,
  Filter,
  MoreVertical,
  X
} from 'lucide-react';
import { authFetch } from '../../utils/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ListSkeleton } from '../../components/Skeleton';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle2 size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-slate-500 text-xs font-medium">Process and verify split multi-vendor orders</p>
        </div>
        <button 
            onClick={fetchOrders}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
        >
            <Filter size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Order ID / Customer..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'pending', 'confirmed', 'shipped'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && !orders.length ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                onClick={async () => {
                   setLoading(true);
                   try {
                     const res = await authFetch(`/api/orders/${order.id}`);
                     const details = await res.json();
                     setSelectedOrder(details);
                     setShowDetails(true);
                   } finally {
                     setLoading(false);
                   }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100">
                    #{order.id.toString().slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{order.customer_name || 'Portal User'}</h3>
                      {order.payment_status === 'paid' && (
                        <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded font-black tracking-tighter shadow-sm">PAID</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${getStatusColor(order.status).split(' ')[1]}`}>
                          {order.status}
                       </span>
                       <span className="text-[10px] text-slate-300 font-bold">•</span>
                       <span className="text-[10px] text-slate-400 font-medium">₦{Number(order.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100" />
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <Package size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-400">No matching orders found</p>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[100] flex flex-col p-6 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Order #{selectedOrder.id}</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase">Customer</span>
                    <span className="text-slate-900 font-black">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase">Payment</span>
                    <span className={`font-black ${selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {selectedOrder.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verify & Process</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['confirmed', 'shipped'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                        disabled={selectedOrder.status === s || updatingId === selectedOrder.id}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                          selectedOrder.status === s 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white border-slate-50 text-slate-500 hover:border-indigo-100'
                        }`}
                      >
                        {updatingId === selectedOrder.id ? '...' : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Items</h3>
                    <div className="space-y-2">
                        {selectedOrder.items?.map((item: any) => (
                           <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                              <span className="text-xs font-bold text-slate-700">{item.name} <span className="text-indigo-400">× {item.quantity}</span></span>
                              <span className="text-xs font-black text-slate-900">₦{(item.quantity * item.unit_price).toLocaleString()}</span>
                           </div>
                        ))}
                    </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-end mb-4">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</p>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">₦{Number(selectedOrder.total_amount).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
