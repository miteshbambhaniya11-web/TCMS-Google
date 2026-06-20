'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { localDb, Driver, Trip, Truck, WalletTransaction } from '@/db/localDb';
import { 
  MessageSquare, Search, Send, Plus, CheckCheck, Sparkles, 
  MapPin, Image as ImageIcon, Scale, Volume2, ShieldAlert, X, HelpCircle 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'driver' | 'bot';
  text: string;
  timestamp: string;
  hasAttachment?: boolean;
  attachmentType?: 'image' | 'location';
}

import FeatureLocked from '@/components/FeatureLocked';

export default function WhatsappPage() {
  const { activeTenant } = useTenant();

  const isWhatsappEnabled = activeTenant?.subscription?.features?.whatsappAutomation !== false;

  if (activeTenant && !isWhatsappEnabled) {
    return (
      <FeatureLocked
        featureName="WhatsApp Driver Bot Console"
        featureDescription="Automate driver dispatch notifications, permit electronic challan verification, collect POD photos, and track cash advance settlements directly via WhatsApp."
      />
    );
  }

  // DB datasets
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  
  // Selection
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [chats, setChats] = useState<{ [driverId: string]: ChatMessage[] }>({});
  const [inputText, setInputText] = useState('');

  // Templates list
  const [templates, setTemplates] = useState([
    { id: 't1', name: 'Trip Assignment', content: 'Hello {{DriverName}}, you have been assigned to Trip {{TripNumber}} ({{Pickup}} to {{Destination}}) with Truck {{TruckNumber}}. Reply ACCEPT to confirm.' },
    { id: 't2', name: 'POD Upload Reminder', content: 'Hi {{DriverName}}, please upload a photo of the signed Challan / POD slip for Trip {{TripNumber}} to process your balance settlements.' },
    { id: 't3', name: 'Document Expiry Warning', content: 'Notice: Your driving license expires on {{ExpiryDate}}. Please submit updated paperwork to the garage operator.' }
  ]);

  // Metrics
  const [metrics, setMetrics] = useState({
    sent: 2481,
    delivered: 2410,
    failed: 71,
    responseRate: 92,
  });

  const loadData = () => {
    if (activeTenant) {
      const drs = localDb.getDrivers(activeTenant.id);
      setDrivers(drs);
      setTrips(localDb.getTrips(activeTenant.id));
      setTrucks(localDb.getTrucks(activeTenant.id));

      if (drs.length > 0 && !selectedDriver) {
        setSelectedDriver(drs[0]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  // Seed initial mock conversations
  useEffect(() => {
    if (drivers.length > 0) {
      const initialChats: { [driverId: string]: ChatMessage[] } = {};
      drivers.forEach(dr => {
        initialChats[dr.id] = [
          { 
            id: `seed-1-${dr.id}`, 
            sender: 'bot', 
            text: `Welcome to ${activeTenant?.name || 'TCMS'} Automated Driver Bot. Reply HELP to view active commands.`, 
            timestamp: new Date(Date.now() - 3600000).toISOString() 
          },
          { 
            id: `seed-2-${dr.id}`, 
            sender: 'driver', 
            text: 'HELP', 
            timestamp: new Date(Date.now() - 3550000).toISOString() 
          },
          { 
            id: `seed-3-${dr.id}`, 
            sender: 'bot', 
            text: "TCMS Driver Bot Commands:\nSTATUS - Get active trip status\nMYTRIPS - View recent assignments\nLOCATION - Sync mobile GPS coordinates\nVEHICLE - Check truck paperwork alerts\nPAYMENT - Get recent advances summary", 
            timestamp: new Date(Date.now() - 3500000).toISOString() 
          }
        ];
      });
      setChats(initialChats);
    }
  }, [drivers]);

  const handleSendMessage = (text: string, sender: 'driver' | 'bot' = 'driver', hasAttach = false, attachType?: 'image' | 'location') => {
    if (!selectedDriver) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      hasAttachment: hasAttach,
      attachmentType: attachType,
    };

    setChats(prev => {
      const current = prev[selectedDriver.id] || [];
      return {
        ...prev,
        [selectedDriver.id]: [...current, newMsg],
      };
    });

    if (sender === 'driver') {
      // Increment metrics
      setMetrics(prev => ({ ...prev, sent: prev.sent + 1, delivered: prev.delivered + 1 }));
      setInputText('');

      // Bot processes command
      setTimeout(() => {
        processBotResponse(text.trim().toUpperCase());
      }, 800);
    }
  };

  const processBotResponse = (cmd: string) => {
    if (!selectedDriver || !activeTenant) return;

    const trip = trips.find(t => t.driverId === selectedDriver.id && !['Completed', 'Cancelled'].includes(t.status));
    const truck = trucks.find(t => t.driverId === selectedDriver.id);

    let reply = '';

    if (cmd === 'HELP') {
      reply = "TCMS Driver Bot Commands:\nSTATUS - Get active trip status\nMYTRIPS - View recent assignments\nLOCATION - Sync mobile GPS coordinates\nVEHICLE - Check truck paperwork alerts\nPAYMENT - Get recent advances summary";
    } else if (cmd === 'STATUS') {
      if (trip) {
        reply = `Active Trip: ${trip.tripNumber}\nTruck: ${truck?.truckNumber || 'N/A'}\nStatus: ${trip.status}\nRoute: ${trip.pickup} to ${trip.destination}\nReply LOCATION to share coordinates.`;
      } else {
        reply = "You do not have any active trip dispatched currently. Reply MYTRIPS to view previous completions.";
      }
    } else if (cmd === 'MYTRIPS') {
      const past = trips.filter(t => t.driverId === selectedDriver.id);
      if (past.length > 0) {
        reply = `Driver ${selectedDriver.name}:\nActive Trip: ${trip ? trip.tripNumber : 'None'}\nTotal assignments in system: ${past.length} trips.`;
      } else {
        reply = "No previous trip records found for your driver license in our database.";
      }
    } else if (cmd === 'LOCATION') {
      if (trip) {
        // Simulate updating driver location coordinates in database
        const simulatedLat = 22.95 + Math.random() * 0.1;
        const simulatedLng = 70.30 + Math.random() * 0.1;
        
        localDb.updateTrip(activeTenant.id, trip.id, {
          currentLat: simulatedLat,
          currentLng: simulatedLng,
          currentSpeed: 50,
        });
        
        reply = `GPS coordinates sync complete!\nLat: ${simulatedLat.toFixed(4)}\nLng: ${simulatedLng.toFixed(4)}\nDashboard tracking metrics successfully updated.`;
        loadData();
      } else {
        reply = "GPS sync ignored: You do not have an active trip in transit.";
      }
    } else if (cmd === 'PAYMENT') {
      if (trip) {
        const advances = localDb.getWalletTransactions(selectedDriver.id)
          .filter(w => w.tripId === trip.id);
        const cash = advances.filter(w => w.type === 'Advance Cash').reduce((a,c) => a+c.amount, 0);
        const diesel = advances.filter(w => w.type === 'Advance Diesel').reduce((a,c) => a+c.amount, 0);
        const toll = advances.filter(w => w.type === 'Advance Toll').reduce((a,c) => a+c.amount, 0);

        reply = `Trip ${trip.tripNumber} Spends Wallet:\nDiesel Card: ₹${diesel.toLocaleString()}\nCash Advance: ₹${cash.toLocaleString()}\nToll Advance: ₹${toll.toLocaleString()}\nDriver Wallet Balance: ₹${selectedDriver.walletBalance.toLocaleString()}`;
      } else {
        reply = `Driver Wallet Registry Balance: ₹${selectedDriver.walletBalance.toLocaleString()}`;
      }
    } else if (cmd === 'VEHICLE') {
      if (truck) {
        reply = `Truck ${truck.truckNumber} Paperwork:\nPermit Expiry: ${truck.permitExpiry}\nInsurance Expiry: ${truck.insuranceExpiry}\nFitness Expiry: ${truck.fitnessExpiry}\nPUC Pollution: ${truck.pucExpiry}`;
      } else {
        reply = "Error: No truck profile currently matches your assigned driver records.";
      }
    } else {
      reply = "Command not recognized. Reply HELP to view standard driver commands catalog.";
    }

    handleSendMessage(reply, 'bot');
  };

  const simulatePodUpload = () => {
    if (!selectedDriver || !activeTenant) return;
    const trip = trips.find(t => t.driverId === selectedDriver.id && !['Completed', 'Cancelled'].includes(t.status));
    
    if (!trip) {
      alert('Driver does not have an active trip to upload a POD for.');
      return;
    }

    // Upload attachment message
    handleSendMessage('Uploading POD Challan Photo (signed_receipt.png)', 'driver', true, 'image');

    // Bot verifies
    setTimeout(() => {
      // Update DB to podUploaded = true
      localDb.updateTrip(activeTenant.id, trip.id, {
        podUploaded: true,
        podVerificationStatus: 'Pending',
        podVerificationNotes: 'Uploaded via WhatsApp Driver Bot. Pending Finance approval.',
        status: 'Unloading',
      });
      loadData();

      handleSendMessage(`POD receipt file successfully received for trip ${trip.tripNumber}! Verification checklist dispatched to finance operator.`, 'bot');
    }, 1200);
  };

  const simulateGpsShare = () => {
    if (!selectedDriver || !activeTenant) return;
    const trip = trips.find(t => t.driverId === selectedDriver.id && !['Completed', 'Cancelled'].includes(t.status));

    if (!trip) {
      alert('Driver does not have an active trip to share coordinates for.');
      return;
    }

    handleSendMessage('Sharing Live Location coordinates', 'driver', true, 'location');

    setTimeout(() => {
      // Shift coordinate coordinates slightly and save
      const lat = 23.003;
      const lng = 70.812;
      
      localDb.updateTrip(activeTenant.id, trip.id, {
        currentLat: lat,
        currentLng: lng,
        currentSpeed: 55,
      });
      loadData();

      handleSendMessage(`GPS Position recorded: Lat ${lat}, Lng ${lng}. Path mapping active.`, 'bot');
    }, 1200);
  };

  const currentChats = selectedDriver ? (chats[selectedDriver.id] || []) : [];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">WhatsApp Driver Automation Console</h2>
          <p className="text-xs text-slate-400">Track driver engagement metrics, edit bot templates, and chat as a driver in the simulator sandbox.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850 shrink-0 text-[10px] text-slate-400">
          <MessageSquare className="text-tenant" size={16} />
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[8px] leading-none mb-0.5">Gateway Configuration</span>
            <span>Provider: <strong className="text-white">{activeTenant?.whatsappSettings.provider || 'Meta Cloud API'}</strong></span>
            <span className="mx-2 text-slate-700">|</span>
            <span>Number: <strong className="text-white">+{activeTenant?.whatsappSettings.number || '91XXXXXXXXXX'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Driver Chats lists */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 font-bold text-slate-300 text-xs uppercase">
            Driver Chats
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
            {drivers.map(dr => {
              const isSelected = selectedDriver?.id === dr.id;
              const hasTrip = trips.some(t => t.driverId === dr.id && !['Completed', 'Cancelled'].includes(t.status));
              return (
                <div
                  key={dr.id}
                  onClick={() => setSelectedDriver(dr)}
                  className={`p-3.5 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected ? 'bg-slate-800/50 border-l-4 border-tenant' : ''
                  }`}
                >
                  <div className="truncate text-xs font-semibold">
                    <p className="text-white font-bold">{dr.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{dr.whatsappNumber}</p>
                  </div>
                  {hasTrip && (
                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse" title="On active trip" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Pane: Chat Workspace (Visual WhatsApp Screen) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[550px]">
          {selectedDriver ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 border-b border-slate-850 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-tenant flex items-center justify-center font-extrabold text-xs shrink-0">
                    {selectedDriver.name[0]}
                  </div>
                  <div className="text-xs">
                    <h3 className="text-white font-bold">{selectedDriver.name}</h3>
                    <p className="text-[9px] text-emerald-400 font-medium">WhatsApp Online</p>
                  </div>
                </div>

                {/* Simulation helper triggers */}
                {trips.some(t => t.driverId === selectedDriver.id && !['Completed', 'Cancelled'].includes(t.status)) && (
                  <div className="flex gap-2">
                    <button
                      onClick={simulateGpsShare}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 text-[10px] px-2.5 py-1.5 rounded font-bold flex items-center gap-1 transition-all"
                    >
                      <MapPin size={12} className="text-rose-500" /> Share GPS
                    </button>
                    <button
                      onClick={simulatePodUpload}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 text-[10px] px-2.5 py-1.5 rounded font-bold flex items-center gap-1 transition-all"
                    >
                      <ImageIcon size={12} className="text-sky-400" /> Upload POD
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages Logs */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col">
                <span className="mx-auto text-[9px] bg-slate-900 border border-slate-800 px-3 py-1 rounded text-slate-500 font-bold uppercase tracking-wider">
                  Today
                </span>
                
                {currentChats.map(msg => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] p-3 rounded-xl text-xs font-semibold leading-relaxed flex flex-col space-y-1 ${
                        isBot 
                          ? 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none self-start' 
                          : 'bg-emerald-950/70 border border-emerald-900/60 text-emerald-100 rounded-tr-none self-end'
                      }`}
                    >
                      {msg.hasAttachment && msg.attachmentType === 'image' && (
                        <div className="w-full bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col items-center gap-1 mb-1.5 text-slate-400">
                          <ImageIcon size={28} className="text-sky-400" />
                          <span className="text-[10px]">scanned_pod_slip.png</span>
                        </div>
                      )}
                      
                      {msg.hasAttachment && msg.attachmentType === 'location' && (
                        <div className="w-full bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col items-center gap-1 mb-1.5 text-slate-400">
                          <MapPin size={28} className="text-rose-500 animate-bounce" />
                          <span className="text-[10px] font-mono">Lat: 23.003, Lng: 70.812</span>
                        </div>
                      )}

                      <p className="whitespace-pre-line text-[11px]">{msg.text}</p>
                      
                      <div className="flex items-center gap-1 justify-end text-[8px] text-slate-500 mt-1.5 font-bold">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isBot && <CheckCheck size={12} className="text-emerald-400 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Console */}
              <div className="p-3 bg-slate-900 border-t border-slate-850 flex gap-2">
                <input
                  type="text"
                  placeholder="Simulate typing a driver message (e.g. HELP, STATUS, PAYMENT)..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputText)}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-tenant"
                />
                <button
                  onClick={() => handleSendMessage(inputText)}
                  className="bg-tenant text-white p-2 rounded-lg hover:bg-tenant/90 transition-all shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <MessageSquare size={36} />
              <p className="font-semibold text-sm">Select a driver from chats to simulate a ground conversation.</p>
            </div>
          )}
        </div>

        {/* Right Pane: Templates & Campaign Stats */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs font-semibold">
            <h4 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
              Automation Campaigns
            </h4>
            
            <div className="space-y-3 font-mono">
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>MESSAGES DELIVERED</span>
                  <span>{Math.round((metrics.delivered / metrics.sent) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(metrics.delivered / metrics.sent) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>DRIVER RESPONSE RATE</span>
                  <span>{metrics.responseRate}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-sky-500 h-full" style={{ width: `${metrics.responseRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs font-semibold max-h-[300px] overflow-y-auto scrollbar-thin">
            <h4 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
              WhatsApp Templates
            </h4>

            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-[10px] font-bold text-white block mb-1">{t.name}</span>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed font-serif">"{t.content}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
