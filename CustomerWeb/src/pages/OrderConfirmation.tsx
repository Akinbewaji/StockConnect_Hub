import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, Package, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId || 'PENDING';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center p-8 md:p-20 mt-10">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-green-100 p-6 rounded-full text-green-600 mb-8 shadow-inner"
        >
          <CheckCircle className="h-20 w-20" />
        </motion.div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 font-outfit mb-4 text-center">Order Confirmed!</h1>
        <p className="text-lg text-slate-500 mb-6 text-center max-w-md">
          Thank you for your purchase. Your order has been successfully placed and the dispatch team has been notified.
        </p>
        
        <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm mb-12 flex items-center justify-between space-x-6 min-w-[300px]">
            <span className="text-slate-500 font-medium">Order Reference:</span>
            <span className="text-indigo-600 font-extrabold tracking-wider text-xl">{orderId !== 'PENDING' ? `#${orderId}` : 'Check Email'}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <button 
            onClick={() => navigate('/orders')}
            className="flex-1 py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center"
          >
            <Package className="h-5 w-5 mr-2" /> Track Order
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 py-4 px-6 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" /> Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
