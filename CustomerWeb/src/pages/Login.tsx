import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Phone, Mail, Lock, Loader2, Eye, EyeOff, Zap } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-4xl font-black text-blue-600 tracking-tight">StockConnect</h2>
          <p className="mt-3 text-gray-500 font-medium">Welcome back! Sign in to your account.</p>
        </div>

        {/* Demo Login Button */}
        <button
          type="button"
          onClick={fillDemoCredentials}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
        >
          <Zap size={16} className="text-yellow-500" />
          Quick Demo Login
          <span className="ml-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">
            demo@stockconnect.com / demo1234
          </span>
        </button>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
          onSubmit={handleLogin}
        >
          <div className="space-y-4">
            {/* Identifier field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {identifier.includes('@') ? (
                  <Mail className="h-5 w-5 text-blue-400" />
                ) : (
                  <Phone className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                placeholder="Email, Phone, or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-btn"
            disabled={loading || !identifier || !password}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </motion.form>

        <div className="mt-8 text-center border-t border-gray-50 pt-8">
          <p className="text-sm text-gray-500 font-medium">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
