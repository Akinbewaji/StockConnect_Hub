import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { CreditCard, Wallet, Plus, ShieldCheck, History, ArrowUpRight, ArrowDownLeft, MoreVertical, Landmark, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BillingDetails() {
  const [transactions] = useState([
    { id: 1, type: 'payment', amount: 154000, date: '2024-03-15', status: 'completed', recipient: 'Concrete Logistics Ltd' },
    { id: 2, type: 'refund', amount: 12000, date: '2024-03-10', status: 'completed', recipient: 'StockConnect System' },
    { id: 3, type: 'payment', amount: 45000, date: '2024-03-05', status: 'pending', recipient: 'Elite Electricals' },
  ]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 relative overflow-hidden">
      <SEO title="Billing & Wallet" description="Manage your payment methods and track your procurement spending." />
      <Navbar />

      {/* Hero Header */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-indigo-600">Billing Core</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Billing & Finance</h1>
          <p className="text-slate-500 mt-2 text-lg">Securely manage your capital and procurement transmissions.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Wallet Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-linear-to-br from-slate-900 to-slate-800 rounded-5xl p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-16">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Nexus Wallet Balance</h2>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black font-outfit">₦2,450,000</span>
                       <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                         <ArrowUpRight size={14} /> +12.5%
                       </span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                    <Wallet size={32} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30 active:scale-95">
                    <Plus size={20} /> Add Liquidity
                  </button>
                  <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl font-bold transition-all active:scale-95">
                    Withdraw Funds
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Transaction History */}
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black text-slate-900 font-outfit flex items-center gap-3">
                  Transmission History
                  <History size={24} className="text-indigo-400" />
                </h3>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All Data</button>
              </div>

              <div className="bg-white rounded-5xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient / Service</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Log</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'payment' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {tx.type === 'payment' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                              </div>
                              <span className="font-bold text-slate-900">{tx.recipient}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-medium text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-8 py-6">
                            <span className="text-lg font-black text-slate-900">₦{tx.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                               tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                               {tx.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Payment Methods */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-5xl p-8 border border-slate-100 shadow-xl shadow-slate-200/20"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 font-outfit">Stored Cards</h3>
                <Plus size={20} className="text-indigo-600 cursor-pointer" />
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group cursor-pointer">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="flex justify-between items-start mb-6">
                    <CreditCard size={24} className="text-indigo-400" />
                    <MoreVertical size={16} className="text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">StockConnect Visa</p>
                  <p className="text-lg font-bold tracking-widest font-mono">**** 4242</p>
                </div>

                <div className="p-6 bg-white border border-slate-100 rounded-3xl text-slate-900 flex items-center justify-between hover:border-indigo-100 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Landmark size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">Linked Bank</p>
                        <p className="font-bold">GTCO Protocol</p>
                     </div>
                  </div>
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
              </div>

              <button className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">
                Manage Secure Enclaves
              </button>
            </motion.div>

            {/* Security Alert */}
            <div className="p-8 bg-indigo-50 rounded-5xl border border-indigo-100 flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100 mb-6">
                  <Zap size={28} className="fill-indigo-600" />
               </div>
               <h4 className="text-lg font-black text-slate-900 font-outfit mb-2">Automated Payments</h4>
               <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                  Initialize smart billing cycles to never miss a material procurement Window.
               </p>
               <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">
                  Configure Now
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
