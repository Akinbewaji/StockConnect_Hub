import { useState, useEffect } from 'react';
import { Plus, Send, MessageSquare } from 'lucide-react';
import { authFetch } from '../../utils/api';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    channel: 'SMS'
  });

  useEffect(() => {
    authFetch('/api/campaigns')
      .then(res => res.json())
      .then(setCampaigns);
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign)
    });
    setShowCreateModal(false);
    const res = await authFetch('/api/campaigns');
    setCampaigns(await res.json());
    setNewCampaign({ name: '', message: '', channel: 'SMS' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white p-2 rounded-full shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  campaign.channel === 'SMS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {campaign.channel}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                campaign.status === 'sent' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-50 text-yellow-600'
              }`}>
                {campaign.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              "{campaign.message}"
            </p>
            <div className="mt-3 flex justify-end">
              {campaign.status === 'draft' && (
                <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  <Send size={16} />
                  Send Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Create Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCampaign({...newCampaign, channel: 'SMS'})}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                      newCampaign.channel === 'SMS' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <MessageSquare size={18} /> SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCampaign({...newCampaign, channel: 'WHATSAPP'})}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                      newCampaign.channel === 'WHATSAPP' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <MessageSquare size={18} /> WhatsApp
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                  value={newCampaign.message}
                  onChange={e => setNewCampaign({...newCampaign, message: e.target.value})}
                  required
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 p-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
