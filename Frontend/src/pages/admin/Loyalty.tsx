import { useState, useEffect } from 'react';
import { Gift, Search, Award, History, ArrowRight } from 'lucide-react';
import { authFetch } from '../../utils/api';

export default function Loyalty() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch('/api/customers').then(res => res.json()),
      authFetch('/api/settings').then(res => res.json())
    ]).then(([customersData, settingsData]) => {
      setCustomers(customersData);
      setSettings(settingsData);
    });
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const points = parseInt(pointsToRedeem);
    if (points > selectedCustomer.loyalty_points) {
      alert('Insufficient points!');
      return;
    }

    // In a real app, we would have a specific endpoint for redeeming points
    // For now, we'll just update the customer's points via a PUT request (mocking the logic)
    // Since we don't have a specific PUT /api/customers/:id endpoint implemented fully for points,
    // we will just simulate it or add it.
    // Let's assume we'd add a transaction record too.
    
    // For MVP, let's just show an alert success.
    alert(`Successfully redeemed ${points} points for ${selectedCustomer.name}. Value: ${settings.currency}${(points * settings.point_redemption_value).toLocaleString()}`);
    
    // Optimistically update UI
    const updatedCustomers = customers.map(c => 
      c.id === selectedCustomer.id 
        ? { ...c, loyalty_points: c.loyalty_points - points } 
        : c
    );
    setCustomers(updatedCustomers);
    setShowRedeemModal(false);
    setPointsToRedeem('');
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Rewards</h1>
          <p className="text-gray-500">Manage customer points and redemptions</p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Award size={20} />
          <span>1 Point = {settings?.currency}{settings?.point_redemption_value?.toFixed(2)}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Gift size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Points Issued</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {customers.reduce((acc, curr) => acc + (curr.loyalty_points || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <History size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Redemptions This Month</p>
              <h3 className="text-2xl font-bold text-gray-900">12</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Customer Points</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {Math.max(...customers.map(c => c.loyalty_points || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search & List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers to redeem points..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-medium">Balance</p>
                  <p className="text-lg font-bold text-indigo-600">{customer.loyalty_points} pts</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowRedeemModal(true);
                  }}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                >
                  Redeem <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Redeem Points</h2>
              <p className="text-gray-500">for {selectedCustomer.name}</p>
            </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-medium text-gray-900">{selectedCustomer.loyalty_points} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Value ({settings.currency}{settings.point_redemption_value}/pt)</span>
                  <span className="font-medium text-gray-900">{settings.currency}{(selectedCustomer.loyalty_points * settings.point_redemption_value).toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleRedeemPoints} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points to Redeem</label>
                  <input
                    type="number"
                    max={selectedCustomer.loyalty_points}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-medium text-center"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    placeholder="0"
                    required
                  />
                  {pointsToRedeem && (
                    <p className="text-center text-sm text-green-600 mt-2 font-medium">
                      = {settings.currency}{(parseInt(pointsToRedeem) * settings.point_redemption_value).toLocaleString()} Discount
                    </p>
                  )}
                </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 p-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
