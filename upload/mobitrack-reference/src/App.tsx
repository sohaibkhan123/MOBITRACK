import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Contracts from './components/Contracts';
import Payments from './components/Payments';
import DueTracking from './components/DueTracking';
import Vendors from './components/Vendors';
import VendorDetail from './components/VendorDetail';
import CustomerDetail from './components/CustomerDetail';
import { Smartphone, LogIn } from 'lucide-react';

import VendorContracts from './components/VendorContracts';
import HomeHub from './components/HomeHub';

export default function App() {
  const { user, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState('hub');
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await login(email, displayName, role);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Hafiz Mobiles...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Smartphone size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-indigo-605 text-center mb-1">Hafiz Mobiles</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide text-center mb-6">Mobile Installment Management System</p>
          
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="admin@hafizmobiles.com" 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
              <input 
                type="text" 
                placeholder="Muhammad Ali" 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">System Role</label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-600 bg-white cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="salesman">Salesman (Restricted)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-150 active:scale-98 disabled:opacity-50 mt-2"
            >
              <LogIn size={16} />
              {isSubmitting ? 'Signing in...' : 'Sign in to Database'}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Database Engine: Cloud MySQL</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'vendor-detail' && activeVendorId) {
      return <VendorDetail vendorId={activeVendorId} goBack={() => setActiveTab('vendors')} />;
    }
    if (activeTab === 'customer-detail' && activeCustomerId) {
      return <CustomerDetail customerId={activeCustomerId} goBack={() => setActiveTab('customers')} />;
    }

    switch (activeTab) {
      case 'hub': return <HomeHub setActiveTab={setActiveTab} />;
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory goToVendor={(id) => { setActiveVendorId(id); setActiveTab('vendor-detail'); }} goToVendorPayables={() => setActiveTab('vendor-contracts')} />;
      case 'vendors': return <Vendors goToDetail={(id) => { setActiveVendorId(id); setActiveTab('vendor-detail'); }} />;
      case 'vendor-contracts': return <VendorContracts />;
      case 'customers': return <Customers goToDetail={(id) => { setActiveCustomerId(id); setActiveTab('customer-detail'); }} />;
      case 'contracts': return <Contracts goToVendorPayables={() => setActiveTab('vendor-contracts')} />;
      case 'payments': return <Payments goToVendorPayables={() => setActiveTab('vendor-contracts')} />;
      case 'due': return <DueTracking />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
