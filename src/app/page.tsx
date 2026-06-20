'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/context/tenantContext';
import { localDb } from '@/db/localDb';
import { 
  Truck, MessageSquare, MapPin, Cpu, ShieldAlert, FileSpreadsheet, 
  Coins, Scale, CheckCircle2, UserCheck, ChevronRight, BarChart3, Settings,
  Lock, Mail, Building2, Phone, User, KeyRound, Sparkles, AlertTriangle
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { login, refreshData } = useTenant();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'connected' | 'error'>('connected');

  useEffect(() => {
    localDb.syncStatusListener = (status) => {
      setSyncStatus(status);
    };

    const unsubscribe = localDb.setupRealtime(() => {
      refreshData();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [loginError, setLoginError] = useState('');

  // Signup Form
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [brandColor, setBrandColor] = useState('#0284c7');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Demo accounts helper drawer
  const [showQuickFill, setShowQuickFill] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = login(loginEmail, loginPassword);
    if (res.success) {
      if (loginEmail.toLowerCase() === 'super.admin@tcms.com') {
        router.push('/super-admin');
      } else {
        router.push('/portal/dashboard');
      }
    } else {
      setLoginError(res.error || 'Authentication failed.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess(false);

    if (!companyName || !contactEmail || !contactName || !contactMobile) {
      setSignupError('All fields are required.');
      return;
    }

    try {
      localDb.signupTenant(companyName, contactEmail, contactName, contactMobile, brandColor);
      refreshData();
      setSignupSuccess(true);
      
      setCompanyName('');
      setContactName('');
      setContactEmail('');
      setContactMobile('');
    } catch (err: any) {
      setSignupError('Company registration request failed.');
    }
  };

  const fillCredentials = (email: string) => {
    setLoginEmail(email);
    const allUsers = localDb.getUsers();
    const u = allUsers.find(x => x.email.toLowerCase() === email.toLowerCase());
    setLoginPassword(u?.password || 'password123');
    setLoginError('');
    setAuthMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 p-2 rounded-lg text-white">
              <Truck size={24} className="animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">TCMS</span>
              <span className="text-xs block text-slate-400 font-semibold leading-none">India's Transport ERP</span>
            </div>
          </div>
          
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
            syncStatus === 'syncing' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
            syncStatus === 'connected' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' :
            'text-rose-400 bg-rose-400/10 border border-rose-400/20'
          }`} title="Supabase Database Status">
            {syncStatus === 'syncing' && '🔄 Syncing...'}
            {syncStatus === 'connected' && '☁️ Cloud Connected'}
            {syncStatus === 'error' && '⚠️ Sync Offline'}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#solution" className="hover:text-white transition-colors">Salt & Mining Special</a>
          <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#demo" className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-sky-600/20 flex items-center gap-1">
            Try Live Demo <ChevronRight size={16} />
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            ⚡ Now Live: Indian Transport ERP
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Stop Excel Chaos. <br />
            Manage Your Fleet, Challans, and <span className="bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">WhatsApp Drivers</span> in One ERP.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
            TCMS is a custom multi-tenant SaaS for Indian salt, mining, and infrastructure contractors. 
            Replace phone calls and paper slips with WhatsApp commands, GPS tracking, and automatic TDS invoicing.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <a href="#demo" className="bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/15 flex items-center gap-2">
              Launch Demo Environment <ChevronRight size={18} />
            </a>
            <a href="#features" className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all border border-slate-700">
              Explore Modules
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/60 max-w-xl">
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-white">1000+</p>
              <p className="text-xs text-slate-400 font-medium">Expected Tenants</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-white">100k+</p>
              <p className="text-xs text-slate-400 font-medium">Monthly Trips</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-white">99.9%</p>
              <p className="text-xs text-slate-400 font-medium">Uptime Guarantee</p>
            </div>
          </div>
        </div>

        {/* Credentials Sign In & Onboarding request forms */}
        <div id="demo" className="lg:col-span-5 bg-slate-900/85 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md relative flex flex-col justify-between min-h-[520px]">
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest shadow-md">
            White-Labeled SaaS
          </div>

          <div>
            {/* Header Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 mb-6 text-xs font-semibold">
              <button 
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(''); setSignupSuccess(false); }}
                className={`w-1/2 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${authMode === 'login' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <KeyRound size={14} /> Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setAuthMode('signup'); setSignupError(''); setSignupSuccess(false); }}
                className={`w-1/2 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${authMode === 'signup' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Sparkles size={14} /> Request Activation
              </button>
            </div>

            {/* Tab: SIGN IN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold text-slate-400">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Welcome Back</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Enter your registered email and password credentials to access your tenant portal.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-slate-500" size={14} />
                      <input
                        type="email"
                        required
                        placeholder="username@company.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold text-white outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-500" size={14} />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold text-white outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-[10px] leading-relaxed flex items-start gap-1.5">
                    <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow shadow-sky-600/10"
                >
                  Authenticate & Enter Workspace
                </button>
              </form>
            )}

            {/* Tab: SIGN UP (REQUEST SUBSCRIPTION) */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs font-semibold text-slate-400">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Request SaaS Subscription</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Register your transport contractor details. Super Admin will review and activate your subscription.</p>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2 text-slate-500" size={12} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gujarat Salt Pan"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Contact Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2 text-slate-500" size={12} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sanjay Patel"
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Admin Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2 text-slate-500" size={12} />
                        <input
                          type="email"
                          required
                          placeholder="admin@company.com"
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2 text-slate-500" size={12} />
                        <input
                          type="tel"
                          required
                          placeholder="91XXXXXXXXXX"
                          value={contactMobile}
                          onChange={e => setContactMobile(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Portal Primary Branding Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={e => setBrandColor(e.target.value)}
                        className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer shrink-0"
                      />
                      <span className="font-mono text-slate-300 text-xs font-bold uppercase">{brandColor}</span>
                    </div>
                  </div>
                </div>

                {signupError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-[10px] leading-relaxed">
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-[10px] leading-normal flex items-start gap-1.5">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={12} />
                    <span>Company registered! Onboarding request status: **Pending Activation**. Log in as Super Admin (`super.admin@tcms.com`) to approve.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow shadow-teal-600/10"
                >
                  Submit Subscription Request
                </button>
              </form>
            )}
          </div>

          {/* Developer Quick-Fill Drawer */}
          <div className="border-t border-slate-800 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setShowQuickFill(!showQuickFill)}
              className="w-full bg-slate-950/65 hover:bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-slate-400 hover:text-slate-200 text-left text-[10px] font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound size={12} className="text-sky-400" /> 🔑 Developer Sandbox Accounts Helper
              </span>
              <ChevronRight size={12} className={`transition-transform duration-200 ${showQuickFill ? 'rotate-90' : ''}`} />
            </button>

            {showQuickFill && (
              <div className="mt-2.5 bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-2 text-[10px] font-semibold">
                <p className="text-slate-500 leading-normal">Click any button to populate the email field for immediate sign-in:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => fillCredentials('super.admin@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Platform Super Owner"
                  >
                    👑 Super Admin
                  </button>
                  <button
                    onClick={() => fillCredentials('adani.admin@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Adani Company Admin"
                  >
                    🏢 Tenant A Admin
                  </button>
                  <button
                    onClick={() => fillCredentials('adani.operator@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Adani Operator"
                  >
                    🛠️ Tenant A Operator
                  </button>
                  <button
                    onClick={() => fillCredentials('adani.finance@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Adani Finance"
                  >
                    💵 Tenant A Finance
                  </button>
                  <button
                    onClick={() => fillCredentials('adani.customer@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono col-span-2"
                    title="Nirma Customer Account"
                  >
                    👤 Tenant A Customer (Nirma)
                  </button>
                  <button
                    onClick={() => fillCredentials('maruti.admin@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono col-span-2"
                    title="Maruti Company Admin"
                  >
                    🏢 Tenant B Admin
                  </button>

                  <div className="col-span-2 border-t border-slate-800/60 my-1 pt-1.5 text-slate-500 font-bold uppercase">
                    🧡 Tenant C: Vasudev Infra (Orange)
                  </div>
                  <button
                    onClick={() => fillCredentials('vasudev.admin@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Vasudev Company Admin"
                  >
                    🏢 Vasudev Admin
                  </button>
                  <button
                    onClick={() => fillCredentials('vasudev.operator1@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Vasudev Operator 1"
                  >
                    🛠️ Operator 1
                  </button>
                  <button
                    onClick={() => fillCredentials('vasudev.operator2@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Vasudev Operator 2"
                  >
                    🛠️ Operator 2
                  </button>
                  <button
                    onClick={() => fillCredentials('vasudev.finance@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono"
                    title="Vasudev Finance"
                  >
                    💵 Finance User
                  </button>
                  <button
                    onClick={() => fillCredentials('vasudev.customer@tcms.com')}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-2 py-1.5 rounded text-left truncate font-mono col-span-2"
                    title="Vasudev Customer Account"
                  >
                    👤 Customer User (Kutch Salt Buyer)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Differentiators Grid */}
      <section id="features" className="py-20 bg-slate-900/50 border-y border-slate-800/80 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Specific Differentiators for Indian Transporters</h2>
            <p className="text-slate-400">
              Generic ERPs ignore the ground realities of Indian drivers. TCMS was built for the dust, the pumps, and the challans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded-lg">
                <MessageSquare size={24} />
              </div>
              <h4 className="text-lg font-bold text-white">WhatsApp Driver Ops</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drivers don't download mobile apps. TCMS operates 100% via WhatsApp. Send trip, capture GPS, upload POD photos with zero app training.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-teal-500/10 text-teal-400 flex items-center justify-center rounded-lg">
                <Coins size={24} />
              </div>
              <h4 className="text-lg font-bold text-white">Driver Wallet & Advances</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Log advances for diesel pumps, toll plazas, and cash payouts. View balances, recovery statements, and transaction ledgers instantly.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-lg">
                <Scale size={24} />
              </div>
              <h4 className="text-lg font-bold text-white">Salt & Weighbridge ERP</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Configure moisture penalties, track Tare vs Gross weights, and generate loading slips. Tailor-made for salt refineries and miners.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-4 hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 flex items-center justify-center rounded-lg">
                <Cpu size={24} />
              </div>
              <h4 className="text-lg font-bold text-white">AI Exceptions & Dispatch</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Smart delay risks forecasting, diesel leakage warning, and a NLP chatbot that answers operator questions based on live trips data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Module: Vahan & Fastag */}
      <section id="solution" className="py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <span className="text-teal-400 font-bold uppercase tracking-wider text-sm">💡 Exclusive Indian Market Features</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Compliance Made Simple: <br />
            Vahan, Fastag & E-Way Bills
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Eliminate manual entry mistakes and fraud. Verify vehicle credentials against official records directly. Track toll spends and verify PODs with smart algorithms.
          </p>

          <div className="space-y-4 font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-teal-400" size={18} />
              <span>Vahan Lookup Simulator (Owner, Insurance, Fitness Verification)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-teal-400" size={18} />
              <span>TDS calculations (Section 194C) and RCM Invoicing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-teal-400" size={18} />
              <span>Fastag Wallet logs linked directly to route standards</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-teal-400" size={18} />
              <span>Tyre life tracker to notice wear-and-tear cycles</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold">VAHAN CHECK</span>
            <p className="text-white font-extrabold text-lg">GJ-12-BY-4567</p>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Owner: Adani Logistics</p>
              <p>Insurance: 10 Apr 2027</p>
              <p className="text-emerald-400">Status: Valid</p>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">FASTAG WALLET</span>
            <p className="text-white font-extrabold text-lg">₹7,800.00</p>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Last Debit: ₹480 (Morbi Toll)</p>
              <p className="text-emerald-400">Balance: Active</p>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2 col-span-1 md:col-span-2">
            <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">AI POD VERIFICATION</span>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <p className="text-white font-semibold">Challan #ASC-2026-00001</p>
                <p className="text-slate-400">Extracted Net Wt: 26.5 Tons</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">MATCHED 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-900/30 border-t border-slate-800 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Affordable Enterprise Pricing</h2>
            <p className="text-slate-400">
              Cancel any time. Pricing modeled to scale with your active trips per month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800/80 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-200">Startup Fleet</h4>
                <p className="text-slate-400 text-sm">Up to 5 trucks & 50 trips/mo</p>
              </div>
              <p className="text-3xl font-extrabold text-white">₹4,999<span className="text-sm text-slate-500 font-normal">/month</span></p>
              <ul className="text-xs text-slate-400 space-y-3 font-semibold">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Basic WhatsApp Commands</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Standard Trip Sheets</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> PDF Challan Download</li>
              </ul>
            </div>

            {/* Plan 2 */}
            <div className="bg-slate-950 p-8 rounded-xl border-2 border-sky-500 relative space-y-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-slate-950 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h4 className="text-xl font-bold text-white">Transport Contractor</h4>
                <p className="text-slate-400 text-sm">Up to 50 trucks & 1,000 trips/mo</p>
              </div>
              <p className="text-3xl font-extrabold text-white">₹14,999<span className="text-sm text-slate-500 font-normal">/month</span></p>
              <ul className="text-xs text-slate-400 space-y-3 font-semibold">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Custom Workflows</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Driver Wallet & Ledger</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> OpenStreetMap GPS Live</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Weighbridge & Salt Module</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> AI Delay Forecasts</li>
              </ul>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800/80 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-200">Enterprise Fleet</h4>
                <p className="text-slate-400 text-sm">Unlimited trucks & trips</p>
              </div>
              <p className="text-3xl font-extrabold text-white">₹39,999<span className="text-sm text-slate-500 font-normal">/month</span></p>
              <ul className="text-xs text-slate-400 space-y-3 font-semibold">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Meta Cloud WhatsApp API</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Hardware GPS Integrations</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> AI Smart Dispatch Chatbot</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="text-sky-500" size={14} /> Dedicated Account Manager</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-6 text-center text-slate-500 text-xs mt-auto">
        <p className="mb-2">© 2026 TCMS - Transport Contractor Management System SaaS. Built for Indian Logistics.</p>
        <p>Developed with Next.js, Tailwind CSS, TypeScript, and local RLS mock storage.</p>
      </footer>
    </div>
  );
}
