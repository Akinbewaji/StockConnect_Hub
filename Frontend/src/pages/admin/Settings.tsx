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
  MapPin,
  Receipt,
  MessageSquare,
  AlertTriangle,
  FileText,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authFetch } from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(true);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
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

  const handleUnlockProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setMessage(null);
    try {
      const res = await authFetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: verifyPassword })
      });

      if (res.ok) {
        setIsProfileLocked(false);
        setShowUnlockModal(false);
        setVerifyPassword('');
        setMessage({ type: 'success', text: 'Business profile unlocked for editing!' });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Incorrect password');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleExportData = async (type: 'products' | 'customers' | 'orders') => {
    try {
      const response = await authFetch(`/api/settings/export/${type}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Export failed');
      }

      // Convert response to blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create hidden download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: `${type} exported successfully!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `Failed to export ${type}` });
    }
  };

  const handleWipeData = async () => {
    if (wipeConfirmText !== 'WIPE DATA') return;
    
    setWiping(true);
    try {
      const res = await authFetch('/api/settings/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: wipeConfirmText })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'All POS transaction data has been permanently wiped.' });
        setShowWipeModal(false);
        setWipeConfirmText('');
      } else {
        throw new Error('Failed to wipe data');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while wiping data.' });
    } finally {
      setWiping(false);
    }
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
        <section className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isProfileLocked ? 'border-amber-100 opacity-95' : 'border-gray-100'}`}>
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isProfileLocked ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <Building2 size={20} />
              </div>
              <h2 className="font-bold text-gray-900">Business Profile</h2>
              {isProfileLocked && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>
            {isProfileLocked && (
              <button 
                type="button"
                onClick={() => setShowUnlockModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
              >
                Unlock to Edit
              </button>
            )}
          </div>
          <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative ${isProfileLocked ? 'pointer-events-none' : ''}`}>
            {isProfileLocked && <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] cursor-not-allowed" title="Click 'Unlock to Edit' to change these settings" />}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Currency Symbol</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Globe size={16} />
                </div>
                <input 
                  type="text" 
                  disabled={isProfileLocked}
                  value={settings.currency || ''}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:text-gray-500"
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
                  disabled={isProfileLocked}
                  value={settings.phone || ''}
                  onChange={e => setSettings({...settings, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:text-gray-500"
                  placeholder="+234 ..."
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Business Address</label>
              <div className="relative">
                <div className="absolute left-3 top-4 text-gray-400">
                  <MapPin size={16} />
                </div>
                <textarea 
                  value={settings.address || ''}
                  disabled={isProfileLocked}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20 disabled:text-gray-500"
                  placeholder="123 Market Street, Lagos..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* POS & Receipts */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={20} />
            </div>
            <h2 className="font-bold text-gray-900">POS & Receipts</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate || ''}
                  onChange={e => setSettings({...settings, tax_rate: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 7.5"
                />
              </div>
              <p className="text-xs text-gray-500">Applied automatically to POS checkouts</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Receipt Footer Message</label>
              <textarea 
                value={settings.receipt_footer || ''}
                onChange={e => setSettings({...settings, receipt_footer: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20"
                placeholder="Thank you for shopping with us! Returns accepted within 3 days with receipt."
              />
            </div>
          </div>
        </section>

        {/* Campaign Preferences */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Campaign Preferences</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1.5 w-full md:w-1/2">
              <label className="text-sm font-medium text-gray-700">Default Africa's Talking Sender ID</label>
              <input 
                type="text" 
                value={settings.default_sender_id || ''}
                onChange={e => setSettings({...settings, default_sender_id: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. MYSTORE (Leave blank for default shortcode)"
              />
              <p className="text-xs text-gray-500 mt-1">Requires an approved alphanumeric Sender ID on your Africa's Talking dashboard.</p>
            </div>
            
            <label className="flex items-center justify-between cursor-pointer pt-4 border-t border-gray-100">
              <div className="space-y-0.5 pr-4">
                <span className="text-sm font-medium text-gray-900">Automated SMS e-Receipts</span>
                <p className="text-xs text-gray-500">Automatically send an SMS receipt to the customer's phone number upon successful POS checkout.</p>
              </div>
              <div className="relative inline-flex items-center shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.auto_receipt_sms === 1}
                  onChange={e => setSettings({...settings, auto_receipt_sms: e.target.checked ? 1 : 0})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
            </label>
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
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText size={18} className="text-gray-600" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-gray-900">Product Inventory</span>
                  <p className="text-xs text-gray-500">Export your product catalog and stock levels</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleExportData('products')}
                title="Download Products CSV"
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText size={18} className="text-gray-600" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-gray-900">Customer List</span>
                  <p className="text-xs text-gray-500">Export your registered customers and loyalty points</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleExportData('customers')}
                title="Download Customers CSV"
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText size={18} className="text-gray-600" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-gray-900">Order History</span>
                  <p className="text-xs text-gray-500">Export all POS transaction records</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleExportData('orders')}
                title="Download Orders CSV"
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-100 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <h2 className="font-bold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 md:pr-10">
                <span className="text-sm font-bold text-red-900">Wipe POS Transactions</span>
                <p className="text-xs text-red-700 leading-relaxed">
                  Permanently delete all Orders, Order Items, and Stock Movements. 
                  <span className="block mt-1 font-semibold">Products and Customers will be kept. This action cannot be reversed.</span>
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowWipeModal(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Wipe Data
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

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {showWipeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Are you sure?</h2>
              <p className="text-gray-500 text-center mb-6 text-sm">
                This will permanently delete ALL historical order and transaction data from your application. Your products and customers will not be altered.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">WIPE DATA</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={wipeConfirmText}
                    onChange={e => setWipeConfirmText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                    placeholder="WIPE DATA"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setShowWipeModal(false);
                      setWipeConfirmText('');
                    }}
                    disabled={wiping}
                    className="flex-1 px-4 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleWipeData}
                    disabled={wipeConfirmText !== 'WIPE DATA' || wiping}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {wiping ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Nuke It'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Check Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Permission Required</h2>
              <p className="text-gray-500 text-center mb-6 text-sm">
                To change critical business information, please verify your account password.
              </p>
              
              <form onSubmit={handleUnlockProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verify Password
                  </label>
                  <input
                    type="password"
                    required
                    value={verifyPassword}
                    onChange={e => setVerifyPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUnlockModal(false);
                      setVerifyPassword('');
                    }}
                    disabled={verifying}
                    className="flex-1 px-4 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!verifyPassword || verifying}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {verifying ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Verify & Unlock'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
