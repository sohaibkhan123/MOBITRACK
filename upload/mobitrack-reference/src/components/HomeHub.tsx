import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Users, FileText, CreditCard, AlertCircle, 
  ArrowRight, Smartphone, Compass, Shield, Users2, ShoppingBag, 
  TrendingUp, Activity, CheckCircle, Clock
} from 'lucide-react';
import { 
  useInventory, useCustomers, useContracts, usePayments, 
  useVendors, useVendorContracts 
} from '../hooks/useData';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { getStorageMode } from '../firebase';

export default function HomeHub({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { profile } = useAuth();
  const [currentMode, setCurrentMode] = useState<'offline' | 'mysql'>('offline');

  useEffect(() => {
    setCurrentMode(getStorageMode());
    const handleModeChange = () => {
      setCurrentMode(getStorageMode());
    };
    window.addEventListener('storage-mode-change', handleModeChange);
    return () => window.removeEventListener('storage-mode-change', handleModeChange);
  }, []);
  
  // Real-time data hooks for live metrics
  const { items, loading: loadingInv } = useInventory();
  const { customers, loading: loadingCust } = useCustomers();
  const { contracts, loading: loadingContracts } = useContracts();
  const { payments, loading: loadingPayments } = usePayments();
  const { vendors, loading: loadingVendors } = useVendors();
  const { vendorContracts, loading: loadingVC } = useVendorContracts();

  // Compute states
  const totalMobiles = items.length;
  const availableMobiles = items.filter(i => i.status === 'Available').length;
  const activeContracts = contracts.filter(c => c.status === 'Running' || c.status === 'Overdue');
  const totalOutstanding = activeContracts.reduce((acc, c) => acc + c.remainingAmount, 0);
  const overdueContractsCount = contracts.filter(c => c.status === 'Overdue').length;
  
  const activeVendorContracts = vendorContracts.filter(vc => vc.status === 'Running' || vc.status === 'Overdue');
  const vendorOwedTotal = activeVendorContracts.reduce((acc, vc) => acc + vc.remainingAmount, 0);

  const hubItems = [
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      description: 'Review financials, collection overviews, and monthly sales profit metrics.',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100 hover:border-blue-300',
      stat: loadingContracts || loadingPayments ? '...' : `${activeContracts.length} Active Plans`,
      subStat: loadingPayments ? '' : `Outstanding: ${formatCurrency(totalOutstanding)}`
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      description: 'Manage shop mobile and accessory stock directories, IMEI indexes, and purchase values.',
      icon: Package,
      color: 'from-violet-500 to-purple-600',
      textColor: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100 hover:border-violet-300',
      stat: loadingInv ? '...' : `${totalMobiles} Mobiles`,
      subStat: loadingInv ? '' : `${availableMobiles} Available to sell`
    },
    {
      id: 'vendors',
      label: 'Suppliers & Vendors',
      description: 'Manage vendor details, track corporate purchase histories, and contact info.',
      icon: Users2,
      color: 'from-sky-500 to-cyan-600',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100 hover:border-sky-300',
      stat: loadingVendors ? '...' : `${vendors.length} Vendors`,
      subStat: 'Integrated mobile suppliers'
    },
    {
      id: 'vendor-contracts',
      label: 'Vendor Payables',
      description: 'Track shop payables, purchase installments, and payments made to mobile suppliers.',
      icon: FileText,
      color: 'from-rose-500 to-pink-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100 hover:border-rose-300',
      stat: loadingVC ? '...' : `${activeVendorContracts.length} Owed Plans`,
      subStat: loadingVC ? '' : `Owed: ${formatCurrency(vendorOwedTotal)}`
    },
    {
      id: 'customers',
      label: 'Buyer Index',
      description: 'Comprehensive customers directory, address verification, and credit standing logs.',
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100 hover:border-emerald-300',
      stat: loadingCust ? '...' : `${customers.length} Customers`,
      subStat: 'Verified buyer profiles'
    },
    {
      id: 'contracts',
      label: 'Installment Contracts',
      description: 'Set up customer payment timelines, check active frequencies, and log warranties.',
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100 hover:border-amber-300',
      stat: loadingContracts ? '...' : `${contracts.length} Total Sales`,
      subStat: loadingContracts ? '' : `${contracts.filter(c => c.status === 'Completed').length} Fully paid`
    },
    {
      id: 'payments',
      label: 'Payment Terminal',
      description: 'Log and verify customer installment payments, print receipts, and track write-offs.',
      icon: CreditCard,
      color: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100 hover:border-indigo-300',
      stat: loadingPayments ? '...' : `${payments.length} Transactions`,
      subStat: 'Instant receipt verification'
    },
    {
      id: 'due',
      label: 'Due Diligence & Alerts',
      description: 'Proactively track overdues, late installment warnings, and map out payment schedules.',
      icon: AlertCircle,
      color: 'from-red-500 to-rose-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100 hover:border-red-300',
      stat: loadingContracts ? '...' : `${overdueContractsCount} Delay Alerts`,
      subStat: 'Requires urgent checkups'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-8 shadow-xl">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl -mb-10"></div>
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wider text-xs uppercase">
            <Compass size={14} className="animate-spin-slow" />
            <span>Operational Control Center</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            Welcome Back, {profile?.displayName || 'Administrator'}
          </h2>
          <p className="text-indigo-200 text-sm sm:text-base leading-relaxed font-light">
            Hafiz Mobiles is fully operational. Manage cell phone inventory, calculate profit ratios, generate automated installment installment trackers, and coordinate customer receipts from a single unified workspace.
          </p>

          {/* Core system indicator badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {currentMode === 'offline' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Offline Sandbox Memory
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/25 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                Active Cloud MySQL
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/20 rounded-full text-xs font-semibold text-indigo-300">
              <Shield size={12} className="text-indigo-400" />
              Role: <span className="capitalize">{profile?.role || 'Staff'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-slate-300">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Launcher Directory</h3>
        <p className="text-xs text-slate-500">Pick any operational sector to instantly view historical data or perform quick edits.</p>
      </div>

      {/* Modern Bento Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hubItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex flex-col justify-between p-6 bg-white rounded-2xl border ${item.borderColor} shadow-sm hover:shadow-md transition-all duration-300 text-left outline-none relative overflow-hidden`}
              style={{ contentVisibility: 'auto' }}
            >
              {/* Card micro backdrop glow on hover */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-tr from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="space-y-4">
                {/* Header Icon Wrap */}
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${item.bgColor} ${item.textColor} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    <ArrowRight size={18} />
                  </div>
                </div>

                {/* Info Text */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 group-hover:text-slate-900 text-base">{item.label}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Stat Footer with modern divide */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between w-full">
                <span className="text-sm font-semibold text-slate-700">{item.stat}</span>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{item.subStat}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini Quick-Start section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200/60 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700">
              <TrendingUp size={20} />
              <h4 className="font-bold">Sales Pipeline</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analyze daily, weekly, or custom monthly charts. See profit estimates on sold smartphones instantly.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-max"
          >
            <span>Analyze statistics</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-violet-50/20 border border-slate-200/60 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-700">
              <Package size={20} />
              <h4 className="font-bold">Rapid Cataloging</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add new mobile phones directly, assign customized purchase installments or configure immediate client listings.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('inventory')} 
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors w-max"
          >
            <span>Manage catalogs</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200/60 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <Activity size={20} />
              <h4 className="font-bold">Instalment Balance Alert</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review any lagging customer collections or vendor payment offsets. Ensure no deadlines slip through.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('due')} 
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors w-max"
          >
            <span>Audit timelines</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
