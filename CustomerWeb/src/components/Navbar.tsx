import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Search, Heart, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/#categories' },
    { name: 'Vendors', path: '/#vendors' },
    { name: 'Wholesale', path: '/#wholesale' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-100 transition-all duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className={`relative px-6 py-4 rounded-4xl border border-white/20 transition-all duration-500 ${
          isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 border border-white/50 px-6 py-2' 
          : 'bg-white border border-slate-100 px-8 py-4 shadow-sm'
        }`}>
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform">
                <Store size={22} />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tighter">Stock<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4 decoration-4">Connect</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === link.path 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Search, Cart & Account */}
            <div className="hidden md:flex items-center space-x-4">
              <div className={`relative transition-all duration-500 ${searchFocused ? 'w-64' : 'w-48'}`}>
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none"
                />
              </div>
              
              <div className="h-6 w-px bg-slate-100 mx-2" />

              <Link to="/favorites" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all relative group">
                <Heart size={22} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white transform scale-0 group-hover:scale-100 transition-transform"></span>
              </Link>

              <Link to="/cart" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all relative group">
                <ShoppingCart size={22} />
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-indigo-100">0</span>
              </Link>

              {!authService.isAuthenticated() ? (
                <Link 
                  to="/login"
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 ml-2"
                >
                  Log In
                </Link>
              ) : (
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-2 px-4"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-4xl border border-slate-100 p-6 shadow-2xl space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block px-4 py-3 rounded-2xl text-lg font-bold text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-50 flex gap-4">
                <Link to="/cart" className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-2xl font-black text-center" onClick={() => setIsOpen(false)}>
                  Cart (0)
                </Link>
                <Link to="/login" className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-black text-center shadow-lg shadow-indigo-100" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
