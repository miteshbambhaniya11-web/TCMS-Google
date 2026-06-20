'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, FuelLog, Trip, Truck, Route } from '@/db/localDb';
import { 
  Fuel, Search, Plus, ShieldAlert, BarChart3, TrendingUp, 
  AlertCircle, CheckCircle, RefreshCw, X, HelpCircle 
} from 'lucide-react';

export default function FuelPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Fuel Slip state
  const [newFuel, setNewFuel] = useState<Partial<FuelLog>>({
    tripId: '',
    actualFuel: 100,
    refuelLocation: 'HP Pump Mundra',
    slipNumber: '',
  });

  const loadData = () => {
    if (activeTenant) {
      setFuelLogs(localDb.getFuelLogs(activeTenant.id));
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setRoutes(localDb.getRoutes(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateFuelLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newFuel.tripId || !newFuel.slipNumber || !newFuel.actualFuel) {
      alert('Please fill out Trip, Slip Number, and Actual Fuel quantity.');
      return;
    }

    const trip = trips.find(t => t.id === newFuel.tripId);
    const route = routes.find(r => r.id === trip?.routeId);
    const expected = route?.expectedFuel || 100;
    const actual = Number(newFuel.actualFuel);
    const variance = actual - expected;

    // Trigger theft warning if actual exceeds expected by threshold %
    const thresholdPercent = activeTenant.aiSettings.fuelVariancePercent || 8;
    const thresholdLitres = expected * (thresholdPercent / 100);
    const hasTheftAlert = variance > thresholdLitres;

    const created: FuelLog = {
      id: `fl-${Date.now()}`,
      tripId: newFuel.tripId,
      routeId: trip?.routeId || '',
      truckId: trip?.truckId || '',
      expectedFuel: expected,
      actualFuel: actual,
      variance: Number(variance.toFixed(1)),
      refuelLocation: newFuel.refuelLocation || 'Highway Pump',
      slipNumber: newFuel.slipNumber.toUpperCase(),
      date: new Date().toISOString(),
      hasTheftAlert,
    };

    const current = localDb.get<FuelLog>('fuel_logs', []);
    current.unshift(created);
    localDb.saveFuelLogs(current);

    // Auto create activity log
    localDb.addLog(activeTenant.id, 'user-3', 'Naresh Kumar Operator', 'Log Fuel', `Added fuel slip ${created.slipNumber} for trip ${trip?.tripNumber}. Variance: ${created.variance}L.`);
    
    loadData();
    setShowAddModal(false);

    // Reset Form
    setNewFuel({
      tripId: '',
      actualFuel: 100,
      refuelLocation: 'HP Pump Mundra',
      slipNumber: '',
    });
  };

  // Metrics
  const totalLogs = fuelLogs.length;
  const theftAlertsCount = fuelLogs.filter(f => f.hasTheftAlert).length;
  const avgVariance = totalLogs > 0 
    ? (fuelLogs.reduce((acc, curr) => acc + curr.variance, 0) / totalLogs).toFixed(1) 
    : '0.0';

  const filteredLogs = fuelLogs.filter(f => {
    const tripNo = trips.find(t => t.id === f.tripId)?.tripNumber || '';
    const truckNo = trucks.find(t => t.id === f.truckId)?.truckNumber || '';
    const routeName = routes.find(r => r.id === f.routeId)?.name || '';
    return (
      tripNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truckNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.slipNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Fuel Performance Analytics</h2>
          <p className="text-xs text-slate-400">Monitor expected vs actual diesel burns, variance leakages, and track fuel receipts.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search trip, truck, slip..."
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
              <Plus size={16} /> Log Fuel Card
            </button>
          )}
        </div>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Average Fuel Variance</span>
            <span className="text-2xl font-extrabold text-white block">{avgVariance} Litres</span>
          </div>
          <TrendingUp size={24} className="text-sky-500/50" />
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Leakage Exceptions</span>
            <span className="text-2xl font-extrabold text-white block">{theftAlertsCount} Warnings</span>
          </div>
          <AlertCircle size={24} className="text-rose-500/50" />
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Fuel Slips Registered</span>
            <span className="text-2xl font-extrabold text-white block">{totalLogs} Receipts</span>
          </div>
          <Fuel size={24} className="text-emerald-500/50" />
        </div>
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                <th className="p-4">Slip Number</th>
                <th className="p-4">Trip Code</th>
                <th className="p-4">Truck Number</th>
                <th className="p-4">Standard Route</th>
                <th className="p-4">Expected Fuel</th>
                <th className="p-4">Actual Fuel</th>
                <th className="p-4">Variance</th>
                <th className="p-4">Refuel Station</th>
                <th className="p-4">Theft Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {filteredLogs.map(log => {
                const trip = trips.find(t => t.id === log.tripId);
                const truck = trucks.find(t => t.id === log.truckId);
                const route = routes.find(r => r.id === log.routeId);
                return (
                  <tr key={log.id} className="hover:bg-slate-850/20">
                    <td className="p-4 text-white font-bold font-mono">{log.slipNumber}</td>
                    <td className="p-4 font-mono">{trip?.tripNumber || 'Ad-hoc'}</td>
                    <td className="p-4 font-bold">{truck?.truckNumber}</td>
                    <td className="p-4 truncate max-w-40">{route?.name}</td>
                    <td className="p-4 font-mono">{log.expectedFuel} L</td>
                    <td className="p-4 font-mono">{log.actualFuel} L</td>
                    <td className={`p-4 font-mono ${log.variance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {log.variance > 0 ? `+${log.variance}` : log.variance} L
                    </td>
                    <td className="p-4">{log.refuelLocation}</td>
                    <td className="p-4">
                      {log.hasTheftAlert ? (
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-2.5 py-0.5 rounded font-bold animate-pulse">
                          THEFT EXCEPTION
                        </span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic font-semibold">
                    No fuel transactions recorded for this tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG FUEL SLIP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Fuel size={18} className="text-tenant" /> Record Fuel Card Slip
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFuelLog} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Link to Trip Assignment</label>
                <select
                  required
                  value={newFuel.tripId}
                  onChange={e => setNewFuel({...newFuel, tripId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="">Choose trip</option>
                  {trips.filter(t => !['Completed', 'Cancelled'].includes(t.status)).map(t => (
                    <option key={t.id} value={t.id}>{t.tripNumber} ({trucks.find(tr => tr.id === t.truckId)?.truckNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Actual Fuel Fills (L)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newFuel.actualFuel}
                    onChange={e => setNewFuel({...newFuel, actualFuel: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Fuel Slip Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FSLIP-89012"
                    value={newFuel.slipNumber}
                    onChange={e => setNewFuel({...newFuel, slipNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Refuel Pump / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP Pump Samakhiali Bypass"
                  value={newFuel.refuelLocation}
                  onChange={e => setNewFuel({...newFuel, refuelLocation: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold focus:border-tenant"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-500 space-y-1">
                <p className="text-slate-400 font-bold uppercase">Theft warning indicator:</p>
                <p>If the actual quantity logged is higher than the standard route expected burn by more than <strong>{activeTenant?.aiSettings.fuelVariancePercent}%</strong>, an AI exception alert will glow red across dashboards.</p>
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md mt-2"
                style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
              >
                Log Slip & Verify Variance
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
