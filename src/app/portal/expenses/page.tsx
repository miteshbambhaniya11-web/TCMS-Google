'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, VehicleExpense, Truck } from '@/db/localDb';
import { 
  FileSpreadsheet, Search, Plus, Wrench, Coins, 
  TrendingUp, BarChart3, PieChart as PieChartIcon, 
  Settings, X, HelpCircle 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ExpensesPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Expense state
  const [newExp, setNewExp] = useState<Partial<VehicleExpense>>({
    truckId: '',
    category: 'Repairs',
    amount: 1500,
    description: '',
  });

  const loadData = () => {
    if (activeTenant) {
      setExpenses(localDb.getVehicleExpenses(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newExp.truckId || !newExp.amount || !newExp.description) {
      alert('Please fill out Truck, Amount, and Description.');
      return;
    }

    const created: VehicleExpense = {
      id: `ve-${Date.now()}`,
      truckId: newExp.truckId,
      category: newExp.category as any,
      amount: Number(newExp.amount),
      date: new Date().toISOString().split('T')[0],
      description: newExp.description,
    };

    const current = localDb.get<VehicleExpense>('vehicle_expenses', []);
    current.unshift(created);
    localDb.saveVehicleExpenses(current);

    loadData();
    setShowAddModal(false);

    // Reset Form
    setNewExp({
      truckId: '',
      category: 'Repairs',
      amount: 1500,
      description: '',
    });
  };

  // Metrics
  const totalSpends = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const avgExpense = expenses.length > 0 ? Math.round(totalSpends / expenses.length) : 0;

  // Chart data compile
  const categories = ['Service', 'Tyres', 'Repairs', 'Insurance', 'Permit', 'Driver Expense', 'Miscellaneous'];
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
  const chartData = categories.map(cat => {
    const sum = expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0);
    return { name: cat, value: sum };
  }).filter(item => item.value > 0);

  const filteredExpenses = expenses.filter(e => {
    const truckNo = trucks.find(t => t.id === e.truckId)?.truckNumber || '';
    return (
      truckNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Vehicle Expense Ledger</h2>
          <p className="text-xs text-slate-400">Record maintenance repairs, servicing, tyre swap bills, and analyze operational trends.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search truck, category, info..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>
          {activeRole !== 'Customer User' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-tenant hover:bg-tenant/90 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={16} /> Log Expense
            </button>
          )}
        </div>
      </div>

      {/* Split summary and chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Ledger stats and table */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Total Spends Turnover</span>
                <span className="text-2xl font-extrabold text-white block">₹{totalSpends.toLocaleString()}</span>
              </div>
              <Wrench size={22} className="text-tenant/50" />
            </div>

            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Avg Spends per Ticket</span>
                <span className="text-2xl font-extrabold text-white block">₹{avgExpense.toLocaleString()}</span>
              </div>
              <Coins size={22} className="text-emerald-500/50" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 font-bold text-slate-300 uppercase">
              Spends Statements
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="p-4">Billing Date</th>
                    <th className="p-4">Truck Number</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description Narrative</th>
                    <th className="p-4">Spends (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-850/20">
                      <td className="p-4 font-mono">{exp.date}</td>
                      <td className="p-4 font-bold">{trucks.find(t => t.id === exp.truckId)?.truckNumber}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-bold uppercase text-[9px] border border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">{exp.description}</td>
                      <td className="p-4 font-bold font-mono text-white">₹{exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 italic font-semibold">
                        No operational expenses logged for this tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Charts split */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-[450px]">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <PieChartIcon size={16} className="text-tenant" /> Expense Share distribution
          </h4>

          {chartData.length > 0 ? (
            <>
              <div className="flex-1 flex items-center justify-center text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} formatter={(val) => `₹${val}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-850 pt-3 text-[10px] text-slate-400 font-semibold max-h-40 overflow-y-auto">
                {chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-mono text-slate-200">₹{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 italic text-center p-8 flex-1 flex items-center justify-center">No categories to display. Log an expense to populate.</p>
          )}
        </div>

      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Wrench size={18} className="text-tenant" /> Log Maintenance Spends
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Vehicle</label>
                <select
                  required
                  value={newExp.truckId}
                  onChange={e => setNewExp({...newExp, truckId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="">Choose truck</option>
                  {trucks.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.truckNumber} ({tr.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Spends Category</label>
                  <select
                    value={newExp.category}
                    onChange={e => setNewExp({...newExp, category: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="Service">Scheduled Servicing</option>
                    <option value="Tyres">Tyres swap / Retread</option>
                    <option value="Repairs">Emergency Repairs</option>
                    <option value="Insurance">Insurance premium renewal</option>
                    <option value="Permit">National Permit fees</option>
                    <option value="Driver Expense">Driver pocket expense</option>
                    <option value="Miscellaneous">Miscellaneous billing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newExp.amount}
                    onChange={e => setNewExp({...newExp, amount: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Expense Narrative</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine oil replacement mobil 15w40..."
                  value={newExp.description}
                  onChange={e => setNewExp({...newExp, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold focus:border-tenant"
                />
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md mt-2"
                style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
              >
                Log Ticket Spends
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
