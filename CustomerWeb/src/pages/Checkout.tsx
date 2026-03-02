import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cart.service';
import { orderService } from '../services/order.service';
import Navbar from '../components/Navbar';
import { Truck, CreditCard, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cart, setCart] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartService.getCart();
      if (!data || data.items.length === 0) {
        navigate('/cart');
      }
      setCart(data);
    } catch (error) {
      navigate('/cart');
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await orderService.placeOrder({
        deliveryMethod,
        paymentMethod
      });
      setSuccess(true);
      setTimeout(() => navigate('/orders'), 3000);
    } catch (error) {
      console.error("Order failed");
    } finally {
      setLoading(false);
    }
  };

  const total = cart?.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;

  if (success) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center p-6 bg-green-50 rounded-full text-green-600 mb-6"
        >
          <CheckCircle className="h-16 w-16" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-8">Your order has been successfully placed. You'll receive an SMS update shortly via Africa's Talking.</p>
        <button 
          onClick={() => navigate('/orders')}
          className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200"
        >
          View Order History
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <button onClick={() => navigate('/cart')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium">
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Cart
        </button>
        
        <h1 className="text-3xl font-bold font-outfit text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" /> Delivery Method
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`font-bold ${deliveryMethod === 'pickup' ? 'text-blue-700' : 'text-gray-900'}`}>In-Store Pickup</div>
                  <div className="text-xs text-gray-500 mt-1">Ready in 2 hours</div>
                </button>
                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`font-bold ${deliveryMethod === 'delivery' ? 'text-blue-700' : 'text-gray-900'}`}>Home Delivery</div>
                  <div className="text-xs text-gray-500 mt-1">Within 24-48 hours</div>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" /> Payment
              </h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                  <input type="radio" className="hidden" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-blue-600' : 'border-gray-300'}`}>
                    {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="font-semibold text-gray-900">Cash on Delivery</span>
                </label>
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-not-allowed opacity-50 border-gray-100`}>
                  <input type="radio" className="hidden" disabled />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 border-gray-300`} />
                  <span className="font-semibold text-gray-400">Card / Online (Disabled for MVP)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Side Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Total Amount</h2>
              <div className="flex justify-between items-baseline mb-8">
                <span className="text-3xl font-extrabold text-blue-600">₦{total.toLocaleString()}</span>
                <span className="text-gray-400 text-sm">incl. taxes</span>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:bg-blue-400"
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
