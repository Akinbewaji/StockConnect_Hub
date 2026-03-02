import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { authService } from '../services/auth.service';
import Navbar from '../components/Navbar';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, Package, Plus, Minus, Loader2 } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(Number(id));
      // Since our search returns an array, we find the specific one
      const found = Array.isArray(data) ? data.find(p => p.id === Number(id)) : data;
      setProduct(found);
    } catch (error) {
      console.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await cartService.addToCart(product.id, quantity);
      navigate('/cart');
    } catch (error) {
      console.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-50 text-center p-20">
      <Navbar />
      <h2 className="text-2xl font-bold">Product not found</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-bold">Back Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-blue-600 mb-8 font-medium">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Image */}
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-32 w-32 text-gray-300" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-4xl font-extrabold text-gray-900 font-outfit mb-4">{product.name}</h1>
            
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-3xl font-bold text-gray-900">₦{product.price.toLocaleString()}</span>
              {product.quantity > 0 ? (
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100 uppercase">In Stock</span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100 uppercase">Out of Stock</span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8 flex-grow">
              {product.description || "High quality construction materials designed for durability and performance. Perfect for residential and commercial projects."}
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-gray-500 hover:text-blue-600"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-gray-500 hover:text-blue-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {product.quantity} items available
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={adding || product.quantity === 0}
                  className="flex-grow bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center disabled:bg-blue-300"
                >
                  {adding ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      <ShoppingCart className="h-6 w-6 mr-2" /> Add to Cart
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <Truck className="h-5 w-5 mr-2 text-blue-500" />
                  <span>Next-day delivery available</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-5 w-5 mr-2 text-blue-500" />
                  <span>Quality guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
