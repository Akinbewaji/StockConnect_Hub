import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService as cartApi } from '../services/cart.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ShieldCheck, ChevronLeft, Package, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export default function Cart() {
  const [cart, setCart] = useState<{ id: number; items: CartItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      console.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setIsUpdating(itemId);
    try {
      await cartApi.updateQuantity(itemId, newQty);
      await loadCart();
    } catch {
      console.error("Failed to update quantity");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setIsUpdating(itemId);
    try {
      await cartApi.removeFromCart(itemId);
      await loadCart();
    } catch {
      console.error("Failed to remove item");
    } finally {
      setIsUpdating(null);
    }
  };

  const total = cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Reviewing your cart...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="Shopping Cart" description="Review your selected materials before procurement." />
      {/* Background Decor */}
      <Navbar />
      
      <div className="pt-32 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <ChevronLeft size={12} className="rotate-180" />
            <span className="text-indigo-600">Shopping Cart</span>
          </nav>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Your Basket</h1>
              <p className="text-slate-500 mt-2 text-lg">
                {cart?.items.length || 0} items ready for your next project.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck size={18} className="text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {!cart || cart.items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-5xl p-20 text-center shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100">
                <ShoppingBag size={48} strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-black font-outfit text-slate-900 mb-4">Your cart is empty</h2>
              <p className="text-slate-400 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
                Looks like you haven't added anything to your cart yet. Explore our premium materials to get started.
              </p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Start Shopping <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="popLayout">
                {cart.items.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="group relative bg-white rounded-4xl p-6 flex flex-col sm:flex-row items-center gap-8 shadow-xl shadow-slate-200/30 border border-slate-100 transition-all hover:border-indigo-100"
                  >
                    {isUpdating === item.id && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-4xl">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                      </div>
                    )}
                    
                    <div className="h-40 w-full sm:w-40 bg-slate-50 rounded-3xl shrink-0 overflow-hidden relative">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package size={48} strokeWidth={1} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
                          ₦{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grow text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{item.name}</h3>
                          <p className="text-slate-400 text-sm font-medium">Verified Vendor Product</p>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-between gap-6">
                        <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          <button 
                            disabled={item.quantity <= 1 || isUpdating === item.id}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="font-black text-lg w-12 text-center text-slate-900">{item.quantity}</span>
                          <button 
                            disabled={isUpdating === item.id}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-3 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <button 
                          disabled={isUpdating === item.id}
                          onClick={() => handleRemoveItem(item.id)}
                          className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm group/btn"
                        >
                          <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <div className="bg-slate-900 rounded-5xl p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                  
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold font-outfit mb-8">Order Summary</h2>
                    
                    <div className="space-y-5 mb-10">
                      <div className="flex justify-between text-slate-400 font-bold text-sm">
                        <span className="uppercase tracking-widest">Subtotal</span>
                        <span className="text-white">₦{total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-bold text-sm">
                        <span className="uppercase tracking-widest">Shipping</span>
                        <span className="text-indigo-400 italic">Calculate at next step</span>
                      </div>
                      <div className="h-px bg-white/10 my-6" />
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Estimated Total</span>
                        <span className="text-4xl font-black font-outfit tracking-tighter">₦{total.toLocaleString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/checkout')}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group/check"
                    >
                      Proceed to Checkout 
                      <ArrowRight size={22} className="group-hover/check:translate-x-1 transition-transform" />
                    </button>

                    <div className="mt-8 flex flex-col gap-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-400 font-medium">
                        <CreditCard size={16} className="text-indigo-400" />
                        Multiple secure payment options
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-4xl p-8 border border-slate-100 shadow-xl shadow-slate-200/20">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 px-2">Need help?</h3>
                  <p className="text-slate-400 text-xs leading-relaxed px-2 mb-6">
                    Got questions about bulk delivery or payment methods? Our support team is ready to assist.
                  </p>
                  <Link 
                    to="/chat" 
                    className="flex items-center justify-center w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                  >
                    Message Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
