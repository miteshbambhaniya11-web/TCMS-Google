'use client';

import React from 'react';
import { Lock, ShieldAlert, CreditCard } from 'lucide-react';
import { useTenant } from '@/context/tenantContext';

interface FeatureLockedProps {
  featureName: string;
  featureDescription: string;
}

export default function FeatureLocked({ featureName, featureDescription }: FeatureLockedProps) {
  const { activeTenant } = useTenant();
  const currentPlan = activeTenant?.subscription?.plan || 'Startup Fleet';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center rounded-2xl border border-white/20 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl max-w-lg mx-auto my-12 transition-all duration-300 hover:shadow-2xl">
      <div className="relative flex items-center justify-center w-20 h-20 mb-6 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl animate-pulse">
        <Lock className="w-10 h-10" />
        <ShieldAlert className="w-5 h-5 absolute -bottom-1 -right-1 text-amber-500 dark:text-amber-400 animate-bounce" />
      </div>
      
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        {featureName} is Locked
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed max-w-sm">
        {featureDescription}
      </p>
      
      <div className="p-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 w-full text-left">
        <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
          <span>Current Subscription</span>
          <span className="text-rose-500 font-bold dark:text-rose-400">{currentPlan}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
          This feature requires a premium plan. Your organization admin can configure this on the Super Admin console or contact customer success.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <a
          href="mailto:support@tcms.com?subject=Subscription Upgrade Request"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-all duration-200 shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          Request Upgrade
        </a>
        <button
          onClick={() => window.history.back()}
          className="flex-1 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
