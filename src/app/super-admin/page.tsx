'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenant } from '@/context/tenantContext';
import { Tenant, localDb } from '@/db/localDb';
import { 
  Building2, Users2, ShieldAlert, BarChart3, RotateCcw, 
  ArrowLeft, Plus, CheckCircle, Smartphone, Map, CheckCircle2 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { tenants, refreshData, resetDatabase, currentUser, activeRole } = useTenant();
  const [activeTab, setActiveTab] = useState<'tenants' | 'billing' | 'system'>('tenants');

  // Tenant form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
    name: '',
    code: '',
    address: '',
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    mobile: '',
    email: '',
    primaryColor: '#0284c7',
  });

  const [message, setMessage] = useState('');

  // Subscription edit state
  const [selectedTenantForSub, setSelectedTenantForSub] = useState<Tenant | null>(null);

  // User management state
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<Tenant | null>(null);
  const [tenantUsersList, setTenantUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Add new user form state
  const [showAddUserSection, setShowAddUserSection] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Company Admin' | 'Operator' | 'Finance User' | 'Customer User'>('Operator');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [subForm, setSubForm] = useState({
    plan: 'Startup Fleet' as 'Startup Fleet' | 'Transport Contractor' | 'Enterprise Fleet',
    maxTrucks: 2,
    maxDrivers: 2,
    gpsTracking: false,
    aiInsights: false,
    whatsappAutomation: false,
    weighbridgeModule: false,
  });

  const handlePlanChange = (plan: 'Startup Fleet' | 'Transport Contractor' | 'Enterprise Fleet') => {
    if (plan === 'Startup Fleet') {
      setSubForm({
        plan,
        maxTrucks: 2,
        maxDrivers: 2,
        gpsTracking: false,
        aiInsights: false,
        whatsappAutomation: false,
        weighbridgeModule: false,
      });
    } else if (plan === 'Transport Contractor') {
      setSubForm({
        plan,
        maxTrucks: 5,
        maxDrivers: 5,
        gpsTracking: true,
        aiInsights: true,
        whatsappAutomation: false,
        weighbridgeModule: false,
      });
    } else if (plan === 'Enterprise Fleet') {
      setSubForm({
        plan,
        maxTrucks: 50,
        maxDrivers: 50,
        gpsTracking: true,
        aiInsights: true,
        whatsappAutomation: true,
        weighbridgeModule: true,
      });
    }
  };

  const handleUpdateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForSub) return;

    const tenantsList = localDb.getTenants();
    const idx = tenantsList.findIndex(t => t.id === selectedTenantForSub.id);
    if (idx !== -1) {
      tenantsList[idx].subscription = {
        plan: subForm.plan,
        maxTrucks: Number(subForm.maxTrucks),
        maxDrivers: Number(subForm.maxDrivers),
        features: {
          gpsTracking: subForm.gpsTracking,
          aiInsights: subForm.aiInsights,
          whatsappAutomation: subForm.whatsappAutomation,
          weighbridgeModule: subForm.weighbridgeModule,
        }
      };
      localDb.saveTenants(tenantsList);
      refreshData();
      setSelectedTenantForSub(null);
      setMessage(`Subscription for "${selectedTenantForSub.name}" updated successfully!`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Statistics calculations
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalTrucks: 0,
    totalDrivers: 0,
    totalTrips: 0,
  });

  // Security Redirect if not logged in as Super Admin
  useEffect(() => {
    if (!currentUser || activeRole !== 'Super Admin') {
      router.push('/');
    }
  }, [currentUser, activeRole]);

  useEffect(() => {
    // Collect stats from db
    const t = localDb.getTenants();
    const u = localDb.getUsers();
    let trucksCount = 0;
    let driversCount = 0;
    let tripsCount = 0;
    
    t.forEach(tenant => {
      trucksCount += localDb.getTrucks(tenant.id).length;
      driversCount += localDb.getDrivers(tenant.id).length;
      tripsCount += localDb.getTrips(tenant.id).length;
    });

    setStats({
      totalTenants: t.length,
      totalUsers: u.length,
      totalTrucks: trucksCount,
      totalDrivers: driversCount,
      totalTrips: tripsCount,
    });
  }, [tenants]);

  const handleEditUserClick = (user: any) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const allUsers = localDb.getUsers();
    const idx = allUsers.findIndex(u => u.id === editingUser.id);
    if (idx !== -1) {
      allUsers[idx] = {
        ...allUsers[idx],
        name: editingUser.name,
        email: editingUser.email.toLowerCase(),
        mobile: editingUser.mobile,
        role: editingUser.role,
        status: editingUser.status,
        password: editingUser.password || 'password123'
      };
      localDb.saveUsers(allUsers);
      refreshData();
      
      if (selectedTenantForUsers) {
        setTenantUsersList(allUsers.filter(u => u.tenantId === selectedTenantForUsers.id));
        localDb.addLog(
          selectedTenantForUsers.id,
          'user-1',
          'Super Admin',
          'Modify User',
          `Super Admin updated account profile & password for user ${editingUser.name}.`
        );
      }
      setEditingUser(null);
      setMessage(`User "${editingUser.name}" details updated successfully!`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForUsers) return;
    if (!newUserName || !newUserEmail || !newUserMobile) {
      alert('Please fill out all user fields');
      return;
    }

    const allUsers = localDb.getUsers();
    if (allUsers.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('A user with this email address already exists');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      tenantId: selectedTenantForUsers.id,
      name: newUserName,
      email: newUserEmail.toLowerCase(),
      mobile: newUserMobile,
      role: newUserRole,
      status: 'Active' as const,
      password: newUserPassword || 'password123'
    };

    const updatedUsers = [...allUsers, newUser];
    localDb.saveUsers(updatedUsers);
    refreshData();
    setTenantUsersList(updatedUsers.filter(u => u.tenantId === selectedTenantForUsers.id));

    localDb.addLog(
      selectedTenantForUsers.id,
      'user-1',
      'Super Admin',
      'Create User',
      `Super Admin created user account for ${newUserName} as ${newUserRole}.`
    );

    setNewUserName('');
    setNewUserEmail('');
    setNewUserMobile('');
    setNewUserRole('Operator');
    setNewUserPassword('password123');
    setShowAddUserSection(false);

    setMessage(`User "${newUserName}" created successfully!`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    
    const allUsers = localDb.getUsers();
    const updated = allUsers.filter(u => u.id !== userId);
    localDb.saveUsers(updated);
    refreshData();

    if (selectedTenantForUsers) {
      setTenantUsersList(updated.filter(u => u.tenantId === selectedTenantForUsers.id));
      localDb.addLog(
        selectedTenantForUsers.id,
        'user-1',
        'Super Admin',
        'Delete User',
        `Super Admin deleted user account for ${userName}.`
      );
    }

    setMessage(`User "${userName}" deleted successfully.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.code) {
      alert('Please fill out Name and Code');
      return;
    }

    const currentTenants = localDb.getTenants();
    const created: Tenant = {
      id: `tenant-${Date.now()}`,
      name: newTenant.name,
      code: newTenant.code.toUpperCase(),
      address: newTenant.address || '',
      gstNumber: newTenant.gstNumber || '',
      panNumber: newTenant.panNumber || '',
      logoUrl: '',
      contactPerson: newTenant.contactPerson || '',
      mobile: newTenant.mobile || '',
      email: newTenant.email || '',
      primaryColor: newTenant.primaryColor || '#0284c7',
      customWorkflow: ['Pending', 'Assigned', 'Dispatched', 'Reached Destination', 'Completed', 'Cancelled'],
      numberSeries: {
        challanPrefix: `${newTenant.code.toUpperCase()}-2026-`,
        invoicePrefix: `INV-${newTenant.code.toUpperCase()}-26-`,
        nextChallanNo: 1,
        nextInvoiceNo: 1,
      },
      whatsappSettings: {
        provider: 'Meta Cloud API',
        apiKey: 'secret_api_key_custom',
        number: newTenant.mobile || '919999999999',
      },
      gpsSettings: {
        autoUpdate: true,
        intervalSeconds: 60,
      },
      aiSettings: {
        delayThresholdMinutes: 30,
        fuelVariancePercent: 8,
        routeDeviationMeters: 500,
      },
      status: 'Active',
    };

    const updated = [...currentTenants, created];
    localDb.saveTenants(updated);
    refreshData();
    setShowAddModal(false);
    
    // Seed standard dummy data for this new tenant
    // Add 1 driver, 1 truck, 1 route
    const drId = `driver-${Date.now()}`;
    localDb.saveDrivers([
      ...localDb.getDrivers(created.id),
      {
        id: drId,
        tenantId: created.id,
        name: 'Auto Driver',
        mobile: '9999900000',
        whatsappNumber: '919999900000',
        licenseNumber: 'DL-MOCK-123',
        licenseExpiry: '2029-01-01',
        aadhaarNumber: '1111-2222-3333',
        address: 'HQ Garage',
        joiningDate: '2026-01-01',
        emergencyContact: '9999900001',
        status: 'Active',
        walletBalance: 0
      }
    ]);

    localDb.saveTrucks([
      ...localDb.getTrucks(created.id),
      {
        id: `truck-${Date.now()}`,
        tenantId: created.id,
        truckNumber: `${created.code}-12-AB-1234`,
        type: 'Taurus',
        capacity: 25,
        ownerName: `${created.name} Fleet`,
        driverId: drId,
        gpsEnabled: true,
        insuranceExpiry: '2027-01-01',
        permitExpiry: '2027-01-01',
        fitnessExpiry: '2027-01-01',
        pucExpiry: '2027-01-01',
        fastagBalance: 5000,
        tyresCount: 10,
        status: 'Available'
      }
    ]);

    localDb.saveRoutes([
      ...localDb.getRoutes(created.id),
      {
        id: `route-${Date.now()}`,
        tenantId: created.id,
        name: 'Factory to Dockyard',
        pickup: 'Factory Loading Zone',
        destination: 'Dockyard Wharf 1',
        distanceKm: 85,
        durationHours: 3,
        expectedFuel: 30,
        standardRate: 400,
        tollCharges: 250
      }
    ]);

    setNewTenant({
      name: '',
      code: '',
      address: '',
      gstNumber: '',
      panNumber: '',
      contactPerson: '',
      mobile: '',
      email: '',
      primaryColor: '#0284c7',
    });
    setMessage(`Tenant "${created.name}" onboarded successfully!`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the system database? All custom tenants and trips will be lost.')) {
      resetDatabase();
      setMessage('Database reset completed successfully.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors bg-slate-850 p-2 rounded-lg">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="text-sky-400" size={24} />
            <h1 className="text-xl font-extrabold tracking-tight">TCMS Super Admin Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset} 
            className="bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700 hover:border-rose-900/60 px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <RotateCcw size={16} /> Reset DB to Seeds
          </button>
          <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
            SUPER_ADMIN_MODE
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {message && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={16} /> {message}
          </div>
        )}

        {/* Global Platform Counters */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Registered Tenants</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{stats.totalTenants}</span>
              <Building2 size={20} className="text-sky-500/50" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Total Platform Users</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{stats.totalUsers}</span>
              <Users2 size={20} className="text-indigo-500/50" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Managed Fleet</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{stats.totalTrucks}</span>
              <Plus size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Active Drivers</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{stats.totalDrivers}</span>
              <Plus size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-2 col-span-2 md:col-span-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Total Trips Logged</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{stats.totalTrips}</span>
              <BarChart3 size={20} className="text-teal-500/50" />
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-6">
          <button 
            onClick={() => setActiveTab('tenants')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'tenants' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            SaaS Tenants
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'billing' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Subscription Plans & API Meters
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'system' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            System Status & Logs
          </button>
        </div>

        {/* Tab Content: Tenants */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">

            {/* Pending Onboarding Activation Requests Console */}
            {(() => {
              const pending = tenants.filter(t => t.status === 'Pending Approval');
              if (pending.length === 0) return null;
              return (
                <div className="bg-amber-950/15 border border-amber-900/30 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <ShieldAlert size={16} /> Pending Onboarding Activation Requests ({pending.length})
                  </h3>
                  <div className="space-y-3 font-semibold text-xs">
                    {pending.map(t => (
                      <div key={t.id} className="bg-slate-950/60 p-4 rounded-lg border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-extrabold text-xs">{t.name}</h4>
                            <span className="bg-slate-850 text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">Code: {t.code}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Contact Person: {t.contactPerson} ({t.mobile}) | Admin Email: <strong className="text-slate-300 font-mono">{t.email}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            localDb.approveTenant(t.id);
                            refreshData();
                            setMessage(`Company "${t.name}" subscription approved & portal activated!`);
                            setTimeout(() => setMessage(''), 4000);
                          }}
                          className="bg-emerald-650 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-md shrink-0 flex items-center gap-1"
                        >
                          <CheckCircle size={14} /> Approve & Activate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Active SaaS Companies</h3>
                <p className="text-slate-400 text-xs">Manage companies, branding properties, and customize workflow setups.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/10"
              >
                <Plus size={16} /> Onboard New Company
              </button>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.filter(t => t.status === 'Active').map(tenant => {
                const trips = localDb.getTrips(tenant.id).length;
                const trucks = localDb.getTrucks(tenant.id).length;
                const drivers = localDb.getDrivers(tenant.id).length;
                const plan = tenant.subscription?.plan || 'Startup Fleet';
                return (
                  <div key={tenant.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tenant.primaryColor }} />
                          <div>
                            <h4 className="text-base font-extrabold text-white">{tenant.name}</h4>
                            <span className="inline-block mt-0.5 bg-sky-950 border border-sky-850/50 text-sky-400 text-[9px] px-2 py-0.5 rounded font-bold">
                              {plan}
                            </span>
                          </div>
                        </div>
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded font-mono uppercase">
                          {tenant.code}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-400 mb-6 border-b border-slate-800/60 pb-4">
                        <div>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">GSTIN / PAN</span>
                          <span className="text-slate-300 font-mono">{tenant.gstNumber || 'N/A'} / {tenant.panNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Contact Mobile</span>
                          <span className="text-slate-300 font-semibold">{tenant.mobile} ({tenant.contactPerson})</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Features Enabled</span>
                          <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-bold">
                            <span className={`px-1.5 py-0.5 rounded ${tenant.subscription?.features.gpsTracking ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'}`}>GPS</span>
                            <span className={`px-1.5 py-0.5 rounded ${tenant.subscription?.features.aiInsights ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'}`}>AI</span>
                            <span className={`px-1.5 py-0.5 rounded ${tenant.subscription?.features.whatsappAutomation ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'}`}>WA</span>
                            <span className={`px-1.5 py-0.5 rounded ${tenant.subscription?.features.weighbridgeModule ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'}`}>WB</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Resource Limits</span>
                          <span className="text-slate-300 font-semibold block mt-0.5">
                            {trucks}/{tenant.subscription?.maxTrucks || 2} Trucks | {drivers}/{tenant.subscription?.maxDrivers || 2} Drivers
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <button
                        onClick={() => {
                          const sub = tenant.subscription || {
                            plan: 'Startup Fleet' as const,
                            maxTrucks: 2,
                            maxDrivers: 2,
                            features: { gpsTracking: false, aiInsights: false, whatsappAutomation: false, weighbridgeModule: false }
                          };
                          setSelectedTenantForSub(tenant);
                          setSubForm({
                            plan: sub.plan,
                            maxTrucks: sub.maxTrucks,
                            maxDrivers: sub.maxDrivers,
                            gpsTracking: sub.features.gpsTracking,
                            aiInsights: sub.features.aiInsights,
                            whatsappAutomation: sub.features.whatsappAutomation,
                            weighbridgeModule: sub.features.weighbridgeModule
                          });
                        }}
                        className="bg-indigo-650 hover:bg-indigo-500 border border-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all"
                      >
                        ⚙️ Manage Sub
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTenantForUsers(tenant);
                          setTenantUsersList(localDb.getUsers(tenant.id).filter(u => u.tenantId === tenant.id));
                        }}
                        className="bg-sky-600 hover:bg-sky-500 border border-sky-700 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all"
                      >
                        👤 Manage Users
                      </button>

                      <button
                        onClick={() => {
                          localDb.addTrip(tenant.id, {
                            driverId: localDb.getDrivers(tenant.id)[0]?.id || 'driver-1',
                            truckId: localDb.getTrucks(tenant.id)[0]?.id || 'truck-1',
                            routeId: localDb.getRoutes(tenant.id)[0]?.id || 'route-1',
                            pickup: 'Loading Station',
                            destination: 'Unloading Point',
                            material: 'Aggregates',
                            quantity: 25,
                            rate: 450,
                            amount: 11250,
                            status: 'Pending',
                            priority: 'Medium',
                          });
                          refreshData();
                          setMessage(`Seeded test trip for ${tenant.name}`);
                          setTimeout(() => setMessage(''), 3000);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all"
                      >
                        + Seed Test Trip
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: Billing */}
        {activeTab === 'billing' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Platform Plans & API Meters</h3>
              <p className="text-slate-400 text-xs">Monitor subscription levels, WhatsApp message consumption, and AI token usages.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                    <th className="pb-3">Tenant Name</th>
                    <th className="pb-3">Active Plan</th>
                    <th className="pb-3">Monthly Charge</th>
                    <th className="pb-3">Limits (Trucks/Drivers)</th>
                    <th className="pb-3">Features Enabled</th>
                    <th className="pb-3">Billing Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-xs">
                  {tenants.map(tenant => {
                    const plan = tenant.subscription?.plan || 'Startup Fleet';
                    const charge = plan === 'Enterprise Fleet' ? '₹39,999' : plan === 'Transport Contractor' ? '₹14,999' : '₹4,999';
                    const maxT = tenant.subscription?.maxTrucks || 2;
                    const maxD = tenant.subscription?.maxDrivers || 2;
                    return (
                      <tr key={tenant.id} className="text-slate-300">
                        <td className="py-4 text-white font-bold">{tenant.name}</td>
                        <td className="py-4">
                          <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold">
                            {plan}
                          </span>
                        </td>
                        <td className="py-4 font-mono">{charge}</td>
                        <td className="py-4 font-mono">
                          Max: {maxT} Trucks / {maxD} Drivers
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1 text-[9px] font-bold">
                            {tenant.subscription?.features.gpsTracking && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">GPS</span>}
                            {tenant.subscription?.features.aiInsights && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">AI</span>}
                            {tenant.subscription?.features.whatsappAutomation && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">WA</span>}
                            {tenant.subscription?.features.weighbridgeModule && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">WB</span>}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            Paid (Active)
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => {
                              const sub = tenant.subscription || {
                                plan: 'Startup Fleet' as const,
                                maxTrucks: 2,
                                maxDrivers: 2,
                                features: { gpsTracking: false, aiInsights: false, whatsappAutomation: false, weighbridgeModule: false }
                              };
                              setSelectedTenantForSub(tenant);
                              setSubForm({
                                plan: sub.plan,
                                maxTrucks: sub.maxTrucks,
                                maxDrivers: sub.maxDrivers,
                                gpsTracking: sub.features.gpsTracking,
                                aiInsights: sub.features.aiInsights,
                                whatsappAutomation: sub.features.whatsappAutomation,
                                weighbridgeModule: sub.features.weighbridgeModule
                              });
                            }}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded transition-all text-xs"
                          >
                            Manage Sub
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTenantForUsers(tenant);
                              setTenantUsersList(localDb.getUsers(tenant.id).filter(u => u.tenantId === tenant.id));
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded transition-all text-xs ml-2"
                          >
                            Manage Users
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: System */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 lg:col-span-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-yellow-400" size={18} />
                System Health
              </h3>
              <div className="text-xs space-y-3 font-semibold">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Main API Gateway</span>
                  <span className="text-emerald-400">99.98% (Online)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Meta WhatsApp Cloud</span>
                  <span className="text-emerald-400">Connected</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">OpenStreetMap API</span>
                  <span className="text-emerald-400">Operational</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Local Database State</span>
                  <span className="text-sky-400">localStorage synced</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 lg:col-span-2">
              <h3 className="text-base font-bold text-white">Cross-Tenant Action Audit Logs</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 text-xs font-semibold">
                {tenants.flatMap(tenant => localDb.getActivityLogs(tenant.id)).map((log, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-850 flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] mb-1">{new Date(log.timestamp).toLocaleString()}</span>
                      <p className="text-slate-300 font-semibold">{log.userName} ({log.action})</p>
                      <p className="text-slate-400 font-medium text-[11px] mt-0.5">{log.details}</p>
                    </div>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase text-[9px]">
                      {tenants.find(t => t.id === log.tenantId)?.code || 'SYS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Onboard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Building2 className="text-sky-400" size={20} />
              Onboard Transport Company
            </h3>
            
            <form onSubmit={handleAddTenant} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maruti Infrastructure"
                  value={newTenant.name}
                  onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Company Code (Prefix)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MLI"
                    maxLength={5}
                    value={newTenant.code}
                    onChange={e => setNewTenant({...newTenant, code: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Branding Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newTenant.primaryColor}
                      onChange={e => setNewTenant({...newTenant, primaryColor: e.target.value})}
                      className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="font-mono text-slate-300 font-semibold">{newTenant.primaryColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 24AAAAC1234A1Z1"
                  value={newTenant.gstNumber}
                  onChange={e => setNewTenant({...newTenant, gstNumber: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PAN Number</label>
                  <input
                    type="text"
                    placeholder="AAAAC1234A"
                    value={newTenant.panNumber}
                    onChange={e => setNewTenant({...newTenant, panNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sanjay Patel"
                    value={newTenant.contactPerson}
                    onChange={e => setNewTenant({...newTenant, contactPerson: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Contact Mobile</label>
                  <input
                    type="tel"
                    placeholder="9999999999"
                    value={newTenant.mobile}
                    onChange={e => setNewTenant({...newTenant, mobile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@maruti.com"
                    value={newTenant.email}
                    onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Billing Address</label>
                <textarea
                  placeholder="Street and city..."
                  value={newTenant.address}
                  onChange={e => setNewTenant({...newTenant, address: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500 h-16 resize-none"
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
                  className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded transition-colors"
                >
                  Save & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Subscription Modal */}
      {selectedTenantForSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              ⚙️ Manage Subscription: {selectedTenantForSub.name}
            </h3>
            
            <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Pricing Plan</label>
                <select
                  value={subForm.plan}
                  onChange={e => handlePlanChange(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500"
                >
                  <option value="Startup Fleet">Startup Fleet (Basic)</option>
                  <option value="Transport Contractor">Transport Contractor (Growth)</option>
                  <option value="Enterprise Fleet">Enterprise Fleet (Premium)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Max Trucks Limit</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={subForm.maxTrucks}
                    onChange={e => setSubForm({...subForm, maxTrucks: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Max Drivers Limit</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={subForm.maxDrivers}
                    onChange={e => setSubForm({...subForm, maxDrivers: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-semibold outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-2 font-bold">Configure Features</label>
                <div className="space-y-2 bg-slate-950 p-3 rounded border border-slate-850">
                  <label className="flex items-center gap-2.5 text-slate-350 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.gpsTracking}
                      onChange={e => setSubForm({...subForm, gpsTracking: e.target.checked})}
                      className="rounded text-sky-500 border-slate-800 bg-slate-950 focus:ring-0 focus:ring-offset-0"
                    />
                    GPS Live Tracking & Maps
                  </label>
                  <label className="flex items-center gap-2.5 text-slate-350 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.aiInsights}
                      onChange={e => setSubForm({...subForm, aiInsights: e.target.checked})}
                      className="rounded text-sky-500 border-slate-800 bg-slate-950 focus:ring-0 focus:ring-offset-0"
                    />
                    AI COO Summary & Insights
                  </label>
                  <label className="flex items-center gap-2.5 text-slate-355 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.whatsappAutomation}
                      onChange={e => setSubForm({...subForm, whatsappAutomation: e.target.checked})}
                      className="rounded text-sky-500 border-slate-800 bg-slate-950 focus:ring-0 focus:ring-offset-0"
                    />
                    WhatsApp Driver Bot Console
                  </label>
                  <label className="flex items-center gap-2.5 text-slate-355 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.weighbridgeModule}
                      onChange={e => setSubForm({...subForm, weighbridgeModule: e.target.checked})}
                      className="rounded text-sky-500 border-slate-800 bg-slate-950 focus:ring-0 focus:ring-offset-0"
                    />
                    Weighbridge Salt Logistics Module
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForSub(null)}
                  className="w-1/2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded transition-colors shadow-lg shadow-sky-600/10"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Users Management Modal */}
      {selectedTenantForUsers && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-850">
            <div className="flex items-center justify-between border-b border-slate-805 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                👤 Manage Users: {selectedTenantForUsers.name}
              </h3>
              <button 
                onClick={() => { setSelectedTenantForUsers(null); setEditingUser(null); }}
                className="text-slate-450 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            {/* Editing Section */}
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="bg-slate-950 p-4 rounded border border-slate-850 space-y-3 text-xs">
                <span className="text-[10px] text-sky-400 font-bold block uppercase">Edit User Account: {editingUser.name}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={editingUser.mobile}
                      onChange={e => setEditingUser({ ...editingUser, mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Account Role</label>
                    <select
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-semibold outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="Company Admin">Company Admin</option>
                      <option value="Operator">Operator</option>
                      <option value="Finance User">Finance User</option>
                      <option value="Customer User">Customer User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Active Status</label>
                    <select
                      value={editingUser.status}
                      onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-semibold outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Password (Plain Text for Super Admin)</label>
                  <input
                    type="text"
                    required
                    value={editingUser.password || ''}
                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold px-3 py-1.5 rounded transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition-all text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Create New User Section */}
            {!editingUser && showAddUserSection && (
              <form onSubmit={handleCreateUser} className="bg-slate-950 p-4 rounded border border-slate-850 space-y-3 text-xs">
                <span className="text-[10px] text-sky-400 font-bold block uppercase">Onboard User Account</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    value={newUserMobile}
                    onChange={e => setNewUserMobile(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono col-span-1"
                  />
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-semibold outline-none focus:border-sky-500 text-xs col-span-1"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Finance User">Finance User</option>
                    <option value="Customer User">Customer User</option>
                    <option value="Company Admin">Company Admin</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-sky-500 text-xs font-mono col-span-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddUserSection(false)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold px-3 py-1.5 rounded transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded transition-all text-xs shadow-md shadow-sky-600/15"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* Add User Control Header */}
            {!editingUser && !showAddUserSection && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddUserSection(true)}
                  className="bg-sky-650 hover:bg-sky-600 border border-sky-700 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all"
                >
                  + Add User Account
                </button>
              </div>
            )}

            {/* Users list */}
            <div className="space-y-2.5 text-slate-400">
              <span className="text-[10px] text-slate-550 font-bold block uppercase border-b border-slate-850 pb-1.5">Active Tenant Users</span>
              {tenantUsersList.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4 font-semibold">No users found for this company.</p>
              ) : (
                <div className="space-y-2">
                  {tenantUsersList.map(user => (
                    <div key={user.id} className="bg-slate-950 p-3 rounded border border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{user.name}</span>
                          <span className="bg-sky-950 border border-sky-850 text-sky-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
                            {user.role}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1 space-x-2">
                          <span>Email: <strong className="text-slate-350">{user.email}</strong></span>
                          <span>|</span>
                          <span>Mobile: <strong className="text-slate-355">{user.mobile}</strong></span>
                          <span>|</span>
                          <span>Password: <strong className="text-amber-400">{user.password || 'password123'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUserClick(user)}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-205 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
