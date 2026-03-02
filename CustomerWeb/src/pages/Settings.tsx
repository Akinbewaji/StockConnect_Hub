import { Moon, Sun, Palette, User, Bell } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { authService } from '../services/auth.service';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const user = authService.getCurrentUser();

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
        {user && (
          <section className="bg-(--bg-surface) rounded-2xl border border-(--border) overflow-hidden shadow-sm">
            <div className="p-5 border-b border-(--border) flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-xl">
                <User size={18} />
              </div>
              <h2 className="font-bold text-(--foreground)">Account</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--foreground) opacity-60">Name</span>
                <span className="text-sm font-semibold text-(--foreground)">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--foreground) opacity-60">Email</span>
                <span className="text-sm font-semibold text-(--foreground)">{user.email}</span>
              </div>
            </div>
          </section>
        )}

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
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
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
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-(--border) bg-(--bg-surface-2)'
                }`}
              >
                <Sun size={16} className={theme === 'light' ? 'text-blue-600' : 'text-(--foreground) opacity-60'} />
                <span className={`text-sm font-bold ${theme === 'light' ? 'text-blue-600' : 'text-(--foreground) opacity-60'}`}>
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
