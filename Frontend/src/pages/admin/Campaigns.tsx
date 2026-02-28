import { useState, useEffect } from 'react';
import { Plus, Send, MessageSquare, AlertCircle, CheckCircle2, Users, Users as UsersIcon, Edit3 } from 'lucide-react';
import { authFetch } from '../../utils/api';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [sendMethod, setSendMethod] = useState<'all'|'select'|'manual'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [manualNumbersInput, setManualNumbersInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success?: boolean, message?: string} | null>(null);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    channel: 'SMS'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, custRes] = await Promise.all([
        authFetch('/api/campaigns'),
        authFetch('/api/customers')
      ]);
      const [campData, custData] = await Promise.all([
        campRes.json(),
        custRes.json()
      ]);
      setCampaigns(campData);
      setCustomers(custData.data || []);
    } catch (error) {
      console.error("Failed to fetch campaign data:", error);
    }
  };

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

  const handleOpenSendModal = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowSendModal(true);
    setSendResult(null);
    setSendMethod('all');
    setSelectedCustomerIds([]);
    setManualNumbersInput('');
  };

  const handleSendCampaign = async () => {
    if (!selectedCampaign) return;
    
    setIsSending(true);
    setSendResult(null);
    
    // Parse manual numbers
    let manualNumbers: string[] = [];
    if (sendMethod === 'manual' || sendMethod === 'select') {
      manualNumbers = manualNumbersInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);
    }
    
    const payload = {
      segment: sendMethod === 'all' ? 'all' : undefined,
      customerIds: sendMethod === 'select' ? selectedCustomerIds : undefined,
      manualNumbers: manualNumbers.length > 0 ? manualNumbers : undefined
    };

    try {
      const res = await authFetch(`/api/campaigns/${selectedCampaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSendResult({ success: true, message: data.message || "Campaign sent successfully!" });
        fetchData(); // Refresh the list to show 'sent' status
      } else {
        setSendResult({ success: false, message: data.error || "Failed to send campaign." });
      }
    } catch (error) {
      setSendResult({ success: false, message: "Network error occurred." });
    } finally {
      setIsSending(false);
    }
  };

  const toggleCustomerSelection = (id: number) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
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
                <button 
                  onClick={() => handleOpenSendModal(campaign)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                >
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

      {/* Send Campaign Modal */}
      {showSendModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Send size={20} className="text-indigo-600" /> 
                Dispatch Campaign
              </h2>
            </div>
            
            {!sendResult ? (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl text-indigo-900 border border-indigo-100">
                  <p className="font-semibold">{selectedCampaign.name}</p>
                  <p className="text-sm mt-1 text-indigo-700 opacity-90 truncate">"{selectedCampaign.message}"</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Audience Selection</label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setSendMethod('all')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        sendMethod === 'all' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <UsersIcon size={24} />
                      <span className="text-xs">All Customers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMethod('select')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        sendMethod === 'select' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Users size={24} />
                      <span className="text-xs">Select DB</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMethod('manual')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        sendMethod === 'manual' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Edit3 size={24} />
                      <span className="text-xs">Manual Entry</span>
                    </button>
                  </div>

                  {sendMethod === 'all' && (
                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-800">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p>This will send the {selectedCampaign.channel} campaign to all {customers.length} registered customers in your database.</p>
                    </div>
                  )}

                  {sendMethod === 'select' && (
                    <div className="space-y-2">
                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Customers</p>
                       <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                         {customers.map(c => (
                           <label key={c.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={selectedCustomerIds.includes(c.id)}
                               onChange={() => toggleCustomerSelection(c.id)}
                               className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                             />
                             <div>
                               <p className="text-sm font-medium text-gray-900">{c.name}</p>
                               <p className="text-xs text-gray-500">{c.phone}</p>
                             </div>
                           </label>
                         ))}
                         {customers.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">No customers available.</div>}
                       </div>
                    </div>
                  )}

                  {(sendMethod === 'manual' || sendMethod === 'select') && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {sendMethod === 'select' ? "Plus Additional Numbers (Optional)" : "Enter Phone Numbers"}
                      </p>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="e.g. 08012345678, +2349012345678, 07080000000"
                        rows={3}
                        value={manualNumbersInput}
                        onChange={e => setManualNumbersInput(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple numbers with commas.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 p-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendCampaign}
                    disabled={
                      isSending || 
                      (sendMethod === 'select' && selectedCustomerIds.length === 0 && !manualNumbersInput.trim()) ||
                      (sendMethod === 'manual' && !manualNumbersInput.trim())
                    }
                    className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Dispatching...
                      </>
                    ) : (
                      <>Fire Campaign!</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                {sendResult.success ? (
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                  </div>
                )}
                <div>
                  <h3 className={`text-xl font-bold ${sendResult.success ? 'text-gray-900' : 'text-red-600'}`}>
                    {sendResult.success ? 'Success!' : 'Campaign Failed'}
                  </h3>
                  <p className="text-gray-600 mt-2">{sendResult.message}</p>
                </div>
                <button 
                  onClick={() => setShowSendModal(false)}
                  className="mt-6 px-6 py-2 bg-gray-100 font-medium text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
