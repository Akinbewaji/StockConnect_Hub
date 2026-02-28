import { useState, useEffect } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Search, 
  History,
  Plus,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { authFetch } from '../../utils/api';

export default function StockManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('adjustment');
  const [thresholdValue, setThresholdValue] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<any>(null);
  const [productHistory, setProductHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds to keep stock levels "real-time"
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, movementsRes] = await Promise.all([
        authFetch('/api/products'),
        authFetch('/api/products/movements')
      ]);
      const productsData = await productsRes.json();
      const movementsData = await movementsRes.json();
      setProducts(productsData.data || []);
      setMovements(movementsData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustmentAmount) return;

    try {
      const promises = [];
      
      if (adjustmentAmount && adjustmentAmount !== '0') {
        promises.push(authFetch(`/api/products/${selectedProduct.id}/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: parseInt(adjustmentAmount),
            reason: adjustmentReason
          })
        }));
      }

      if (thresholdValue && parseInt(thresholdValue) !== selectedProduct.reorder_threshold) {
        promises.push(authFetch(`/api/products/${selectedProduct.id}/threshold`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threshold: parseInt(thresholdValue) })
        }));
      }

      await Promise.all(promises);

      setShowAdjustModal(false);
      setAdjustmentAmount('');
      setThresholdValue('');
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const fetchProductHistory = async (productId: number) => {
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/api/products/movements?productId=${productId}`);
      const data = await res.json();
      setProductHistory(data);
    } catch (error) {
      console.error('Error fetching product history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.quantity <= p.reorder_threshold);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-500">Monitor levels and track inventory movement</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4 shadow-sm overflow-hidden"
          >
            <div className="p-2 bg-red-100 text-red-600 rounded-lg relative">
              <AlertCircle size={24} />
              <div className="absolute inset-0 bg-red-400 rounded-lg animate-ping opacity-20" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800">Low Stock Alerts</h3>
              <p className="text-xs text-red-700 mt-1">
                {lowStockProducts.length} items are below their reorder threshold.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockProducts.map(p => (
                  <span key={p.id} className="bg-white/50 px-2 py-1 rounded text-[10px] font-medium text-red-800 border border-red-200">
                    {p.name} ({p.quantity})
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stock List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-indigo-600" />
                Current Inventory
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td 
                        className="px-4 py-4 font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => {
                          setHistoryProduct(product);
                          setShowHistoryModal(true);
                          fetchProductHistory(product.id);
                        }}
                      >
                        {product.name}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{product.category}</td>
                      <td className="px-4 py-4 font-bold text-gray-900">{product.quantity}</td>
                      <td className="px-4 py-4 text-gray-500 font-medium">{product.reorder_threshold}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          product.quantity <= product.reorder_threshold
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.quantity <= product.reorder_threshold ? 'Low' : 'Healthy'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setHistoryProduct(product);
                              setShowHistoryModal(true);
                              fetchProductHistory(product.id);
                            }}
                            className="text-gray-500 hover:text-gray-700 font-bold text-xs"
                          >
                            History
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setThresholdValue(product.reorder_threshold.toString());
                              setAdjustmentAmount('0');
                              setShowAdjustModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <History size={20} className="text-indigo-600" />
                Recent Movements
              </h2>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0">
                  <div className={`p-1.5 rounded-lg ${
                    m.change_amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {m.change_amount > 0 ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-gray-900">{m.product_name}</h4>
                      <span className={`text-[10px] font-bold ${
                        m.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {m.change_amount > 0 ? '+' : ''}{m.change_amount}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">
                      {m.reason} • {format(new Date(m.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {movements.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-4">No recent movements</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Adjust Stock</h2>
              <p className="text-gray-500">{selectedProduct.name}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm text-gray-500">Current Stock</span>
              <span className="text-xl font-bold text-gray-900">{selectedProduct.quantity}</span>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAdjustmentAmount(prev => (parseInt(prev || '0') - 1).toString())}
                  className="p-3 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentAmount(prev => (parseInt(prev || '0') + 1).toString())}
                  className="p-3 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Amount</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-lg font-bold"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g. 10 or -5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                >
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="restock">Restock / Purchase</option>
                  <option value="sale">Sale / Outgoing</option>
                  <option value="damage">Damage / Loss</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    placeholder="Threshold"
                  />
                  <div className="text-xs text-gray-500 max-w-[120px]">
                    Alerts trigger when stock is ≤ this value.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 p-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product History Modal */}
      {showHistoryModal && historyProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Stock History</h2>
                <p className="text-gray-500">{historyProduct.name}</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <History size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {historyLoading ? (
                <div className="py-12 text-center text-gray-500">Loading history...</div>
              ) : productHistory.length > 0 ? (
                <div className="space-y-4">
                  {productHistory.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          m.change_amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {m.change_amount > 0 ? <Plus size={16} /> : <Minus size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 uppercase text-xs tracking-wider">{m.reason}</p>
                          <p className="text-xs text-gray-500">{format(new Date(m.created_at), 'PPP p')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          m.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.change_amount > 0 ? '+' : ''}{m.change_amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">No history found for this product.</div>
              )}
            </div>

            <button 
              onClick={() => setShowHistoryModal(false)}
              className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
