import React, { useState } from 'react';
import { useVendorContracts, useVendors, useInventory, useVendorInstallments } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Search, Plus, CreditCard, ChevronRight } from 'lucide-react';

export default function VendorContracts() {
  const { vendorContracts, loading: loadingContracts } = useVendorContracts();
  const { vendors, loading: loadingVendors } = useVendors();
  const { items, loading: loadingInventory } = useInventory();
  const { vendorInstallments } = useVendorInstallments();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentContractId, setPaymentContractId] = useState<string | null>(null);

  if (loadingContracts || loadingVendors || loadingInventory) {
    return <div className="p-8 text-gray-500">Loading vendor payables...</div>;
  }

  const filteredContracts = vendorContracts.filter(vc => {
    const v = vendors.find(ven => ven.id === vc.vendorId);
    const i = items.find(item => item.id === vc.itemId);
    const vendorMatch = v?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        v?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const itemMatch = i?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      i?.model?.toLowerCase().includes(searchTerm.toLowerCase());
    return vendorMatch || itemMatch;
  });

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentContractId) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const nextDate = formData.get('nextDate') as string;
    const method = formData.get('method') as string;

    const contract = vendorContracts.find(c => c.id === paymentContractId);
    if (!contract) return;

    try {
      await addDoc(collection(db, 'vendorInstallments'), {
        vendorContractId: contract.id,
        vendorId: contract.vendorId,
        amount,
        date: new Date().toISOString(),
        method,
      });

      const newPaid = contract.totalPaid + amount;
      const newRemaining = contract.remainingAmount - amount;
      let newStatus = contract.status;
      
      if (newRemaining <= 0) {
        newStatus = 'Completed';
      }

      await updateDoc(doc(db, 'vendorContracts', contract.id), {
        totalPaid: newPaid,
        remainingAmount: newRemaining,
        nextDueDate: nextDate || contract.nextDueDate,
        status: newStatus
      });

      const vendor = vendors.find(v => v.id === contract.vendorId);
      if (vendor) {
        await updateDoc(doc(db, 'vendors', vendor.id), {
          totalPaid: vendor.totalPaid + amount
        });
      }

      setIsPaymentModalOpen(false);
      setPaymentContractId(null);
    } catch (error) {
      console.error('Error adding payment: ', error);
      alert('Failed to add payment');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Payables</h2>
          <p className="text-gray-500">Manage installments for items purchased from vendors</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by vendor or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 font-medium text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 text-left">Vendor & Item</th>
                <th className="px-6 py-4 text-left">Purchase Details</th>
                <th className="px-6 py-4 text-left">Balance</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map(contract => {
                const vendor = vendors.find(v => v.id === contract.vendorId);
                const item = items.find(i => i.id === contract.itemId);
                const isSelected = selectedContractId === contract.id;
                
                return (
                  <React.Fragment key={contract.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{vendor?.name}</div>
                        <div className="text-sm text-gray-500">{item?.brand} {item?.model}</div>
                        <div className="text-xs text-blue-600 mt-1">Due: {formatDate(contract.nextDueDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">Total: {formatCurrency(contract.purchasePrice)}</div>
                        <div className="text-sm text-gray-500">Adv: {formatCurrency(contract.advancePaid)}</div>
                        <div className="text-xs text-gray-400 mt-1">{contract.installmentsCount} x {formatCurrency(contract.installmentAmount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">Paid: {formatCurrency(contract.totalPaid)}</div>
                        <div className="text-sm text-red-600 font-medium tracking-tight">Rem: {formatCurrency(contract.remainingAmount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${contract.status === 'Running' ? 'bg-blue-100 text-blue-800' : ''}
                          ${contract.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                          ${contract.status === 'Overdue' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedContractId(isSelected ? null : contract.id);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ChevronRight size={18} className={`transform transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </button>
                          {contract.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                setPaymentContractId(contract.id);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {isSelected && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 p-6 border-b border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-4">Installment History</h4>
                          {vendorInstallments.filter(i => i.vendorContractId === contract.id).length > 0 ? (
                            <div className="space-y-2">
                              {vendorInstallments.filter(i => i.vendorContractId === contract.id).map(inst => (
                                <div key={inst.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                                  <div>
                                    <div className="font-medium text-gray-900">{formatCurrency(inst.amount)}</div>
                                    <div className="text-xs text-gray-500">{formatDate(inst.date)} • {inst.method}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">No payments recorded yet.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No vendor contracts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPaymentModalOpen && paymentContractId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Add Installment Payment</h3>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  defaultValue={vendorContracts.find(c => c.id === paymentContractId)?.installmentAmount}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Payment Method</label>
                <select name="method" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Next Due Date (Optional)</label>
                <input 
                  type="date" 
                  name="nextDate" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
