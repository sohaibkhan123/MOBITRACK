import React, { useState } from 'react';
import { ArrowLeft, Plus, Smartphone, DollarSign, List, ShieldCheck } from 'lucide-react';
import { useVendors, useInventory, useVendorPayments } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VendorDetail({ vendorId, goBack }: { vendorId: string, goBack: () => void }) {
  const { vendors } = useVendors();
  const { items } = useInventory();
  const { payments } = useVendorPayments();

  const [activeTab, setActiveTab] = useState<'inventory' | 'payments'>('inventory');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const vendor = vendors.find(v => v.id === vendorId);
  const vendorItems = items.filter(i => i.vendorId === vendorId);
  const vendorPayments = payments.filter(p => p.vendorId === vendorId);

  // Recalculate robustly from actual items and payments
  const totalPurchasesCalc = vendorItems.reduce((acc, item) => acc + item.purchasePrice, 0);
  const totalPaidCalc = vendorPayments.reduce((acc, payment) => acc + payment.amount, 0);
  const balance = totalPurchasesCalc - totalPaidCalc;

  if (!vendor) return <div>Loading vendor details...</div>;

  const handleMakePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    
    // Add payment
    await addDoc(collection(db, 'vendorPayments'), {
      vendorId: vendor.id,
      amount,
      date: new Date().toISOString(),
      method: formData.get('method') as string,
      receiptNumber: `V-REC-${Date.now().toString().slice(-5)}`
    });

    // Update Vendor totals
    await updateDoc(doc(db, 'vendors', vendor.id), {
      totalPaid: vendor.totalPaid + amount
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{vendor.company}</h2>
          <p className="text-gray-500">{vendor.name} • {vendor.phone}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Purchase Price (All Mobiles)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalPurchasesCalc)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaidCalc)}</p>
        </div>
        <div className={`bg-white p-6 rounded-xl border ${balance > 0 ? 'border-red-100 bg-red-50' : 'border-gray-100'} shadow-sm`}>
          <p className={`text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>Balance Remaining</p>
          <p className={`text-2xl font-bold mt-1 ${balance > 0 ? 'text-red-700' : 'text-gray-900'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2"><Smartphone size={18} /> View Inventory ({vendorItems.length})</div>
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2"><DollarSign size={18} /> Vendor Billings & Payments</div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Info</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendorItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{item.brand} {item.model}</p>
                        <p className="text-xs text-gray-500">IMEI: {item.imei1 || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.model} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Smartphone size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'Available' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vendorItems.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No inventory found for this vendor.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus size={20} /> Make Payment
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt Number</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendorPayments.map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.date)}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{p.receiptNumber}</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(p.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.method}</td>
                      </tr>
                    ))}
                    {vendorPayments.length === 0 && (
                       <tr>
                         <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No payments recorded for this vendor.</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Make Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleMakePayment} className="p-6 space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase">Balance Due</label>
                 <p className="text-lg font-bold text-red-600 mb-2">{formatCurrency(balance)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount Paying</label>
                <input name="amount" type="number" max={balance > 0 ? balance : undefined} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
                <select name="method" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
