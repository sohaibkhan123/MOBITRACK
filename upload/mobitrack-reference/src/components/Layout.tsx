import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Smartphone, Users, FileText, CreditCard, LogOut, Package, AlertCircle, Compass, Zap, Database, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { getStorageMode, setStorageMode } from '../firebase';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-xl",
        active 
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-150 border border-indigo-500/30" 
          : "text-slate-650 hover:bg-slate-50 hover:text-indigo-600 hover:translate-x-0.5"
      )}
    >
      <Icon size={18} className={cn("transition-transform", active ? "text-white scale-105" : "text-slate-400")} />
      {label}
    </button>
  );
}

export default function Layout({ children, activeTab, setActiveTab }: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (tab: string) => void 
}) {
  const { profile, logout } = useAuth();
  const [currentMode, setCurrentMode] = useState<'offline' | 'mysql'>('offline');

  useEffect(() => {
    // Sync initial state
    setCurrentMode(getStorageMode());

    // Listen for storage change events
    const handleModeChange = () => {
      setCurrentMode(getStorageMode());
    };
    window.addEventListener('storage-mode-change', handleModeChange);
    return () => window.removeEventListener('storage-mode-change', handleModeChange);
  }, []);

  const handleToggleMode = (mode: 'offline' | 'mysql') => {
    setStorageMode(mode);
  };

  const menuItems = [
    { id: 'hub', label: 'Control Center', icon: Compass },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'vendor-contracts', label: 'Vendor Payables', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'contracts', label: 'Installments', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'due', label: 'Due Tracking', icon: AlertCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5 text-indigo-400 font-extrabold text-2xl tracking-tight">
            <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-sm border border-indigo-500/20">
              <Smartphone size={22} className="stroke-[2.5]" />
            </div>
            <span>Hafiz Mobiles</span>
          </div>
          <p className="text-[10px] text-indigo-400/80 mt-2 uppercase tracking-widest font-bold">Latest Mobile Phones on Easy Installments</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center w-full gap-3 px-4 py-2.5 my-0.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 rounded-xl",
                  isActive 
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 border border-indigo-500/40" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-0.5"
                )}
              >
                <item.icon size={16} className={isActive ? "text-white animate-pulse" : "text-slate-500"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate leading-tight uppercase tracking-wide">{profile?.displayName}</p>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            <LogOut size={14} />
            Logout Account
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
              {activeTab === 'hub' ? 'Operational Hub' : activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Elegant Hybrid Database Hot-Sync pill selector */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm animate-pulse">
              <Zap size={12} className="text-emerald-500 animate-bounce" />
              <span>OFFLINE SECURE SANDBOX</span>
            </div>

            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

