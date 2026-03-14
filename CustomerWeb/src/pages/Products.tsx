import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { productService } from '../services/product.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { Filter, Package, Truck, ChevronRight, ShoppingCart, Star, SlidersHorizontal, ArrowUpDown, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Building', 'Tools', 'Electrical', 'Plumbing', 'Safety', 'Security'];

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
        category: category === 'All' ? undefined : category,
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

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      // Basic fallback since not all items might have category
      const catA = a.category || '';
      const catB = b.category || '';
      
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return catA.localeCompare(catB);
      
      return b.id - a.id; 
    });
  }, [products, sortBy]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Products" description="Explore our extensive collection of high-quality industrial materials." />
      <Navbar />
      
      {/* Header Section */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                <ChevronRight size={12} />
                <span className="text-indigo-600">Product Catalog</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Explore Materials</h1>
              <p className="text-slate-500 mt-2 text-lg">Quality supplies from Nigeria's top-rated hardware stores.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-10 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                  <option value="category">Category</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
              >
                <Filter size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Advanced Sidebar Filters */}
          <aside className={`w-full lg:w-72 space-y-8 lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white p-8 rounded-4xl shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black font-outfit text-slate-900">Filters</h3>
                  {(category !== 'All' || minPrice || maxPrice || search) && (
                    <button 
                      onClick={() => {setCategory('All'); setSearch(''); setMinPrice(''); setMaxPrice('');}}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Reset <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-6 mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category Select</p>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          category === cat 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                        }`}
                      >
                        <span>{cat}</span>
                        {category === cat && <motion.div layoutId="cat-indicator"><ChevronRight size={16} /></motion.div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price Range (₦)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-slate-900 p-8 rounded-4xl shadow-2xl shadow-indigo-900/10 text-white relative overflow-hidden group">
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold font-outfit mb-2">Bulk Orders?</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">Save up to 15% on construction materials for large-scale projects.</p>
                <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-white/5">
                  Get Wholesale Quote
                </button>
              </div>
            </div>
          </aside>

          {/* Product Grid Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-white rounded-4xl h-[400px] shadow-sm border border-slate-50"></div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <AnimatePresence>
                  {sortedProducts.map((product) => (
                    <motion.div 
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -10 }}
                      className="bg-white rounded-4xl overflow-hidden shadow-xl shadow-slate-200/30 border border-slate-100 group transition-all"
                    >
                      <Link to={`/products/${product.id}`} className="block">
                        <div className="aspect-4/5 bg-slate-50 relative overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <Package size={80} strokeWidth={1} />
                            </div>
                          )}
                          <div className="absolute top-5 left-5">
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-lg border border-white/50">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div className="p-6">
                        <div className="flex items-center gap-1 mb-3">
                          {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">4.9 (120+)</span>
                        </div>
                        <Link to={`/products/${product.id}`} className="block group">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 truncate">{product.name}</h3>
                          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 h-10 mb-4">{product.description}</p>
                        </Link>
                        <div className="mt-6 flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">₦{(product.price || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <button className="bg-slate-50 text-slate-600 p-3.5 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-100">
                              <Truck size={20} />
                            </button>
                            <button className="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-indigo-600 shadow-xl hover:shadow-indigo-600/30 transition-all active:scale-95">
                              <ShoppingCart size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="bg-white rounded-3xl p-24 text-center border border-slate-50 shadow-2xl shadow-slate-100/50">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100">
                  <Package size={48} strokeWidth={1} />
                </div>
                <h3 className="text-3xl font-black font-outfit text-slate-900 mb-4">No results found</h3>
                <p className="text-slate-400 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
                  We couldn't find any products matching your criteria. Try adjusting your filters or search term.
                </p>
                <button 
                  onClick={() => {setSearch(''); setCategory('All'); setMinPrice(''); setMaxPrice('');}}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


