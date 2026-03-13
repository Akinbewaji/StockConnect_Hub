import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { authService } from '../services/auth.service';
import { quoteService } from '../services/quote.service';
import Navbar from '../components/Navbar';
import { ShoppingCart, ShieldCheck, Truck, Package, Plus, Minus, Loader2, FileText, Store, Star, Share2, Heart, Info, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

const REVIEWS = [
  { id: 1, user: "Abiodun K.", rating: 5, comment: "Excellent quality cement. Fast delivery too!", date: "2 days ago" },
  { id: 2, user: "Chidi N.", rating: 4, comment: "Good service, but the packaging could be better.", date: "1 week ago" },
];

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetailsType[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);

  // Quote Request State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteQuantity, setQuoteQuantity] = useState(10);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteAttachment, setQuoteAttachment] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getById(Number(id));
      const found = Array.isArray(data) ? data.find(p => p.id === Number(id)) : data;
      setProduct(found);
      
      if (found) {
        const related = await productService.getAll({ category: found.category });
        setRelatedProducts(related.filter((p: ProductDetailsType) => p.id !== found.id).slice(0, 4));
      }
    } catch {
      console.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
    window.scrollTo(0, 0);
  }, [loadProduct]);

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
    <div className="min-h-screen bg-[#fcfcfc]">
      <Navbar />
      <div className="flex flex-col items-center justify-center p-40">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Details...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-slate-50 text-center p-20 flex flex-col items-center justify-center">
      <Navbar />
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
        <Package size={40} className="text-slate-200" />
      </div>
      <h2 className="text-3xl font-black font-outfit text-slate-900 mb-2">Product Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-sm">The item you're looking for might have been moved.</p>
      <button onClick={() => navigate('/products')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-100">
        Return to Catalog
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
          <Link to="/" className="hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-4 decoration-2">Home</Link>
          <ChevronRight size={10} />
          <Link to="/products" className="hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-4 decoration-2">Products</Link>
          <ChevronRight size={10} />
          <span className="text-indigo-600">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative aspect-square bg-white rounded-4xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex items-center justify-center"
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center">
                  <Package size={120} strokeWidth={0.5} className="text-slate-100 mb-4" />
                  <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No Image Preview</p>
                </div>
              )}
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <button className="px-6 py-3 bg-slate-900/80 backdrop-blur-xl text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-white/20 hover:bg-slate-900 transition-all active:scale-95">
                  <Box size={16} /> View in AR
                </button>
              </div>

              <div className="absolute top-8 right-8 flex flex-col gap-3">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-500'}`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-white' : ''} />
                </button>
                <button className="p-4 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl shadow-xl transition-all active:scale-90">
                  <Share2 size={20} />
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-4xl border border-slate-50 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                  <Truck size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Delivery</p>
                <p className="text-xs font-bold text-slate-900">Next Day</p>
              </div>
              <div className="bg-white p-6 rounded-4xl border border-slate-50 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Warranty</p>
                <p className="text-xs font-bold text-slate-900">Original</p>
              </div>
              <div className="bg-white p-6 rounded-4xl border border-slate-50 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-3">
                  <Star size={20} className="fill-amber-600" />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rating</p>
                <p className="text-xs font-bold text-slate-900">4.9 / 5</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-indigo-100">
                {product.category}
              </span>
              <Link to={`/seller/${product.business_id}`} className="group flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100 font-bold text-xs hover:border-indigo-200 transition-all">
                <Store size={14} className="group-hover:text-indigo-600" />
                {product.business_name || 'Verified Vendor'}
              </Link>
            </div>

            <h1 className="text-5xl font-black text-slate-900 font-outfit leading-tight mb-4 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-6 mb-10">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                ₦{(product.price || 0).toLocaleString()}
              </span>
              <div className="h-8 w-px bg-slate-100" />
              {product.quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-black text-green-600 uppercase tracking-widest">In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <span className="text-sm font-black text-red-600 uppercase tracking-widest">Sold Out</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-4xl p-2 border border-slate-100 mb-8 flex gap-2">
               {[
                { id: 'description', label: 'Description', icon: Info },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'comparison', label: 'Comparison', icon: SlidersHorizontal }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[150px] mb-12 px-4">
              <AnimatePresence mode="wait">
                {activeTab === 'description' && (
                  <motion.div
                    key="desc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-slate-500 leading-relaxed text-lg"
                  >
                    {product.description || "Premium high-grade construction material."}
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    {REVIEWS.map(review => (
                      <div key={review.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black text-slate-900 text-sm italic">{review.user}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">"{review.comment}"</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">{review.date}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-900 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-16 text-center font-black text-xl">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-900 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={adding || product.quantity === 0}
                  className="grow py-5 bg-indigo-600 text-white rounded-4xl font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 active:scale-95 group"
                >
                  {adding ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      <ShoppingCart className="mr-3 group-hover:rotate-12 transition-transform" /> Add to Shopping Cart
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (!authService.isAuthenticated()) navigate('/login');
                    else setShowQuoteModal(true);
                  }}
                  className="grow py-5 bg-slate-900 text-white rounded-4xl font-black text-lg shadow-2xl shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center justify-center active:scale-95"
                >
                  <FileText className="mr-3" /> Get Wholesale Quote
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-40">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div animate={{ rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Zap size={24} className="fill-indigo-500 text-indigo-500" />
                </motion.div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">AI Powered For You</h3>
              </div>
              <h2 className="text-4xl font-black font-outfit text-slate-900 tracking-tight">You Might Also Need</h2>
              <p className="text-slate-400 mt-2 text-lg">Smart suggestions based on your selection.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.length > 0 ? relatedProducts.map((p) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-4xl overflow-hidden shadow-xl shadow-slate-100/50 border border-slate-50 group"
              >
                <Link to={`/products/${p.id}`}>
                  <div className="aspect-square bg-slate-50 overflow-hidden relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-100">
                        <Package size={60} strokeWidth={0.5} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{p.name}</h4>
                    <p className="text-xl font-black text-slate-800 mt-2">₦{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              </motion.div>
            )) : (
              [1,2,3,4].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-4xl h-60 border border-slate-50 shadow-sm" />
              ))
            )}
          </div>
        </section>
      </div>

      {showQuoteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowQuoteModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-4xl shadow-3xl max-w-xl w-full p-10 relative z-10 border border-white"
          >
            <button onClick={() => setShowQuoteModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <XCircle size={32} strokeWidth={1.5} />
            </button>
            
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <FileText size={32} />
              </div>
              <h2 className="text-3xl font-black font-outfit text-slate-900 mb-2">Bulk Pricing Quote</h2>
              <p className="text-slate-500 font-medium">Negotiate contract pricing for projects.</p>
            </div>
            
            {quoteSuccess ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-200">
                  <ShieldCheck size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Request Dispatched!</h3>
                <p className="text-slate-500 mt-3 font-medium">The vendor has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Quantity</label>
                    <input 
                      type="number" min="1" required value={quoteQuantity}
                      onChange={e => setQuoteQuantity(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-bold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Attachment Link</label>
                    <input 
                      type="url" placeholder="https://..." value={quoteAttachment}
                      onChange={e => setQuoteAttachment(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-medium outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Message</label>
                  <textarea 
                    required value={quoteMessage}
                    onChange={e => setQuoteMessage(e.target.value)}
                    placeholder="Describe your bulk requirement..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-medium outline-none transition-all h-32 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" disabled={submittingQuote}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95 flex items-center justify-center"
                >
                  {submittingQuote ? <Loader2 className="animate-spin" /> : "Dispatch Quote Request"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

const ChevronRight = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const Zap = ({ size, className }: { size: number, className: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const XCircle = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const SlidersHorizontal = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>;
