'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Route } from '@/db/localDb';
import { MapPin, Search, Plus, Map, Clock, Fuel, Coins, X } from 'lucide-react';

export default function RoutesPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Route Form State
  const [newRoute, setNewRoute] = useState<Partial<Route>>({
    name: '',
    pickup: '',
    destination: '',
    distanceKm: 100,
    durationHours: 4,
    expectedFuel: 30,
    standardRate: 500,
    tollCharges: 300,
  });

  const loadData = () => {
    if (activeTenant) {
      setRoutes(localDb.getRoutes(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newRoute.name || !newRoute.pickup || !newRoute.destination) {
      alert('Please fill out Route Name, Pickup, and Destination locations.');
      return;
    }

    const created: Route = {
      id: `route-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newRoute.name,
      pickup: newRoute.pickup,
      destination: newRoute.destination,
      distanceKm: Number(newRoute.distanceKm),
      durationHours: Number(newRoute.durationHours),
      expectedFuel: Number(newRoute.expectedFuel),
      standardRate: Number(newRoute.standardRate),
      tollCharges: Number(newRoute.tollCharges),
    };

    const current = localDb.getRoutes(activeTenant.id);
    localDb.saveRoutes([...current, created]);
    loadData();
    setShowAddModal(false);

    // Reset Form
    setNewRoute({
      name: '',
      pickup: '',
      destination: '',
      distanceKm: 100,
      durationHours: 4,
      expectedFuel: 30,
      standardRate: 500,
      tollCharges: 300,
    });
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Route Master Catalog</h2>
          <p className="text-xs text-slate-400">Establish travel distances, standard diesel usages, expected tolls, and standard shipping rates.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search route name, pickup..."
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
              <Plus size={16} /> Add Route
            </button>
          )}
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map(route => (
          <div key={route.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 hover:border-tenant/60 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Map size={18} className="text-tenant shrink-0" />
                <h3 className="font-extrabold text-white text-xs truncate">{route.name}</h3>
              </div>

              <div className="text-xs space-y-1 font-semibold text-slate-400">
                <p><span className="text-slate-500 font-bold block text-[9px] uppercase">Loading Point</span>{route.pickup}</p>
                <p className="pt-1.5"><span className="text-slate-500 font-bold block text-[9px] uppercase">Discharging Point</span>{route.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] bg-slate-950/60 p-3 rounded-lg border border-slate-850 font-semibold font-mono text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-sky-500" />
                <span>{route.durationHours} hrs | {route.distanceKm} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel size={12} className="text-emerald-500" />
                <span>{route.expectedFuel} Litres expected</span>
              </div>
              <div className="flex items-center gap-1 col-span-2 border-t border-slate-850 pt-2 mt-1">
                <Coins size={12} className="text-amber-500" />
                <span>₹{route.standardRate}/Ton | Est Tolls: ₹{route.tollCharges}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 col-span-3 italic font-semibold">
            No routes listed matching search criteria.
          </div>
        )}
      </div>

      {/* ADD ROUTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <MapPin size={18} className="text-tenant" /> Add Route Standard
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Route Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mundra to Ahmedabad GIDC"
                  value={newRoute.name}
                  onChange={e => setNewRoute({...newRoute, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Pickup Location (Loading)</label>
                  <input
                    type="text"
                    required
                    placeholder="Mundra Port"
                    value={newRoute.pickup}
                    onChange={e => setNewRoute({...newRoute, pickup: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Destination (Discharging)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmedabad GIDC"
                    value={newRoute.destination}
                    onChange={e => setNewRoute({...newRoute, destination: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Distance (km)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoute.distanceKm}
                    onChange={e => setNewRoute({...newRoute, distanceKm: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Duration (hrs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoute.durationHours}
                    onChange={e => setNewRoute({...newRoute, durationHours: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Expected Fuel (L)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoute.expectedFuel}
                    onChange={e => setNewRoute({...newRoute, expectedFuel: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Standard Rate / Ton (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoute.standardRate}
                    onChange={e => setNewRoute({...newRoute, standardRate: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Expected Tolls (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newRoute.tollCharges}
                    onChange={e => setNewRoute({...newRoute, tollCharges: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 text-white font-bold py-2 rounded transition-colors"
                  style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
