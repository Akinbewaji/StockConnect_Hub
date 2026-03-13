import { useState, useEffect } from 'react';
import { Moon, Sun, Palette, User, Bell, Save, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { Link } from 'react-router-dom';

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
    }).catch(err => console.error("Failed to fetch profile"));
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
      // Update local storage if needed (optional based on auth service implementation)
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-(--bg-surface) border-b border-(--border) px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/" className="text-(--foreground) opacity-60 hover:opacity-100 transition-opacity">
            ←
          </Link>
          <h1 className="text-lg font-black text-(--foreground)">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Account Info */}
        <section className="bg-(--bg-surface) rounded-2xl border border-(--border) overflow-hidden shadow-sm">
          <div className="p-5 border-b border-(--border) flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 rounded-xl">
              <User size={18} />
            </div>
            <h2 className="font-bold text-(--foreground)">Account Profile</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--foreground) opacity-50 uppercase tracking-wider">Full Name</label>
              <input 
                type="text"
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full bg-(--bg-surface-2) border border-(--border) rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--foreground) opacity-50 uppercase tracking-wider">Email Address</label>
              <input 
                type="email"
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
                className="w-full bg-(--bg-surface-2) border border-(--border) rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--foreground) opacity-50 uppercase tracking-wider">Phone Number</label>
              <input 
                type="text"
                value={profile.phone}
                disabled
                className="w-full bg-(--bg-surface-2) border border-(--border) rounded-xl px-4 py-3 text-sm opacity-50 cursor-not-allowed"
              />
              <p className="text-[10px] text-(--foreground) opacity-40 italic">Phone number is linked to your identity and cannot be changed.</p>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                success 
                  ? 'bg-green-600 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <><CheckCircle2 size={18} /> Profile Updated</>
              ) : (
                <><Save size={18} /> Save Changes</>
              )}
            </button>
          </form>
        </section>

        {/* Appearance */}
        <section className="bg-(--bg-surface) rounded-2xl border border-(--border) overflow-hidden shadow-sm">
          <div className="p-5 border-b border-(--border) flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 dark:bg-violet-900/30 rounded-xl">
              <Palette size={18} />
            </div>
            <h2 className="font-bold text-(--foreground)">Appearance</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-(--foreground)">Theme</p>
                <p className="text-xs opacity-60 text-(--foreground) mt-0.5">
                  Switch between light and dark mode
                </p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`relative flex items-center w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon size={12} className="text-indigo-600" />
                  ) : (
                    <Sun size={12} className="text-amber-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Visual theme preview chips */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-(--border) bg-(--bg-surface-2)'
                }`}
              >
                <Sun size={16} className={theme === 'light' ? 'text-indigo-600' : 'text-(--foreground) opacity-60'} />
                <span className={`text-sm font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-(--foreground) opacity-60'}`}>
                  Light
                </span>
              </button>
              <button
                type="button"
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-(--border) bg-(--bg-surface-2)'
                }`}
              >
                <Moon size={16} className={theme === 'dark' ? 'text-indigo-400' : 'text-(--foreground) opacity-60'} />
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-(--foreground) opacity-60'}`}>
                  Dark
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Notifications placeholder */}
        <section className="bg-(--bg-surface) rounded-2xl border border-(--border) overflow-hidden shadow-sm">
          <div className="p-5 border-b border-(--border) flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-500 dark:bg-rose-900/30 rounded-xl">
              <Bell size={18} />
            </div>
            <h2 className="font-bold text-(--foreground)">Notifications</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-(--foreground) opacity-60">
              Notification preferences coming soon.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
