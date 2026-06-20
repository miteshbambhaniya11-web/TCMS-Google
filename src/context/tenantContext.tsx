'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User, localDb } from '@/db/localDb';

interface TenantContextType {
  activeTenant: Tenant | null;
  activeRole: User['role'];
  tenants: Tenant[];
  users: User[];
  currentTenantId: string;
  currentUser: User | null;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  changeTenant: (tenantId: string) => void;
  changeRole: (role: User['role']) => void;
  refreshData: () => void;
  resetDatabase: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-1');
  const [activeRole, setActiveRole] = useState<User['role']>('Company Admin');
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize and load database
  const loadData = () => {
    localDb.initialize();
    const allTenants = localDb.getTenants();
    const allUsers = localDb.getUsers();
    setTenants(allTenants);
    setUsers(allUsers);

    // Get current tenant
    const t = allTenants.find(item => item.id === currentTenantId);
    setActiveTenant(t || null);
  };

  // Sync state on load (load saved user sessions)
  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tcms_logged_in_user');
      if (stored) {
        try {
          const user = JSON.parse(stored) as User;
          setCurrentUser(user);
          setCurrentTenantId(user.tenantId);
          setActiveRole(user.role);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (currentTenantId !== 'all') {
      const allTenants = localDb.getTenants();
      const t = allTenants.find(item => item.id === currentTenantId);
      setActiveTenant(t || null);
    } else {
      setActiveTenant(null);
    }
  }, [currentTenantId]);

  // Sync color variable with active tenant primary color
  useEffect(() => {
    if (activeTenant && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--tenant-primary', activeTenant.primaryColor);
    } else if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--tenant-primary', '#0284c7'); // Default
    }
  }, [activeTenant]);

  const login = (email: string, password?: string): { success: boolean; error?: string } => {
    const allUsers = localDb.getUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'User account with this email not found.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    if (user.role === 'Super Admin' || user.tenantId === 'all') {
      setCurrentUser(user);
      setCurrentTenantId('all');
      setActiveRole('Super Admin');
      setActiveTenant(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tcms_logged_in_user', JSON.stringify(user));
      }
      return { success: true };
    }

    const allTenants = localDb.getTenants();
    const tenant = allTenants.find(t => t.id === user.tenantId);
    if (!tenant) {
      return { success: false, error: 'Company subscription profile not found.' };
    }

    if (tenant.status === 'Pending Approval') {
      return { success: false, error: 'SaaS subscription request is pending activation by Super Admin.' };
    }

    if (tenant.status === 'Suspended') {
      return { success: false, error: 'Company subscription has been suspended. Contact support.' };
    }

    if (user.status === 'Inactive') {
      return { success: false, error: 'Your user profile is marked inactive. Contact administrator.' };
    }

    setCurrentUser(user);
    setCurrentTenantId(user.tenantId);
    setActiveRole(user.role);
    setActiveTenant(tenant);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tcms_logged_in_user', JSON.stringify(user));
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentTenantId('tenant-1');
    setActiveRole('Company Admin');
    setActiveTenant(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tcms_logged_in_user');
    }
  };

  const changeTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
  };

  const changeRole = (role: User['role']) => {
    setActiveRole(role);
    if (role === 'Super Admin') {
      setCurrentTenantId('all');
    }
  };

  const refreshData = () => {
    loadData();
  };

  const resetDatabase = () => {
    localDb.reset();
    logout();
    loadData();
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        activeRole,
        tenants,
        users,
        currentTenantId,
        currentUser,
        login,
        logout,
        changeTenant,
        changeRole,
        refreshData,
        resetDatabase,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
