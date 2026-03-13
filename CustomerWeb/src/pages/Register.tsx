import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import SEO from '../components/SEO';
import { User, Phone, Mail, Loader2, MapPin, Navigation, Lock, Eye, EyeOff, ChevronLeft, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      setError('Name, Phone, Email, and Password are all required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      setError(axiosErr.response?.data?.error || (err instanceof Error ? err.message : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || '';
            const state = data.address.state || '';
            const suburb = data.address.suburb || data.address.neighbourhood || '';
            
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                street: prev.address.street || suburb,
                city: city,
                state: state
              }
            }));
          }
        } catch (err) {
          console.error('Location detection error:', err);
          setError('Could not detect location. Please enter manually.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError('Location access denied. Please enter manually.');
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-20 flex items-center justify-center p-4 relative overflow-hidden">
      <SEO title="Register" description="Create your StockConnect account to start procuring materials." />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold text-xs uppercase tracking-widest mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-5xl p-8 sm:p-12 shadow-2xl shadow-indigo-900/10 border border-white"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
              <User size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 font-outfit tracking-tight">Create Account</h2>
            <p className="mt-3 text-slate-500 font-medium">Join StockConnect's global material network.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs border border-rose-100 font-bold mb-8 flex items-center gap-3"
            >
              <XCircle size={16} />
              {error}
            </motion.div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="group md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Full Identity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Secure Passcode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Address Section */}
              <div className="md:col-span-2 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4 px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Location</p>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all border border-indigo-100 shadow-sm"
                  >
                    <Navigation size={12} className="fill-indigo-600" />
                    Auto-Detect
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative md:col-span-2 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                      placeholder="Street name or neighborhood"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Launch My Account'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
