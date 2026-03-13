import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Package, ShieldCheck, Truck, MessageSquarePlus, Star, Clock, ChevronLeft, Search, Filter, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';
import { authService } from '../services/auth.service';
import { productService } from '../services/product.service';

interface SellerProfileData {
  businessName: string;
  phone: string;
  email: string;
  address: string | null;
}

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: number; image_url: string; category: string; }>>([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadSellerData(id);
    }
  }, [id]);

  const loadSellerData = async (sellerId: string) => {
    setLoading(true);
    try {
      const sellerData = await authService.getSellerProfile(sellerId);
      setSeller(sellerData);

      const productsData = await productService.getAll({ businessId: Number(sellerId) });
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load seller profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Profile</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
            <Store size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Business Not Found</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">This profile may have been deactivated or never existed.</p>
          <Link to="/" className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100">Return to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title={seller.businessName} description={`Browse ${seller.businessName}'s collection of high-quality industrial materials.`} />
      <Navbar />

      {/* Hero Header */}
      <div className="relative bg-indigo-600 pt-48 pb-64 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-700/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-100/60 hover:text-white transition-all font-bold text-xs uppercase tracking-widest mb-12 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Marketplace
          </Link>
          
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-5xl flex items-center justify-center shadow-2xl shadow-indigo-900/40 relative z-10 rotate-3 transform">
                <Store size={64} className="text-indigo-600" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl border-4 border-emerald-50 z-20">
                <ShieldCheck size={24} />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl font-black text-white font-outfit tracking-tight">{seller.businessName}</h1>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-tighter">Verified Seller</span>
                </div>
              </div>
              <p className="text-indigo-100/80 text-lg flex items-center justify-center md:justify-start gap-4">
                <span className="flex items-center gap-1.5"><MapPin size={18} className="text-indigo-300" /> Lagos, Nigeria</span>
                <span className="w-1 h-1 bg-indigo-300/50 rounded-full" />
                <span className="flex items-center gap-1.5"><Clock size={18} className="text-indigo-300" /> Responses in 2h</span>
              </p>
            </div>
            
            <button 
              onClick={() => setIsChatOpen(true)}
              className="px-10 py-5 bg-white text-indigo-600 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-950/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <MessageSquarePlus size={20} />
              Engage Hub
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-4xl border border-white shadow-xl shadow-slate-200/50 flex items-center gap-5 group">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mail Hub</p>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{seller.email}</p>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-4xl border border-white shadow-xl shadow-slate-200/50 flex items-center gap-5 group">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Comms</p>
              <p className="text-sm font-bold text-slate-900">{seller.phone}</p>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-4xl border border-white shadow-xl shadow-slate-200/50 flex items-center gap-5 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Unit</p>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{seller.address || 'Global Origin'}</p>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-4xl border border-white shadow-xl shadow-slate-200/50 flex items-center gap-5 group">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</p>
              <p className="text-sm font-bold text-slate-900">{products.length} Units Active</p>
            </div>
          </div>
        </div>

        {/* Product Filter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 font-outfit tracking-tight flex items-center gap-4">
              Collection Grid
              <Sparkles size={24} className="text-indigo-400" />
            </h2>
            <p className="text-slate-500 font-medium mt-1">Browse and procure high-quality industrial materials.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search inventory..."
                  className="pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all w-64 shadow-lg shadow-slate-200/30"
                />
              </div>
              <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors shadow-lg shadow-slate-200/30">
                <Filter size={18} />
              </button>
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group bg-white rounded-5xl overflow-hidden shadow-2xl shadow-slate-200/40 border border-slate-50 relative"
                >
                  <div className="aspect-4/5 bg-slate-50 relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={80} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-xl border border-white">
                        {product.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1 font-outfit">{product.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Industrial Grade Asset</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Procure Rate</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">₦{product.price.toLocaleString()}</span>
                      </div>
                      <Link 
                        to={`/products/${product.id}`}
                        className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                      >
                         <Truck size={20} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center py-32 bg-white rounded-5xl border border-slate-50 shadow-xl shadow-slate-200/50"
             >
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-100">
                 <Package size={48} strokeWidth={1} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 font-outfit mb-2">Zero Active Inventory</h3>
               <p className="text-slate-400 font-medium">This seller hasn't listed any neural nodes yet.</p>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Comms Widget */}
      {isChatOpen && seller && (
        <ChatWidget 
          businessId={Number(id)}
          businessName={seller.businessName}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
