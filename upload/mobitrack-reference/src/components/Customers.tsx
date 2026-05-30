import React, { useState } from 'react';
import { Plus, Search, User, Phone, MapPin, CreditCard, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useCustomers } from '../hooks/useData';
import { formatDate } from '../lib/utils';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer } from '../types';

export default function Customers({ goToDetail }: { goToDetail?: (id: string) => void }) {
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnic.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  const handleDelete = (id: string) => {
    setCustomerToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!customerToDeleteId) return;
    try {
      await deleteDoc(doc(db, 'customers', customerToDeleteId));
      setCustomerToDeleteId(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. " + (error instanceof Error ? error.message : ""));
      setCustomerToDeleteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      fullName: formData.get('fullName') as string,
      fatherName: formData.get('fatherName') as string,
      cnic: formData.get('cnic') as string,
      phone: formData.get('phone') as string,
      altPhone: formData.get('altPhone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      occupation: formData.get('occupation') as string,
      income: Number(formData.get('income')),
      guarantorName: formData.get('guarantorName') as string,
      guarantorPhone: formData.get('guarantorPhone') as string,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    if (editingCustomer) {
      await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
    } else {
      await addDoc(collection(db, 'customers'), customerData);
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, CNIC or phone..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-md shadow-indigo-150 hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100/50 shadow-xs">
                    {customer.fullName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-850 hover:text-indigo-600 transition-colors">{customer.fullName}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CreditCard size={16} className="text-gray-400" />
                  <span>{customer.cnic}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="truncate">{customer.address}, {customer.city}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider",
                  customer.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" : "bg-rose-50 text-rose-700 border border-rose-100/50"
                )}>
                  {customer.status}
                </span>
                <button 
                  onClick={() => goToDetail && goToDetail(customer.id)}
                  className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider hover:text-indigo-800 transition-colors flex items-center gap-1 group/btn"
                >
                  <span>View Ledger</span>
                  <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Information</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                     <input name="fullName" defaultValue={editingCustomer?.fullName} required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Father Name</label>
                    <input name="fatherName" defaultValue={editingCustomer?.fatherName} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">CNIC / ID Number</label>
                    <input name="cnic" defaultValue={editingCustomer?.cnic} required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                    <input name="phone" defaultValue={editingCustomer?.phone} required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Address & Employment</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                    <input name="address" defaultValue={editingCustomer?.address} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">City</label>
                    <input name="city" defaultValue={editingCustomer?.city} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Occupation</label>
                    <input name="occupation" defaultValue={editingCustomer?.occupation} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Monthly Income</label>
                    <input name="income" type="number" defaultValue={editingCustomer?.income} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-150 text-sm active:scale-95">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Customer</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCustomerToDeleteId(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
