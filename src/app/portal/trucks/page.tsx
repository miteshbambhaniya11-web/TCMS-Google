'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Truck, Driver, Contractor } from '@/db/localDb';
import { 
  Truck as TruckIcon, Search, ShieldCheck, ShieldAlert, 
  MapPin, Plus, ShieldCheck as VerifiedIcon, Sparkles, 
  Scale, FileText, Settings, X, Coins, HelpCircle 
} from 'lucide-react';

export default function TrucksPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  // Page view states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVahanModal, setShowVahanModal] = useState(false);

  // New Truck Form state
  const [newTruck, setNewTruck] = useState<Partial<Truck>>({
    truckNumber: '',
    type: 'Taurus',
    capacity: 25,
    ownerName: '',
    driverId: '',
    contractorId: '',
    gpsEnabled: true,
    insuranceExpiry: '',
    permitExpiry: '',
    fitnessExpiry: '',
    pucExpiry: '',
    fastagBalance: 5000,
    tyresCount: 10,
  });

  // Vahan simulator state
  const [vahanQuery, setVahanQuery] = useState('');
  const [vahanSearching, setVahanSearching] = useState(false);
  const [vahanResult, setVahanResult] = useState<any>(null);

  const loadData = () => {
    if (activeTenant) {
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setContractors(localDb.getContractors(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateTruck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newTruck.truckNumber) {
      alert('Please enter a vehicle number');
      return;
    }

    const created: Truck = {
      id: `truck-${Date.now()}`,
      tenantId: activeTenant.id,
      truckNumber: newTruck.truckNumber.toUpperCase(),
      type: newTruck.type as any,
      capacity: Number(newTruck.capacity),
      ownerName: newTruck.ownerName || 'Self Owned',
      driverId: newTruck.driverId || '',
      contractorId: newTruck.contractorId || undefined,
      gpsEnabled: !!newTruck.gpsEnabled,
      insuranceExpiry: newTruck.insuranceExpiry || '2027-01-01',
      permitExpiry: newTruck.permitExpiry || '2027-01-01',
      fitnessExpiry: newTruck.fitnessExpiry || '2027-01-01',
      pucExpiry: newTruck.pucExpiry || '2027-01-01',
      fastagBalance: Number(newTruck.fastagBalance) || 0,
      tyresCount: Number(newTruck.tyresCount) || 10,
      status: 'Available',
    };

    const currentTrucks = localDb.getTrucks(activeTenant.id);
    localDb.saveTrucks([...currentTrucks, created]);
    loadData();
    setShowAddModal(false);

    // Reset Form
    setNewTruck({
      truckNumber: '',
      type: 'Taurus',
      capacity: 25,
      ownerName: '',
      driverId: '',
      contractorId: '',
      gpsEnabled: true,
      insuranceExpiry: '',
      permitExpiry: '',
      fitnessExpiry: '',
      pucExpiry: '',
      fastagBalance: 5000,
      tyresCount: 10,
    });
  };

  const handleVahanLookup = () => {
    if (!vahanQuery) return;
    setVahanSearching(true);
    setVahanResult(null);

    setTimeout(() => {
      setVahanSearching(false);
      // Realistic Vahan database payload response
      const vehicleNo = vahanQuery.toUpperCase();
      setVahanResult({
        truckNumber: vehicleNo,
        ownerName: 'Vasan Roadlines Pvt Ltd',
        registrationDate: '2022-03-12',
        chassisNumber: 'MERRIN8809A120X998',
        engineNumber: 'TATA-6D-998810A',
        makerModel: 'TATA LPT 3718 (10-Wheeler)',
        fuelType: 'Diesel',
        emissionNorms: 'BS-VI',
        fitnessExpiry: '2027-03-11',
        insuranceExpiry: '2027-03-10',
        permitExpiry: '2026-12-30',
        pucExpiry: '2026-09-09',
        status: 'Active',
      });
    }, 1200);
  };

  const autofillFromVahan = () => {
    if (!vahanResult) return;
    setNewTruck({
      truckNumber: vahanResult.truckNumber,
      type: 'Taurus',
      capacity: 25,
      ownerName: vahanResult.ownerName,
      insuranceExpiry: vahanResult.insuranceExpiry,
      permitExpiry: vahanResult.permitExpiry,
      fitnessExpiry: vahanResult.fitnessExpiry,
      pucExpiry: vahanResult.pucExpiry,
      fastagBalance: 3000,
      tyresCount: 10,
    });
    setShowVahanModal(false);
    setShowAddModal(true); // open add dialog prefilled!
  };

  const checkDocExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'EXPIRED', color: 'text-rose-500 bg-rose-500/10' };
    if (diffDays <= 30) return { label: 'EXPIRES SOON', color: 'text-yellow-500 bg-yellow-500/10' };
    return { label: 'VALID', color: 'text-emerald-400 bg-emerald-500/10' };
  };

  const filteredTrucks = trucks.filter(t => 
    t.truckNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxTrucks = activeTenant?.subscription?.maxTrucks ?? 2;
  const isLimitReached = trucks.length >= maxTrucks;

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Truck Fleet Management</h2>
          <p className="text-xs text-slate-400">Manage vehicle expiries, Vahan compliance lookups, Fastag wallets, and tyres.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search truck number, owner..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>

          {activeRole !== 'Customer User' && (
            <>
              <button
                disabled={isLimitReached}
                onClick={() => setShowVahanModal(true)}
                className={`border px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  isLimitReached
                    ? 'bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
              >
                <Sparkles size={14} className={isLimitReached ? "text-slate-650" : "text-teal-400 animate-spin"} /> Query Vahan
              </button>
              <button
                disabled={isLimitReached}
                onClick={() => setShowAddModal(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  isLimitReached
                    ? 'bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                    : 'bg-tenant hover:bg-tenant/90 text-white'
                }`}
              >
                <Plus size={16} /> Add Truck
              </button>
            </>
          )}
        </div>
      </div>

      {isLimitReached && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>
              <strong>Fleet Limit Reached ({trucks.length}/{maxTrucks} Trucks).</strong> You cannot add more trucks on your current plan. Please upgrade your subscription.
            </span>
          </div>
          <a href="mailto:support@tcms.com?subject=Upgrade request to add more trucks" className="text-red-300 underline font-bold hover:text-white shrink-0">
            Request Upgrade
          </a>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Trucks list */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 uppercase">Fleet Registry</span>
            <span className="bg-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              {filteredTrucks.length} Vehicles
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredTrucks.map(tr => {
              const insCheck = checkDocExpiry(tr.insuranceExpiry);
              const fitCheck = checkDocExpiry(tr.fitnessExpiry);
              const isSelected = selectedTruck?.id === tr.id;
              
              const hasAlert = insCheck.label !== 'VALID' || fitCheck.label !== 'VALID' || tr.fastagBalance < 1000;

              return (
                <div
                  key={tr.id}
                  onClick={() => setSelectedTruck(tr)}
                  className={`p-4 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-slate-800/50 border-l-4 border-tenant' : ''
                  }`}
                >
                  <div className="space-y-1.5 truncate">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-extrabold text-xs">{tr.truckNumber}</p>
                      {hasAlert && <ShieldAlert size={14} className="text-rose-500 animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">{tr.type} ({tr.capacity} Tons) | Owner: {tr.ownerName}</p>
                    
                    <div className="flex items-center gap-1.5 font-bold text-[9px]">
                      <span className={`px-1.5 py-0.5 rounded ${insCheck.color}`}>INS: {insCheck.label}</span>
                      <span className={`px-1.5 py-0.5 rounded ${fitCheck.color}`}>FIT: {fitCheck.label}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Fastag Wallet</span>
                    <span className={`font-extrabold text-xs font-mono ${tr.fastagBalance < 1000 ? 'text-rose-400' : 'text-slate-200'}`}>
                      ₹{tr.fastagBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTrucks.length === 0 && (
              <p className="text-slate-500 text-xs text-center p-8 italic font-semibold">No trucks matching search criteria.</p>
            )}
          </div>
        </div>

        {/* Right Side: Truck Workcard, Fastag, Tyres */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          {selectedTruck ? (
            <div className="flex-grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
              
              {/* Profile Block */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <TruckIcon size={18} className="text-tenant" /> {selectedTruck.truckNumber}
                  </h3>
                  <p className="text-slate-400 mt-1 font-semibold">
                    Type: {selectedTruck.type} | Capacity: {selectedTruck.capacity} Tons | Owner: {selectedTruck.ownerName}
                  </p>
                  <p className="text-slate-500 font-semibold mt-0.5">
                    Assigned Driver: {drivers.find(d => d.id === selectedTruck.driverId)?.name || 'Unassigned'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded font-bold uppercase ${
                  selectedTruck.status === 'On Trip' ? 'bg-sky-500/10 text-sky-400' : selectedTruck.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {selectedTruck.status}
                </span>
              </div>

              {/* Expiring Documents Audit Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Compliance Documents Locker</h4>
                
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex justify-between items-center font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Insurance Valid</span>
                      <span className="text-slate-300 font-mono">{selectedTruck.insuranceExpiry}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-extrabold ${checkDocExpiry(selectedTruck.insuranceExpiry).color}`}>
                      {checkDocExpiry(selectedTruck.insuranceExpiry).label}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex justify-between items-center font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">National Permit</span>
                      <span className="text-slate-300 font-mono">{selectedTruck.permitExpiry}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-extrabold ${checkDocExpiry(selectedTruck.permitExpiry).color}`}>
                      {checkDocExpiry(selectedTruck.permitExpiry).label}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex justify-between items-center font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Fitness Expiry</span>
                      <span className="text-slate-300 font-mono">{selectedTruck.fitnessExpiry}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-extrabold ${checkDocExpiry(selectedTruck.fitnessExpiry).color}`}>
                      {checkDocExpiry(selectedTruck.fitnessExpiry).label}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex justify-between items-center font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">PUC Pollution</span>
                      <span className="text-slate-300 font-mono">{selectedTruck.pucExpiry}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-extrabold ${checkDocExpiry(selectedTruck.pucExpiry).color}`}>
                      {checkDocExpiry(selectedTruck.pucExpiry).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fastag Wallet simulation block */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Coins size={14} className="text-sky-400" /> Fastag Smart Ledger
                  </h4>
                  {selectedTruck.fastagBalance < 1000 && (
                    <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] px-2 py-0.5 rounded font-bold animate-pulse">
                      LOW BALANCE WARNING
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 font-semibold text-[10px] text-slate-400 bg-slate-900 p-3 rounded border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Fastag ID</span>
                    <span className="text-slate-300 font-mono">FT-9908122-A</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Linked Issuer</span>
                    <span className="text-slate-300 font-semibold">ICICI FASTAG</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Fastag Balance</span>
                    <span className="text-white font-extrabold font-mono">₹{selectedTruck.fastagBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tyre life tracking block */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Tyre Lifetime Registry</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[10px] font-semibold text-slate-400">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Front Left (FL)</span>
                    <p className="text-slate-300 font-mono mt-0.5">38,910 km</p>
                    <span className="text-emerald-400 font-bold">80% Life</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Front Right (FR)</span>
                    <p className="text-slate-300 font-mono mt-0.5">39,120 km</p>
                    <span className="text-emerald-400 font-bold">78% Life</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Rear Inner Left</span>
                    <p className="text-slate-300 font-mono mt-0.5">85,490 km</p>
                    <span className="text-yellow-500 font-bold">25% (Retread)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold uppercase">Rear Outer Right</span>
                    <p className="text-slate-300 font-mono mt-0.5">12,490 km</p>
                    <span className="text-emerald-400 font-bold">95% Life</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <TruckIcon size={36} />
              <p className="font-semibold text-sm">Select a truck from the Registry to view compliance logs, Fastag ledger, and tyre wear.</p>
            </div>
          )}
        </div>

      </div>

      {/* ADD TRUCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <TruckIcon size={18} className="text-tenant" /> Add Truck Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTruck} className="space-y-3 font-semibold text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Truck Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ-12-BY-4567"
                    value={newTruck.truckNumber}
                    onChange={e => setNewTruck({...newTruck, truckNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Truck Body Type</label>
                  <select
                    value={newTruck.type}
                    onChange={e => setNewTruck({...newTruck, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  >
                    <option value="Taurus">Taurus (10-Wheeler)</option>
                    <option value="Tipper">Tipper (Mining/Sand)</option>
                    <option value="Dumper">Dumper (Salt Pans)</option>
                    <option value="Trailer">Trailer (Heavy Cargo)</option>
                    <option value="Container">Container (Box Body)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Payload Capacity (Tons)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newTruck.capacity}
                    onChange={e => setNewTruck({...newTruck, capacity: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Owner Name / Fleet</label>
                  <input
                    type="text"
                    placeholder="e.g. Maruti Logistics"
                    value={newTruck.ownerName}
                    onChange={e => setNewTruck({...newTruck, ownerName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Assign Driver</label>
                  <select
                    value={newTruck.driverId}
                    onChange={e => setNewTruck({...newTruck, driverId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Choose Driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Hired Contractor</label>
                  <select
                    value={newTruck.contractorId}
                    onChange={e => setNewTruck({...newTruck, contractorId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Self Owned Fleet</option>
                    {contractors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Insurance Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newTruck.insuranceExpiry}
                    onChange={e => setNewTruck({...newTruck, insuranceExpiry: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">National Permit Expiry</label>
                  <input
                    type="date"
                    required
                    value={newTruck.permitExpiry}
                    onChange={e => setNewTruck({...newTruck, permitExpiry: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Fitness Certificate Expiry</label>
                  <input
                    type="date"
                    required
                    value={newTruck.fitnessExpiry}
                    onChange={e => setNewTruck({...newTruck, fitnessExpiry: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PUC Pollution Expiry</label>
                  <input
                    type="date"
                    required
                    value={newTruck.pucExpiry}
                    onChange={e => setNewTruck({...newTruck, pucExpiry: e.target.value})}
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
                  Save Truck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VAHAN API LOOKUP MODAL */}
      {showVahanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="text-teal-400" size={18} /> Ministry of Road Transport (Vahan)
              </h3>
              <button onClick={() => setShowVahanModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Enter Vehicle Registration Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. GJ-12-BY-4567"
                    value={vahanQuery}
                    onChange={e => setVahanQuery(e.target.value)}
                    className="flex-grow bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant uppercase"
                  />
                  <button
                    onClick={handleVahanLookup}
                    className="bg-tenant text-white px-4 py-2 rounded font-bold transition-all shrink-0"
                  >
                    Query Vahan
                  </button>
                </div>
              </div>

              {vahanSearching && (
                <div className="bg-slate-950 p-4 rounded border border-slate-850 text-center font-semibold">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-tenant border-t-transparent mx-auto mb-2" />
                  <p className="text-slate-300">Fetching registration records...</p>
                </div>
              )}

              {vahanResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-semibold">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-white font-extrabold font-mono text-sm">{vahanResult.truckNumber}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">VERIFIED VAHAN</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold leading-relaxed">
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Registered Owner</span>
                      <span className="text-slate-300">{vahanResult.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Chassis Number</span>
                      <span className="text-slate-300 font-mono">{vahanResult.chassisNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Maker / Model</span>
                      <span className="text-slate-300">{vahanResult.makerModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px] font-bold uppercase">Emission Std</span>
                      <span className="text-slate-300 font-mono">{vahanResult.emissionNorms} ({vahanResult.fuelType})</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded text-[9px] text-slate-500 border border-slate-850 space-y-1">
                    <p className="text-slate-400 font-bold uppercase">Extracted Expiry Dates:</p>
                    <p>Insurance: {vahanResult.insuranceExpiry}</p>
                    <p>Fitness: {vahanResult.fitnessExpiry}</p>
                    <p>National Permit: {vahanResult.permitExpiry}</p>
                  </div>

                  <button
                    onClick={autofillFromVahan}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded transition-all mt-2"
                  >
                    Auto-Fill Profile Form
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
