import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { User, Mail, Phone, MapPin, Package, Heart, CreditCard, Clock, ShieldCheck, Edit3, Camera, Map } from 'lucide-react';
import { motion } from 'framer-motion';

interface Customer {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  street_address?: string;
  email_verified?: number;
  created_at?: string;
  logo_url?: string;
}

export default function Profile() {
  const [user] = useState<Customer | null>(authService.getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="My Profile" description="Manage your StockConnect customer profile and information." />
      <Navbar />

      {/* Hero Header */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 relative">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 via-white to-sky-50/30" />
        <div className="absolute left-0 right-0 h-px bottom-0 bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8"
          >
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-200 relative overflow-hidden">
                {user.logo_url ? (
                  <img src={user.logo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black font-outfit uppercase tracking-tighter">{user.name[0]}</span>
                )}
                {/* Hover overlay for changing picture */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white" size={28} />
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors">
                <Edit3 size={18} className="text-slate-600" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 font-outfit tracking-tight mb-2">
                    {user.name}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-medium">
                    <Mail size={16} />
                    {user.email}
                    {user.email_verified === 1 && <ShieldCheck size={16} className="text-emerald-500 ml-1" />}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/settings" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                     Account Settings
                  </Link>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center md:items-start">
                  <Package size={20} className="text-indigo-600 mb-2" />
                  <span className="text-2xl font-black text-slate-900 font-outfit">12</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Orders</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center md:items-start">
                  <Heart size={20} className="text-rose-500 mb-2" />
                  <span className="text-2xl font-black text-slate-900 font-outfit">24</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Favorites</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center md:items-start">
                  <Clock size={20} className="text-emerald-500 mb-2" />
                  <span className="text-2xl font-black text-slate-900 font-outfit">3</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center md:items-start">
                  <CreditCard size={20} className="text-sky-500 mb-2" />
                  <span className="text-2xl font-black text-slate-900 font-outfit">2</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Methods</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Details Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-4xl p-8 border border-slate-100 shadow-xl shadow-slate-200/20"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 font-outfit">Personal Details</h2>
                <button className="text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors">Edit</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</p>
                  <div className="flex items-center gap-3 text-slate-900 font-medium bg-slate-50 p-4 rounded-2xl">
                    <User size={18} className="text-slate-400" />
                    {user.name}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</p>
                  <div className="flex items-center gap-3 text-slate-900 font-medium bg-slate-50 p-4 rounded-2xl">
                    <Phone size={18} className="text-slate-400" />
                    {user.phone || 'Not provided'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</p>
                  <div className="flex items-center justify-between text-slate-900 font-medium bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-slate-400" />
                      {user.email}
                    </div>
                    {user.email_verified === 1 ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide">Verified</span>
                    ) : (
                      <button className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">Verify Now</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Address Book Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-4xl p-8 border border-slate-100 shadow-xl shadow-slate-200/20"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 font-outfit flex items-center gap-3">
                  Address Book
                </h2>
                <button className="text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors flex items-center gap-1">
                  + Add New
                </button>
              </div>

              {user.location || user.street_address ? (
                 <div className="border border-indigo-100 bg-indigo-50/30 p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="mt-1 p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-lg">Default Delivery Address</h3>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Primary</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed max-w-sm mt-2">
                          {user.street_address && <span className="block">{user.street_address}</span>}
                          {user.location && <span className="block">{user.location}</span>}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                      <Edit3 size={18} />
                    </button>
                  </div>
                 </div>
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Map size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No addresses saved</h3>
                  <p className="text-slate-500 font-medium mb-6">Add a delivery address to complete your checkout faster.</p>
                  <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-200">
                    Add Delivery Address
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Account Status Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-br from-indigo-600 to-indigo-800 rounded-4xl p-8 text-white shadow-2xl shadow-indigo-200 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-xl font-bold font-outfit mb-6 flex items-center gap-2">
                <ShieldCheck size={24} className="text-indigo-200" />
                Customer Account
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-indigo-500/30">
                  <span className="text-indigo-100 font-medium">Member Since</span>
                  <span className="font-bold">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-indigo-500/30">
                  <span className="text-indigo-100 font-medium">Account Tier</span>
                  <span className="font-bold flex items-center gap-1 text-amber-300">
                    Premium
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100 font-medium">Status</span>
                  <span className="bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Active
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-4xl p-6 border border-slate-100 shadow-xl shadow-slate-200/20"
            >
              <h3 className="text-lg font-bold text-slate-900 font-outfit mb-4 px-2">Quick Navigation</h3>
              <div className="space-y-1">
                <Link to="/orders" className="flex items-center gap-3 p-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-colors font-medium">
                  <Package size={20} className="text-slate-400" />
                  My Orders
                </Link>
                <Link to="/favorites" className="flex items-center gap-3 p-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-colors font-medium">
                  <Heart size={20} className="text-slate-400" />
                  Saved Materials
                </Link>
                <Link to="/chat" className="flex items-center gap-3 p-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-colors font-medium">
                  <div className="relative">
                    <User size={20} className="text-slate-400" />
                  </div>
                  Seller Communications
                </Link>
                <Link to="/settings" className="flex items-center gap-3 p-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-colors font-medium">
                  <CreditCard size={20} className="text-slate-400" />
                  Billing Details
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
