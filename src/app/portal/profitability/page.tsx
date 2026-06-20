'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { aiAnalytics, ProfitabilityCard, EmptyReturnOpportunity } from '@/lib/aiAnalytics';
import { localDb } from '@/db/localDb';
import { 
  Coins, Percent, TrendingUp, TrendingDown, Layers, 
  ArrowUpRight, AlertCircle, CheckCircle, RefreshCw, 
  BookOpen, HelpCircle, ArrowRightLeft, DollarSign, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';

export default function ProfitabilityPage() {
  const { activeTenant } = useTenant();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'margins' | 'empty-return' | 'working-capital'>('margins');

  // Datasets from AI
  const [vehicleProfit, setVehicleProfit] = useState<ProfitabilityCard[]>([]);
  const [routeProfit, setRouteProfit] = useState<ProfitabilityCard[]>([]);
  const [customerProfit, setCustomerProfit] = useState<ProfitabilityCard[]>([]);
  const [emptyReturns, setEmptyReturns] = useState<EmptyReturnOpportunity[]>([]);
  const [rateRecommendations, setRateRecommendations] = useState<any[]>([]);

  // Local state for actions
  const [bookedLoads, setBookedLoads] = useState<number[]>([]);

  const loadData = () => {
    if (activeTenant) {
      setVehicleProfit(aiAnalytics.getVehicleProfitability(activeTenant.id));
      setRouteProfit(aiAnalytics.getRouteProfitability(activeTenant.id));
      setCustomerProfit(aiAnalytics.getCustomerProfitability(activeTenant.id));
      setEmptyReturns(aiAnalytics.getEmptyReturnOpportunities(activeTenant.id));
      setRateRecommendations(aiAnalytics.getSmartRateRecommendations(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleBookLoad = (loadId: number) => {
    if (bookedLoads.includes(loadId)) return;
    setBookedLoads([...bookedLoads, loadId]);
    alert(`Return load #${loadId} booked successfully! Dispatched driver notification and updated Manifest.`);
  };

  // Aggregated margins
  const overallRevenue = vehicleProfit.reduce((a, c) => a + c.revenue, 0);
  const overallExpenses = vehicleProfit.reduce((a, c) => a + c.expenses, 0);
  const overallProfit = overallRevenue - overallExpenses;
  const overallMargin = overallRevenue > 0 ? Math.round((overallProfit / overallRevenue) * 100) : 0;

  // Mocked Working Capital Data
  const workingCapitalData = [
    { month: 'Jan', Receivables: 1850000, Payables: 1200000, WorkingCapital: 650000 },
    { month: 'Feb', Receivables: 2100000, Payables: 1350000, WorkingCapital: 750000 },
    { month: 'Mar', Receivables: 1950000, Payables: 1500000, WorkingCapital: 450000 },
    { month: 'Apr', Receivables: 2400000, Payables: 1650000, WorkingCapital: 750000 },
    { month: 'May', Receivables: 2850000, Payables: 1800000, WorkingCapital: 1050000 },
    { month: 'Jun', Receivables: overallRevenue * 1.2, Payables: overallExpenses * 1.1, WorkingCapital: (overallRevenue * 1.2) - (overallExpenses * 1.1) }
  ];

  // Compliance summary calculations (Local Indian Rules)
  // TDS Section 194C is 1% for Indiv/HUF and 2% for Companies
  const projectedTDS = Math.round(overallRevenue * 0.02); // assuming 2% corporate TDS deduction
  // GST RCM (Reverse Charge Mechanism) usually 5% without ITC or 12% with ITC.
  const projectedRCM = Math.round(overallRevenue * 0.05);

  return (
    <div className="space-y-6">
      
      {/* Title Header banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-xl border border-slate-850">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Coins className="text-emerald-400 shrink-0" size={14} />
            <span className="text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider">Financial Operations Desk</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Profitability & Capital Desk</h2>
          <p className="text-xs text-slate-400">Evaluate trip margins, empty-run matching, Indian TDS/RCM tax metrics, and cash flow projections.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('margins')} 
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'margins' ? 'bg-tenant text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Operating Margins
          </button>
          <button 
            onClick={() => setActiveTab('empty-return')} 
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'empty-return' ? 'bg-tenant text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Empty Return Engine
          </button>
          <button 
            onClick={() => setActiveTab('working-capital')} 
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'working-capital' ? 'bg-tenant text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Working Capital & Tax
          </button>
        </div>
      </div>

      {/* Margins Overview tab content */}
      {activeTab === 'margins' && (
        <div className="space-y-6">
          {/* Top level stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Fleet Revenue</span>
                <span className="text-2xl font-extrabold text-white">₹{overallRevenue.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Fleet Expenses</span>
                <span className="text-2xl font-extrabold text-white">₹{overallExpenses.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <TrendingDown size={24} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Projected Profit Margin</span>
                <span className="text-2xl font-extrabold text-white">{overallMargin}%</span>
              </div>
              <div className="p-3 bg-tenant/10 rounded-xl text-tenant">
                <Percent size={24} />
              </div>
            </div>
          </div>

          {/* Margins breakdown grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Route margins list */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-850 pb-2">
                <span>Route Profitability</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Standard Rates</span>
              </h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {routeProfit.map(r => (
                  <div key={r.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white text-xs font-bold truncate max-w-[70%]">{r.name}</h4>
                      <span className={`text-xs font-mono font-extrabold ${r.marginPercent > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {r.marginPercent}% Margin
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Revenue: ₹{r.revenue.toLocaleString()}</span>
                      <span>Profit: ₹{r.profit.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle margins list */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-850 pb-2">
                <span>Truck Fleet Margins</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Self vs Attached</span>
              </h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {vehicleProfit.map(v => (
                  <div key={v.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white text-xs font-bold font-mono">{v.name}</h4>
                      <span className={`text-xs font-mono font-extrabold ${v.marginPercent > 35 ? 'text-emerald-400' : v.marginPercent > 20 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {v.marginPercent}% Margin
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Revenue: ₹{v.revenue.toLocaleString()}</span>
                      <span>Spends: ₹{v.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer margins list */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-850 pb-2">
                <span>Customer Account Margins</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Corporate Client</span>
              </h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {customerProfit.map(c => (
                  <div key={c.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white text-xs font-bold">{c.name}</h4>
                      <span className="text-xs font-mono font-extrabold text-teal-400">
                        {c.marginPercent}% Margin
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Invoiced: ₹{c.revenue.toLocaleString()}</span>
                      <span>Net profit: ₹{c.profit.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* AI Smart Rate Strategy recommendations */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Layers className="text-tenant" size={16} /> AI Smart Rate Optimization Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-semibold text-xs">
              {rateRecommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[8px] font-bold uppercase tracking-wider block">Route Target</span>
                    <h4 className="text-white font-extrabold text-xs">{rec.routeName}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center py-2 bg-slate-900/50 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[8px] uppercase block">Contractor Rate</span>
                      <span className="text-slate-300 font-mono text-xs">₹{rec.currentRate}</span>
                    </div>
                    <div>
                      <span className="text-teal-400 text-[8px] uppercase block">AI Rec Rate</span>
                      <span className="text-teal-400 font-mono text-xs font-bold">₹{rec.aiRecommendedRate}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400 text-[10px] leading-relaxed">
                    <ArrowUpRight className="text-emerald-400 shrink-0 mt-0.5" size={12} />
                    <span>{rec.advice} (Delta: <strong className="text-emerald-400">+{rec.marginDeltaPercent}%</strong>)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty Return Engine tab content */}
      {activeTab === 'empty-return' && (
        <div className="space-y-6">
          {/* Header alert */}
          <div className="bg-teal-950/30 border border-teal-900/50 p-4 rounded-xl text-xs text-teal-400 flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h4 className="font-bold text-teal-200">Empty Return Opportunity Matcher</h4>
              <p className="leading-relaxed">
                When trucks deliver salt or raw materials to chemical refineries, they often travel back to Mundra or Gandhidham completely empty, losing diesel expenses. 
                Our AI matcher finds local shippers looking for bulk transit back on the same route, booking backhauls to optimize margins.
              </p>
            </div>
          </div>

          {/* Empty returns opportunities */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-850 pb-2">
              Detected Backhaul Opportunities
            </h3>
            
            <div className="space-y-4 font-semibold text-xs">
              {emptyReturns.length === 0 ? (
                <p className="text-slate-500 text-center py-6 font-medium">No empty return opportunities currently active.</p>
              ) : (
                emptyReturns.map((item, idx) => {
                  const isBooked = bookedLoads.includes(item.recommendedMarketplaceLoadId);
                  return (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-slate-700">
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded text-[10px]">
                            {item.truckNumber}
                          </span>
                          <span className="text-slate-500 text-[10px]">Trip ID: {item.tripId}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase font-mono">
                            Match Score: {item.matchScore}%
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-slate-300">
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase block">Current Location</span>
                            <span>{item.currentDestination}</span>
                          </div>
                          <ArrowRightLeft className="text-slate-500" size={14} />
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase block">Suggested Empty Return Backhaul</span>
                            <span>{item.emptyReturnRoute}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                        <div className="text-right">
                          <span className="text-slate-500 text-[8px] uppercase block">Est. Return Load Revenue</span>
                          <span className="text-emerald-400 font-extrabold text-sm">₹{item.potentialSavings.toLocaleString()}</span>
                        </div>

                        <button
                          disabled={isBooked}
                          onClick={() => handleBookLoad(item.recommendedMarketplaceLoadId)}
                          className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                            isBooked 
                              ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow shadow-emerald-500/10'
                          }`}
                        >
                          {isBooked ? 'Return Booked' : 'Book Load'}
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Working Capital & Cash Flow tab content */}
      {activeTab === 'working-capital' && (
        <div className="space-y-6 font-semibold text-xs">
          
          {/* Compliance cards info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cash flow card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Capital Status</h4>
              <div className="flex justify-between items-baseline border-b border-slate-850 pb-2">
                <span className="text-2xl font-extrabold text-white">₹{projectedTDS.toLocaleString()}</span>
                <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">TDS Section 194C</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Transporters are subject to 1% or 2% TDS on contractor payments. TCMS automatically computes TDS credits on invoices to match 26AS records.
              </p>
            </div>

            {/* GST RCM compliance */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST RCM Provision</h4>
              <div className="flex justify-between items-baseline border-b border-slate-850 pb-2">
                <span className="text-2xl font-extrabold text-white">₹{projectedRCM.toLocaleString()}</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">GST 5% Reverse Charge</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Reverse Charge Mechanism (RCM) applies to transport operators in India. The recipient pays the GST directly, which TCMS auto-tags for compliance auditing.
              </p>
            </div>

            {/* Working capital forecast */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Position</h4>
              <div className="flex justify-between items-baseline border-b border-slate-850 pb-2">
                <span className="text-2xl font-extrabold text-white">₹{(overallProfit * 0.9).toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Positive Inflow</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Accounts receivable (outstanding client billing) vs accounts payable (contractor payouts & driver wallets) are matched to ensure liquidity is maintained.
              </p>
            </div>

          </div>

          {/* Working Capital chart widget */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[350px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <DollarSign size={16} className="text-tenant" /> Working Capital & Outstanding Account Receivable Trends
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Comparing monthly receivables (customer billing) vs payables (attached contractor hires) to manage liquidity.</p>
            </div>
            
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workingCapitalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Receivables" fill="#38bdf8" name="Accounts Receivable" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Payables" fill="#fb7185" name="Accounts Payable" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="WorkingCapital" fill="#34d399" name="Net Working Capital" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
