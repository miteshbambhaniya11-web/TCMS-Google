'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, FuelLog } from '@/db/localDb';
import { aiAnalytics, DriverScoreCard, CustomerRiskCard, ProfitabilityCard } from '@/lib/aiAnalytics';
import { 
  Sparkles, TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Coins, Truck as TruckIcon, ShieldAlert, BarChart3, 
  MapPin, HelpCircle, ArrowRight, ArrowUpRight, Award, ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

import FeatureLocked from '@/components/FeatureLocked';

export default function AiCooDashboard() {
  const { activeTenant } = useTenant();

  const isAiEnabled = activeTenant?.subscription?.features?.aiInsights !== false;

  if (activeTenant && !isAiEnabled) {
    return (
      <FeatureLocked
        featureName="AI COO Summary Desk"
        featureDescription="Access executive-level operations summaries, business health scoring, driver performance ratings, and payment risk assessments."
      />
    );
  }

  // Datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // AI scores
  const [healthScore, setHealthScore] = useState<any>(null);
  const [driverScores, setDriverScores] = useState<DriverScoreCard[]>([]);
  const [customerRisk, setCustomerRisk] = useState<CustomerRiskCard[]>([]);
  const [vehicleProfit, setVehicleProfit] = useState<ProfitabilityCard[]>([]);

  // Page logs
  const [actions, setActions] = useState([
    { id: 1, title: 'Approve Empty Return Match', desc: 'Truck GJ-12-BY-4567 returning empty from Sanand. Match with load ID #101 Mundra to save ₹18,000.', savings: '₹18,000', status: 'Pending' },
    { id: 2, title: 'License Expiry Warning', desc: 'Driver Suresh Singh license expires in 25 days. Re-schedule paperwork renewal.', savings: 'Risk Mitigation', status: 'Pending' },
    { id: 3, title: 'Fuel Card Lock Recommendation', desc: 'Lock Fuel Card 88910 linked to GJ-12-BY-4567 SAMAKHIALI due to high variance warning.', savings: '₹3,500 Leakage', status: 'Pending' }
  ]);

  const loadData = () => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      
      // AI computations
      setHealthScore(aiAnalytics.getBusinessHealthScore(activeTenant.id));
      setDriverScores(aiAnalytics.getDriverPerformanceScores(activeTenant.id));
      setCustomerRisk(aiAnalytics.getCustomerRiskScores(activeTenant.id));
      setVehicleProfit(aiAnalytics.getVehicleProfitability(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleAction = (id: number) => {
    setActions(actions.map(a => a.id === id ? { ...a, status: 'Executed' } : a));
    alert('Action executed! TCMS dispatch engine updated.');
  };

  // Aggregated summaries
  const rawRevenue = vehicleProfit.reduce((a, c) => a + c.revenue, 0);
  const totalRevenue = isNaN(rawRevenue) ? 0 : rawRevenue;

  const rawExpenses = vehicleProfit.reduce((a, c) => a + c.expenses, 0);
  const totalExpenses = isNaN(rawExpenses) ? 0 : rawExpenses;

  const totalProfit = totalRevenue - totalExpenses;

  const rawMarginSum = vehicleProfit.reduce((a, c) => a + c.marginPercent, 0);
  const avgMargin = vehicleProfit.length > 0 && !isNaN(rawMarginSum)
    ? Math.round(rawMarginSum / vehicleProfit.length)
    : 0;

  const idleTrucksCount = trucks.filter(t => t.status === 'Available').length;
  const delayedTripsCount = trips.filter(t => t.delayRisk === 'High' || t.delayRisk === 'Medium').length;
  const expiriesCount = trucks.filter(t => {
    const today = new Date();
    const fit = new Date(t.fitnessExpiry);
    return fit.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Chart data: Profit trend
  const profitTrendData = [
    { name: 'Monday', Profit: (isNaN(totalProfit) ? 0 : totalProfit) * 0.15, Revenue: (isNaN(totalRevenue) ? 0 : totalRevenue) * 0.14 },
    { name: 'Tuesday', Profit: (isNaN(totalProfit) ? 0 : totalProfit) * 0.18, Revenue: (isNaN(totalRevenue) ? 0 : totalRevenue) * 0.16 },
    { name: 'Wednesday', Profit: (isNaN(totalProfit) ? 0 : totalProfit) * 0.14, Revenue: (isNaN(totalRevenue) ? 0 : totalRevenue) * 0.15 },
    { name: 'Thursday', Profit: (isNaN(totalProfit) ? 0 : totalProfit) * 0.22, Revenue: (isNaN(totalRevenue) ? 0 : totalRevenue) * 0.20 },
    { name: 'Friday', Profit: (isNaN(totalProfit) ? 0 : totalProfit) * 0.31, Revenue: (isNaN(totalRevenue) ? 0 : totalRevenue) * 0.35 }
  ];

  // Chart data: Fuel Trend
  const fuelTrendData = [
    { name: 'Week 1', Expected: 450, Actual: 472 },
    { name: 'Week 2', Expected: 510, Actual: 535 },
    { name: 'Week 3', Expected: 490, Actual: 512 },
    { name: 'Week 4', Expected: 540, Actual: 585 } // widening variance
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Welcome */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="text-teal-400 animate-spin shrink-0" size={14} />
            <span className="text-teal-400 font-bold uppercase text-[10px] tracking-wider">AI Operations Chief Desk</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">AI COO Executive Board</h2>
          <p className="text-xs text-slate-400">Consolidated executive summaries, fuel trends, and automated operational recommendations.</p>
        </div>

        {healthScore && (
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850 shrink-0">
            <div className="w-10 h-10 rounded-full border-4 border-tenant flex items-center justify-center font-extrabold text-white text-xs">
              {healthScore.score}
            </div>
            <div>
              <span className="text-slate-500 text-[8px] font-bold block uppercase">Business Health Score</span>
              <span className="text-white text-xs font-bold font-mono">Status: {healthScore.score > 80 ? 'Healthy' : 'Caution'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Daily summaries widgets grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        
        {/* Revenue widget */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-2 relative overflow-hidden group">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Daily Revenue</span>
          <div className="flex items-baseline justify-between z-10 relative">
            <span className="text-2xl font-extrabold text-white">₹{totalRevenue.toLocaleString()}</span>
            <span className="text-emerald-400 flex items-center text-[10px] font-bold font-mono">
              <TrendingUp size={10} className="mr-0.5" /> +8.4%
            </span>
          </div>
        </div>

        {/* Profit widget */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-2 relative overflow-hidden group">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Operating Profit</span>
          <div className="flex items-baseline justify-between z-10 relative">
            <span className="text-2xl font-extrabold text-white">₹{totalProfit.toLocaleString()}</span>
            <span className="text-emerald-400 flex items-center text-[10px] font-bold font-mono">
              <TrendingUp size={10} className="mr-0.5" /> +12.3%
            </span>
          </div>
        </div>

        {/* Idle Trucks widget */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-2 relative overflow-hidden group">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Idle Trucks</span>
          <div className="flex items-baseline justify-between z-10 relative">
            <span className="text-2xl font-extrabold text-white">{idleTrucksCount} <span className="text-slate-500 font-medium text-xs">/ {trucks.length}</span></span>
            {idleTrucksCount > 2 && <span className="text-amber-400 text-[10px] font-bold">Capacity Open</span>}
          </div>
        </div>

        {/* Overdue billing widget */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-2 relative overflow-hidden group">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Delayed & Overdue</span>
          <div className="flex items-baseline justify-between z-10 relative">
            <span className="text-2xl font-extrabold text-white">{delayedTripsCount} <span className="text-slate-500 font-medium text-xs">Trips</span></span>
            {delayedTripsCount > 0 && <span className="text-rose-400 text-[10px] font-bold animate-pulse">Alerts Active</span>}
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
        
        {/* Profit trend chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Coins size={16} className="text-tenant" /> Weekly Revenue & Operating Profit Trends
          </h4>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitTrendData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.05)" strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Efficiency Line chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <TrendingDown size={16} className="text-rose-400" /> Fuel Burn Variance Analysis (Weekly)
          </h4>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="Expected" stroke="#38bdf8" strokeWidth={2} />
                <Line type="monotone" dataKey="Actual" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recommended actions list (COO core module) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
        
        {/* Recommended actions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-850 pb-2">
            AI COO Recommended Actions
          </h3>

          <div className="space-y-3">
            {actions.map(action => (
              <div key={action.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
                      {action.savings}
                    </span>
                    <h4 className="text-white font-extrabold text-xs">{action.title}</h4>
                  </div>
                  <p className="text-slate-400 font-medium leading-relaxed">{action.desc}</p>
                </div>

                <button
                  disabled={action.status === 'Executed'}
                  onClick={() => handleAction(action.id)}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all shrink-0 ${
                    action.status === 'Executed' 
                      ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800' 
                      : 'bg-tenant hover:bg-tenant/90 text-white shadow shadow-tenant/20'
                  }`}
                >
                  {action.status === 'Executed' ? 'Applied' : 'Execute Action'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Business alert logs summary */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-850 pb-2 mb-3">
              Operational Alerts Summary
            </h3>
            
            <div className="space-y-2.5 font-semibold text-slate-400">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex justify-between items-center">
                <span>Delayed Trips:</span>
                <span className="text-amber-400">{delayedTripsCount} Trips</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex justify-between items-center">
                <span>Near-Expiry Paperwork:</span>
                <span className="text-rose-400">{expiriesCount} Documents</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex justify-between items-center">
                <span>Overdue Customer invoices:</span>
                <span className="text-white">2 Invoices</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-500 leading-normal">
            <p className="text-slate-400 font-bold uppercase mb-1">AI Recommendation Model</p>
            <p>Our algorithms refresh every hour, matching telemetry GPS coordinates, weighbridge logs, and fuel slips to suggest margin tweaks.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
