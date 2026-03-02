import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cart.service';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import { Truck, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cart, setCart] = useState<{ items: { price: number; quantity: number }[] } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
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
    try {
      const response = await orderService.placeOrder({
        deliveryMethod,
        paymentMethod
      });
      const orderId = response?.orderId || response?.id || 'CONFIRMED';
      navigate('/order-confirmation', { state: { orderId } });
    } catch {
      console.error("Order failed");
    } finally {
      setLoading(false);
    }
  };

  const total = cart?.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <button onClick={() => navigate('/cart')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-medium">
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Cart
        </button>
        
        <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-indigo-600" /> Delivery Method
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'pickup' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`font-bold ${deliveryMethod === 'pickup' ? 'text-indigo-700' : 'text-slate-900'}`}>In-Store Pickup</div>
                  <div className="text-xs text-slate-500 mt-1">Ready in 2 hours</div>
                </button>
                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'delivery' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`font-bold ${deliveryMethod === 'delivery' ? 'text-indigo-700' : 'text-slate-900'}`}>Home Delivery</div>
                  <div className="text-xs text-slate-500 mt-1">Within 24-48 hours</div>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-indigo-600" /> Payment
              </h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100'}`}>
                  <input type="radio" className="hidden" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                  </div>
                  <span className="font-semibold text-slate-900">Cash on Delivery</span>
                </label>
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-not-allowed opacity-50 border-slate-100`}>
                  <input type="radio" className="hidden" disabled />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 border-slate-300`} />
                  <span className="font-semibold text-slate-400">Card / Online (Disabled for MVP)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Side Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Total Amount</h2>
              <div className="flex justify-between items-baseline mb-8">
                <span className="text-3xl font-extrabold text-indigo-600">₦{total.toLocaleString()}</span>
                <span className="text-slate-400 text-sm">incl. taxes</span>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:bg-indigo-400"
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
