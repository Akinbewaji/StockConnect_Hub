import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, ShoppingBag, Users, DollarSign, PieChart, Plus } from 'lucide-react';
import { authFetch } from '../../utils/api';
import socket from '../../utils/socket';
import { DashboardSkeleton } from '../../components/Skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const statsRes = await authFetch('/api/analytics/summary');
        const statsData = await statsRes.json();
        
        const salesRes = await authFetch('/api/analytics/sales');
        const salesJson = await salesRes.json();
        
        if (isMounted) {
          setStats(statsData);
          setSalesData(salesJson);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    // Initial fetch
    fetchData();

    // Listen for real-time sale events
    socket.on("sale_completed", (data) => {
      console.log("🚀 Real-time sale update received:", data);
      fetchData(); // Refresh data immediately
    });

    // Set up polling interval every 60 seconds as a fallback
    const intervalId = setInterval(fetchData, 60000);

    return () => {
      isMounted = false;
      socket.off("sale_completed");
      clearInterval(intervalId);
    };
  }, []);

  if (!stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm text-gray-500">Revenue</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">₦{stats.totalRevenue?.toLocaleString()}</p>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${stats.trends?.dayChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stats.trends?.dayChange >= 0 ? '+' : ''}{stats.trends?.dayChange}%
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Vs yesterday (₦{stats.trends?.yesterday?.toLocaleString()})</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <span className="text-sm text-gray-500">Profit</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-green-600">₦{stats.totalProfit?.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-green-500">{stats.profitMargin}% Margin</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">This month: ₦{stats.trends?.month?.toLocaleString()}</p>
        </div>

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
            <span className="text-sm text-gray-500">Total Orders</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            to="/admin/pos"
            className="flex flex-col items-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <ShoppingBag size={24} />
            <span>Take Sale</span>
          </Link>
          <Link 
            to="/admin/inventory"
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Plus size={24} className="text-indigo-600" />
            <span>Add Product</span>
          </Link>
          <Link 
            to="/admin/customers"
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Users size={24} className="text-indigo-600" />
            <span>Add Customer</span>
          </Link>
          <Link 
            to="/admin/campaigns"
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <TrendingUp size={24} className="text-indigo-600" />
            <span>Campaign</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
