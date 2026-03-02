import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { productService } from '../services/product.service';
import Navbar from '../components/Navbar';
import { Search, Filter, Package, Truck, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from './Home';

export default function Products() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const categories = ['All', 'Cement', 'Nails', 'Tools', 'Electrical', 'Plumbing'];

  useEffect(() => {
    // Debounce the search term to avoid hitting API too often
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, minPrice, maxPrice]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll({ 
        category: category === 'All' ? undefined : category.toLowerCase(),
        search: search || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      });
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-slate-900">Product Catalog</h1>
            <p className="text-slate-500 mt-1">Browse all available construction materials</p>
          </div>
          
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2 mb-4 text-slate-900 font-semibold">
                <Filter className="h-5 w-5" />
                <span>Categories</span>
              </div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`nav-item flex items-center justify-between p-2 rounded-lg text-sm w-full transition-all ${
                      category === cat 
                        ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-100' 
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
              <div className="flex items-center space-x-2 mb-4 text-slate-900 font-semibold">
                <Filter className="h-5 w-5" />
                <span>Price Range (₦)</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white mt-6">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-indigo-100 text-sm mb-4">Can't find what you're looking for? Our experts can help.</p>
              <button className="w-full bg-white text-indigo-600 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                Contact Support
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl h-80 shadow-sm border border-slate-100"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                      </Link>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-slate-900">₦{(product.price || 0).toLocaleString()}</span>
                        <div className="flex space-x-2">
                          <button className="bg-white border border-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-all">
                            <Plus className="h-5 w-5" />
                          </button>
                          <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                            <Truck className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <div className="inline-flex p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4">
                  <Package className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500">We couldn't find any products matching your search or category.</p>
                <button 
                  onClick={() => {setSearch(''); setCategory('All'); setMinPrice(''); setMaxPrice('');}}
                  className="mt-6 text-indigo-600 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


