import { useState, useEffect } from 'react';
import { productService } from '../services/product.service';
import Navbar from '../components/Navbar';
import { Search, Filter, Package, Truck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Cement', 'Nails', 'Tools', 'Electrical', 'Plumbing'];

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll({ 
        category: category === 'All' ? undefined : category.toLowerCase() 
      });
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-gray-900">Product Catalog</h1>
            <p className="text-gray-500 mt-1">Browse all available construction materials</p>
          </div>
          
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4 text-gray-900 font-semibold">
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
                        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-100' 
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4">Can't find what you're looking for? Our experts can help.</p>
              <button className="w-full bg-white text-blue-600 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                Contact Support
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl h-80 shadow-sm border border-gray-100"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition-all"
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-blue-600 uppercase tracking-wider shadow-sm">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">₦{product.price.toLocaleString()}</span>
                        <div className="flex space-x-2">
                          <button className="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all">
                            <Plus className="h-5 w-5" />
                          </button>
                          <button className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                            <Truck className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="inline-flex p-4 bg-gray-50 rounded-2xl text-gray-400 mb-4">
                  <Package className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">We couldn't find any products matching your search or category.</p>
                <button 
                  onClick={() => {setSearch(''); setCategory('All');}}
                  className="mt-6 text-blue-600 font-semibold hover:underline"
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

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
