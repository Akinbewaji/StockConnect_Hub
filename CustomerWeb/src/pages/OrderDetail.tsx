import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import { Package, Truck, Calendar, CreditCard, ChevronLeft, CheckCircle2, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface OrderDetails {
  id: number;
  order_date: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  customer_name: string;
  shipping_address: string;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await orderService.getOrderDetails(Number(id));
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Order...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Package size={40} className="text-slate-200" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-slate-500 mb-8">We couldn't find the order you were looking for.</p>
        <button onClick={() => navigate('/orders')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">
          View My Orders
        </button>
      </div>
    </div>
  );

  const steps = ['Pending', 'Processing', 'Delivered'];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-32">
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center text-slate-500 hover:text-indigo-600 mb-8 font-black text-xs uppercase tracking-widest transition-all"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Orders
        </button>

        <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 z-0">
              <ShoppingBag size={120} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Order Tracking</p>
                <h1 className="text-3xl font-black font-outfit">#{order.id.toString().padStart(6, '0')}</h1>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                  <Calendar size={18} className="text-indigo-400" />
                  <div>
                    <p className="text-[8px] font-black uppercase text-indigo-300">Date Ordered</p>
                    <p className="text-sm font-bold">{new Date(order.order_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                  <CreditCard size={18} className="text-indigo-400" />
                  <div>
                    <p className="text-[8px] font-black uppercase text-indigo-300">Total Paid</p>
                    <p className="text-sm font-bold">₦{order.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 relative z-10 bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">Tracking Progress</h3>
                <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-full">
                  {order.status}
                </span>
              </div>

              {/* Tracking Progress */}
              <div className="relative flex justify-between mb-8 px-4">
                <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 z-0">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000" 
                    style={{ width: `${(currentStep / 2) * 100}%` }}
                  />
                </div>
                
                {steps.map((step, idx) => (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      idx <= currentStep ? 'bg-indigo-600 shadow-lg shadow-indigo-200 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'
                    }`}>
                      {idx < currentStep ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    <p className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      idx <= currentStep ? 'text-indigo-600' : 'text-slate-300'
                    }`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Order Items */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-black font-outfit text-slate-900 border-b border-slate-50 pb-4 mb-2">Order Items</h2>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 p-6 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all group">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500"><Package size={24} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-slate-900 truncate mb-1">{item.product_name}</h4>
                      <p className="text-sm font-bold text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 tracking-tight">₦{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">₦{item.price.toLocaleString()} ea</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping & Billing */}
              <div className="space-y-8">
                <div className="bg-slate-50 rounded-4xl p-8 border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Truck size={14} className="text-indigo-600" /> Shipping Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Customer Name</p>
                      <p className="font-bold text-slate-900">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Shipping Address</p>
                      <p className="font-bold text-slate-900 leading-relaxed">{order.shipping_address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 rounded-4xl p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <ShoppingBag size={64} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6 relative z-10">Order Total</h3>
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-sm font-bold text-white/80">
                      <span>Subtotal</span>
                      <span>₦{order.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white/80">
                      <span>Shipping</span>
                      <span>₦0.00</span>
                    </div>
                    <div className="h-px bg-white/20 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                      <span className="text-3xl font-black font-outfit tracking-tighter">₦{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
