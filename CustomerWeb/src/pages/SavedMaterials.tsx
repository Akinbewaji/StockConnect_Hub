import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Heart, ShoppingBag, Package, ArrowRight, Star, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { authService } from '../services/auth.service';

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
}

export default function SavedMaterials() {
  const [savedItems, setSavedItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we'd fetch from a favorites service/localStorage
    // For now, let's mock some data to show the premium design
    const mockSaved = async () => {
      try {
        const allProducts = await productService.getAll({});
        // Take a few items as "saved" for demonstration
        setSavedItems(allProducts.slice(0, 3));
      } catch (error) {
        console.error("Failed to load saved items", error);
      } finally {
        setLoading(false);
      }
    };
    mockSaved();
  }, []);

  const handleRemove = (id: number) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddToCart = async (productId: number) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setAddingToCart(productId);
    try {
      await cartService.addToCart(productId, 1);
      // Optional: show success toast or navigate
    } catch {
      console.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="Saved Materials" description="Your curated collection of premium hardware and building materials." />
      <Navbar />

      {/* Hero Section */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-rose-500">Saved Collection</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight flex items-center gap-4">
            Saved Materials
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
              <Heart size={28} fill="currentColor" />
            </div>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Your curated selection of premium project essentials.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-4xl h-[450px] animate-pulse border border-slate-50 shadow-sm" />
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-5xl p-20 text-center shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-rose-50/20 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-200 mx-auto mb-8 border border-rose-100">
                <Heart size={48} strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-black font-outfit text-slate-900 mb-4">Your collection is empty</h2>
              <p className="text-slate-400 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
                Save your favorite materials to easily find them later and build your project vision.
              </p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Browse Materials <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {savedItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-4xl p-4 border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 mb-6">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={80} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button 
                        onClick={() => handleRemove(item.id)}
                        className="p-3 bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 rounded-xl shadow-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-4 py-1.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1 font-outfit group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</h3>
                    <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-6 h-10">{item.description}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">₦{item.price.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(item.id)}
                        disabled={addingToCart === item.id || item.quantity === 0}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl hover:bg-indigo-600 shadow-xl hover:shadow-indigo-600/30 transition-all font-bold text-sm disabled:opacity-50"
                      >
                        {addingToCart === item.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><ShoppingBag size={18} /> Add to Cart</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Suggestion Section */}
        {savedItems.length > 0 && (
          <div className="mt-24 p-12 bg-indigo-600 rounded-5xl relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black text-white font-outfit mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Zap size={28} className="fill-amber-400 text-amber-400" />
                  Complete Your Project Faster
                </h2>
                <p className="text-indigo-100 font-medium">Get bulk discounts when you purchase all your saved materials at once.</p>
              </div>
              <button 
                onClick={() => navigate('/cart')}
                className="px-10 py-5 bg-white text-indigo-600 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all shadow-xl shadow-slate-900/10 active:scale-95 whitespace-nowrap"
              >
                Checkout All Saved Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
