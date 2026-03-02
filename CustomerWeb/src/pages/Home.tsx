import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/product.service';
import Navbar from '../components/Navbar';
import { Search, ChevronRight, Package, Truck, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
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

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl font-outfit"
                >
                  <span className="block xl:inline">Quality hardware for</span>{' '}
                  <span className="block text-indigo-600 xl:inline">your next project</span>
                </motion.h1>
                <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Browse thousands of construction materials, tools, and accessories from top hardware stores in Nigeria. Fast delivery, secure payments.
                </p>
                <div className="mt-8">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`);
                    }} 
                    className="relative max-w-lg"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-4 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                      placeholder="Search for cement, nails, tools..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="hidden">Search</button>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Get your materials within 24 hours' },
            { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'We only connect you with verified sellers' },
            { icon: Package, title: 'Bulk Orders', desc: 'Special pricing for large construction projects' }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold font-outfit text-slate-900">Featured Products</h2>
            <p className="text-slate-500 mt-2">Top picks for you today</p>
          </div>
          <Link to="/products" className="text-indigo-600 font-semibold flex items-center hover:translate-x-1 transition-transform">
            View All <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-64 shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group transition-all"
              >
                <Link to={`/products/${product.id}`} className="block">
                  <div className="aspect-square bg-slate-100 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 uppercase tracking-wider shadow-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">{product.description}</p>
                  </Link>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">₦{(product.price || 0).toLocaleString()}</span>
                    <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                      <Truck className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
