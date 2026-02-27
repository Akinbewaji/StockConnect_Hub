import { useState, useEffect } from 'react';
import { 
  Building2, 
  Coins, 
  Bell, 
  Download, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Globe,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { authFetch } from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await authFetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    // In a real app, this would trigger a CSV download
    alert('Exporting data to CSV... (This is a demo feature)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your business profile and application preferences</p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Business Profile</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Currency Symbol</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Globe size={16} />
                </div>
                <input 
                  type="text" 
                  value={settings.currency}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="₦, $, €"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Business Phone</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Smartphone size={16} />
                </div>
                <input 
                  type="tel" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="+234 ..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Loyalty Program */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Coins size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Loyalty Program</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Points Awarded</label>
                <input 
                  type="number" 
                  value={settings.loyalty_points_per_unit}
                  onChange={e => setSettings({...settings, loyalty_points_per_unit: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Per Amount Spent ({settings.currency})</label>
                <input 
                  type="number" 
                  value={settings.currency_unit_for_points}
                  onChange={e => setSettings({...settings, currency_unit_for_points: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Redemption Value ({settings.currency} per Point)</label>
                <input 
                  type="number" 
                  value={settings.point_redemption_value}
                  onChange={e => setSettings({...settings, point_redemption_value: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Currently: Customers earn {settings.loyalty_points_per_unit} point(s) for every {settings.currency}{settings.currency_unit_for_points} spent. 
              Each point is worth {settings.currency}{settings.point_redemption_value} during redemption.
            </p>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Bell size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Notifications</h2>
          </div>
          <div className="p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-gray-900">Low Stock Alerts</span>
                <p className="text-xs text-gray-500">Receive in-app notifications when products drop below threshold</p>
              </div>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={settings.low_stock_notifications === 1}
                  onChange={e => setSettings({...settings, low_stock_notifications: e.target.checked ? 1 : 0})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
            </label>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Download size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Data Management</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-gray-900">Export Inventory Data</span>
                <p className="text-xs text-gray-500">Download all your products and stock levels as a CSV file</p>
              </div>
              <button 
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button 
            type="button"
            onClick={fetchSettings}
            className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Reset
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
