import React, { useState } from 'react';
import { Search, CreditCard, Calendar, User, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import { usePayments, useContracts, useCustomers, useVendorContracts, useVendors } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Payment } from '../types';

export default function Payments({ goToVendorPayables }: { goToVendorPayables?: () => void }) {
  const { payments } = usePayments();
  const { contracts } = useContracts();
  const { customers } = useCustomers();
  const { vendorContracts } = useVendorContracts();
  const { vendors } = useVendors();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedContractIdForPayment, setSelectedContractIdForPayment] = useState<string>('');

  const [paymentToDelete, setPaymentToDelete] = useState<{paymentId: string, contractId: string, amount: number} | null>(null);

  const filteredPayments = payments.filter(p => {
    const customer = customers.find(c => c.id === p.customerId);
    return (
      p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDeletePayment = (paymentId: string, contractId: string, amount: number) => {
    setPaymentToDelete({paymentId, contractId, amount});
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const contract = contracts.find(c => c.id === paymentToDelete.contractId);
      if (contract) {
        await updateDoc(doc(db, 'contracts', paymentToDelete.contractId), {
          totalPaid: Math.max(0, contract.totalPaid - paymentToDelete.amount),
          remainingAmount: contract.remainingAmount + paymentToDelete.amount,
          status: 'Running' // Default to Running, might need to update based on actual balance
        });
      }
      await deleteDoc(doc(db, 'payments', paymentToDelete.paymentId));
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment. " + (error instanceof Error ? error.message : ""));
      setPaymentToDelete(null);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amount = Number(formData.get('amount'));
    const contractId = formData.get('contractId') as string;
    const contract = contracts.find(c => c.id === contractId);
    
    if (!contract) return;

    const nextDueDate = formData.get('nextDueDate') as string;
    
    if (editingPayment) {
      await updateDoc(doc(db, 'payments', editingPayment.id), {
        contractId,
        customerId: contract.customerId,
        amount,
        method: formData.get('method') as string,
        nextDueDateSet: nextDueDate,
      });

      if (editingPayment.contractId === contractId) {
         const diff = amount - editingPayment.amount;
         const newTotalPaid = contract.totalPaid + diff;
         const newRemaining = contract.totalPrice - newTotalPaid;
         const newStatus = newRemaining <= 0 ? 'Completed' : 'Running';
         const updateData: any = {
           totalPaid: newTotalPaid,
           remainingAmount: newRemaining,
           status: newStatus,
         };
         if (newStatus !== 'Completed' && nextDueDate) {
           updateData.nextDueDate = new Date(nextDueDate).toISOString();
         }
         await updateDoc(doc(db, 'contracts', contractId), updateData);
      } else {
         // Revert old contract
         const oldContract = contracts.find(c => c.id === editingPayment.contractId);
         if (oldContract) {
           await updateDoc(doc(db, 'contracts', oldContract.id), {
             totalPaid: Math.max(0, oldContract.totalPaid - editingPayment.amount),
             remainingAmount: oldContract.remainingAmount + editingPayment.amount,
             status: 'Running'
           });
         }
         // Apply to new contract
         const newTotalPaid = contract.totalPaid + amount;
         const newRemaining = contract.totalPrice - newTotalPaid;
         const newStatus = newRemaining <= 0 ? 'Completed' : 'Running';
         const updateData: any = {
           totalPaid: newTotalPaid,
           remainingAmount: newRemaining,
           status: newStatus,
         };
         if (newStatus !== 'Completed' && nextDueDate) {
           updateData.nextDueDate = new Date(nextDueDate).toISOString();
         }
         await updateDoc(doc(db, 'contracts', contractId), updateData);
      }
    } else {
      const paymentData = {
        contractId,
        customerId: contract.customerId,
        amount,
        date: new Date().toISOString(),
        method: formData.get('method') as string,
        receivedBy: auth.currentUser?.displayName || 'System',
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        nextDueDateSet: nextDueDate,
      };

      await addDoc(collection(db, 'payments'), paymentData);
      
      const newTotalPaid = contract.totalPaid + amount;
      const newRemaining = contract.totalPrice - newTotalPaid;
      const newStatus = newRemaining <= 0 ? 'Completed' : contract.status;
      
      const updateData: any = {
        totalPaid: newTotalPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      };
      
      if (newStatus !== 'Completed' && nextDueDate) {
        updateData.nextDueDate = new Date(nextDueDate).toISOString();
      }
      
      await updateDoc(doc(db, 'contracts', contractId), updateData);
    }
    
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by receipt # or customer..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setSelectedContractIdForPayment('');
            setEditingPayment(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Received By</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => {
                const customer = customers.find(c => c.id === payment.customerId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{payment.receiptNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{customer?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{payment.method}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{payment.receivedBy}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { 
                            setEditingPayment(payment); 
                            setSelectedContractIdForPayment(payment.contractId);
                            setIsModalOpen(true); 
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Payment"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeletePayment(payment.id, payment.contractId, payment.amount)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingPayment(null); }} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Select Contract</label>
                <select 
                  name="contractId" 
                  value={selectedContractIdForPayment} 
                  onChange={(e) => setSelectedContractIdForPayment(e.target.value)} 
                  required 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Contract...</option>
                  {contracts.filter(c => c.status !== 'Completed' || (editingPayment && c.id === editingPayment.contractId)).map(c => {
                    const cust = customers.find(cust => cust.id === c.customerId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.contractNumber} - {cust?.fullName} ({formatCurrency(c.installmentAmount)})
                      </option>
                    );
                  })}
                </select>

                {/* Vendor notice */}
                {selectedContractIdForPayment && (() => {
                  const selectedContract = contracts.find(c => c.id === selectedContractIdForPayment);
                  const relatedVendorContract = vendorContracts.find(vc => vc.itemId === selectedContract?.itemId);
                  if (relatedVendorContract) {
                    const vendor = vendors.find(v => v.id === relatedVendorContract.vendorId);
                    return (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-blue-800">Vendor Installment Notice</span>
                          {goToVendorPayables && (
                            <button type="button" onClick={goToVendorPayables} className="text-xs text-blue-600 hover:text-blue-800 underline">View Payables</button>
                          )}
                        </div>
                        <p className="text-sm text-blue-700">
                          Item purchased from <b>{vendor?.name}</b> on installents.
                        </p>
                        <div className="flex justify-between items-center text-xs text-blue-600 font-medium pt-1">
                           <span>Owed to Vendor (Inst Amount):</span>
                           <span>{formatCurrency(relatedVendorContract.installmentAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-green-700 font-medium">
                           <span>Retained Profit (if inst paid in full):</span>
                           <span>{formatCurrency((selectedContract?.installmentAmount || 0) - relatedVendorContract.installmentAmount)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount Received</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input name="amount" type="number" defaultValue={editingPayment?.amount} required className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
                  <select name="method" defaultValue={editingPayment?.method || 'Cash'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Next Due Date</label>
                  <input type="date" name="nextDueDate" defaultValue={editingPayment?.nextDueDateSet?.split('T')[0]} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingPayment(null); }} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Payment</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this payment? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPaymentToDelete(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePayment} 
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
