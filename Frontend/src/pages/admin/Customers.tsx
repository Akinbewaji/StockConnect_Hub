import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, User, Download } from 'lucide-react';
import { authFetch } from '../../utils/api';
import { ReceiptService } from '../../utils/receipt';
import { ListSkeleton } from '../../components/Skeleton';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    authFetch('/api/settings')
      .then(res => res.json())
      .then(setSettings);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCustomers(page);
  }, [page]);

  const fetchCustomers = (targetPage: number = page) => {
    setLoading(true);
    authFetch(`/api/customers?search=${search}&page=${targetPage}&limit=${limit}`)
      .then(res => res.json())
      .then(res => {
        setCustomers(res.data || []);
        setTotal(res.total || 0);
        setLoading(false);
      });
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });
    setShowAddModal(false);
    // Refresh list
    fetchCustomers();
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  const handleCustomerClick = async (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await authFetch(`/api/customers/${customer.id}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Update local state
        setSelectedCustomer((prev: any) => ({
          ...prev,
          orders: prev.orders.map((o: any) => 
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white p-2 rounded-full shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
          <div 
            key={customer.id} 
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors"
            onClick={() => handleCustomerClick(customer)}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <Mail size={14} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs font-medium text-gray-500 uppercase">Loyalty Points</span>
                <span className="text-lg font-bold text-indigo-600">{customer.loyalty_points}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Pagination Controls */}
      {total > limit && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page <span className="font-semibold text-indigo-600">{page}</span> of {Math.ceil(total / limit)}
            <span className="ml-2 text-gray-400">({total} total)</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 p-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-gray-500">Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="block text-xs font-medium text-gray-500 uppercase">Phone</span>
                <span className="text-sm font-semibold text-gray-900">{selectedCustomer.phone}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="block text-xs font-medium text-gray-500 uppercase">Email</span>
                <span className="text-sm font-semibold text-gray-900">{selectedCustomer.email || 'N/A'}</span>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl">
                <span className="block text-xs font-medium text-indigo-500 uppercase">Loyalty Points</span>
                <span className="text-lg font-bold text-indigo-600">{selectedCustomer.loyalty_points}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Order History</h3>
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Total Orders: {selectedCustomer.orders.length}</span>
                    <span>Total Spent: ₦{selectedCustomer.orders.reduce((acc: number, o: any) => acc + o.total_amount, 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {loadingDetails ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-indigo-600 rounded-full mb-2" role="status" aria-label="loading"></div>
                  <p className="text-sm">Fetching transaction history...</p>
                </div>
              ) : selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCustomer.orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">#{order.id}</td>
                          <td className="px-4 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs">
                            {order.items && order.items.map((item: any) => (
                              <div key={item.id}>
                                {item.product_name} <span className="text-gray-400">x{item.quantity}</span>
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                order.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-gray-900">₦{order.total_amount.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => ReceiptService.generatePDF(order, settings)}
                              className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Download size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm">No transaction history found for this customer.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowDetailsModal(false)}
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
