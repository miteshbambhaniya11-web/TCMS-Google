'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, VehicleExpense, FuelLog } from '@/db/localDb';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { 
  TrendingUp, Calendar, AlertTriangle, AlertCircle, 
  MapPin, CheckCircle, Clock, CreditCard, Fuel, Wrench, 
  Settings2, Plus, RotateCcw, HelpCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  size: 'small' | 'large'; // small = 1 col, large = 2 cols
}

export default function Dashboard() {
  const { activeTenant, activeRole } = useTenant();

  // Load datasets matching tenant
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  // Widget settings
  const [showConfig, setShowConfig] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'trips_metric', name: 'Trips Metrics Summary', visible: true, size: 'small' },
    { id: 'trucks_metric', name: 'Fleet Utilization Card', visible: true, size: 'small' },
    { id: 'wallet_metric', name: 'Outstanding Payments Card', visible: true, size: 'small' },
    { id: 'ai_alerts', name: 'Real-time AI Warnings', visible: true, size: 'small' },
    { id: 'contractor_chart', name: 'Contractor Volume Chart', visible: true, size: 'large' },
    { id: 'expense_chart', name: 'Maintenance Expense Pie', visible: true, size: 'small' },
    { id: 'fuel_chart', name: 'Fuel Expected vs Actual Line', visible: true, size: 'large' },
    { id: 'gps_widget', name: 'GPS Track Status Monitor', visible: true, size: 'small' },
  ]);

  useEffect(() => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setExpenses(localDb.getVehicleExpenses(activeTenant.id));
      setFuelLogs(localDb.getFuelLogs(activeTenant.id));
    }
  }, [activeTenant]);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const resizeWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, size: w.size === 'small' ? 'large' : 'small' } : w));
  };

  const resetWidgets = () => {
    setWidgets(widgets.map(w => ({ ...w, visible: true, size: w.id.includes('chart') ? 'large' : 'small' })));
  };

  // Metrics calculators
  const activeTripsCount = trips.filter(t => !['Completed', 'Cancelled', 'Delivered'].includes(t.status)).length;
  const delayedTripsCount = trips.filter(t => t.delayRisk === 'High' || t.delayRisk === 'Medium').length;
  const pendingPaymentsAmount = trips
    .filter(t => t.status === 'Completed' || t.status === 'Delivered')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const availableTrucksCount = trucks.filter(t => t.status === 'Available').length;
  const activeDriversCount = drivers.filter(d => d.status === 'On Trip').length;

  // Chart Data: Contractor Volume
  const contractorData = localDb.getContractors(activeTenant?.id || 'tenant-1').map(c => {
    const totalFreight = trips
      .filter(t => t.contractorId === c.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: c.name.split(' ')[0], Freight: totalFreight };
  });

  // Chart Data: Expense Category Distribution
  const expenseCategories = ['Service', 'Tyres', 'Repairs', 'Insurance', 'Miscellaneous'];
  const colors = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const expenseData = expenseCategories.map(cat => {
    const total = expenses
      .filter(e => e.category === cat)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: cat, value: total || 5000 }; // fallback for empty seeds
  });

  // Chart Data: Fuel Expected vs Actual
  const fuelData = fuelLogs.map((log, idx) => ({
    name: `Trip ${idx + 1}`,
    Expected: log.expectedFuel,
    Actual: log.actualFuel,
    Variance: log.variance,
  }));

  // Render Widget based on ID
  const renderWidget = (id: string) => {
    switch (id) {
      case 'trips_metric':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-tenant/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-sky-500/10 transition-all" />
            <div className="space-y-1 z-10">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Trips In Transit</span>
              <span className="text-3xl font-extrabold text-white block">{activeTripsCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-4 border-t border-slate-800/80 pt-3 z-10 justify-between">
              <span className="flex items-center gap-1"><Clock size={12} className="text-sky-500" /> {trips.length} Total Logs</span>
              <Link href="/portal/trips" className="text-tenant hover:underline flex items-center gap-0.5">Trips Board <ArrowRight size={10} /></Link>
            </div>
          </div>
        );

      case 'trucks_metric':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-tenant/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-emerald-500/10 transition-all" />
            <div className="space-y-1 z-10">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Fleet Available</span>
              <span className="text-3xl font-extrabold text-white block">{availableTrucksCount} <span className="text-xs text-slate-500 font-medium">/ {trucks.length} Trucks</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-4 border-t border-slate-800/80 pt-3 z-10 justify-between">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> {activeDriversCount} Drivers Active</span>
              <Link href="/portal/trucks" className="text-tenant hover:underline flex items-center gap-0.5">Fleet List <ArrowRight size={10} /></Link>
            </div>
          </div>
        );

      case 'wallet_metric':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-tenant/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-amber-500/10 transition-all" />
            <div className="space-y-1 z-10">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Pending Billing</span>
              <span className="text-3xl font-extrabold text-white block">₹{(pendingPaymentsAmount).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-4 border-t border-slate-800/80 pt-3 z-10 justify-between">
              <span className="flex items-center gap-1"><CreditCard size={12} className="text-amber-500" /> 154C Calculations</span>
              <Link href="/portal/invoices" className="text-tenant hover:underline flex items-center gap-0.5">Billing <ArrowRight size={10} /></Link>
            </div>
          </div>
        );

      case 'ai_alerts':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between h-full relative overflow-hidden group hover:border-tenant/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-rose-500/10 transition-all" />
            <div className="space-y-1 z-10">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">AI Exception Alerts</span>
              <span className="text-3xl font-extrabold text-white block">{delayedTripsCount} <span className="text-xs text-rose-500 font-medium">Warnings</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-4 border-t border-slate-800/80 pt-3 z-10 justify-between">
              <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-rose-500 animate-bounce" /> 1 Route Deviation Alert</span>
              <Link href="/portal/ai" className="text-tenant hover:underline flex items-center gap-0.5">AI Center <ArrowRight size={10} /></Link>
            </div>
          </div>
        );

      case 'contractor_chart':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calendar size={16} className="text-sky-500" /> Contractor Freight Turnover (₹)
            </h4>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractorData.length > 0 ? contractorData : [{ name: 'Dummy', Freight: 10000 }]}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="Freight" fill="var(--tenant-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'expense_chart':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Wrench size={16} className="text-amber-500" /> Fleet Maintenance Split
            </h4>
            <div className="flex-grow flex items-center justify-center text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 flex-wrap text-[10px] text-slate-400 font-semibold">
              {expenseData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'fuel_chart':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Fuel size={16} className="text-emerald-500" /> Expected vs Actual Fuel (Litres)
            </h4>
            <div className="flex-grow text-xs w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelData.length > 0 ? fuelData : [{ name: 'Trip 1', Expected: 100, Actual: 110, Variance: 10 }]}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Legend verticalAlign="top" height={36} fontSize={10} />
                  <Line type="monotone" dataKey="Expected" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'gps_widget':
        return (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-[300px] flex flex-col justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin size={16} className="text-rose-500" /> Active GPS Trackers
            </h4>
            
            <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-850 flex flex-col justify-center items-center text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-full animate-pulse">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-white font-bold text-xs">GPS Signal Online</p>
                <p className="text-[10px] text-slate-500 font-medium">3 Trucks sending GPS coordinates via driver WhatsApp</p>
              </div>
            </div>

            <Link href="/portal/gps" className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold py-2 rounded-lg text-center border border-slate-700 transition-all block">
              Launch Live GPS Map
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Welcome back, {activeRole}</h2>
          <p className="text-xs text-slate-400">Here is what's happening at <strong>{activeTenant?.name}</strong> today.</p>
        </div>

        {/* Dashboard config actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Settings2 size={14} /> Customize Dashboard
          </button>
        </div>
      </div>

      {/* Widget Customizer Console */}
      {showConfig && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-white">Customize Dashboard Layout</h4>
              <p className="text-slate-500 text-[10px]">Toggle the visibility and layout configurations for your home widgets.</p>
            </div>
            <button 
              onClick={resetWidgets}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw size={10} /> Reset to Defaults
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {widgets.map(w => (
              <div key={w.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={w.visible}
                    onChange={() => toggleWidget(w.id)}
                    className="w-3.5 h-3.5 accent-tenant rounded"
                  />
                  <span className="text-slate-300">{w.name}</span>
                </div>
                {w.visible && (
                  <button 
                    onClick={() => resizeWidget(w.id)}
                    className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase hover:text-white font-bold"
                  >
                    {w.size === 'small' ? 'Double size' : 'Single size'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.filter(w => w.visible).map(w => (
          <div 
            key={w.id} 
            className={`${
              w.size === 'large' 
                ? 'md:col-span-2' 
                : 'col-span-1'
            }`}
          >
            {renderWidget(w.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
