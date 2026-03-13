import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import SEO from '../components/SEO';
import { Phone, Mail, Lock, Loader2, Eye, EyeOff, ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(identifier, password);
  };

  const fillDemoCredentials = async () => {
    const demoId = 'demo@stockconnect.com';
    const demoPass = 'demo1234';
    setIdentifier(demoId);
    setPassword(demoPass);
    await doLogin(demoId, demoPass);
  };

  async function doLogin(id: string, pass: string) {
    setLoading(true);
    setError('');
    try {
      await authService.login(id, pass);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      setError(axiosErr.response?.data?.error || (err instanceof Error ? err.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] px-4 py-12 relative overflow-hidden">
      <SEO title="Login" description="Access your StockConnect customer portal." />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold text-xs uppercase tracking-widest mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Store
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-5xl p-8 sm:p-12 shadow-2xl shadow-indigo-900/10 border border-white"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 font-outfit tracking-tight">Welcome Back</h2>
            <p className="mt-3 text-slate-500 font-medium">Log in to manage your procurement.</p>
          </div>

          {/* Quick Demo Login */}
          <button
            type="button"
            onClick={fillDemoCredentials}
            disabled={loading}
            className="w-full relative group p-4 rounded-3xl border-2 border-dashed border-indigo-100 bg-indigo-50/50 text-indigo-600 font-bold text-xs hover:bg-indigo-50 hover:border-indigo-200 transition-all disabled:opacity-50 overflow-hidden mb-8"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span>CLICK HERE FOR QUICK DEMO LOGIN</span>
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs border border-rose-100 font-bold mb-6 flex items-center gap-3"
            >
              <XCircle size={16} />
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              {/* Identifier field */}
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Credential</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    {identifier.includes('@') ? (
                      <Mail size={18} />
                    ) : (
                      <Phone size={18} />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Email, Phone, or Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-4">Passcode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-14 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full flex justify-center py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log Into Account'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 font-medium">
              New here?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200">
                Join StockConnect
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const XCircle = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
