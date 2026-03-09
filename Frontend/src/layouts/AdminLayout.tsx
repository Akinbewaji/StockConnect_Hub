import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Megaphone, LogOut, Menu, X, Gift, ClipboardList, ShoppingCart, Settings, MessageSquare, Brain } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/ChatBot';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/insights', icon: Brain, label: 'AI Insights', pro: true },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/stock', icon: ClipboardList, label: 'Stock' },
    { path: '/admin/pos', icon: ShoppingCart, label: 'New Sale' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/loyalty', icon: Gift, label: 'Loyalty', pro: true },
    { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns', pro: true },
    { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/admin/plans', icon: ClipboardList, label: 'Subscription' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const userPlan = user?.plan?.toLowerCase() || 'free';
  const isPro = userPlan !== 'free';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span className="font-bold text-slate-900 truncate">{user?.businessName || 'StockConnect'}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`text-[10px] inline-flex items-center w-fit px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isPro ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {userPlan} Plan
            </div>
            {isPro && (
              <div className="text-[10px] text-slate-500 font-medium">
                SMS Credits: <span className="text-indigo-600 font-bold">{user?.smsCredits || 0}</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isRestricted = item.pro && !isPro;
            return (
              <Link
                key={item.path}
                to={isRestricted ? '#' : item.path}
                onClick={(e) => {
                  if (isRestricted) {
                    e.preventDefault();
                    alert("This is a Pro feature. Please upgrade to access.");
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : isRestricted 
                      ? 'text-slate-400 cursor-not-allowed opacity-60' 
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {item.pro && !isPro && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Pro</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {!isPro && (
            <Link 
              to="/admin/plans" 
              className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
            >
              Upgrade to Pro
            </Link>
          )}
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
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span className="font-semibold text-slate-900">{user?.businessName || 'StockConnect'}</span>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Navigation Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-0 bg-black/50 z-60 md:hidden" onClick={() => setIsMenuOpen(false)}>
            <div className="bg-white w-64 h-full shadow-xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <span className="font-bold text-slate-900">Menu</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                        : 'text-slate-600 hover:bg-slate-50'
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center md:hidden z-40">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                location.pathname === item.path ? 'text-indigo-600' : 'text-slate-500'
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
