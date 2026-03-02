import { useState, useEffect } from 'react';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import { Package, Clock, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 mr-1" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'cancelled': return <XCircle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-8">Order History</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="text-slate-500 mt-2">When you place an order, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      <Package className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Order #{String(order.id).padStart(5, '0')}</h3>
                      <p className="text-sm text-slate-500">{format(new Date(order.created_at), 'PPP')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₦{order.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{order.payment_method}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
