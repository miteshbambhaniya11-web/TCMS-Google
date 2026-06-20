'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Contractor, Truck, Trip } from '@/db/localDb';
import { 
  Building2, Search, Plus, CreditCard, Scale, Truck as TruckIcon, 
  FileText, Calendar, Wallet, CheckCircle, HelpCircle, X 
} from 'lucide-react';

export default function ContractorsPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [selectedCont, setSelectedCont] = useState<Contractor | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'vehicles' | 'trips' | 'payments'>('details');

  // Search & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Contractor Form state
  const [newCont, setNewCont] = useState<Partial<Contractor>>({
    name: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    notes: '',
  });

  const loadData = () => {
    if (activeTenant) {
      const list = localDb.getContractors(activeTenant.id);
      setContractors(list);
      setTrucks(localDb.getTrucks(activeTenant.id));
      setTrips(localDb.getTrips(activeTenant.id));

      if (selectedCont) {
        const updated = list.find(c => c.id === selectedCont.id);
        if (updated) setSelectedCont(updated);
      } else if (list.length > 0) {
        setSelectedCont(list[0]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newCont.name || !newCont.mobile) {
      alert('Please enter Name and Mobile number');
      return;
    }

    const created: Contractor = {
      id: `cont-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newCont.name,
      mobile: newCont.mobile,
      altMobile: newCont.altMobile,
      email: newCont.email || '',
      address: newCont.address || '',
      gstNumber: newCont.gstNumber || '',
      panNumber: newCont.panNumber || '',
      bankName: newCont.bankName || '',
      accountNumber: newCont.accountNumber || '',
      ifscCode: newCont.ifscCode || '',
      upiId: newCont.upiId || '',
      notes: newCont.notes || '',
      status: 'Active',
    };

    const current = localDb.getContractors(activeTenant.id);
    localDb.saveContractors([...current, created]);
    loadData();
    setShowAddModal(false);

    // Reset Form
    setNewCont({
      name: '',
      mobile: '',
      altMobile: '',
      email: '',
      address: '',
      gstNumber: '',
      panNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      notes: '',
    });
  };

  const filteredConts = contractors.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contractor attached items
  const attachedTrucks = trucks.filter(t => t.contractorId === selectedCont?.id);
  const attachedTrips = trips.filter(t => t.contractorId === selectedCont?.id);
  const totalFreightPayout = attachedTrips.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Contractors & Supplier Registry</h2>
          <p className="text-xs text-slate-400">Manage third-party fleet suppliers, financial terms, and vehicle assignments.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search contractor, GSTIN..."
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
              <Plus size={16} /> Add Contractor
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Contractor list */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 uppercase">Supplier Registry</span>
            <span className="bg-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              {filteredConts.length} Registered
            </span>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredConts.map(c => {
              const isSelected = selectedCont?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCont(c)}
                  className={`p-4 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-slate-800/50 border-l-4 border-tenant' : ''
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <p className="text-white font-extrabold text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Mobile: {c.mobile} | Email: {c.email || 'N/A'}</p>
                    <span className="inline-flex bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                      GSTIN: {c.gstNumber || 'Unregistered'}
                    </span>
                  </div>
                  
                  <span className="bg-slate-800 text-slate-400 font-extrabold text-[9px] px-2.5 py-1 rounded uppercase shrink-0">
                    {c.status}
                  </span>
                </div>
              );
            })}

            {filteredConts.length === 0 && (
              <p className="text-slate-500 text-xs text-center p-8 italic font-semibold">No suppliers matching search criteria.</p>
            )}
          </div>
        </div>

        {/* Right pane: Tabs and details */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          {selectedCont ? (
            <>
              {/* Header profile details */}
              <div className="p-5 border-b border-slate-850 bg-slate-900/60">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-tenant flex items-center justify-center font-extrabold text-sm shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{selectedCont.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Pan Number: {selectedCont.panNumber || 'N/A'} | Billing: {selectedCont.address}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Contact: {selectedCont.mobile} | Alt: {selectedCont.altMobile || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 px-5 gap-6 bg-slate-900/40 text-xs">
                {(['details', 'vehicles', 'trips', 'payments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 font-semibold border-b-2 capitalize transition-all ${
                      activeTab === tab ? 'border-tenant text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800 text-xs font-semibold text-slate-400">
                
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <h4 className="text-xs font-extrabold text-white uppercase flex items-center gap-1">
                        <CreditCard size={14} className="text-slate-400" /> Remittance Bank Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 leading-relaxed font-semibold">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Bank Name</span>
                          <span className="text-slate-300">{selectedCont.bankName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Account Number</span>
                          <span className="text-slate-300 font-mono">{selectedCont.accountNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">IFSC Code</span>
                          <span className="text-slate-300 font-mono">{selectedCont.ifscCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">UPI ID</span>
                          <span className="text-slate-300 font-mono">{selectedCont.upiId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                      <h4 className="text-xs font-extrabold text-white uppercase">Internal Memo Notes</h4>
                      <p className="text-slate-300 italic">{selectedCont.notes || 'No notes added for this contractor.'}</p>
                    </div>
                  </div>
                )}

                {/* Vehicles Tab */}
                {activeTab === 'vehicles' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase">Attached Hired Fleet</h4>
                    <div className="space-y-2">
                      {attachedTrucks.map(tr => (
                        <div key={tr.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <TruckIcon size={14} className="text-tenant" />
                            <span className="text-white font-bold">{tr.truckNumber}</span>
                            <span className="text-[10px] text-slate-500">({tr.type} | Capacity: {tr.capacity}T)</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            tr.status === 'On Trip' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {tr.status}
                          </span>
                        </div>
                      ))}

                      {attachedTrucks.length === 0 && (
                        <p className="text-slate-600 italic p-4 text-center">No vehicles attached to this contractor currently.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trips Tab */}
                {activeTab === 'trips' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase">Trip Assignments Log</h4>
                    <div className="space-y-2">
                      {attachedTrips.map(tr => (
                        <div key={tr.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-white font-extrabold font-mono">{tr.tripNumber}</span>
                            <p className="text-[10px] text-slate-500">{tr.pickup} → {tr.destination} | {tr.material}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-slate-300 font-bold font-mono block">₹{tr.amount.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-500">{tr.status}</span>
                          </div>
                        </div>
                      ))}

                      {attachedTrips.length === 0 && (
                        <p className="text-slate-600 italic p-4 text-center">No trips booked for this contractor currently.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Spends Turnover</span>
                        <span className="text-white font-extrabold text-sm font-mono">₹{totalFreightPayout.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Outstanding Settlements</span>
                        <span className="text-white font-extrabold text-sm font-mono">₹{(totalFreightPayout * 0.15).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-[10px] text-slate-500">
                      <p className="text-slate-400 font-bold uppercase">Settlements Guideline (Indian Tax 194C):</p>
                      <p>Company Admin or Finance role can record advances and recoveries in the Invoice Hub. All payouts are automatically logged under the ledger audit sheets, subject to a 1% TDS deduction for individual transporters and 2% for transport firms.</p>
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Building2 size={36} />
              <p className="font-semibold text-sm">Select a supplier from the registry to view attached vehicles, ledger trips, and banking details.</p>
            </div>
          )}
        </div>

      </div>

      {/* ADD CONTRACTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Building2 size={18} className="text-tenant" /> Add Contractor Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContractor} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Contractor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaji Roadlines"
                  value={newCont.name}
                  onChange={e => setNewCont({...newCont, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Primary Mobile</label>
                  <input
                    type="tel"
                    required
                    placeholder="9988776655"
                    value={newCont.mobile}
                    onChange={e => setNewCont({...newCont, mobile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Alternate Mobile</label>
                  <input
                    type="tel"
                    placeholder="9900990099"
                    value={newCont.altMobile}
                    onChange={e => setNewCont({...newCont, altMobile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24ABCDE1234F..."
                    value={newCont.gstNumber}
                    onChange={e => setNewCont({...newCont, gstNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={newCont.panNumber}
                    onChange={e => setNewCont({...newCont, panNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Bank Name</label>
                  <input
                    type="text"
                    placeholder="SBI / HDFC"
                    value={newCont.bankName}
                    onChange={e => setNewCont({...newCont, bankName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Account Number</label>
                  <input
                    type="text"
                    placeholder="100234091..."
                    value={newCont.accountNumber}
                    onChange={e => setNewCont({...newCont, accountNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={newCont.ifscCode}
                    onChange={e => setNewCont({...newCont, ifscCode: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">UPI ID</label>
                  <input
                    type="text"
                    placeholder="name@okaxis"
                    value={newCont.upiId}
                    onChange={e => setNewCont({...newCont, upiId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Billing Address</label>
                <textarea
                  placeholder="Street details..."
                  value={newCont.address}
                  onChange={e => setNewCont({...newCont, address: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none h-14 resize-none"
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
                  Save Contractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
