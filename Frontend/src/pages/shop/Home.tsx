import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../utils/api';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const url = category ? `${API_URL}/api/products?category=${category}` : `${API_URL}/api/products`;
    fetch(url)
      .then(res => res.json())
      .then(setProducts);
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="flex justify-end mb-4 gap-3">
        <Link to="/login" className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
          Login
        </Link>
        <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          Sign Up
        </Link>
      </div>
      <div className="bg-indigo-600 rounded-2xl p-8 mb-12 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Quality Hardware for Your Projects</h1>
        <p className="text-indigo-100 text-lg mb-8">Find everything you need for construction, renovation, and DIY.</p>
        <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
          Browse Catalog
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            category === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Products
        </button>
        {['Tools', 'Plumbing', 'Electrical', 'Paint', 'Building Materials'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link to={`/product/${product.id}`} key={product.id} className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.quantity <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg">OUT OF STOCK</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">₦{product.price}</span>
                <button className="text-indigo-600 font-medium hover:text-indigo-700">
                  View Details
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
