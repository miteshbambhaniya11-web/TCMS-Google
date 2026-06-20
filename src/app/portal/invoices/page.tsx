'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, Route, Invoice } from '@/db/localDb';
import { FileText, Printer, ShieldAlert, Sparkles, Coins, Plus, Eye, X, Check, Search } from 'lucide-react';

export default function InvoicesPage() {
  const { activeTenant, activeRole } = useTenant();

  // DB datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Billing parameters
  const [isRcm, setIsRcm] = useState(true); // default logistics reverse charge mechanism
  const [gstRate, setGstRate] = useState(12); // Standard transport GST (if not RCM)
  const [tdsRate, setTdsRate] = useState(2); // Section 194C (1% individual, 2% firm)
  const [customDeduction, setCustomDeduction] = useState('0');
  const [customDeductionReason, setCustomDeductionReason] = useState('');
  const [invoiceTerms, setInvoiceTerms] = useState('Payment due within 30 days of POD verification.');

  // Seed invoices
  const loadData = () => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setRoutes(localDb.getRoutes(activeTenant.id));
      
      // Fetch or seed mock invoices
      const seededInvoices = localDb.get<Invoice>('invoices', [
        {
          id: 'inv-seed-1',
          tripId: 'trip-1',
          invoiceNumber: `${activeTenant.numberSeries.invoicePrefix}00501`,
          subtotal: 29150,
          tdsDeduction: 583,
          gstRate: 0,
          gstAmount: 0,
          finalAmount: 28567,
          terms: 'Payment due within 30 days of POD verification.',
          status: 'Approved',
          createdAt: '2026-06-19T08:00:00Z',
        }
      ]);
      setInvoices(seededInvoices);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !selectedTripId) return;

    const trip = trips.find(t => t.id === selectedTripId);
    if (!trip) return;

    const subtotal = trip.amount;
    
    // Calculates TDS
    const tds = subtotal * (tdsRate / 100);

    // Calculates GST
    const gst = isRcm ? 0 : subtotal * (gstRate / 100);

    // Deducts advances and moisture penalties if any
    const advances = localDb.getWalletTransactions(trip.driverId)
      .filter(w => w.tripId === trip.id)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const moisturePenalty = (trip.moisturePercent && trip.moisturePercent > 2.5) 
      ? Math.round(subtotal * 0.05) // 5% moisture penalty
      : 0;

    const extraDeductions = Number(customDeduction) + moisturePenalty;
    const finalAmount = subtotal + gst - tds - advances - extraDeductions;

    // Generate Invoice Number
    const nextSeq = activeTenant.numberSeries.nextInvoiceNo;
    const invNo = `${activeTenant.numberSeries.invoicePrefix}${nextSeq.toString().padStart(5, '0')}`;
    
    // Increment sequence
    const tenants = localDb.getTenants();
    const tIdx = tenants.findIndex(t => t.id === activeTenant.id);
    if (tIdx !== -1) {
      tenants[tIdx].numberSeries.nextInvoiceNo += 1;
      localDb.saveTenants(tenants);
    }

    const created: Invoice = {
      id: `inv-${Date.now()}`,
      tripId: selectedTripId,
      invoiceNumber: invNo,
      subtotal,
      tdsDeduction: tds,
      gstRate: isRcm ? 0 : gstRate,
      gstAmount: gst,
      finalAmount,
      terms: invoiceTerms,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [created, ...invoices];
    localDb.set('invoices', updatedList);
    setInvoices(updatedList);

    // Log action
    localDb.addLog(activeTenant.id, 'user-4', 'Amit Joshi Finance', 'Create Invoice', `Generated invoice ${invNo} for trip ${trip.tripNumber}`);

    loadData();
    setShowCreateModal(false);
    setSelectedTripId('');
    setCustomDeduction('0');
  };

  const handleUpdateStatus = (invId: string, nextStatus: Invoice['status']) => {
    if (!activeTenant) return;
    const updated = invoices.map(inv => {
      if (inv.id === invId) {
        // Log action
        localDb.addLog(activeTenant.id, 'user-4', 'Amit Joshi Finance', 'Approve Invoice', `Updated invoice ${inv.invoiceNumber} status to ${nextStatus}`);
        return { ...inv, status: nextStatus };
      }
      return inv;
    });
    localDb.set('invoices', updated);
    setInvoices(updated);
    setSelectedInvoice(null);
    loadData();
  };

  const filteredInvoices = invoices.filter(inv => {
    const trip = trips.find(t => t.id === inv.tripId);
    const truck = trucks.find(t => t.id === trip?.truckId)?.truckNumber || '';
    return (
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip?.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTripDetails = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    const truck = trucks.find(t => t.id === trip?.truckId);
    const driver = drivers.find(d => d.id === trip?.driverId);
    const route = routes.find(r => r.id === trip?.routeId);
    
    const advances = trip 
      ? localDb.getWalletTransactions(trip.driverId).filter(w => w.tripId === trip.id).reduce((acc, curr) => acc + curr.amount, 0)
      : 0;

    return { trip, truck, driver, route, advances };
  };

  const printInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Printable Area overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: #fff !important;
            color: #000 !important;
          }
          #print-invoice, #print-invoice * {
            visibility: visible;
          }
          #print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-size: 11px;
          }
        }
      `}</style>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-white">Invoice & Settlements Hub</h2>
          <p className="text-xs text-slate-400">Generate tax invoices, calculate TDS 194C, RCM offsets, and manage settlements.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search invoice number, trip..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold w-full sm:w-60 outline-none focus:border-tenant"
            />
          </div>
          {activeRole !== 'Customer User' && activeRole !== 'Operator' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-tenant hover:bg-tenant/90 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={16} /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoices grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                <th className="p-4">Invoice Number</th>
                <th className="p-4">Trip Reference</th>
                <th className="p-4">Subtotal Freight</th>
                <th className="p-4">TDS (194C) Deducted</th>
                <th className="p-4">GST (RCM) Spends</th>
                <th className="p-4">Net Payout Spends</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Invoice Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {filteredInvoices.map(inv => {
                const tripRef = trips.find(t => t.id === inv.tripId)?.tripNumber || 'Ad-hoc';
                return (
                  <tr key={inv.id} className="hover:bg-slate-850/20">
                    <td className="p-4 text-white font-bold font-mono">{inv.invoiceNumber}</td>
                    <td className="p-4 font-mono">{tripRef}</td>
                    <td className="p-4 font-mono">₹{inv.subtotal.toLocaleString()}</td>
                    <td className="p-4 font-mono text-rose-400">-₹{inv.tdsDeduction.toLocaleString()}</td>
                    <td className="p-4 font-mono">{inv.gstAmount > 0 ? `₹${inv.gstAmount.toLocaleString()} (${inv.gstRate}%)` : 'RCM (0%)'}</td>
                    <td className="p-4 font-bold font-mono text-white">₹{Math.max(0, inv.finalAmount).toLocaleString()}</td>
                    <td className="p-4 font-mono">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : inv.status === 'Approved' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-2.5 py-1 rounded font-bold transition-all"
                      >
                        Manage Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic font-semibold">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE WORKSPACE MODAL */}
      {selectedInvoice && activeTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-xl w-full space-y-6">
            
            {/* Modal actions top bar */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
              <div>
                <span className="text-slate-500 text-[8px] font-bold uppercase block">Settlements Desk</span>
                <h3 className="text-base font-extrabold text-white font-mono">{selectedInvoice.invoiceNumber}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={printInvoice}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded font-bold flex items-center gap-1"
                >
                  <Printer size={12} /> Print PDF
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div 
              id="print-invoice" 
              className="bg-white text-slate-900 p-6 border border-slate-200 font-sans leading-relaxed text-[10px] rounded shadow-lg"
            >
              {/* Header */}
              <div className="flex justify-between border-b border-slate-300 pb-3 items-start">
                <div>
                  <h2 className="text-base font-extrabold tracking-wide uppercase">{activeTenant.name}</h2>
                  <p className="text-[9px] text-slate-500">{activeTenant.address}</p>
                  <p className="text-[9px] text-slate-500 font-bold">GSTIN: {activeTenant.gstNumber}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-extrabold uppercase text-slate-700 bg-slate-100 px-2 py-0.5 border rounded">TAX INVOICE</h3>
                  <p className="mt-1"><span className="text-slate-500 font-bold">Invoice #:</span> <span className="font-bold">{selectedInvoice.invoiceNumber}</span></p>
                  <p><span className="text-slate-500 font-bold">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client and Trip references */}
              {(() => {
                const details = getTripDetails(selectedInvoice.tripId);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-[10px]">
                      <div>
                        <span className="text-slate-500 block text-[8px] font-bold uppercase">Billed Client Target</span>
                        <p className="text-slate-900 font-extrabold">Nirma Chemical Works Pvt Ltd</p>
                        <p className="text-slate-500 font-medium">Sanand GIDC Plant, Ahmedabad, Gujarat</p>
                        <p className="text-slate-500 font-medium">GSTIN: 24AAACN9908F1Z1</p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[8px] font-bold uppercase text-right">Trip & Vehicle metadata</span>
                        <p className="text-slate-900 font-bold">Trip ID: {details.trip?.tripNumber}</p>
                        <p className="text-slate-600">Truck: {details.truck?.truckNumber} ({details.truck?.type})</p>
                        <p className="text-slate-600">Route: {details.route?.pickup} → {details.route?.destination}</p>
                      </div>
                    </div>

                    {/* Cargo Calculation summary */}
                    <table className="w-full text-left mt-3 border-collapse text-[9px]">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase bg-slate-50">
                          <th className="p-2">Material Description</th>
                          <th className="p-2 text-right">Weight (Tons)</th>
                          <th className="p-2 text-right">Freight Rate (₹)</th>
                          <th className="p-2 text-right">Total Freight (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 font-bold">{details.trip?.material}</td>
                          <td className="p-2 text-right font-mono">{details.trip?.quantity} Tons</td>
                          <td className="p-2 text-right font-mono">₹{details.trip?.rate.toLocaleString()}/Ton</td>
                          <td className="p-2 text-right font-bold font-mono">₹{selectedInvoice.subtotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Tax & Deductions calculations */}
                    <div className="grid grid-cols-2 gap-4 pt-4 text-[9px] font-semibold text-slate-600 border-t border-slate-200 mt-2">
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-slate-500 block text-[8px] font-bold uppercase">Advances & Quality Deductions</span>
                        <p className="flex justify-between"><span>Driver Advances Paid:</span> <span className="font-mono text-slate-900">₹{details.advances.toLocaleString()}</span></p>
                        {details.trip?.moisturePercent && details.trip?.moisturePercent > 2.5 && (
                          <p className="flex justify-between text-rose-600"><span>Moisture Penalty (5%):</span> <span className="font-mono font-bold">₹{Math.round(selectedInvoice.subtotal * 0.05).toLocaleString()}</span></p>
                        )}
                        <p className="flex justify-between border-t border-slate-300 pt-1 mt-1 font-bold text-slate-900"><span>Total Deductions:</span> <span className="font-mono">₹{(details.advances + (details.trip?.moisturePercent && details.trip.moisturePercent > 2.5 ? Math.round(selectedInvoice.subtotal * 0.05) : 0)).toLocaleString()}</span></p>
                      </div>

                      <div className="space-y-1.5 text-right font-sans text-[10px] text-slate-700">
                        <p className="flex justify-between pl-12"><span className="text-slate-500 font-bold uppercase">Freight Subtotal:</span> <span className="font-mono font-bold text-slate-900">₹{selectedInvoice.subtotal.toLocaleString()}</span></p>
                        <p className="flex justify-between pl-12"><span className="text-slate-500 font-bold uppercase">TDS Deducted (Sec 194C - {tdsRate}%):</span> <span className="font-mono text-rose-600">-₹{selectedInvoice.tdsDeduction.toLocaleString()}</span></p>
                        <p className="flex justify-between pl-12">
                          <span className="text-slate-500 font-bold uppercase">GST ({selectedInvoice.gstRate}%):</span> 
                          <span className="font-mono text-slate-900">{selectedInvoice.gstAmount > 0 ? `₹${selectedInvoice.gstAmount.toLocaleString()}` : 'RCM Exempt (0%)'}</span>
                        </p>
                        <p className="flex justify-between pl-12 border-t border-slate-300 pt-1.5 font-bold text-sm bg-slate-100 p-1 border rounded"><span className="text-slate-950 font-black uppercase text-xs">Net Settlement Payout:</span> <span className="font-mono text-emerald-600 font-black">₹{Math.max(0, selectedInvoice.finalAmount).toLocaleString()}</span></p>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="pt-6 border-t border-slate-200 mt-4">
                <p className="text-[8px] text-slate-400 italic text-center mb-4">{selectedInvoice.terms}</p>
                <div className="grid grid-cols-2 font-bold text-[8px] text-slate-700 pt-4">
                  <div className="text-left border-t border-slate-300 w-32 pt-1">Finance Executive Signature</div>
                  <div className="text-right border-t border-slate-300 w-32 pt-1 ml-auto">Authorised Auditor</div>
                </div>
              </div>
            </div>

            {/* Role actions workspace */}
            {activeRole !== 'Customer User' && activeRole !== 'Operator' && (
              <div className="flex gap-2 border-t border-slate-800 pt-4 print:hidden">
                {selectedInvoice.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInvoice.id, 'Approved')}
                    className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Check size={14} /> Approve Invoice
                  </button>
                )}
                {selectedInvoice.status === 'Approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInvoice.id, 'Paid')}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Coins size={14} /> Record Client Payment (Paid)
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus(selectedInvoice.id, 'Cancelled')}
                  className="w-1/2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2 border border-slate-700 rounded transition-all"
                >
                  Cancel Invoice
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <FileText size={18} className="text-tenant" /> Generate Tax Invoice
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Dispatched / Completed Trip</label>
                <select
                  required
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="">Choose trip</option>
                  {trips.filter(t => !invoices.map(i => i.tripId).includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.tripNumber} ({trucks.find(tr => tr.id === t.truckId)?.truckNumber})</option>
                  ))}
                </select>
              </div>

              {/* Indian tax customization parameters */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer col-span-2 py-1">
                  <input
                    type="checkbox"
                    checked={isRcm}
                    onChange={e => setIsRcm(e.target.checked)}
                    className="w-3.5 h-3.5 accent-tenant"
                  />
                  <span>Reverse Charge Mechanism (RCM GST 0%)</span>
                </label>
                
                {!isRcm && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">GST Rate (%)</label>
                    <select
                      value={gstRate}
                      onChange={e => setGstRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                    >
                      <option value={5}>5% (No ITC)</option>
                      <option value={12}>12% (With ITC)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">TDS (194C) Rate (%)</label>
                  <select
                    value={tdsRate}
                    onChange={e => setTdsRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold"
                  >
                    <option value={1}>1% (Individual/Proprietor)</option>
                    <option value={2}>2% (Partnership/Pvt Ltd)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Ad-hoc Deduction (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={customDeduction}
                    onChange={e => setCustomDeduction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Deduction Reason</label>
                  <input
                    type="text"
                    placeholder="Shortage, delay penalty..."
                    value={customDeductionReason}
                    onChange={e => setCustomDeductionReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Invoice Terms & Policy</label>
                <input
                  type="text"
                  value={invoiceTerms}
                  onChange={e => setInvoiceTerms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md mt-2"
                style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
              >
                Compile Tax Invoice
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
