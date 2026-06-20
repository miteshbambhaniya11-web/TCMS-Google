'use client';

import React, { useState } from 'react';
import { useTenant } from '@/context/tenantContext';
import { FileText, Calendar, Search, Download, HelpCircle, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const { activeTenant } = useTenant();

  // States
  const [reportType, setReportType] = useState('trips');
  const [format, setFormat] = useState('CSV');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-19');
  
  // Loader
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const triggerExport = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setStatusMessage('Compiling database records...');

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === 40) setStatusMessage('Structuring table schemas...');
        if (prev === 80) setStatusMessage('Formatting CSV/Excel sheets...');
        
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          alert(`Report successfully exported! File saved as: ${reportType}_report_${startDate}_to_${endDate}.${format.toLowerCase()}`);
          return 100;
        }
        return prev + 20;
      });
    }, 450);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Central Reports Desk</h2>
          <p className="text-xs text-slate-400">Compile trip logs, driver wallet advances, fuel variances, and fleet expenses into formatted downloads.</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 text-xs font-semibold">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-3">
          <FileText size={16} className="text-tenant" /> Compile Audit Statement
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">Select Report Category</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
            >
              <option value="trips">Trip Assignments Sheet</option>
              <option value="trucks">Truck utilization Reports</option>
              <option value="drivers">Driver wallets ledger statement</option>
              <option value="contractors">Contractor freight volumes</option>
              <option value="fuel">Fuel Expected vs Actual variance</option>
              <option value="expenses">Maintenance spent category pie</option>
              <option value="ai">AI warnings & theft exceptions</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">Export Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
            >
              <option value="CSV">Comma Separated Values (CSV)</option>
              <option value="XLSX">Microsoft Excel Sheet (XLSX)</option>
              <option value="PDF">Document format (PDF)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        {downloading ? (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 text-center space-y-3">
            <RefreshCw className="animate-spin text-tenant mx-auto" size={24} />
            <div>
              <p className="text-white font-bold">{statusMessage}</p>
              <p className="text-[10px] text-slate-500 font-medium font-mono">{downloadProgress}% completed</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-tenant h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        ) : (
          <button
            onClick={triggerExport}
            className="w-full text-white font-bold py-2.5 rounded transition-all shadow-md flex items-center justify-center gap-1.5"
            style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
          >
            <Download size={16} /> Compile & Export Statement
          </button>
        )}

      </div>

    </div>
  );
}
