import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowUpCircle, ArrowDownCircle, Banknote, Plus, 
  Search, Filter, Trash2, Calendar, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authFetch } from '../../utils/api';
import socket from '../../utils/socket';
import { RefreshCw } from 'lucide-react';

interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
}

interface CashFlowDay {
  date: string;
  name: string;
  inflow: number;
  outflow: number;
  net: number;
}

export default function CashFlow() {
  const [data, setData] = useState<{ history: CashFlowDay[], summary: CashFlowSummary } | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [analyticsRes, expensesRes] = await Promise.all([
        authFetch('/api/analytics/cash-flow'),
        authFetch('/api/expenses')
      ]);
      
      const analyticsData = await analyticsRes.json();
      const expensesData = await expensesRes.json();
      
      setData(analyticsData);
      setExpenses(expensesData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch cash flow data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on("sale_completed", () => {
      fetchData();
    });

    return () => {
      socket.off("sale_completed");
    };
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewExpense({
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="text-indigo-600" size={40} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Banknote className="text-indigo-600" size={32} />
            Cash Flow Report
          </h1>
          <p className="text-slate-500 mt-1">Monitor your business liquidity and expenditures</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <ArrowUpCircle size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500">Total Inflow (30d)</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">₦{data.summary.totalInflow.toLocaleString()}</p>
          <div className="mt-2 text-xs text-green-600 font-medium">Money coming into the business</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <ArrowDownCircle size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500">Total Outflow (30d)</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">₦{data.summary.totalOutflow.toLocaleString()}</p>
          <div className="mt-2 text-xs text-red-600 font-medium">Expenses and purchases</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-8 ${data.summary.netCashFlow >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${data.summary.netCashFlow >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <Banknote size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500">Net Cash Flow (30d)</span>
          </div>
          <p className={`text-3xl font-bold ${data.summary.netCashFlow >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            ₦{data.summary.netCashFlow.toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Net liquidity change</div>
        </motion.div>
      </div>

      {/* Main Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600" />
            Cash Flow Trends
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Inflow</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Outflow</span>
             </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(val) => `₦${val.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stroke="#4F46E5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInflow)" 
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stroke="#F59E0B" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOutflow)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Expenses List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-slate-500" />
            Recent Expenses
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No expenses recorded yet</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{new Date(expense.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{expense.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-slate-900">₦{Number(expense.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Record Expense</h2>
                  <p className="text-slate-500 text-sm mt-1">Add details about your expenditure</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50">
                  <RefreshCw className="rotate-45" size={20} />
                </button>
              </div>
              <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Amount (₦)</label>
                    <input 
                      required
                      type="number" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="e.g. 5000"
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                    <input 
                      required
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                  <select 
                    required
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all font-medium appearance-none"
                  >
                    <option value="">Select Category</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description (Optional)</label>
                  <textarea 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Briefly describe what this was for..."
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all font-medium resize-none"
                    rows={3}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Save Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
