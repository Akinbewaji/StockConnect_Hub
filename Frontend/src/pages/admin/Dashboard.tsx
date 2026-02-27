import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, ShoppingBag, Users } from 'lucide-react';
import { authFetch } from '../../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch summary stats
    authFetch('/api/analytics/summary')
      .then(res => res.json())
      .then(setStats);

    // Fetch sales chart data
    authFetch('/api/analytics/sales')
      .then(res => res.json())
      .then(setSalesData);
  }, []);

  if (!stats) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag size={20} />
            </div>
            <span className="text-sm text-gray-500">Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm text-gray-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm text-gray-500">Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.recentOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
            <span className="text-sm text-gray-500">Campaigns</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Sales</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700">
            Add Product
          </button>
          <button className="p-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
