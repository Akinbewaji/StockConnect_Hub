import { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authFetch } from '../../utils/api';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        authFetch('/api/products'),
        authFetch('/api/customers'),
        authFetch('/api/settings')
      ]);
      setProducts(await pRes.json());
      setCustomers(await cRes.json());
      setSettings(await sRes.json());
    } catch (error) {
      console.error('Error fetching POS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity) return prev;
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.cartQuantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.quantity) return item;
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          totalAmount: total,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.cartQuantity,
            unitPrice: item.price
          }))
        })
      });

      if (res.ok) {
        setShowSuccess(true);
        setCart([]);
        setSelectedCustomer(null);
        fetchData();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6">
      {/* Left Side: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">New Sale</h1>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity <= 0}
                className={`group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-500 transition-all text-left flex flex-col h-full ${
                  product.quantity <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''
                }`}
              >
                <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                  <img 
                    src={`https://picsum.photos/seed/${product.id}/200/200`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  {product.quantity <= 5 && product.quantity > 0 && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Low Stock
                    </span>
                  )}
                  {product.quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                <div className="mt-auto flex justify-between items-center">
                  <span className="font-bold text-indigo-600">{settings?.currency}{product.price.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{product.quantity} left</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Customer */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 min-h-0">
        {/* Customer Selection */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <User size={18} className="text-indigo-600" />
            Customer
          </h2>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <div>
                <p className="font-bold text-indigo-900 text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-indigo-600">{selectedCustomer.phone}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-indigo-400 hover:text-indigo-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Find customer..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch('');
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                    >
                      <span className="font-bold text-sm text-gray-900">{c.name}</span>
                      <span className="text-xs text-gray-500">{c.phone}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500 italic">No customers found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <ShoppingCart size={18} className="text-indigo-600" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[10px] font-bold text-red-500 uppercase hover:underline">
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={`https://picsum.photos/seed/${item.id}/100/100`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">{settings?.currency}{item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-indigo-600">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-indigo-600">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-gray-900 ml-auto">
                      {settings?.currency}{(item.price * item.cartQuantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                <ShoppingCart size={40} />
                <p className="text-xs font-medium">Your cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">{settings?.currency}{total.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>Checkout</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sale Confirmed!</h2>
              <p className="text-gray-500">The order has been processed and stock updated.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
