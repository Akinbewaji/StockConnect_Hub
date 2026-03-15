import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { authService } from '../services/auth.service';
import Navbar from '../components/Navbar';
import { Search, ChevronRight, Package, Truck, ShieldCheck, Star, Zap, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  business_id: number;
  business_name?: string;
}

const HERO_SLIDES = [
  {
    title: "Build Your Vision with Premium Hardware",
    subtitle: "From foundation to finish, we connect you with Nigeria's most trusted suppliers.",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop",
    cta: "Explore Catalog",
    link: "/products"
  },
  {
    title: "Industrial Tools & Heavy Machinery",
    subtitle: "High-performance equipment for professionals who won't compromise on quality.",
    image: "https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?q=80&w=2070&auto=format&fit=crop",
    cta: "View Equipment",
    link: "/products?category=Tools"
  },
  {
    title: "Secure Your Construction Sites",
    subtitle: "Advanced security systems and durable fencing materials for every project scale.",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop",
    cta: "Shop Security",
    link: "/products?category=Security"
  }
];

const CATEGORIES = [
  { name: 'Building', icon: '🏛️', count: 124, color: 'bg-blue-500' },
  { name: 'Tools', icon: '🛠️', count: 86, color: 'bg-orange-500' },
  { name: 'Electrical', icon: '⚡', count: 54, color: 'bg-yellow-500' },
  { name: 'Plumbing', icon: '🚿', count: 42, color: 'bg-indigo-500' },
  { name: 'Safety', icon: '👷', count: 31, color: 'bg-red-500' },
];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll({});
      setProducts(data);
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setAddingToCart(productId);
    try {
      await cartService.addToCart(productId, 1);
      navigate('/cart');
    } catch {
      console.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] pb-20">
      <Navbar />
      
      {/* Premium Hero Slider */}
      <div className="relative h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-linear-to-r from-slate-900/80 via-slate-900/40 to-transparent z-10" />
            <img 
              src={HERO_SLIDES[currentSlide].image} 
              className="w-full h-full object-cover" 
              alt="Hero" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/20 backdrop-blur-md border border-indigo-400/30 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} className="fill-indigo-400" /> Premium Quality Hardware
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-outfit leading-tight mb-6">
              {HERO_SLIDES[currentSlide].title}
            </h1>
            <p className="text-xl text-slate-200 mb-10 leading-relaxed max-w-lg">
              {HERO_SLIDES[currentSlide].subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to={HERO_SLIDES[currentSlide].link}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/30"
              >
                {HERO_SLIDES[currentSlide].cta} <ArrowRight size={20} />
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          {/* Slider Indicators */}
          <div className="absolute bottom-10 left-4 flex gap-3">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 transition-all rounded-full ${currentSlide === i ? 'w-10 bg-indigo-500' : 'w-4 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Trust Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-30">
        <div className="bg-white rounded-4xl shadow-2xl shadow-slate-200/50 p-8 grid grid-cols-1 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-100 border border-slate-50">
          <div className="flex items-center gap-4 px-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Truck size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Swift Delivery</p>
              <p className="text-xs text-slate-500">Across all 36 states</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Secure Payment</p>
              <p className="text-xs text-slate-500">100% Protected SSL</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Star size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Top Rated</p>
              <p className="text-xs text-slate-500">4.9/5 Vendor Rating</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Package size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Bulk Discounts</p>
              <p className="text-xs text-slate-500">Save on large orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-4xl p-16 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-indigo-500 to-purple-500 opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-bold font-outfit text-white mb-6 leading-tight">
              Ready to elevate your projects?
            </h2>
            <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto">
              Discover a world of quality hardware and building materials. Your next big project starts here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30"
            >
              Start Shopping <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-bold font-outfit text-slate-900">Shop by Category</h2>
            <p className="text-slate-500 mt-2 text-lg">Browse curated selections for your hardware needs</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.name}
              className={`group relative p-8 rounded-4xl border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col items-center text-center overflow-hidden cursor-pointer ${cat.color} aspect-square justify-center`}
            >
              <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{cat.name}</h3>
              <p className="text-xs font-medium text-slate-400 tracking-widest">{cat.count} ITEMS</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold font-outfit text-slate-900">Featured Products</h2>
            <p className="text-slate-500 mt-2 text-lg">Hand-picked premium selections for your project</p>
          </div>
          <Link to="/products" className="group flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-6 py-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
            See All Products <ChevronRight className="transition-transform group-hover:translate-x-1" size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map((k) => (
              <div key={k} className="animate-pulse bg-white rounded-4xl h-80 shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-4xl p-4 border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <Link to={`/products/${product.id}`}>
                  <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={64} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-5 right-5">
                      <span className="px-5 py-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-indigo-100 mb-6 block w-fit">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate mb-1">{product.name}</h3>
                    <p className="text-slate-400 text-xs font-medium line-clamp-1 h-4">{product.description}</p>
                  </Link>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">₦{(product.price || 0).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, product.id)}
                      disabled={addingToCart === product.id || product.quantity === 0}
                      className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart === product.id ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShoppingBag size={20} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Global Search Bar (Persistent) */}
      <section className="max-w-4xl mx-auto px-4 mt-32 text-center">
        <h2 className="text-3xl font-bold font-outfit text-slate-900 mb-8">Can't find what you're looking for?</h2>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`);
          }} 
          className="relative group"
        >
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-8 border-none bg-white rounded-5xl shadow-2xl shadow-indigo-100/50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 text-xl font-medium transition-all"
            placeholder="Search thousands of heavy materials & tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            type="submit" 
            className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-4 bg-indigo-600 text-white rounded-3xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
          >
            Search
          </button>
        </form>
      </section>
    </div>
  );
}
