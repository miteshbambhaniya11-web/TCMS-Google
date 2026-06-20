'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Driver, WalletTransaction, Trip } from '@/db/localDb';
import { 
  Users, Search, ShieldAlert, BadgePercent, Coins, 
  ArrowUpRight, ArrowDownRight, Wallet, History, Plus, 
  HelpCircle, Trash2, CheckCircle, FileText, X 
} from 'lucide-react';

export default function DriversPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Driver state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    name: '',
    mobile: '',
    whatsappNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    aadhaarNumber: '',
    address: '',
    emergencyContact: '',
  });

  // Advance modal state
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceType, setAdvanceType] = useState<'Advance Diesel' | 'Advance Cash' | 'Advance Toll' | 'Recovery'>('Advance Cash');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDesc, setAdvanceDesc] = useState('');
  const [associatedTripId, setAssociatedTripId] = useState('');

  const loadData = () => {
    if (activeTenant) {
      const drs = localDb.getDrivers(activeTenant.id);
      setDrivers(drs);
      setTrips(localDb.getTrips(activeTenant.id));
      
      // Keep selected driver updated
      if (selectedDriver) {
        const updatedSelected = drs.find(d => d.id === selectedDriver.id);
        if (updatedSelected) {
          setSelectedDriver(updatedSelected);
          setTransactions(localDb.getWalletTransactions(updatedSelected.id));
        }
      } else if (drs.length > 0) {
        setSelectedDriver(drs[0]);
        setTransactions(localDb.getWalletTransactions(drs[0].id));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  // Load transactions when selected driver changes
  useEffect(() => {
    if (selectedDriver) {
      setTransactions(localDb.getWalletTransactions(selectedDriver.id));
    }
  }, [selectedDriver]);

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newDriver.name || !newDriver.mobile || !newDriver.licenseNumber) {
      alert('Please fill out Name, Mobile, and License details.');
      return;
    }

    const created: Driver = {
      id: `driver-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newDriver.name,
      mobile: newDriver.mobile,
      whatsappNumber: newDriver.whatsappNumber || `91${newDriver.mobile}`,
      licenseNumber: newDriver.licenseNumber,
      licenseExpiry: newDriver.licenseExpiry || '2029-01-01',
      aadhaarNumber: newDriver.aadhaarNumber || '0000-0000-0000',
      address: newDriver.address || '',
      joiningDate: new Date().toISOString().split('T')[0],
      emergencyContact: newDriver.emergencyContact || '',
      status: 'Active',
      walletBalance: 0,
    };

    const currentDrivers = localDb.getDrivers(activeTenant.id);
    localDb.saveDrivers([...currentDrivers, created]);
    loadData();
    setShowAddModal(false);
    
    // Reset form
    setNewDriver({
      name: '',
      mobile: '',
      whatsappNumber: '',
      licenseNumber: '',
      licenseExpiry: '',
      aadhaarNumber: '',
      address: '',
      emergencyContact: '',
    });
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !selectedDriver || !advanceAmount) return;

    const amt = Number(advanceAmount);
    const type = advanceType;
    const isRecovery = type === 'Recovery';
    
    // Calculate new balance: advances increase driver wallet debt/balance; recoveries reduce it
    const balanceDiff = isRecovery ? -amt : amt;

    const list = localDb.getWalletTransactions(selectedDriver.id);
    const newTx: WalletTransaction = {
      id: `wt-${Date.now()}`,
      driverId: selectedDriver.id,
      tripId: associatedTripId || 'trip-adhoc',
      type,
      amount: amt,
      description: advanceDesc || `${type} recorded in system`,
      date: new Date().toISOString(),
    };

    // Save transaction
    const allTxs = localDb.get<WalletTransaction>('wallet_transactions', []);
    allTxs.push(newTx);
    localDb.saveWalletTransactions(allTxs);

    // Update driver balance
    const allDrs = localDb.getDrivers(activeTenant.id);
    const dIdx = allDrs.findIndex(d => d.id === selectedDriver.id);
    if (dIdx !== -1) {
      allDrs[dIdx].walletBalance += balanceDiff;
      localDb.saveDrivers(allDrs);
    }

    loadData();
    setShowAdvanceModal(false);
    setAdvanceAmount('');
    setAdvanceDesc('');
    setAssociatedTripId('');
  };

  const checkLicenseExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'Expired', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    if (diffDays <= 30) return { status: 'Expires Soon', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
    return { status: 'Valid', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.mobile.includes(searchTerm) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxDrivers = activeTenant?.subscription?.maxDrivers ?? 2;
  const isLimitReached = drivers.length >= maxDrivers;

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Driver Operations & Wallets</h2>
          <p className="text-xs text-slate-400">Track driver licenses, advances (diesel, cash, tolls), and wallets history.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search driver name, license..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>
          {activeRole !== 'Customer User' && (
            <button
              disabled={isLimitReached}
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                isLimitReached
                  ? 'bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-tenant hover:bg-tenant/90 text-white'
              }`}
            >
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>
      </div>

      {isLimitReached && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>
              <strong>Driver Registry Limit Reached ({drivers.length}/{maxDrivers} Drivers).</strong> You cannot register more drivers on your current plan. Please upgrade your subscription.
            </span>
          </div>
          <a href="mailto:support@tcms.com?subject=Upgrade request to add more drivers" className="text-red-300 underline font-bold hover:text-white shrink-0">
            Request Upgrade
          </a>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Drivers list */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 uppercase">Driver Registry</span>
            <span className="bg-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              {filteredDrivers.length} Registered
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredDrivers.map(dr => {
              const expiryCheck = checkLicenseExpiry(dr.licenseExpiry);
              const isSelected = selectedDriver?.id === dr.id;
              return (
                <div
                  key={dr.id}
                  onClick={() => setSelectedDriver(dr)}
                  className={`p-4 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-slate-800/50 border-l-4 border-tenant' : ''
                  }`}
                >
                  <div className="space-y-1.5 truncate">
                    <p className="text-white font-extrabold text-xs">{dr.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Mobile: {dr.mobile} | WA: {dr.whatsappNumber}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] border px-1.5 py-0.5 rounded-full font-bold ${expiryCheck.color}`}>
                        License: {expiryCheck.status}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        dr.status === 'On Trip' ? 'bg-sky-500/10 text-sky-400' : dr.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {dr.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Wallet Debt</span>
                    <span className="text-white font-extrabold text-xs font-mono">₹{dr.walletBalance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredDrivers.length === 0 && (
              <p className="text-slate-500 text-xs text-center p-8 italic font-semibold">No drivers matching search criteria.</p>
            )}
          </div>
        </div>

        {/* Right Side: Wallet details & Ledger */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          {selectedDriver ? (
            <>
              {/* Header Details */}
              <div className="p-5 border-b border-slate-850 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-tenant flex items-center justify-center font-extrabold text-sm shrink-0">
                    {selectedDriver.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{selectedDriver.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Aadhaar: {selectedDriver.aadhaarNumber} | License: {selectedDriver.licenseNumber}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Joined: {selectedDriver.joiningDate} | Emergency Contact: {selectedDriver.emergencyContact}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-850 shrink-0 justify-between sm:justify-start">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">Balance Due</span>
                    <span className="text-white font-extrabold text-sm font-mono">₹{selectedDriver.walletBalance.toLocaleString()}</span>
                  </div>
                  
                  {activeRole !== 'Customer User' && (
                    <button
                      onClick={() => setShowAdvanceModal(true)}
                      className="bg-tenant hover:bg-tenant/90 text-white p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-lg shadow-tenant/15"
                    >
                      <Plus size={14} /> Record Flow
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase flex items-center gap-1">
                  <History size={14} className="text-slate-400" /> Wallet Ledger Statement
                </h4>

                <div className="space-y-3 font-semibold text-xs">
                  {transactions.map(tx => {
                    const isRec = tx.type === 'Recovery';
                    return (
                      <div key={tx.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isRec ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {isRec ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] font-bold block">{new Date(tx.date).toLocaleString()}</span>
                            <p className="text-white font-bold">{tx.type}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tx.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-extrabold text-xs font-mono ${isRec ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {isRec ? '-' : '+'} ₹{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {transactions.length === 0 && (
                    <div className="border border-dashed border-slate-800/80 rounded-xl p-12 text-center text-slate-600 font-semibold italic">
                      No wallet transactions recorded for this driver.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Wallet size={36} />
              <p className="font-semibold text-sm">Select a driver from the Registry to view details & wallet transactions.</p>
            </div>
          )}
        </div>

      </div>

      {/* ADD DRIVER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Users size={18} className="text-tenant" /> Register Driver Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={newDriver.name}
                  onChange={e => setNewDriver({...newDriver, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="9988776655"
                    value={newDriver.mobile}
                    onChange={e => setNewDriver({...newDriver, mobile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="919988776655"
                    value={newDriver.whatsappNumber}
                    onChange={e => setNewDriver({...newDriver, whatsappNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="GJ12-2021-..."
                    value={newDriver.licenseNumber}
                    onChange={e => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newDriver.licenseExpiry}
                    onChange={e => setNewDriver({...newDriver, licenseExpiry: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Aadhaar Card Number</label>
                  <input
                    type="text"
                    placeholder="1234-5678-..."
                    value={newDriver.aadhaarNumber}
                    onChange={e => setNewDriver({...newDriver, aadhaarNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="9900990099 (Brother)"
                    value={newDriver.emergencyContact}
                    onChange={e => setNewDriver({...newDriver, emergencyContact: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Permanent Address</label>
                <textarea
                  placeholder="Street details..."
                  value={newDriver.address}
                  onChange={e => setNewDriver({...newDriver, address: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant h-16 resize-none"
                />
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
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD ADVANCE / PAYMENT MODAL */}
      {showAdvanceModal && selectedDriver && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Coins size={18} className="text-tenant" /> Record Transaction Flow
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAdvance} className="space-y-3 font-semibold text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Target Driver Wallet</span>
                <p className="text-white font-extrabold">{selectedDriver.name}</p>
                <p className="text-slate-400">Current Debt Balance: ₹{selectedDriver.walletBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Transaction Type</label>
                <select
                  value={advanceType}
                  onChange={e => setAdvanceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="Advance Cash">Cash Advance</option>
                  <option value="Advance Diesel">Diesel Pump Advance</option>
                  <option value="Advance Toll">Fastag Toll Advance</option>
                  <option value="Recovery">Balance Recovery (Repayment)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 5000"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Link to Trip</label>
                  <select
                    value={associatedTripId}
                    onChange={e => setAssociatedTripId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  >
                    <option value="">Ad-hoc (No Trip link)</option>
                    {trips.filter(t => t.driverId === selectedDriver.id).map(t => (
                      <option key={t.id} value={t.id}>{t.tripNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Transaction Narrative</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diesel fuel slip samakhiali pump..."
                  value={advanceDesc}
                  onChange={e => setAdvanceDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                />
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md mt-2"
                style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
              >
                Log Transaction & Update Wallet
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
