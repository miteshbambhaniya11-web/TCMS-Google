'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck } from '@/db/localDb';
import dynamic from 'next/dynamic';
import { MapPin, Search, ShieldAlert, Sparkles, Navigation, CheckCircle2, CircleDot } from 'lucide-react';

// Dynamic import of Leaflet map to prevent SSR crashes in Next.js
const GpsMap = dynamic(() => import('@/components/GpsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 font-semibold space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-tenant border-t-transparent" />
      <p className="text-xs">Loading OpenStreetMap Canvas...</p>
    </div>
  )
});

import FeatureLocked from '@/components/FeatureLocked';

export default function GpsPage() {
  const { activeTenant } = useTenant();

  // DB datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFeed, setAlertFeed] = useState<string[]>([]);

  const loadData = () => {
    if (activeTenant) {
      const activeTripsList = localDb.getTrips(activeTenant.id)
        .filter(t => !['Completed', 'Cancelled'].includes(t.status));
      setTrips(activeTripsList);
      setTrucks(localDb.getTrucks(activeTenant.id));

      if (activeTripsList.length > 0 && !selectedTrip) {
        setSelectedTrip(activeTripsList[0]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleGeofenceTrigger = (tripId: string, nextStatus: string) => {
    if (!activeTenant) return;
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    localDb.updateTrip(activeTenant.id, tripId, {
      status: nextStatus,
    });
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAlertFeed(prev => [
      `[${time}] Vehicle ${trucks.find(t => t.id === trip.truckId)?.truckNumber || 'N/A'} entered Ahmedabad Destination Geofence! Auto-updated trip status to "Reached Destination".`,
      ...prev
    ]);

    loadData();
    setSelectedTrip(null);
  };

  const filteredTrips = trips.filter(t => {
    const truckNo = trucks.find(tr => tr.id === t.truckId)?.truckNumber || '';
    return (
      t.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truckNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.material.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const isGpsEnabled = activeTenant?.subscription?.features?.gpsTracking !== false;

  if (activeTenant && !isGpsEnabled) {
    return (
      <FeatureLocked
        featureName="GPS Live Tracking & Maps"
        featureDescription="Track your fleet in real time, configure geofences, and manage route deviations automatically."
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Live GPS Fleet Tracking</h2>
          <p className="text-xs text-slate-400">Track active trucks in real time, review route deviation exceptions, and define custom geofences.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search active truck number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>
        </div>
      </div>

      {/* Main Map Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Trip list and geofence events feed */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[550px]">
          
          {/* Active list card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 font-bold text-slate-300 text-xs uppercase flex justify-between items-center">
              <span>Active GPS Slips</span>
              <span className="bg-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {filteredTrips.filter(t => t.currentLat && t.currentLng).length} Online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredTrips.filter(t => t.currentLat && t.currentLng).map(trip => {
                const tr = trucks.find(t => t.id === trip.truckId);
                const isSelected = selectedTrip?.id === trip.id;
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-4 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs font-semibold ${
                      isSelected ? 'bg-slate-800/50 border-l-4 border-tenant' : ''
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-extrabold font-mono">{trip.tripNumber}</span>
                        {trip.routeDeviationAlert && (
                          <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] px-1.5 py-0.5 rounded font-bold animate-pulse">ROUTE DEV</span>
                        )}
                      </div>
                      <p className="text-slate-300 font-bold">{tr?.truckNumber}</p>
                      <p className="text-slate-500 text-[10px] truncate">{trip.pickup} → {trip.destination}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-bold font-mono block">{(trip.currentSpeed || 50)} km/h</span>
                      <span className="text-[9px] text-slate-500 uppercase">{trip.status}</span>
                    </div>
                  </div>
                );
              })}

              {filteredTrips.filter(t => t.currentLat && t.currentLng).length === 0 && (
                <p className="text-slate-500 text-xs text-center p-8 italic font-semibold">No active vehicles transmitting GPS signals currently.</p>
              )}
            </div>
          </div>

          {/* Alert Feed Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl h-[200px] flex flex-col overflow-hidden text-xs">
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 font-bold text-slate-300 uppercase flex items-center gap-1">
              <Navigation size={14} className="text-rose-500" /> Geofence Log Feed
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[10px] text-slate-400 scrollbar-thin">
              {alertFeed.map((alert, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-850 flex gap-2 items-start">
                  <CircleDot size={12} className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="leading-relaxed">{alert}</p>
                </div>
              ))}

              {alertFeed.length === 0 && (
                <p className="text-slate-600 italic text-center p-4">No geofencing enter/exit logs registered yet. Trigger a geofence on map popup to test.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Map Canvas */}
        <div className="lg:col-span-8 h-[550px] relative">
          <GpsMap 
            activeTrip={selectedTrip} 
            tripsList={filteredTrips} 
            onGeofenceTrigger={handleGeofenceTrigger}
          />
        </div>

      </div>

    </div>
  );
}
