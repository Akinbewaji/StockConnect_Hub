import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Package, ShieldCheck, Truck, MessageSquarePlus } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <Store className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-outfit">Seller Not Found</h2>
          <p className="text-slate-500 mt-2">The business profile you're looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      {/* Seller Header / Glassmorphism Profile Card */}
      <div className="bg-indigo-600 pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-indigo-300">
                <Store className="h-10 w-10 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white font-outfit flex items-center">
                  {seller.businessName}
                  <span title="Verified Seller" className="ml-2 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-indigo-200" />
                  </span>
                </h1>
                <p className="text-indigo-100 text-lg mt-1 flex items-center">
                  <span className="bg-indigo-500/50 px-2 py-0.5 rounded-md text-sm backdrop-blur-sm shadow-sm border border-indigo-400/30">
                    Hardware Vendor
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col md:flex-row justify-between gap-6 relative z-10 glass">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Location</p>
                <p className="text-slate-500">{seller.address || 'Address not listed'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Contact</p>
                <p className="text-slate-500">{seller.phone}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Email</p>
                <p className="text-slate-500">{seller.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Total Products</p>
                <p className="text-slate-500">{products.length} Items Available</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center md:border-l border-slate-100 md:pl-8">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center transition-all transform hover:-translate-y-1"
            >
              <MessageSquarePlus className="h-5 w-5 mr-2" />
              Chat with Seller
            </button>
          </div>
        </div>

        {/* Product Catalog */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-outfit text-slate-900 flex items-center">
              Product Catalog
              <span className="ml-3 bg-indigo-100 text-indigo-800 text-xs py-1 px-2 rounded-lg">{products.length}</span>
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div 
                  key={product.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group transition-all"
                >
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
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">₦{product.price.toLocaleString()}</span>
                      <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all btn-press">
                        <Truck className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
               <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 text-lg">This seller hasn't listed any products yet.</p>
             </div>
          )}
        </div>
      </div>
      
      {/* Floating Chat Widget */}
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
