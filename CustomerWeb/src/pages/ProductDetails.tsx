import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { authService } from '../services/auth.service';
import { quoteService } from '../services/quote.service';
import Navbar from '../components/Navbar';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, Package, Plus, Minus, Loader2, FileText, Upload, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductDetailsType {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  business_id: number;
  business_name: string;
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Quote Request State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteQuantity, setQuoteQuantity] = useState(10);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteAttachment, setQuoteAttachment] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(Number(id));
      // Since our search returns an array, we find the specific one
      const found = Array.isArray(data) ? data.find(p => p.id === Number(id)) : data;
      setProduct(found);
    } catch {
      console.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await cartService.addToCart(product.id, quantity);
      navigate('/cart');
    } catch {
      console.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setSubmittingQuote(true);
    try {
      await quoteService.requestQuote({
        productId: product.id,
        requestedQuantity: quoteQuantity,
        message: quoteMessage,
        attachmentUrl: quoteAttachment || undefined
      });
      setQuoteSuccess(true);
      setTimeout(() => {
        setShowQuoteModal(false);
        setQuoteSuccess(false);
        setQuoteMessage('');
        setQuoteAttachment('');
        setQuoteQuantity(10);
      }, 3000);
    } catch {
      console.error("Failed to request quote");
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-slate-50 text-center p-20">
      <Navbar />
      <h2 className="text-2xl font-bold">Product not found</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-bold">Back Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-8 font-medium">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          {/* Image */}
          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-32 w-32 text-slate-300" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center space-x-2">
              <span>{product.category}</span>
              <span className="text-slate-300">•</span>
              <Link to={`/seller/${product.business_id}`} className="hover:text-indigo-800 transition-colors flex items-center">
                <Store className="h-4 w-4 mr-1" />
                {product.business_name || 'Hardware Vendor'}
              </Link>
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 font-outfit mb-4">{product.name}</h1>
            
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-3xl font-bold text-slate-900">₦{(product.price || 0).toLocaleString()}</span>
              {product.quantity > 0 ? (
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100 uppercase">In Stock</span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100 uppercase">Out of Stock</span>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed mb-8 grow">
              {product.description || "High quality construction materials designed for durability and performance. Perfect for residential and commercial projects."}
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-100 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-slate-500 hover:text-indigo-600"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-slate-500 hover:text-indigo-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {product.quantity} items available
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={adding || product.quantity === 0}
                  className="grow bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center disabled:bg-indigo-300"
                >
                  {adding ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      <ShoppingCart className="h-6 w-6 mr-2" /> Add to Cart
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (!authService.isAuthenticated()) {
                      navigate('/login');
                    } else {
                      setShowQuoteModal(true);
                    }
                  }}
                  className="grow bg-slate-100 text-indigo-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center border border-indigo-100"
                >
                  <FileText className="h-6 w-6 mr-2" /> Request Custom Quote
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-500">
                  <Truck className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>Next-day delivery available</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <ShieldCheck className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>Quality guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 relative">
            <button 
              onClick={() => setShowQuoteModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <Plus className="h-6 w-6 rotate-45" />
            </button>
            
            <h2 className="text-2xl font-bold font-outfit text-slate-900 mb-2">Request Custom Quote</h2>
            <p className="text-slate-500 mb-6">Negotiate bulk pricing directly with the seller for {product.name}.</p>
            
            {quoteSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Quote Requested!</h3>
                <p className="text-slate-500 mt-2">The seller will review your request and get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Requested Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={quoteQuantity}
                    onChange={e => setQuoteQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Project Details / Message</label>
                  <textarea 
                    required
                    value={quoteMessage}
                    onChange={e => setQuoteMessage(e.target.value)}
                    placeholder="Describe your requirements, project timeline, etc."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900 mb-2 flex items-center justify-between">
                    <span>Blueprint / Parts List (Optional)</span>
                    <span className="text-xs font-normal text-slate-400">PDF, JPG, PNG</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="url" 
                      placeholder="https://link-to-your-blueprint.com"
                      value={quoteAttachment}
                      onChange={e => setQuoteAttachment(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Upload className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Provide a cloud link (Google Drive, Dropbox) to your schematics.</p>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={submittingQuote}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                  >
                    {submittingQuote ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
