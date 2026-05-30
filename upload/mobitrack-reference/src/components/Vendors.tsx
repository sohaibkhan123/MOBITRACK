import React, { useState } from 'react';
import { Plus, Search, Building2, Eye, MapPin, Phone, Edit2, Trash2 } from 'lucide-react';
import { useVendors } from '../hooks/useData';
import { formatCurrency } from '../lib/utils';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Vendor } from '../types';

export default function Vendors({ goToDetail }: { goToDetail: (id: string) => void }) {
  const { vendors, loading } = useVendors();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  const filteredVendors = vendors.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteVendor = (id: string) => {
    setVendorToDelete(id);
  };

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      const db = (await import('../firebase')).db;
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vendors', vendorToDelete));
      setVendorToDelete(null);
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. " + (error instanceof Error ? error.message : ""));
      setVendorToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const vendorData = {
      name: name,
      company: (formData.get('company') as string) || name,
      phone: (formData.get('phone') as string) || '',
      address: (formData.get('address') as string) || '',
      totalPurchases: editingVendor ? editingVendor.totalPurchases : 0,
      totalPaid: editingVendor ? editingVendor.totalPaid : 0,
    };

    if (editingVendor) {
      await updateDoc(doc(db, 'vendors', editingVendor.id), vendorData);
    } else {
      await addDoc(collection(db, 'vendors'), vendorData);
    }
    setIsModalOpen(false);
    setEditingVendor(null);
  };

  const totalBalanceToPay = vendors.reduce((acc, v) => acc + (v.totalPurchases - v.totalPaid), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50/40 rounded-bl-3xl"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Suppliers</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{vendors.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-violet-50/40 rounded-bl-3xl"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchase Volume</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(vendors.reduce((acc, v) => acc + v.totalPurchases, 0))}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-rose-100/50 shadow-sm bg-rose-50/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-rose-100/20 rounded-bl-3xl"></div>
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Balance to Pay</p>
          <p className="text-3xl font-extrabold text-rose-700 mt-2">{formatCurrency(totalBalanceToPay)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm shadow-md shadow-indigo-150 active:scale-95"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => {
          const balance = vendor.totalPurchases - vendor.totalPaid;
          return (
            <div key={vendor.id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/30">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-850 hover:text-indigo-600 transition-colors">{vendor.company}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">{vendor.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { setEditingVendor(vendor); setIsModalOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <Phone size={14} className="text-slate-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{vendor.address || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Purchase</p>
                    <p className="font-extrabold text-slate-700 mt-0.5 text-sm">{formatCurrency(vendor.totalPurchases)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Balance</p>
                    <p className={`font-extrabold mt-0.5 text-sm ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => goToDetail(vendor.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer active:scale-98"
                >
                  <Eye size={14} />
                  View Details & Billing
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Vendor/Person Name</label>
                <input name="name" defaultValue={editingVendor?.name} required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Company Name (Optional)</label>
                <input name="company" defaultValue={editingVendor?.company} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number (Optional)</label>
                <input name="phone" defaultValue={editingVendor?.phone} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                <input name="address" defaultValue={editingVendor?.address} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-550 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-150 text-sm active:scale-95">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {vendorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Vendor</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this vendor? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setVendorToDelete(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteVendor} 
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
