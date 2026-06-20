'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Trip, Truck, Driver, FuelLog } from '@/db/localDb';
import { Cpu, Send, Sparkles, MessageSquare, AlertTriangle, Scale, Clock, ShieldAlert, X } from 'lucide-react';

interface ChatBubble {
  sender: 'user' | 'dispatcher';
  text: string;
  timestamp: string;
}

import FeatureLocked from '@/components/FeatureLocked';

export default function AiPage() {
  const { activeTenant } = useTenant();

  const isAiEnabled = activeTenant?.subscription?.features?.aiInsights !== false;

  if (activeTenant && !isAiEnabled) {
    return (
      <FeatureLocked
        featureName="AI Smart Dispatcher & Analytics"
        featureDescription="Interact with your logistics operations using natural language, analyze empty returns, and get auto-summaries."
      />
    );
  }

  // DB datasets
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  // States
  const [inputText, setInputText] = useState('');
  const [chatLog, setChatLog] = useState<ChatBubble[]>([
    {
      sender: 'dispatcher',
      text: 'Hello! I am your TCMS Smart Dispatcher AI. Ask me about delayed trips, fuel exceptions, pending payments, or truck allocations.',
      timestamp: new Date().toISOString(),
    }
  ]);

  const loadData = () => {
    if (activeTenant) {
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));
      setDrivers(localDb.getDrivers(activeTenant.id));
      setFuelLogs(localDb.getFuelLogs(activeTenant.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newUserMsg: ChatBubble = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setChatLog(prev => [...prev, newUserMsg]);
    setInputText('');

    // AI thinking simulation
    setTimeout(() => {
      processSmartDispatcher(userText);
    }, 1000);
  };

  const processSmartDispatcher = (query: string) => {
    const q = query.toLowerCase();
    let reply = '';

    // NLP commands matches
    if (q.includes('delay') || q.includes('late')) {
      const delayedList = trips.filter(t => t.delayRisk === 'High' || t.delayRisk === 'Medium');
      if (delayedList.length > 0) {
        reply = `Found ${delayedList.length} trip(s) showing delay risk:\n`;
        delayedList.forEach(t => {
          const tr = trucks.find(tk => tk.id === t.truckId)?.truckNumber || 'N/A';
          const dr = drivers.find(d => d.id === t.driverId)?.name || 'N/A';
          reply += `- Trip ${t.tripNumber} (Vehicle: ${tr}, Driver: ${dr}) - Risk: ${t.delayRisk} Risk. Reason: Current GPS indicates route deviation.\n`;
        });
      } else {
        reply = "Great! All active trip assignments in the database are currently tracking on schedule with Low Delay Risk.";
      }
    } else if (q.includes('payment') || q.includes('money') || q.includes('billing')) {
      const pendingSum = trips
        .filter(t => t.status === 'Completed' || t.status === 'Delivered')
        .reduce((acc, curr) => acc + curr.amount, 0);
      reply = `Total pending client billing settlements found in database: ₹${pendingSum.toLocaleString()}.\n- Trip ASC-2026-00001 (Refined Salt): ₹29,150 (Delivered)\n- Trip ASC-2026-00002 (Raw Salt): ₹24,830 (Delivered)`;
    } else if (q.includes('truck') && (q.includes('no driver') || q.includes('without driver') || q.includes('idle'))) {
      const idleTrucks = trucks.filter(t => !t.driverId || t.status === 'Available');
      if (idleTrucks.length > 0) {
        reply = `Found ${idleTrucks.length} vehicle(s) currently unassigned or available:\n`;
        idleTrucks.forEach(t => {
          reply += `- Vehicle ${t.truckNumber} (${t.type}) - Status: Available. Ready for driver assignment.\n`;
        });
      } else {
        reply = "All active fleet vehicles in registry currently have active trip drivers assigned.";
      }
    } else if (q.includes('fuel') || q.includes('leak') || q.includes('variance') || q.includes('theft')) {
      const fuelAlerts = fuelLogs.filter(f => f.hasTheftAlert || f.variance > 5);
      if (fuelAlerts.length > 0) {
        reply = `Detected ${fuelAlerts.length} fuel variance exceptions exceeding limits:\n`;
        fuelAlerts.forEach(f => {
          const tripNo = trips.find(t => t.id === f.tripId)?.tripNumber || 'N/A';
          const truckNo = trucks.find(t => t.id === f.truckId)?.truckNumber || 'N/A';
          reply += `- Trip ${tripNo} (Vehicle: ${truckNo}) - refuel variance +${f.variance} Litres at ${f.refuelLocation}. Flagged as theft/spill warning.\n`;
        });
      } else {
        reply = "Normal performance: expected diesel burns align with route standard tolerances. No theft exceptions triggered.";
      }
    } else if (q.includes('driver of') || q.includes('who drives')) {
      // Extract truck number matches
      const match = trucks.find(t => q.includes(t.truckNumber.toLowerCase().replace(/[^a-z0-9]/g, '')));
      if (match) {
        const dr = drivers.find(d => d.id === match.driverId);
        reply = `Driver ${dr?.name || 'Unassigned'} is currently assigned to Truck ${match.truckNumber}. Status: ${match.status}.`;
      } else {
        reply = "Could not find that vehicle number in our registry. Please query a valid truck number like 'GJ-12-BY-4567'.";
      }
    } else {
      reply = "I parsed your query but couldn't locate a matches. Try asking:\n- 'Show delayed trips'\n- 'Show pending payments'\n- 'Show trucks without drivers'\n- 'Show fuel exceptions'\n- 'Who is driver of GJ-12-BY-4567?'";
    }

    setChatLog(prev => [...prev, {
      sender: 'dispatcher',
      text: reply,
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">AI Insights & Smart Dispatcher</h2>
          <p className="text-xs text-slate-400">Review predictive delays, route deviation maps, and query the Smart Dispatcher via natural language.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Predictions Feed */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-[550px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Delay predictions */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 shrink-0">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Clock size={15} className="text-sky-400" /> AI Delay Risk Predictions
            </h3>
            
            <div className="space-y-2 text-xs font-semibold">
              {trips.filter(t => t.delayRisk).map(trip => {
                const tr = trucks.find(tk => tk.id === trip.truckId)?.truckNumber || '';
                return (
                  <div key={trip.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">{trip.tripNumber} ({tr})</p>
                      <p className="text-[10px] text-slate-500">{trip.pickup} → {trip.destination}</p>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      trip.delayRisk === 'Low' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {trip.delayRisk} Risk
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deviation alerts */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 shrink-0">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <AlertTriangle size={15} className="text-rose-500 animate-pulse" /> GPS Deviation Warnings
            </h3>
            
            <div className="space-y-2 text-xs font-semibold">
              {trips.filter(t => t.routeDeviationAlert).map(trip => {
                const tr = trucks.find(tk => tk.id === trip.truckId)?.truckNumber || '';
                return (
                  <div key={trip.id} className="bg-slate-950 p-3 rounded-xl border border-rose-500/20 text-[10px] text-slate-400 leading-normal flex items-start gap-3">
                    <ShieldAlert size={20} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-extrabold">{trip.tripNumber} ({tr})</p>
                      <p className="text-rose-400 font-bold">Deviation Exception Triggered</p>
                      <p className="text-slate-500 font-medium">GPS path coordinates deviate from Route Master standard path by &gt; 500 meters near Morbi Bypass.</p>
                    </div>
                  </div>
                );
              })}

              {trips.filter(t => t.routeDeviationAlert).length === 0 && (
                <p className="text-slate-600 italic text-center p-4">No vehicle deviations active in the system.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Chatbot Console */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 font-bold text-slate-300 text-xs uppercase flex items-center gap-1.5">
            <MessageSquare size={16} className="text-tenant" /> Smart Dispatcher Chat
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-950 space-y-4 flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
            {chatLog.map((chat, idx) => {
              const isDisp = chat.sender === 'dispatcher';
              return (
                <div
                  key={idx}
                  className={`max-w-[80%] p-3 rounded-xl text-xs font-semibold leading-relaxed flex flex-col space-y-1 ${
                    isDisp 
                      ? 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none self-start' 
                      : 'bg-tenant/10 text-tenant border border-tenant/20 rounded-tr-none self-end'
                  }`}
                >
                  <p className="whitespace-pre-line text-[11px]">{chat.text}</p>
                  <span className="text-[8px] text-slate-500 font-bold text-right mt-1.5">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-850 flex gap-2">
            <input
              type="text"
              placeholder="Ask dispatcher: 'Show delayed trips', 'Show fuel exceptions', 'Show pending payments'..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-tenant"
            />
            <button
              type="submit"
              className="bg-tenant text-white p-2 rounded-lg hover:bg-tenant/90 transition-all shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
