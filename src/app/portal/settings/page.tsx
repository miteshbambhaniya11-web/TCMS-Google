'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/tenantContext';
import { Tenant, localDb } from '@/db/localDb';
import { Settings, Save, AlertCircle, Sparkles, Sliders, Hash, MessageSquare, Building2, Plus, X, Scale, FileText, Users } from 'lucide-react';

export default function SettingsPage() {
  const { activeTenant, activeRole, refreshData, currentUser } = useTenant();

  // Settings form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  
  // Workflow list state
  const [workflow, setWorkflow] = useState<string[]>([]);
  const [newWorkflowStep, setNewWorkflowStep] = useState('');

  // Number series states
  const [challanPrefix, setChallanPrefix] = useState('ASC-2026-');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-ASC-26-');

  // WhatsApp states
  const [whatsappProvider, setWhatsappProvider] = useState('Meta Cloud API');
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // GPS settings
  const [gpsAutoUpdate, setGpsAutoUpdate] = useState(true);
  const [gpsInterval, setGpsInterval] = useState(30);

  // AI settings
  const [aiDelayThreshold, setAiDelayThreshold] = useState(45);
  const [aiFuelVariance, setAiFuelVariance] = useState(8);
  const [aiRouteDeviation, setAiRouteDeviation] = useState(500);

  // Vahan & Fastag states
  const [vahanProvider, setVahanProvider] = useState('NIC Vahan API Sandbox');
  const [vahanApiKey, setVahanApiKey] = useState('vahan_key_prod_99011');
  const [fastagBank, setFastagBank] = useState('ICICI Bank Fastag API');
  const [fastagApiKey, setFastagApiKey] = useState('fastag_key_prod_88901');

  // Weighbridge settings
  const [wbModel, setWbModel] = useState('Mettler Toledo IND780');
  const [wbIpAddress, setWbIpAddress] = useState('192.168.1.150');
  const [wbPort, setWbPort] = useState('8080');

  // E-Way Bill settings
  const [ewayProvider, setEwayProvider] = useState('ClearTax API Bridge');
  const [ewayUsername, setEwayUsername] = useState('maruti_gst_ops');
  const [ewayApiKey, setEwayApiKey] = useState('eway_bill_prod_77189');

  const [saveMessage, setSaveMessage] = useState('');

  // User & operator registry states
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Company Admin' | 'Operator' | 'Finance User' | 'Customer User'>('Operator');

  // Role Permissions Customizer states
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<'Operator' | 'Finance User' | 'Customer User'>('Operator');
  const [rolePermsState, setRolePermsState] = useState<string[]>([]);

  useEffect(() => {
    if (activeTenant) {
      setName(activeTenant.name);
      setAddress(activeTenant.address);
      setGst(activeTenant.gstNumber);
      setPan(activeTenant.panNumber);
      setPrimaryColor(activeTenant.primaryColor);
      setWorkflow(activeTenant.customWorkflow);
      setChallanPrefix(activeTenant.numberSeries.challanPrefix);
      setInvoicePrefix(activeTenant.numberSeries.invoicePrefix);
      setWhatsappProvider(activeTenant.whatsappSettings.provider);
      setWhatsappApiKey(activeTenant.whatsappSettings.apiKey);
      setWhatsappNumber(activeTenant.whatsappSettings.number);

      setGpsAutoUpdate(activeTenant.gpsSettings?.autoUpdate ?? true);
      setGpsInterval(activeTenant.gpsSettings?.intervalSeconds ?? 30);
      setAiDelayThreshold(activeTenant.aiSettings?.delayThresholdMinutes ?? 45);
      setAiFuelVariance(activeTenant.aiSettings?.fuelVariancePercent ?? 8);
      setAiRouteDeviation(activeTenant.aiSettings?.routeDeviationMeters ?? 500);

      // Fetch dynamic fields if stored, or default
      const extraSettings = (activeTenant as any).extraSettings || {
        vahanProvider: 'NIC Vahan API Sandbox',
        vahanApiKey: 'vahan_key_prod_99011',
        fastagBank: 'ICICI Bank Fastag API',
        fastagApiKey: 'fastag_key_prod_88901',
        wbModel: 'Mettler Toledo IND780',
        wbIpAddress: '192.168.1.150',
        wbPort: '8080',
        ewayProvider: 'ClearTax API Bridge',
        ewayUsername: 'maruti_gst_ops',
        ewayApiKey: 'eway_bill_prod_77189',
      };
      setVahanProvider(extraSettings.vahanProvider);
      setVahanApiKey(extraSettings.vahanApiKey);
      setFastagBank(extraSettings.fastagBank);
      setFastagApiKey(extraSettings.fastagApiKey);
      setWbModel(extraSettings.wbModel);
      setWbIpAddress(extraSettings.wbIpAddress);
      setWbPort(extraSettings.wbPort);
      setEwayProvider(extraSettings.ewayProvider);
      setEwayUsername(extraSettings.ewayUsername);
      setEwayApiKey(extraSettings.ewayApiKey);

      setTenantUsers(localDb.getUsers(activeTenant.id).filter(u => u.tenantId === activeTenant.id));
    }
  }, [activeTenant]);

  useEffect(() => {
    if (activeTenant) {
      const perms = activeTenant.rolePermissions?.[selectedRoleForPerms] || [];
      setRolePermsState(perms);
    }
  }, [selectedRoleForPerms, activeTenant]);

  const handleAddStep = () => {
    if (!newWorkflowStep.trim()) return;
    if (workflow.includes(newWorkflowStep.trim())) {
      alert('This step already exists in the workflow');
      return;
    }
    setWorkflow([...workflow, newWorkflowStep.trim()]);
    setNewWorkflowStep('');
  };

  const handleRemoveStep = (step: string) => {
    setWorkflow(workflow.filter(s => s !== step));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;

    const tenants = localDb.getTenants();
    const idx = tenants.findIndex(t => t.id === activeTenant.id);
    if (idx === -1) return;

    tenants[idx] = {
      ...tenants[idx],
      name,
      address,
      gstNumber: gst,
      panNumber: pan,
      primaryColor,
      customWorkflow: workflow,
      numberSeries: {
        ...tenants[idx].numberSeries,
        challanPrefix,
        invoicePrefix,
      },
      whatsappSettings: {
        provider: whatsappProvider,
        apiKey: whatsappApiKey,
        number: whatsappNumber,
      },
      gpsSettings: {
        autoUpdate: gpsAutoUpdate,
        intervalSeconds: Number(gpsInterval),
      },
      aiSettings: {
        delayThresholdMinutes: Number(aiDelayThreshold),
        fuelVariancePercent: Number(aiFuelVariance),
        routeDeviationMeters: Number(aiRouteDeviation),
      },
      // Save extra integrations
      extraSettings: {
        vahanProvider,
        vahanApiKey,
        fastagBank,
        fastagApiKey,
        wbModel,
        wbIpAddress,
        wbPort,
        ewayProvider,
        ewayUsername,
        ewayApiKey,
      } as any
    };

    localDb.saveTenants(tenants);
    refreshData();
    
    // Log action
    localDb.addLog(activeTenant.id, 'user-2', 'Vipul Shah Admin', 'Update Settings', 'Updated company profile, API connections, numbering structures, and workflows.');

    setSaveMessage('Workspace configurations successfully saved!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!newUserName || !newUserEmail || !newUserMobile) {
      alert('Please fill out all user fields');
      return;
    }
    
    const allUsers = localDb.getUsers();
    if (allUsers.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('A user with this email address already exists');
      return;
    }

    const createdUser = {
      id: `user-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newUserName,
      email: newUserEmail.toLowerCase(),
      mobile: newUserMobile,
      role: newUserRole,
      status: 'Active' as const,
    };

    const updatedUsers = [...allUsers, createdUser];
    localDb.saveUsers(updatedUsers);
    
    setTenantUsers(updatedUsers.filter(u => u.tenantId === activeTenant.id));
    
    setNewUserName('');
    setNewUserEmail('');
    setNewUserMobile('');
    setNewUserRole('Operator');
    
    localDb.addLog(activeTenant.id, 'user-2', 'Vipul Shah Admin', 'Create User', `Created user account for ${newUserName} as ${newUserRole}`);
  };

  const handleToggleUserStatus = (userId: string) => {
    if (!activeTenant) return;
    const allUsers = localDb.getUsers();
    const idx = allUsers.findIndex(u => u.id === userId && u.tenantId === activeTenant.id);
    if (idx !== -1) {
      const oldStatus = allUsers[idx].status;
      const newStatus = oldStatus === 'Active' ? 'Inactive' : 'Active';
      allUsers[idx].status = newStatus;
      localDb.saveUsers(allUsers);
      setTenantUsers(allUsers.filter(u => u.tenantId === activeTenant.id));
      localDb.addLog(activeTenant.id, 'user-2', 'Vipul Shah Admin', 'Toggle Status', `Updated user status of ${allUsers[idx].name} to ${newStatus}`);
    }
  };

  const ALL_MODULES = [
    { name: 'Dashboard', path: '/portal/dashboard' },
    { name: 'AI COO Summary', path: '/portal/coo' },
    { name: 'Profitability Desk', path: '/portal/profitability' },
    { name: 'Trip Management', path: '/portal/trips' },
    { name: 'Truck Fleet', path: '/portal/trucks' },
    { name: 'Drivers & Wallets', path: '/portal/drivers' },
    { name: 'Contractors', path: '/portal/contractors' },
    { name: 'Route Master', path: '/portal/routes' },
    { name: 'Fuel Management', path: '/portal/fuel' },
    { name: 'Expense Logs', path: '/portal/expenses' },
    { name: 'Challan Builder', path: '/portal/challans' },
    { name: 'Invoice Hub', path: '/portal/invoices' },
    { name: 'WhatsApp Bot Console', path: '/portal/whatsapp' },
    { name: 'GPS Live Maps', path: '/portal/gps' },
    { name: 'AI Insights Center', path: '/portal/ai' },
    { name: 'Reports & Export', path: '/portal/reports' },
    { name: 'Workspace Settings', path: '/portal/settings' },
  ];

  const handleTogglePerm = (path: string) => {
    if (rolePermsState.includes(path)) {
      setRolePermsState(rolePermsState.filter(p => p !== path));
    } else {
      setRolePermsState([...rolePermsState, path]);
    }
  };

  const handleSaveRolePermissions = () => {
    if (!activeTenant) return;
    const tenants = localDb.getTenants();
    const idx = tenants.findIndex(t => t.id === activeTenant.id);
    if (idx === -1) return;

    const currentPerms = tenants[idx].rolePermissions || {
      'Operator': [],
      'Finance User': [],
      'Customer User': []
    };

    tenants[idx] = {
      ...tenants[idx],
      rolePermissions: {
        ...currentPerms,
        [selectedRoleForPerms]: rolePermsState
      }
    };

    localDb.saveTenants(tenants);
    refreshData();
    
    localDb.addLog(
      activeTenant.id,
      currentUser?.id || 'user-2',
      currentUser?.name || 'Vipul Shah Admin',
      'Update Permissions',
      `Updated access permissions for role ${selectedRoleForPerms}.`
    );

    setSaveMessage(`Permissions for ${selectedRoleForPerms} successfully saved!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold text-white">Workspace Configuration Hub</h2>
          <p className="text-xs text-slate-400">Edit company metadata, customize numbering formats, and reorder trip Kanban workflows.</p>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-emerald-400" /> {saveMessage}
        </div>
      )}

      {/* Settings Grid Panel */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-semibold text-slate-400">
        
        {/* Left Side: Profile and structure */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Company profile */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Building2 size={15} className="text-tenant" /> Company Profile Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-tenant"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold">Branding Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer shrink-0"
                  />
                  <span className="font-mono text-slate-300 font-bold">{primaryColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">GSTIN Number</label>
                <input
                  type="text"
                  value={gst}
                  onChange={e => setGst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-tenant uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">PAN Number</label>
                <input
                  type="text"
                  value={pan}
                  onChange={e => setPan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-tenant uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-bold">HQ Office Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none h-16 resize-none"
              />
            </div>
          </div>

          {/* Numbering format config */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Hash size={15} className="text-tenant" /> Numbering Sequences Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Challan Series Prefix</label>
                <input
                  type="text"
                  value={challanPrefix}
                  onChange={e => setChallanPrefix(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Invoice Series Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Integrations settings */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <MessageSquare size={15} className="text-tenant" /> WhatsApp API Integrations
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Select API Provider</label>
                <select
                  value={whatsappProvider}
                  onChange={e => setWhatsappProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none"
                >
                  <option value="Meta Cloud API">Meta WhatsApp Cloud</option>
                  <option value="Twilio API">Twilio API Gateway</option>
                  <option value="Gupshup API">Gupshup Console</option>
                  <option value="AISensy">AISensy Service</option>
                  <option value="Interakt">Interakt App</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Connected Number</label>
                <input
                  type="tel"
                  placeholder="918888888888"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">API Authorization Key</label>
                <input
                  type="password"
                  value={whatsappApiKey}
                  onChange={e => setWhatsappApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>
          </div>

          {/* GPS & AI Operations Configuration */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Sliders size={15} className="text-tenant" /> GPS & AI Operations Engine Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">GPS Auto-refresh Rate (Seconds)</label>
                <input
                  type="number"
                  value={gpsInterval}
                  onChange={e => setGpsInterval(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">AI Trip Delay Alarm Threshold (Minutes)</label>
                <input
                  type="number"
                  value={aiDelayThreshold}
                  onChange={e => setAiDelayThreshold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Fuel Card Variance Threshold (%)</label>
                <input
                  type="number"
                  value={aiFuelVariance}
                  onChange={e => setAiFuelVariance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Route Deviation Lockout Threshold (Meters)</label>
                <input
                  type="number"
                  value={aiRouteDeviation}
                  onChange={e => setAiRouteDeviation(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>
          </div>

          {/* Vahan & Fastag compliance settings */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Sparkles size={15} className="text-tenant" /> Vahan & Fastag API Integrations
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Vahan Verification API Provider</label>
                <select
                  value={vahanProvider}
                  onChange={e => setVahanProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="NIC Vahan API Sandbox">NIC Vahan Sandbox (Developer Mock)</option>
                  <option value="Signzy Vahan API">Signzy API Gate</option>
                  <option value="Sandbox.co.in Vahan">Sandbox.co.in API</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Vahan API Key</label>
                <input
                  type="password"
                  value={vahanApiKey}
                  onChange={e => setVahanApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Fastag Issuer Bank API Partner</label>
                <select
                  value={fastagBank}
                  onChange={e => setFastagBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="ICICI Bank Fastag API">ICICI Bank Corporate API</option>
                  <option value="HDFC Bank Fastag API">HDFC Bank Commercial API</option>
                  <option value="IDFC First Bank Fastag">IDFC First Bank API</option>
                  <option value="NHAI Fastag Hub">NHAI Unified Sandbox</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Fastag API Secret Key</label>
                <input
                  type="password"
                  value={fastagApiKey}
                  onChange={e => setFastagApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>
          </div>

          {/* Weighbridge Hardware Integrations */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Scale size={15} className="text-tenant" /> Weighbridge IoT Hardware Polling Settings
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Weighbridge Scale Model</label>
                <select
                  value={wbModel}
                  onChange={e => setWbModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="Mettler Toledo IND780">Mettler Toledo IND780 (LAN)</option>
                  <option value="Avery Weigh-Tronix ZM615">Avery Weigh-Tronix ZM615</option>
                  <option value="Essae DS-8520 Scale">Essae DS-8520 Indicator</option>
                  <option value="Digital LAN Modbus Scale">Digital LAN Modbus Adapter</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Hardware IP Address</label>
                <input
                  type="text"
                  placeholder="192.168.1.150"
                  value={wbIpAddress}
                  onChange={e => setWbIpAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">LAN Socket Port</label>
                <input
                  type="text"
                  placeholder="8080"
                  value={wbPort}
                  onChange={e => setWbPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>
          </div>

          {/* E-way Bill settings */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <FileText size={15} className="text-tenant" /> E-Way Bill & GST API Integrations
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">GST GSP API Provider</label>
                <select
                  value={ewayProvider}
                  onChange={e => setEwayProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                >
                  <option value="ClearTax API Bridge">ClearTax GSP Connector</option>
                  <option value="Taxilla GST API">Taxilla API Hub</option>
                  <option value="NIC Direct Sandbox">NIC E-Way Bill Sandbox</option>
                  <option value="Adaa GST Portal">Adaa GSP Client</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">NIC E-Way Bill Username</label>
                <input
                  type="text"
                  value={ewayUsername}
                  onChange={e => setEwayUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-tenant"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Authorization Key</label>
                <input
                  type="password"
                  value={ewayApiKey}
                  onChange={e => setEwayApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-tenant"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Workflow customize (Kanban Steps editor) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex-grow flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                <Sliders size={15} className="text-tenant" /> Trip Workflow Stages
              </h3>
              
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-500 font-semibold flex items-start gap-2.5">
                <AlertCircle size={16} className="text-sky-500 shrink-0 mt-0.5" />
                <p>Adding/Removing stages here instantly re-builds the columns of the Trip Board Kanban desk.</p>
              </div>

              {/* Workflow list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {workflow.map((step, index) => (
                  <div key={step} className="bg-slate-950 px-3 py-2 rounded border border-slate-850 flex items-center justify-between font-mono text-[10px] text-slate-300">
                    <span>{index + 1}. {step}</span>
                    {activeRole === 'Company Admin' && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveStep(step)}
                        className="text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add step control */}
            {activeRole === 'Company Admin' && (
              <div className="pt-3 border-t border-slate-850 flex gap-2">
                <input
                  type="text"
                  placeholder="New step..."
                  value={newWorkflowStep}
                  onChange={e => setNewWorkflowStep(e.target.value)}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-tenant"
                />
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-3 py-1.5 rounded font-bold"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* User Management Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <Users size={15} className="text-tenant" /> Users & Role Access Control
            </h3>

            {/* Existing Users list */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {tenantUsers.map(user => (
                <div key={user.id} className="bg-slate-950 p-2.5 rounded border border-slate-850 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{user.email} | <span className="text-sky-400 font-semibold">{user.role}</span></p>
                  </div>
                  {activeRole === 'Company Admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user.id)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-455 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-450 hover:border-rose-500/20'
                          : 'bg-rose-500/10 text-rose-455 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-450 hover:border-emerald-500/20'
                      }`}
                    >
                      {user.status}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add User Form */}
            {activeRole === 'Company Admin' && (
              <div className="border-t border-slate-850 pt-3 space-y-2.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Create User Account</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-tenant text-[10px]"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile"
                    value={newUserMobile}
                    onChange={e => setNewUserMobile(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-tenant text-[10px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-tenant text-[10px]"
                  />
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-semibold outline-none focus:border-tenant text-[10px]"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Finance User">Finance User</option>
                    <option value="Customer User">Customer User</option>
                    <option value="Company Admin">Company Admin</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 py-1.5 rounded font-bold text-[10px]"
                >
                  Create User & Assign Role
                </button>
              </div>
            )}
          </div>

          {/* Role Permissions Customizer */}
          {activeRole === 'Company Admin' && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                <Sliders size={15} className="text-tenant" /> Role Access Permissions Customizer
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Select Role to Customize</label>
                  <select
                    value={selectedRoleForPerms}
                    onChange={e => setSelectedRoleForPerms(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white font-semibold outline-none focus:border-tenant text-[10px]"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Finance User">Finance User</option>
                    <option value="Customer User">Customer User</option>
                  </select>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-500 font-semibold leading-normal">
                  <p>Check the pages/modules this role is allowed to access. Unchecked pages will be hidden from their sidebar and blocked.</p>
                </div>

                {/* Modules Checklist */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin border-t border-b border-slate-850 py-2.5">
                  {ALL_MODULES.map(mod => {
                    const isChecked = rolePermsState.includes(mod.path);
                    return (
                      <label key={mod.path} className="flex items-center gap-2.5 text-[10px] text-slate-350 font-semibold cursor-pointer py-0.5 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePerm(mod.path)}
                          className="rounded text-tenant border-slate-800 bg-slate-950 focus:ring-0 focus:ring-offset-0 mr-2"
                        />
                        {mod.name}
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 py-1.5 rounded font-bold text-[10px] transition-colors"
                >
                  Save Role Permissions
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full text-white font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
            style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}
          >
            <Save size={16} /> Save Workspace Settings
          </button>

        </div>

      </form>

    </div>
  );
}
