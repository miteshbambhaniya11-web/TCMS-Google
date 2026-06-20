'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, Route } from '@/db/localDb';
import { FileText, Printer, Settings2, Eye, Download, X, HelpCircle, Scale } from 'lucide-react';

export default function ChallansPage() {
  const { activeTenant } = useTenant();

  // DB datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  // States
  const [selectedTripId, setSelectedTripId] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Challan custom config
  const [prefix, setPrefix] = useState('ASC-2026-');
  const [logoText, setLogoText] = useState('ADANI SALT CORP');
  const [headerContent, setHeaderContent] = useState('Mundra Port Salt Works, Kutch, Gujarat - 370421');
  const [footerContent, setFooterContent] = useState('Subject to Mundra jurisdiction. Received goods in good condition.');
  const [includeWeighbridge, setIncludeWeighbridge] = useState(true);
  const [includeDriverDetails, setIncludeDriverDetails] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  useEffect(() => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setRoutes(localDb.getRoutes(activeTenant.id));
      
      // Seed default configs matching active tenant
      setPrefix(activeTenant.numberSeries.challanPrefix);
      setLogoText(activeTenant.name.toUpperCase());
      setHeaderContent(`${activeTenant.address} | GSTIN: ${activeTenant.gstNumber}`);
    }
  }, [activeTenant]);

  const activeTrip = trips.find(t => t.id === selectedTripId);
  const activeTruck = trucks.find(t => t?.id === activeTrip?.truckId);
  const activeDriver = drivers.find(d => d?.id === activeTrip?.driverId);

  const handlePrint = () => {
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
          #print-document, #print-document * {
            visibility: visible;
          }
          #print-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-white">Customizable Challan Desk</h2>
          <p className="text-xs text-slate-400">Design loading challans, map weights, and generate print-ready PDF attachments.</p>
        </div>
      </div>

      {/* Grid customization board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* Left Side: Builder Control Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <Settings2 size={16} className="text-tenant" /> Document Configurator
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Select Active Trip Cargo</label>
              <select
                value={selectedTripId}
                onChange={e => {
                  setSelectedTripId(e.target.value);
                  setShowPreview(true);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
              >
                <option value="">Select a trip to load metadata</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} ({trucks.find(tr => tr.id === t.truckId)?.truckNumber || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Challan Number Series Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Logo Text (Header Banner)</label>
              <input
                type="text"
                value={logoText}
                onChange={e => setLogoText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Header Address / Contact Details</label>
              <textarea
                value={headerContent}
                onChange={e => setHeaderContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none h-16 resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Footer Declaration / Terms</label>
              <textarea
                value={footerContent}
                onChange={e => setFooterContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none h-16 resize-none"
              />
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <span className="text-slate-400 block font-bold mb-1">Optional Metadata Fields</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWeighbridge}
                    onChange={e => setIncludeWeighbridge(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-tenant"
                  />
                  <span>Weighbridge Slip Net Weights (Salt Industry parameters)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDriverDetails}
                    onChange={e => setIncludeDriverDetails(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-tenant"
                  />
                  <span>Driver details (License Number, Aadhaar card reference)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={e => setIncludeNotes(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-tenant"
                  />
                  <span>Special dispatching notes and instructions</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Document Preview Canvas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[580px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 uppercase flex items-center gap-1">
              <Eye size={14} className="text-slate-400" /> Live Document Canvas
            </span>
            {showPreview && activeTrip && (
              <button
                onClick={handlePrint}
                className="bg-tenant hover:bg-tenant/90 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-lg"
              >
                <Printer size={12} /> Print Challan / Save PDF
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto p-8 bg-slate-950 flex items-start justify-center scrollbar-thin scrollbar-thumb-slate-800">
            {showPreview && activeTrip ? (
              
              /* PREVIEW LEAFLET CHALLAN CONTAINER */
              <div 
                id="print-document" 
                className="w-[500px] bg-white border border-slate-300 p-6 text-slate-900 font-serif leading-relaxed text-[11px] shadow-lg flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div className="border-b-2 border-slate-800 pb-3 text-center space-y-1">
                  <h2 className="text-lg font-black tracking-wide text-slate-900 uppercase">{logoText}</h2>
                  <p className="text-[9px] text-slate-500 font-sans italic">{headerContent}</p>
                  <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest bg-slate-100 py-0.5 mt-1 border border-slate-200">DELIVERY CHALLAN</p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 py-4 font-sans text-[10px] border-b border-slate-200">
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-bold uppercase">Challan Number:</span> <span className="font-bold">{prefix}{activeTrip.tripNumber.split('-')[2]}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Booking Date:</span> <span className="font-semibold">{new Date(activeTrip.createdAt).toLocaleDateString()}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Vehicle Number:</span> <span className="font-bold">{activeTruck?.truckNumber}</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p><span className="text-slate-500 font-bold uppercase">Source:</span> <span className="font-semibold">{activeTrip.pickup}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Destination:</span> <span className="font-semibold">{activeTrip.destination}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Material:</span> <span className="font-bold">{activeTrip.material}</span></p>
                  </div>
                </div>

                {/* Weighbridge parameters */}
                {includeWeighbridge && activeTrip.weighbridgeSlipNo && (
                  <div className="py-3 border-b border-slate-200 font-sans">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1"><Scale size={10} /> Weighbridge Cargo Weight Slip</h4>
                    <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2 border border-slate-200 rounded text-[9px] text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[7px] font-bold">SLIP TICKET</span>
                        <span className="font-mono">{activeTrip.weighbridgeSlipNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px] font-bold">GROSS WEIGHT</span>
                        <span>{activeTrip.grossWeight} Tons</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px] font-bold">TARE WEIGHT</span>
                        <span>{activeTrip.tareWeight} Tons</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7px] font-bold">NET PAYLOAD</span>
                        <span className="font-extrabold text-slate-900">{activeTrip.netWeight} Tons</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver information */}
                {includeDriverDetails && activeDriver && (
                  <div className="py-3 border-b border-slate-200 font-sans text-[10px] text-slate-700 space-y-1">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase mb-1">Driver Verification Reference</h4>
                    <p><span className="text-slate-400 font-bold">Driver Name:</span> {activeDriver.name} | <span className="text-slate-400 font-bold">License:</span> {activeDriver.licenseNumber}</p>
                    <p><span className="text-slate-400 font-bold">Aadhaar Card:</span> {activeDriver.aadhaarNumber}</p>
                  </div>
                )}

                {/* Notes */}
                {includeNotes && activeTrip.notes && (
                  <div className="py-3 border-b border-slate-200 font-sans text-[10px] text-slate-700">
                    <span className="text-slate-500 block text-[9px] font-bold uppercase">Special Shipping notes</span>
                    <p className="italic">"{activeTrip.notes}"</p>
                  </div>
                )}

                {/* Declaration footer and signatures */}
                <div className="pt-8 space-y-6">
                  <p className="text-[8px] text-slate-500 text-center italic">{footerContent}</p>
                  
                  <div className="grid grid-cols-2 pt-6 font-sans text-[9px] text-slate-700 font-bold">
                    <div className="text-left">
                      <div className="border-t border-slate-400 w-36 pt-1">Driver Signature</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="border-t border-slate-400 w-36 pt-1">Authorised Signatory</div>
                    </div>
                  </div>
                </div>

              </div>

            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 text-center space-y-2 max-w-sm">
                <FileText size={32} />
                <p className="font-semibold text-xs">Choose an active trip from the builder control dropdown on the left to render the delivery challan template preview.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
