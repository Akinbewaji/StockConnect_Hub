import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { Moon, Sun, Palette, User, Bell, Save, CheckCircle2, Shield, Sparkles, Smartphone, Mail, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const currentUser = authService.getCurrentUser();
  
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch latest profile data
    api.get('/customers/self/profile').then(res => {
      setProfile(res.data);
    }).catch(() => console.error("Failed to fetch profile"));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await api.put('/customers/self/profile', {
        name: profile.name,
        email: profile.email
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="Settings" description="Manage your digital identity and preferences on StockConnect." />
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Header */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <nav className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-indigo-600">Preferences</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your digital identity and preferences.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-8">
          
          {/* Profile Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-5xl shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-outfit">Identity Profile</h2>
                  <p className="text-sm text-slate-400 font-medium">Your personal information</p>
                </div>
              </div>
              <Sparkles size={20} className="text-indigo-300" />
            </div>

            <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Full Identity</label>
                  <div className="relative">
                    <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Digital Mail</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({...profile, email: e.target.value})}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                      placeholder="name@nexus.com"
                      required
                    />
                  </div>
                </div>

                <div className="group md:col-span-2 opacity-60">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Phone Link (Immutable)</label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text"
                      value={profile.phone}
                      disabled
                      className="w-full bg-slate-50/30 border border-slate-100 rounded-3xl px-14 py-4 text-slate-400 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                  success 
                    ? 'bg-emerald-600 text-white shadow-emerald-100' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : success ? (
                  <><CheckCircle2 size={20} /> Success: Identity Updated</>
                ) : (
                  <><Save size={20} /> Deploy Profile Changes</>
                )}
              </button>
            </form>
          </motion.section>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Visual Configuration */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-5xl shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <Palette size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-outfit">Visual Core</h2>
                  <p className="text-sm text-slate-400 font-medium">Theme engine settings</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">Adaptive Mode</span>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-500 shadow-inner ${
                      theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center transition-transform duration-500 ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      {theme === 'dark' ? <Moon size={12} className="text-indigo-600" /> : <Sun size={12} className="text-amber-500" />}
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 items-center ${
                      theme === 'light' 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-50 bg-slate-50/30'
                    }`}
                  >
                    <Sun size={20} className={theme === 'light' ? 'text-indigo-600' : 'text-slate-300'} />
                    <span className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-indigo-600' : 'text-slate-400'}`}>Light</span>
                  </button>
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 items-center ${
                      theme === 'dark' 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-50 bg-slate-50/30'
                    }`}
                  >
                    <Moon size={20} className={theme === 'dark' ? 'text-indigo-600' : 'text-slate-300'} />
                    <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-indigo-600' : 'text-slate-400'}`}>Dark</span>
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Neural System */}
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-5xl shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                  <Bell size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-outfit">Neural Net</h2>
                  <p className="text-sm text-slate-400 font-medium">Notification control</p>
                </div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center h-[200px] text-center space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
                  <Shield size={20} />
                </div>
                <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-[200px]">
                  Notification encryption & filters coming in v2.0
                </p>
              </div>
            </motion.section>
          </div>

          {/* Danger Zone */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-rose-50/30 rounded-5xl border border-rose-100 overflow-hidden"
          >
            <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-rose-900 font-outfit">Entropy Zone</h3>
                <p className="text-sm text-rose-600 font-medium mt-1">Permanent data erasure protocol.</p>
              </div>
              <button className="px-8 py-4 bg-white border border-rose-100 text-rose-600 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-900/5 active:scale-95 flex items-center gap-2">
                <Trash2 size={16} />
                Terminate Account
              </button>
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
