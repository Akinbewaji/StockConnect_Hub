import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../services/cart.service';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Truck, CreditCard, ChevronLeft, Loader2, ShieldCheck, MapPin, Store, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { authService } from '../services/auth.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const PaystackPop: any;

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cart, setCart] = useState<{ items: { price: number; quantity: number }[] } | null>(null);
  const [user] = useState(authService.getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartService.getCart();
      if (!data || data.items.length === 0) {
        navigate('/cart');
      }
      setCart(data);
    } catch {
      navigate('/cart');
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    const items = cart?.items || [];
    const totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);

    if (paymentMethod === 'card') {
      try {
        const handler = PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', // You should replace this with the real public key via env
          email: user?.email || 'customer@stockconnect.com',
          amount: Math.round(totalAmount * 100), // Amount in kobo
          currency: 'NGN',
          ref: `order_${Math.floor((Math.random() * 1000000000) + 1)}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: async (response: any) => {
            try {
              const res = await orderService.placeOrder({
                deliveryMethod,
                paymentMethod,
                paymentReference: response.reference
              });
              const orderId = res?.orderId || res?.id || 'CONFIRMED';
              navigate('/order-confirmation', { state: { orderId } });
            } catch (err) {
              console.error("Order verification/creation failed", err);
              setLoading(false);
            }
          },
          onClose: () => {
            setLoading(false);
            // User closed the popup
          }
        });

        handler.openIframe();
      } catch (err) {
        console.error("Failed to initialize Paystack", err);
        setLoading(false);
      }
    } else {
      // Cash/Transfer flow
      try {
        const response = await orderService.placeOrder({
          deliveryMethod,
          paymentMethod
        });
        const orderId = response?.orderId || response?.id || 'CONFIRMED';
        navigate('/order-confirmation', { state: { orderId } });
      } catch {
        console.error("Order failed");
        setLoading(false);
      }
    }
  };

  const total = cart?.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Secure Checkout" description="Finalize your material procurement securely." />
      {/* Simple Header */}
      <Navbar />
      
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/cart" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <ChevronLeft size={14} /> Back to Basket
            </Link>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Finalize Order</h1>
          <p className="text-slate-500 mt-2 text-lg">Secure checkout Powered by Africa's Talking.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Main Form Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Delivery Selection */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-5xl p-8 shadow-xl shadow-slate-200/40 border border-slate-50"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-outfit text-slate-900">Delivery Method</h2>
                  <p className="text-sm text-slate-400 font-medium">Choose how you want to receive your materials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`group relative p-6 rounded-3xl border-2 text-left transition-all overflow-hidden ${
                    deliveryMethod === 'pickup' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-colors ${deliveryMethod === 'pickup' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <Store size={20} />
                    </div>
                    {deliveryMethod === 'pickup' && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-white rotate-45 translate-x-px translate-y-px" />
                        <div className="w-3 h-0.5 bg-white -rotate-45 -translate-x-px" />
                      </div>
                    )}
                  </div>
                  <h3 className={`font-black uppercase tracking-tight ${deliveryMethod === 'pickup' ? 'text-slate-900' : 'text-slate-500'}`}>In-Store Pickup</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">Ready in ~2 hours</p>
                </button>

                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`group relative p-6 rounded-3xl border-2 text-left transition-all overflow-hidden ${
                    deliveryMethod === 'delivery' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-colors ${deliveryMethod === 'delivery' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <MapPin size={20} />
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center" />
                    )}
                  </div>
                  <h3 className={`font-black uppercase tracking-tight ${deliveryMethod === 'delivery' ? 'text-slate-900' : 'text-slate-500'}`}>Home Delivery</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">Within 24-48 hours</p>
                </button>
              </div>

              {deliveryMethod === 'delivery' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 pt-8 border-t border-slate-50"
                >
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Calendar size={18} className="text-indigo-600 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Delivery Address</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        We'll use your registered default shipping address for this delivery.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.section>

            {/* Payment Method Selection */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-5xl p-8 shadow-xl shadow-slate-200/40 border border-slate-50"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-outfit text-slate-900">Payment Selection</h2>
                  <p className="text-sm text-slate-400 font-medium">All payments are protected and verified.</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full group relative p-6 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === 'cash' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <div className="w-5 h-5 flex items-center justify-center font-black">₦</div>
                      </div>
                      <div>
                        <h3 className={`font-bold transition-colors ${paymentMethod === 'cash' ? 'text-slate-900' : 'text-slate-500'}`}>Pay on Delivery</h3>
                        <p className="text-xs text-slate-400 font-medium">Pay in cash or transfer upon receiving materials.</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${paymentMethod === 'cash' ? 'border-indigo-600' : 'border-slate-200'}`}>
                      {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full group relative p-6 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === 'card' 
                    ? 'border-indigo-600 bg-indigo-50/30' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h3 className={`font-bold transition-colors ${paymentMethod === 'card' ? 'text-slate-900' : 'text-slate-500'}`}>Card / Digital Wallet</h3>
                        <p className="text-xs text-slate-400 font-medium">Direct secure payment via Africa's Talking Link.</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-600' : 'border-slate-200'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                  </div>
                </button>
              </div>
            </motion.section>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-32 space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-5xl p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                
                <h2 className="text-2xl font-bold font-outfit mb-8 relative z-10">Summary</h2>
                
                <div className="space-y-4 mb-8 pt-4 border-t border-white/10 relative z-10">
                  <div className="flex justify-between text-slate-400 font-medium text-sm">
                    <span>Selected Delivery</span>
                    <span className="text-white capitalize font-bold">{deliveryMethod}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium text-sm">
                    <span>Payment Base</span>
                    <span className="text-white capitalize font-bold">{paymentMethod}</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 mb-10 relative z-10">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Final Total</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-4xl font-black font-outfit tracking-tighter">₦{total.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs mb-1">VAT Incl.</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group/btn disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : (
                    <>
                      Place My Order <ArrowRight size={22} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-green-500" />
                  Verified secure transaction
                </div>
              </motion.div>

              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                <p className="text-slate-400 text-xs leading-relaxed">
                  By clicking "Place My Order", you agree to StockConnect's terms of service and delivery protocols.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
