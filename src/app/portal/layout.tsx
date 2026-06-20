'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTenant } from '@/context/tenantContext';
import { 
  Truck, LayoutDashboard, Calendar, Users, MapPin, 
  Coins, MessageSquare, Map, Cpu, FileSpreadsheet, 
  Settings, LogOut, ChevronLeft, ChevronRight, Bell, 
  Menu, X, Building2, Eye, ShieldAlert, BadgeInfo,
  TrendingUp, LineChart
} from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    activeTenant, activeRole, tenants, currentTenantId, 
    changeTenant, changeRole, refreshData, currentUser, logout
  } = useTenant();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic notification list
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Document Expiry Warning', text: 'Truck GJ-12-CZ-9876 permit expires in 30 days.', type: 'warning' },
    { id: 2, title: 'AI Delay Alert', text: 'Trip ASC-2026-00002 showing medium delay risk.', type: 'danger' },
    { id: 3, title: 'Fuel Variance Exception', text: 'Trip ASC-2026-00001 refueled with +7L variance.', type: 'info' }
  ]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser]);

  // Adjust routing if role is Super Admin
  useEffect(() => {
    if (activeRole === 'Super Admin') {
      router.push('/super-admin');
    }
  }, [activeRole]);

  // Redirect or block manually typed unauthorized routes
  useEffect(() => {
    if (activeTenant && activeRole !== 'Company Admin' && activeRole !== 'Super Admin') {
      const allowedPaths = activeTenant.rolePermissions?.[activeRole] || [];
      if (pathname.startsWith('/portal/') && pathname !== '/portal/dashboard' && !allowedPaths.includes(pathname)) {
        router.push('/portal/dashboard');
      }
    }
  }, [pathname, activeRole, activeTenant]);

  const navItems = [
    { name: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { name: 'AI COO Summary', path: '/portal/coo', icon: TrendingUp },
    { name: 'Profitability Desk', path: '/portal/profitability', icon: LineChart },
    { name: 'Trip Management', path: '/portal/trips', icon: Calendar },
    { name: 'Truck Fleet (Vahan/Fastag)', path: '/portal/trucks', icon: Truck },
    { name: 'Drivers & Wallets', path: '/portal/drivers', icon: Users },
    { name: 'Contractors', path: '/portal/contractors', icon: Building2 },
    { name: 'Route Master', path: '/portal/routes', icon: MapPin },
    { name: 'Fuel Management', path: '/portal/fuel', icon: Coins },
    { name: 'Expense Logs', path: '/portal/expenses', icon: FileSpreadsheet },
    { name: 'Challan Builder', path: '/portal/challans', icon: FileSpreadsheet },
    { name: 'Invoice Hub', path: '/portal/invoices', icon: FileSpreadsheet },
    { name: 'WhatsApp Bot Console', path: '/portal/whatsapp', icon: MessageSquare },
    { name: 'GPS Live Maps', path: '/portal/gps', icon: Map },
    { name: 'AI Insights Center', path: '/portal/ai', icon: Cpu },
    { name: 'Reports & Export', path: '/portal/reports', icon: FileSpreadsheet },
    { name: 'Workspace Settings', path: '/portal/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-850">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-2 rounded-lg text-white shrink-0" style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }}>
              <Truck size={20} />
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  {activeTenant?.name || 'TCMS Portal'}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold leading-none">
                  Tenant Active: {activeTenant?.code}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            // Capabilities filters based on dynamic role permissions
            const rolePerms = activeTenant?.rolePermissions;
            const allowedPaths = (rolePerms && (activeRole === 'Operator' || activeRole === 'Finance User' || activeRole === 'Customer User'))
              ? rolePerms[activeRole]
              : [
                  '/portal/dashboard', '/portal/trips', '/portal/trucks', '/portal/drivers', '/portal/contractors', '/portal/routes', '/portal/fuel', '/portal/expenses', '/portal/challans', '/portal/invoices', '/portal/whatsapp', '/portal/gps', '/portal/ai', '/portal/reports', '/portal/settings'
                ];
            
            if (activeRole !== 'Company Admin' && !allowedPaths.includes(item.path)) {
              return null; // hide tabs the role doesn't have permission to access
            }

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                style={isActive ? { backgroundColor: activeTenant?.primaryColor || '#0284c7' } : {}}
              >
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-850 bg-slate-900/40">
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all text-left"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Exit Workspace</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE NAV OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-fade-in">
          <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-sky-500 p-2 rounded-lg text-white">
                  <Truck size={20} />
                </div>
                <span className="font-extrabold text-sm text-white">{activeTenant?.name}</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-grow overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                if (activeRole === 'Customer User' && 
                    !['/portal/dashboard', '/portal/trips', '/portal/gps', '/portal/challans', '/portal/invoices', '/portal/reports'].includes(item.path)) {
                  return null;
                }
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white"
                    style={isActive ? { backgroundColor: activeTenant?.primaryColor || '#0284c7', color: '#fff' } : {}}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 text-left"
              >
                <LogOut size={16} />
                <span>Exit Workspace</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md z-40">
          
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <span className="font-bold text-sm text-white">{activeTenant?.code}</span>
          </div>

          {/* Active Tenant Brand Label */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeTenant?.primaryColor || '#0284c7' }} />
            <span className="text-xs font-extrabold text-white tracking-wider uppercase">{activeTenant?.name || 'System Portal'}</span>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            
            {/* Active Role tag */}
            <span className="hidden sm:inline-flex bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
              {activeRole}
            </span>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/80 transition-colors relative"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-2 divide-y divide-slate-800 font-semibold text-xs">
                  <div className="p-3 text-white font-bold flex justify-between items-center">
                    <span>System Alerts</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 font-medium">No alerts active</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-850/50 rounded-lg transition-colors flex gap-2.5 items-start">
                          <ShieldAlert className={`shrink-0 mt-0.5 ${n.type === 'warning' ? 'text-yellow-500' : n.type === 'danger' ? 'text-rose-500' : 'text-sky-500'}`} size={14} />
                          <div>
                            <p className="text-slate-200 font-bold">{n.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{n.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <Link href="/portal/dashboard" onClick={() => setShowNotifications(false)} className="text-[10px] text-sky-400 hover:underline block pt-1">
                      View all logs
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center font-extrabold text-xs font-mono">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-slate-300">
                {currentUser?.name || 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE SUB-CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          
          {/* Mobile Warning Alert */}
          {activeRole === 'Customer User' && (
            <div className="mb-6 bg-sky-950/40 border border-sky-900/60 p-3.5 rounded-xl text-xs flex items-center gap-3 text-sky-400">
              <BadgeInfo size={16} />
              <span>
                <strong>Customer Portal Mode:</strong> You represent <strong>Nirma Chemical Works</strong>. You only have access to view dashboard metrics, your ongoing trips, download challans/invoices, and export custom statements.
              </span>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
