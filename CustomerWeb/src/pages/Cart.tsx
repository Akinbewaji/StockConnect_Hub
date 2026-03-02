import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService as cartApi } from '../services/cart.service';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Cart() {
  const [cart, setCart] = useState<{ id: number; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (error) {
      console.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    try {
      await cartApi.updateQuantity(itemId, newQty);
      loadCart();
    } catch (error) {
      console.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartApi.removeFromCart(itemId);
      loadCart();
    } catch (error) {
      console.error("Failed to remove item");
    }
  };

  const total = cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100-4rem)]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="text-slate-500 mt-2 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
              Go Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-slate-100"
                >
                  <div className="h-24 w-24 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-indigo-600 font-bold mt-1">₦{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-xl text-slate-900">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure Checkout with Africa's Talking OTP</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ShieldCheck = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
