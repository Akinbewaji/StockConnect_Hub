import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, MessageSquare, Bell, LogOut, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../services/auth.service';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600 font-outfit">StockConnect</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link to="/" className="text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium">
                Home
              </Link>
              <Link to="/products" className="text-slate-500 hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-slate-300 text-sm font-medium transition-colors">
                Products
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-6">
            <Link to="/cart" className="p-2 text-slate-400 hover:text-indigo-600 relative transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute top-0 right-0 flex h-4 w-4 rounded-full bg-red-500 text-white text-[10px] items-center justify-center font-bold">
                0
              </span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/chat" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </Link>
                <Link to="/notifications" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Bell className="h-6 w-6" />
                </Link>
                <div className="flex items-center space-x-2 border-l pl-4 ml-4">
                  <Link to="/settings" className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold hover:bg-indigo-200 transition-colors" title={user.name}>
                    {user.name[0]}
                  </Link>
                  <Link to="/settings" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
                Sign In
              </Link>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-b border-slate-100 animate-in slide-in-from-top duration-200">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link to="/" className="block py-2 text-base font-medium text-slate-700">Home</Link>
            <Link to="/products" className="block py-2 text-base font-medium text-slate-700">Products</Link>
            <Link to="/cart" className="block py-2 text-base font-medium text-slate-700">Cart</Link>
            {user && (
              <>
                <Link to="/orders" className="block py-2 text-base font-medium text-slate-700">Orders</Link>
                <Link to="/chat" className="block py-2 text-base font-medium text-slate-700">Chat</Link>
                <Link to="/settings" className="block py-2 text-base font-medium text-slate-700">Settings</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-base font-medium text-red-600">Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
