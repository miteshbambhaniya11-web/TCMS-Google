'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, Route, Contractor } from '@/db/localDb';
import { 
  Plus, Search, KanbanSquare, TableProperties, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Scale, Eye, 
  UserCheck, ShieldCheck, RefreshCw, UploadCloud, ChevronRight, X,
  MessageSquare
} from 'lucide-react';

export default function TripsPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  // Page layout toggles
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState<Trip | null>(null);
  const [showOcrModal, setShowOcrModal] = useState<Trip | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState('');

  // New Trip form state
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    contractorId: '',
    driverId: '',
    truckId: '',
    routeId: '',
    material: 'Refined Salt (Industrial)',
    quantity: 25,
    rate: 0,
    amount: 0,
    priority: 'Medium',
    notes: '',
  });

  // Weighbridge form state
  const [wbGross, setWbGross] = useState('');
  const [wbTare, setWbTare] = useState('');
  const [wbMoisture, setWbMoisture] = useState('2.0');
  const [wbQuality, setWbQuality] = useState('A Grade');

  // OCR Upload simulator state
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrDiscrepancy, setOcrDiscrepancy] = useState<boolean | null>(null);

  // Port Logistics states
  const [portContainer, setPortContainer] = useState('');
  const [portSeal, setPortSeal] = useState('');
  const [portGateIn, setPortGateIn] = useState('');
  const [portGateOut, setPortGateOut] = useState('');

  useEffect(() => {
    if (selectedTrip) {
      setPortContainer(selectedTrip.containerNumber || '');
      setPortSeal(selectedTrip.sealNumber || '');
      setPortGateIn(selectedTrip.gateIn ? selectedTrip.gateIn.substring(0, 16) : '');
      setPortGateOut(selectedTrip.gateOut ? selectedTrip.gateOut.substring(0, 16) : '');
    }
  }, [selectedTrip]);

  // Refresh lists helper
  const loadData = () => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setRoutes(localDb.getRoutes(activeTenant.id));
      setContractors(localDb.getContractors(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  // Update trip amount if route or quantity changes
  useEffect(() => {
    if (newTrip.routeId) {
      const selectedRoute = routes.find(r => r.id === newTrip.routeId);
      if (selectedRoute) {
        const rate = selectedRoute.standardRate;
        const qty = newTrip.quantity || 0;
        setNewTrip(prev => ({
          ...prev,
          rate,
          amount: qty * rate,
        }));
      }
    }
  }, [newTrip.routeId, newTrip.quantity, routes]);

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newTrip.driverId || !newTrip.truckId || !newTrip.routeId) {
      alert('Please fill out Driver, Truck, and Route fields.');
      return;
    }

    const route = routes.find(r => r.id === newTrip.routeId);
    
    localDb.addTrip(activeTenant.id, {
      contractorId: newTrip.contractorId || undefined,
      driverId: newTrip.driverId,
      truckId: newTrip.truckId,
      routeId: newTrip.routeId,
      pickup: route?.pickup || 'Pickup Point',
      destination: route?.destination || 'Destination Point',
      material: newTrip.material || 'Raw Salt',
      quantity: Number(newTrip.quantity),
      rate: Number(newTrip.rate),
      amount: Number(newTrip.amount),
      status: activeTenant.customWorkflow[0] || 'Pending',
      priority: newTrip.priority as any,
      notes: newTrip.notes,
      delayRisk: 'Low',
    });

    // Update truck and driver status to On Trip
    const activeTrucks = localDb.getTrucks(activeTenant.id);
    const tIdx = activeTrucks.findIndex(t => t.id === newTrip.truckId);
    if (tIdx !== -1) {
      activeTrucks[tIdx].status = 'On Trip';
      localDb.saveTrucks(activeTrucks);
    }

    const activeDrivers = localDb.getDrivers(activeTenant.id);
    const dIdx = activeDrivers.findIndex(d => d.id === newTrip.driverId);
    if (dIdx !== -1) {
      activeDrivers[dIdx].status = 'On Trip';
      localDb.saveDrivers(activeDrivers);
    }

    // Auto-create initial advances for the driver wallet
    const trList = localDb.getTrips(activeTenant.id);
    const createdTrip = trList[0]; // most recent
    
    const walletLogs = localDb.getWalletTransactions(newTrip.driverId);
    localDb.saveWalletTransactions([
      ...localDb.getWalletTransactions(newTrip.driverId),
      {
        id: `wt-${Date.now()}-1`,
        driverId: newTrip.driverId,
        tripId: createdTrip.id,
        type: 'Advance Diesel',
        amount: Math.round((route?.expectedFuel || 30) * 85), // standard diesel price estimation
        description: `Diesel card advance for trip ${createdTrip.tripNumber}`,
        date: new Date().toISOString(),
      },
      {
        id: `wt-${Date.now()}-2`,
        driverId: newTrip.driverId,
        tripId: createdTrip.id,
        type: 'Advance Cash',
        amount: 2000,
        description: `Cash advance for trip ${createdTrip.tripNumber}`,
        date: new Date().toISOString(),
      }
    ]);

    // Update driver wallet balance
    const updatedDrivers = localDb.getDrivers(activeTenant.id);
    const updDIdx = updatedDrivers.findIndex(d => d.id === newTrip.driverId);
    if (updDIdx !== -1) {
      updatedDrivers[updDIdx].walletBalance += 2000 + Math.round((route?.expectedFuel || 30) * 85);
      localDb.saveDrivers(updatedDrivers);
    }

    loadData();
    setShowAddModal(false);

    // Simulate WhatsApp Dispatch Automation Trigger using Configured Settings
    const matchedDriver = drivers.find(d => d.id === newTrip.driverId);
    if (matchedDriver) {
      setDispatchAlert(`WhatsApp Notification Triggered via ${activeTenant.whatsappSettings.provider} Gateway (+${activeTenant.whatsappSettings.number || '91XXXXXXXXXX'}): Sent Trip Assignment to ${matchedDriver.name} (+${matchedDriver.whatsappNumber}).`);
      setTimeout(() => setDispatchAlert(''), 6000);
    }
    
    // Reset form
    setNewTrip({
      contractorId: '',
      driverId: '',
      truckId: '',
      routeId: '',
      material: 'Refined Salt (Industrial)',
      quantity: 25,
      rate: 0,
      amount: 0,
      priority: 'Medium',
      notes: '',
    });
  };

  const handleUpdateStatus = (tripId: string, nextStatus: string) => {
    if (!activeTenant) return;
    localDb.updateTrip(activeTenant.id, tripId, { status: nextStatus });
    
    // If completed or cancelled, release driver & truck
    if (['Completed', 'Cancelled', 'Delivered'].includes(nextStatus)) {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        // Truck set available
        const trs = localDb.getTrucks(activeTenant.id);
        const tIdx = trs.findIndex(t => t.id === trip.truckId);
        if (tIdx !== -1) {
          trs[tIdx].status = 'Available';
          localDb.saveTrucks(trs);
        }
        
        // Driver set available
        const drs = localDb.getDrivers(activeTenant.id);
        const dIdx = drs.findIndex(d => d.id === trip.driverId);
        if (dIdx !== -1) {
          drs[dIdx].status = 'Active';
          localDb.saveDrivers(drs);
        }
      }
    }
    // Simulate WhatsApp Status Update Trigger using Configured Settings
    const trip = trips.find(t => t.id === tripId);
    const dr = drivers.find(d => d.id === trip?.driverId);
    if (trip && dr) {
      setDispatchAlert(`WhatsApp Notification Triggered via ${activeTenant.whatsappSettings.provider} Gateway: Sent status update to driver ${dr.name} (+${dr.whatsappNumber}): "Trip ${trip.tripNumber} is now ${nextStatus}"`);
      setTimeout(() => setDispatchAlert(''), 6000);
    }

    loadData();
    setSelectedTrip(null);
  };

  const handleSaveWeighbridge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !showWeighbridgeModal) return;

    const gross = Number(wbGross);
    const tare = Number(wbTare);
    const net = gross - tare;

    localDb.updateTrip(activeTenant.id, showWeighbridgeModal.id, {
      weighbridgeSlipNo: `WB-SLIP-${Math.floor(10000 + Math.random() * 90000)}`,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
      moisturePercent: Number(wbMoisture),
      qualityGrade: wbQuality,
      weighbridgeOperator: 'Mitesh Weighbridge Ops',
      weighbridgeDate: new Date().toISOString(),
      status: 'Loading', // Progress workflow automatically!
    });

    loadData();
    setShowWeighbridgeModal(null);
    setWbGross('');
    setWbTare('');
  };

  const startOcrSimulation = (hasDiscrepancy: boolean) => {
    setOcrScanning(true);
    setOcrProgress(0);
    setOcrDiscrepancy(hasDiscrepancy);

    const interval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setOcrScanning(false);
          
          // Complete verification
          if (activeTenant && showOcrModal) {
            localDb.updateTrip(activeTenant.id, showOcrModal.id, {
              podUploaded: true,
              podVerificationStatus: hasDiscrepancy ? 'Discrepancy' : 'Verified',
              podVerificationNotes: hasDiscrepancy 
                ? 'Discrepancy detected: POD Net weight is 24.1 Tons while weighbridge recorded 26.5 Tons.' 
                : 'Matched weight and signatures 100%. Verified.',
              status: 'Delivered', // Move to delivered status
            });
            loadData();
          }
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    const term = searchTerm.toLowerCase();
    const truck = trucks.find(tr => tr.id === t.truckId)?.truckNumber || '';
    const driver = drivers.find(d => d.id === t.driverId)?.name || '';
    const route = routes.find(r => r.id === t.routeId)?.name || '';
    return (
      t.tripNumber.toLowerCase().includes(term) ||
      truck.toLowerCase().includes(term) ||
      driver.toLowerCase().includes(term) ||
      route.toLowerCase().includes(term) ||
      t.material.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {dispatchAlert && (
        <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-pulse shrink-0">
          <MessageSquare size={16} className="text-teal-400" />
          <span>{dispatchAlert}</span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Trip Management Desk</h2>
          <p className="text-xs text-slate-400">Dispatch trucks, log weighbridge tickets, and track trip lifecycles.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search truck, driver, route..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>

          <div className="flex border border-slate-800 rounded-lg overflow-hidden shrink-0">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-tenant text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
            >
              <KanbanSquare size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-tenant text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
            >
              <TableProperties size={16} />
            </button>
          </div>

          {activeRole !== 'Customer User' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-tenant hover:bg-tenant/90 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-lg shadow-tenant/15"
            >
              <Plus size={16} /> Create Trip
            </button>
          )}
        </div>
      </div>

      {/* KANBAN BOARD */}
      {viewMode === 'kanban' && activeTenant && (
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex gap-4 min-w-[1200px] h-[550px] items-stretch">
            {activeTenant.customWorkflow.map(column => {
              const columnTrips = filteredTrips.filter(t => t.status === column);
              return (
                <div key={column} className="bg-slate-900/50 border border-slate-850 rounded-xl w-72 flex flex-col p-3 space-y-3 shrink-0">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-extrabold text-slate-200 tracking-wide uppercase">{column}</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {columnTrips.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {columnTrips.map(trip => {
                      const tr = trucks.find(t => t.id === trip.truckId);
                      const dr = drivers.find(d => d.id === trip.driverId);
                      return (
                        <div 
                          key={trip.id} 
                          className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg hover:border-tenant/60 transition-all cursor-pointer space-y-3 relative group"
                          onClick={() => setSelectedTrip(trip)}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-white font-extrabold text-xs tracking-mono">{trip.tripNumber}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              trip.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : trip.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {trip.priority}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 font-semibold text-slate-400">
                            <p className="text-slate-200 font-bold">{tr?.truckNumber}</p>
                            <p className="truncate">Driver: {dr?.name}</p>
                            <p className="truncate text-slate-500 text-[10px]">{trip.pickup} → {trip.destination}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[10px] text-slate-500 font-bold">
                            <span>{trip.quantity} Tons ({trip.material.split(' ')[0]})</span>
                            
                            <div className="flex items-center gap-1.5">
                              {trip.delayRisk === 'High' && (
                                <span className="bg-rose-500/10 text-rose-500 px-1 py-0.5 rounded text-[8px] animate-pulse">DELAY RISK</span>
                              )}
                              {trip.weighbridgeSlipNo ? (
                                <span title="Weighbridge Slip Recorded"><Scale size={12} className="text-emerald-500" /></span>
                              ) : (
                                <span title="Pending Weighbridge"><Scale size={12} className="text-slate-600" /></span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {columnTrips.length === 0 && (
                      <div className="border border-dashed border-slate-800/60 rounded-lg p-6 text-center text-slate-600 text-xs font-semibold">
                        Empty column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="p-4">Trip Number</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Material / Qty</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Weighbridge</th>
                  <th className="p-4">POD Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                {filteredTrips.map(trip => {
                  const tr = trucks.find(t => t.id === trip.truckId);
                  const dr = drivers.find(d => d.id === trip.driverId);
                  return (
                    <tr key={trip.id} className="hover:bg-slate-850/20">
                      <td className="p-4 text-white font-bold font-mono">{trip.tripNumber}</td>
                      <td className="p-4 font-bold">{tr?.truckNumber}</td>
                      <td className="p-4">{dr?.name}</td>
                      <td className="p-4">{trip.material} ({trip.quantity} Tons)</td>
                      <td className="p-4 truncate max-w-40">{trip.pickup} → {trip.destination}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                          {trip.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {trip.weighbridgeSlipNo ? (
                          <span className="text-emerald-400 font-mono">{trip.weighbridgeSlipNo} ({trip.netWeight}T)</span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </td>
                      <td className="p-4">
                        {trip.podVerificationStatus === 'Verified' ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Verified</span>
                        ) : trip.podVerificationStatus === 'Discrepancy' ? (
                          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded">Discrepancy</span>
                        ) : (
                          <span className="text-slate-500">Not Uploaded</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedTrip(trip)}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-2.5 py-1 rounded font-bold"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED TRIP MANAGER MODAL */}
      {selectedTrip && activeTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-xl w-full space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-slate-500 block font-bold text-[9px] uppercase">Trip Workspace</span>
                <h3 className="text-base font-extrabold text-white font-mono">{selectedTrip.tripNumber}</h3>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Truck & Driver</span>
                <p className="text-white font-bold">{trucks.find(t => t.id === selectedTrip.truckId)?.truckNumber}</p>
                <p className="text-slate-300">Driver: {drivers.find(d => d.id === selectedTrip.driverId)?.name}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Route & Rate</span>
                <p className="text-white truncate">{selectedTrip.pickup} → {selectedTrip.destination}</p>
                <p className="text-slate-300">Freight Total: ₹{selectedTrip.amount.toLocaleString()} (₹{selectedTrip.rate}/Ton)</p>
              </div>
            </div>

            {/* Weighbridge summary block */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <h4 className="text-xs font-extrabold text-white flex items-center justify-between">
                <span>Scale Weighbridge (Salt Module)</span>
                {!selectedTrip.weighbridgeSlipNo && activeRole !== 'Customer User' && (
                  activeTenant?.subscription?.features?.weighbridgeModule ? (
                    <button
                      onClick={() => {
                        setShowWeighbridgeModal(selectedTrip);
                        setSelectedTrip(null);
                      }}
                      className="text-tenant hover:underline flex items-center gap-0.5 text-[10px]"
                    >
                      Log Slip Weighing <ChevronRight size={12} />
                    </button>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5 text-[10px] cursor-not-allowed">
                      🔒 Weighbridge Slip (Locked)
                    </span>
                  )
                )}
              </h4>
              
              {selectedTrip.weighbridgeSlipNo ? (
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-400">
                  <div>
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Slip Number</span>
                    <span className="text-slate-300 font-semibold">{selectedTrip.weighbridgeSlipNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Net weight (T)</span>
                    <span className="text-emerald-400 font-bold">{selectedTrip.netWeight} Tons</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Moisture / Grade</span>
                    <span className="text-slate-300">{selectedTrip.moisturePercent}% ({selectedTrip.qualityGrade})</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-[10px] italic">No weighbridge ticket recorded yet for this load.</p>
              )}
            </div>

            {/* Port Logistics Section */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <h4 className="text-xs font-extrabold text-white flex items-center justify-between">
                <span>Port Logistics & Container Tracking</span>
                {selectedTrip.detentionCharges !== undefined && selectedTrip.detentionCharges > 0 && (
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[8px] font-bold uppercase animate-pulse">
                    Detention: ₹{selectedTrip.detentionCharges.toLocaleString()}
                  </span>
                )}
              </h4>
              
              {activeRole !== 'Customer User' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold uppercase mb-0.5">Container Number</label>
                      <input
                        type="text"
                        placeholder="e.g. MSKU992019"
                        value={portContainer}
                        onChange={e => setPortContainer(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold uppercase mb-0.5">Seal Number</label>
                      <input
                        type="text"
                        placeholder="e.g. SL77102"
                        value={portSeal}
                        onChange={e => setPortSeal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold uppercase mb-0.5">Gate In Time</label>
                      <input
                        type="datetime-local"
                        value={portGateIn}
                        onChange={e => setPortGateIn(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold uppercase mb-0.5">Gate Out Time</label>
                      <input
                        type="datetime-local"
                        value={portGateOut}
                        onChange={e => setPortGateOut(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="text-[9px] text-slate-500 leading-normal max-w-[70%]">
                      {portGateIn && portGateOut ? (
                        (() => {
                          const diffHours = (new Date(portGateOut).getTime() - new Date(portGateIn).getTime()) / (1000 * 60 * 60);
                          if (diffHours <= 0) return <span className="text-rose-400">Invalid: Gate Out before Gate In.</span>;
                          if (diffHours <= 48) return <span className="text-emerald-400">Time inside: {diffHours.toFixed(1)}h (Within 48h free-time)</span>;
                          const billableDays = Math.ceil((diffHours - 48) / 24);
                          return <span className="text-amber-400">Time: {diffHours.toFixed(1)}h (Exceeds free-time by {billableDays} day(s). Detention due: ₹{(billableDays * 2000).toLocaleString()})</span>;
                        })()
                      ) : (
                        <span>Specify Gate In/Out to calculate detention (48h free threshold).</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const detention = portGateIn && portGateOut ? (() => {
                          const tIn = new Date(portGateIn).getTime();
                          const tOut = new Date(portGateOut).getTime();
                          const diffHours = (tOut - tIn) / (1000 * 60 * 60);
                          if (diffHours <= 48) return 0;
                          return Math.ceil((diffHours - 48) / 24) * 2000;
                        })() : 0;

                        const updated = localDb.updateTrip(activeTenant.id, selectedTrip.id, {
                          containerNumber: portContainer || undefined,
                          sealNumber: portSeal || undefined,
                          gateIn: portGateIn ? new Date(portGateIn).toISOString() : undefined,
                          gateOut: portGateOut ? new Date(portGateOut).toISOString() : undefined,
                          detentionCharges: detention
                        });
                        if (updated) {
                          setSelectedTrip(updated);
                          loadData();
                          alert("Port Logistics details saved!");
                        }
                      }}
                      className="bg-tenant hover:bg-tenant/95 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                    >
                      Save Port Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Container / Seal</span>
                    <span>{selectedTrip.containerNumber || 'N/A'} / {selectedTrip.sealNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Detention charges</span>
                    <span className={selectedTrip.detentionCharges ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      ₹{selectedTrip.detentionCharges?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* POD upload simulation */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <h4 className="text-xs font-extrabold text-white flex items-center justify-between">
                <span>Proof of Delivery (POD)</span>
                {!selectedTrip.podUploaded && activeRole !== 'Customer User' && (
                  <button
                    onClick={() => {
                      setShowOcrModal(selectedTrip);
                      setSelectedTrip(null);
                    }}
                    className="text-tenant hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    Scan & Verify POD <ChevronRight size={12} />
                  </button>
                )}
              </h4>

              {selectedTrip.podUploaded ? (
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <div>
                    <p className="text-slate-300">File: signed_challan_scan.png</p>
                    <p className="text-slate-400">OCR Notes: {selectedTrip.podVerificationNotes}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    selectedTrip.podVerificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {selectedTrip.podVerificationStatus}
                  </span>
                </div>
              ) : (
                <p className="text-slate-500 text-[10px] italic">Proof of Delivery document is pending upload.</p>
              )}
            </div>

            {/* Workflow state adjustment buttons */}
            {activeRole !== 'Customer User' && (
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <span className="text-slate-500 block font-bold text-[9px] uppercase">Advance Workflow State</span>
                <div className="flex flex-wrap gap-2">
                  {activeTenant.customWorkflow.map(step => {
                    const isCurrent = selectedTrip.status === step;
                    return (
                      <button
                        key={step}
                        disabled={isCurrent}
                        onClick={() => handleUpdateStatus(selectedTrip.id, step)}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                          isCurrent 
                            ? 'bg-tenant/10 text-tenant border-tenant/30 cursor-not-allowed' 
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                        }`}
                      >
                        {step}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TRIP DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Calendar size={18} className="text-tenant" /> Dispatch New Trip
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Contractor (Broker/Supplier)</label>
                <select
                  value={newTrip.contractorId}
                  onChange={e => setNewTrip({...newTrip, contractorId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="">No contractor (Self Fleet)</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Select Route Standard</label>
                  <select
                    required
                    value={newTrip.routeId}
                    onChange={e => setNewTrip({...newTrip, routeId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Choose route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Loading Material</label>
                  <input
                    type="text"
                    required
                    value={newTrip.material}
                    onChange={e => setNewTrip({...newTrip, material: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Assign Truck</label>
                  <select
                    required
                    value={newTrip.truckId}
                    onChange={e => setNewTrip({...newTrip, truckId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Choose available vehicle</option>
                    {trucks.filter(t => t.status === 'Available').map(t => (
                      <option key={t.id} value={t.id}>{t.truckNumber} ({t.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Assign Driver</label>
                  <select
                    required
                    value={newTrip.driverId}
                    onChange={e => setNewTrip({...newTrip, driverId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Choose driver</option>
                    {drivers.filter(d => d.status === 'Active').map(d => (
                      <option key={d.id} value={d.id}>{d.name} (Wallet: ₹{d.walletBalance})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Quantity (Tons)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newTrip.quantity}
                    onChange={e => setNewTrip({...newTrip, quantity: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Rate / Ton (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={newTrip.rate}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-slate-500 font-mono outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Freight Spends</label>
                  <div className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-slate-300 font-bold font-mono">
                    ₹{newTrip.amount?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Priority Status</label>
                  <select
                    value={newTrip.priority}
                    onChange={e => setNewTrip({...newTrip, priority: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Trip Instruction</label>
                  <input
                    type="text"
                    placeholder="Fragile, cover tarp..."
                    value={newTrip.notes}
                    onChange={e => setNewTrip({...newTrip, notes: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-500 space-y-1">
                <p className="text-slate-400 font-bold uppercase">Sandbox Notice:</p>
                <p>Creating this trip will automatically record a Diesel Advance and Cash Advance inside the driver's wallet, and update their statuses to "On Trip".</p>
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
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WEIGHBRIDGE MODAL */}
      {showWeighbridgeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Scale size={18} className="text-tenant" /> Record Weighbridge Slip
              </h3>
              <button onClick={() => setShowWeighbridgeModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWeighbridge} className="space-y-4 font-semibold text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Trip Booking Target</span>
                <p className="text-white font-extrabold font-mono">{showWeighbridgeModal.tripNumber}</p>
                <p className="text-slate-400">Target Qty: {showWeighbridgeModal.quantity} Tons ({showWeighbridgeModal.material})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Gross weight (Tons)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 38.5"
                    value={wbGross}
                    onChange={e => setWbGross(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Tare weight (Tons)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 12.0"
                    value={wbTare}
                    onChange={e => setWbTare(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={wbMoisture}
                    onChange={e => setWbMoisture(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Salt Quality Grade</label>
                  <select
                    value={wbQuality}
                    onChange={e => setWbQuality(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  >
                    <option value="A Grade">A Grade (Super White)</option>
                    <option value="B Grade">B Grade (Standard)</option>
                    <option value="C Grade">C Grade (Raw Industrial)</option>
                  </select>
                </div>
              </div>

              {wbGross && wbTare && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center">
                  <span className="text-slate-400">Calculated Net Payload:</span>
                  <span className="text-emerald-400 font-extrabold text-sm font-mono">
                    {Number(wbGross) - Number(wbTare)} Tons
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md"
                style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
              >
                Save slip & Set "Loading"
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OCR POD SIMULATOR MODAL */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <UploadCloud size={18} className="text-tenant" /> AI POD OCR Verifier
              </h3>
              <button onClick={() => setShowOcrModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <p className="text-slate-400">
                Simulate uploading a Proof of Delivery (POD) signed paper challan from the driver. 
                Our AI OCR engine will extract the load weight and flag discrepancies.
              </p>

              {ocrScanning ? (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 text-center space-y-3">
                  <RefreshCw className="animate-spin text-tenant mx-auto" size={32} />
                  <div>
                    <p className="text-white font-bold">Scanning Challan Image...</p>
                    <p className="text-[10px] text-slate-500">Extracting weights and operator signature fields.</p>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-tenant h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => startOcrSimulation(false)}
                    className="p-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl flex flex-col items-center text-center space-y-2 group hover:border-emerald-500/40"
                  >
                    <ShieldCheck size={28} className="text-emerald-500" />
                    <div>
                      <p className="text-white font-bold text-xs">Upload Clear POD</p>
                      <p className="text-[9px] text-slate-500 leading-normal mt-1">Simulates correct weights matching the weighbridge (26.5 Tons).</p>
                    </div>
                  </button>

                  <button
                    onClick={() => startOcrSimulation(true)}
                    className="p-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl flex flex-col items-center text-center space-y-2 group hover:border-rose-500/40"
                  >
                    <AlertTriangle size={28} className="text-rose-500" />
                    <div>
                      <p className="text-white font-bold text-xs">Upload Discrepant POD</p>
                      <p className="text-[9px] text-slate-500 leading-normal mt-1">Simulates loading weights mismatch (POD states 24.1 Tons vs 26.5 Tons).</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
