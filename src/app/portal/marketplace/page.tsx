'use client';

import React, { useState } from 'react';
import { useTenant } from '@/context/tenantContext';
import { Truck, Sparkles, Plus, Scale, MapPin, Send, HelpCircle, BadgeCheck, AlertCircle, X } from 'lucide-react';

export default function MarketplacePage() {
  const { activeTenant } = useTenant();

  // Mock Marketplace boards
  const [loads, setLoads] = useState([
    { id: 1, origin: 'Mundra Salt Pans', dest: 'Ahmedabad Chemical Works', wt: '45 Tons', rate: '₹1,200/Ton', matches: '98% AI Match', truckType: 'Taurus' },
    { id: 2, origin: 'Morbi Ceramic GIDC', dest: 'Kandla Port Wharf 5', wt: '120 Tons', rate: '₹680/Ton', matches: '91% AI Match', truckType: 'Trailer' }
  ]);

  const [trucks, setTrucks] = useState([
    { id: 1, contractor: 'Balaji Roadlines', vehicle: 'GJ-12-CZ-9876', location: 'Morbi bypass', status: 'Idle', matchRate: '94% Match' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  
  // Post load form
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [weight, setWeight] = useState('25 Tons');
  const [rate, setRate] = useState('₹800/Ton');

  const handlePostLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !dest) return;

    setLoads(prev => [
      {
        id: Date.now(),
        origin,
        dest,
        wt: weight,
        rate,
        matches: 'Calculating AI matches...',
        truckType: 'Taurus'
      },
      ...prev
    ]);

    setShowAddModal(false);
    setOrigin('');
    setDest('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="bg-teal-500/10 text-teal-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Phase 2 Preview</span>
            <Sparkles size={14} className="text-teal-400 animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold text-white">AI Transport Marketplace</h2>
          <p className="text-xs text-slate-400">Post load assignments, view available third-party trucks, and match them using smart AI matching grids.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-lg"
        >
          <Plus size={16} /> Post Load requirement
        </button>
      </div>

      {/* Grid boards split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
        
        {/* Load postings board */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col h-[450px]">
          <h3 className="text-sm font-bold text-white border-b border-slate-850 pb-2">
            Load Postings Board
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
            {loads.map(load => (
              <div key={load.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-500" />
                    <span className="text-white font-bold">{load.origin} → {load.dest}</span>
                  </div>
                  <p className="text-slate-400 font-semibold text-[10px]">{load.wt} | Target: {load.rate} ({load.truckType})</p>
                </div>

                <div className="text-right">
                  <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded text-[10px] font-bold block">
                    {load.matches}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Hired trucks board */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col h-[450px]">
          <h3 className="text-sm font-bold text-white border-b border-slate-850 pb-2">
            Contractor Truck Availabilities
          </h3>

          <div className="flex-grow overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
            {trucks.map(tr => (
              <div key={tr.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Truck size={14} className="text-tenant" />
                    <span className="text-white font-bold">{tr.vehicle} ({tr.contractor})</span>
                  </div>
                  <p className="text-slate-500 font-semibold text-[10px]">Location: {tr.location} | Status: {tr.status}</p>
                </div>

                <div className="text-right">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold block">
                    {tr.matchRate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* POST LOAD REQUIREMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Sparkles size={18} className="text-teal-400" /> Post Load Requirement
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostLoad} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Origin (Loading Point)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mundra Salt Pans"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold focus:border-tenant"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Destination (Discharging Point)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmedabad Sanand GIDC"
                  value={dest}
                  onChange={e => setDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold focus:border-tenant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Estimated Cargo Weight</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Freight Target Rate (₹/Ton)</label>
                  <input
                    type="text"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded transition-all shadow-md mt-2"
              >
                Post requirement
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
