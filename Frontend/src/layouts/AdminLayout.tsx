import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Megaphone, LogOut, Menu, X, Gift, ClipboardList, ShoppingCart, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/ChatBot';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/stock', icon: ClipboardList, label: 'Stock' },
    { path: '/admin/pos', icon: ShoppingCart, label: 'New Sale' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/loyalty', icon: Gift, label: 'Loyalty' },
    { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            SC
          </div>
          <span className="font-bold text-gray-900 truncate">{user?.businessName || 'StockConnect'}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span className="font-semibold text-gray-900">{user?.businessName || 'StockConnect'}</span>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Navigation Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-0 bg-black/50 z-[60] md:hidden" onClick={() => setIsMenuOpen(false)}>
            <div className="bg-white w-64 h-full shadow-xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <span className="font-bold text-gray-900">Menu</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 mt-auto"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <Outlet />
        </main>

        <ChatBot />

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center md:hidden z-40">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                location.pathname === item.path ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <item.icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
