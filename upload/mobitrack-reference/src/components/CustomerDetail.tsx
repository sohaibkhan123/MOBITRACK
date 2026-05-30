import React, { useState } from 'react';
import { ArrowLeft, CreditCard, FileText, User, Printer, X } from 'lucide-react';
import { usePayments, useContracts, useInventory, useCustomers } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import ContractDetail from './ContractDetail';

export default function CustomerDetail({ customerId, goBack }: { customerId: string, goBack: () => void }) {
  const { customers } = useCustomers();
  const { contracts } = useContracts();
  const { payments } = usePayments();
  const { items } = useInventory();

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showPrintLedger, setShowPrintLedger] = useState(false);

  const customer = customers.find(c => c.id === customerId);
  const customerContracts = contracts.filter(c => c.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!customer) return <div>Loading...</div>;

  if (selectedContractId) {
    const selectedContract = contracts.find(c => c.id === selectedContractId);
    if (selectedContract) {
      return <ContractDetail contract={selectedContract} goBack={() => setSelectedContractId(null)} />;
    }
  }

  const totalPurchases = customerContracts.reduce((acc, c) => acc + c.totalPrice, 0);
  const totalPaid = customerContracts.reduce((acc, c) => acc + c.totalPaid, 0);
  const totalRemaining = customerContracts.reduce((acc, c) => acc + c.remainingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{customer.fullName}</h2>
            <p className="text-sm text-slate-500">Father's Name: {customer.fatherName || 'N/A'} • CNIC: {customer.cnic} • Phone: {customer.phone}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrintLedger(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-wider font-extrabold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Printer size={14} />
          Print Customer Account Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Purchase Volume</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`bg-white p-6 rounded-xl border ${totalRemaining > 0 ? 'border-red-100 bg-red-50' : 'border-gray-100'} shadow-sm`}>
          <p className={`text-sm font-medium ${totalRemaining > 0 ? 'text-red-600' : 'text-gray-500'}`}>Total Balance Due</p>
          <p className={`text-2xl font-bold mt-1 ${totalRemaining > 0 ? 'text-red-700' : 'text-gray-900'}`}>{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-800 flex items-center gap-2">
          <FileText size={18} /> Contracts
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract #</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerContracts.map(contract => {
                const item = items.find(i => i.id === contract.itemId);
                return (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{contract.contractNumber}</td>
                    <td className="px-6 py-4">
                      {item ? (
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.brand} {item.model}</p>
                          <p className="text-xs text-gray-500">IMEI: {item.imei1 || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown Item</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(contract.totalPrice)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        contract.status === 'Completed' ? 'bg-green-50 text-green-600' :
                        contract.status === 'Running' ? 'bg-blue-50 text-blue-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedContractId(contract.id)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customerContracts.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No contracts found for this customer.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-800 flex items-center gap-2">
          <CreditCard size={18} /> Payment History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract #</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerPayments.map(p => {
                const contract = contracts.find(c => c.id === p.contractId);
                return (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.date)}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{p.receiptNumber}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{contract?.contractNumber || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(p.amount)}</td>
                  </tr>
                );
              })}
              {customerPayments.length === 0 && (
                 <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No payments recorded for this customer.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled Printable Customer Account Ledger Modal */}
      {showPrintLedger && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-ledger-area, #printable-ledger-area * {
                visibility: visible !important;
              }
              #printable-ledger-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print truncate">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-indigo-400" />
                <span className="font-extrabold text-sm uppercase tracking-wider">Hafiz Mobiles • Ledger Print Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
                >
                  Confirm and Print Now
                </button>
                <button
                  onClick={() => setShowPrintLedger(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-ledger-area" className="p-8 overflow-y-auto bg-white text-slate-850 space-y-6">
              {/* Invoice Layout Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">HAFIZ MOBILES</h1>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Latest Smartphones on Cash & Easy Monthly Installments</p>
                  <p className="text-xs text-slate-500 mt-1">Sadiqabad Road / Hall Road, Lahore, Pakistan • Contact: +92 300 1234567</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded">
                     Ledger Statement
                  </span>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-2">Statement Date</p>
                  <p className="text-xs font-extrabold text-slate-800">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Customer Particulars Profiler */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Customer General Profile</h3>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><span className="font-bold text-slate-905 text-sm">Name:</span> {customer.fullName}</p>
                    <p><span className="font-bold text-slate-905 text-sm">Father's Name:</span> {customer.fatherName || 'N/A'}</p>
                    <p><span className="font-bold text-slate-905">CNIC Card Number:</span> <span className="font-mono">{customer.cnic}</span></p>
                    <p><span className="font-bold text-slate-905">Occupation / Job:</span> {customer.occupation || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Contact & Address</h3>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><span className="font-bold text-slate-905">Primary Mobile No:</span> {customer.phone}</p>
                    <p><span className="font-bold text-slate-905">Alt Phone / Home No:</span> {customer.altPhone || 'N/A'}</p>
                    <p><span className="font-bold text-slate-905">Residence Address:</span> {customer.address || 'N/A'}</p>
                    <p><span className="font-bold text-slate-905">City / District:</span> {customer.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Ledger Summary Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Gross Purchased value</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(totalPurchases)}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Net Paid</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl text-white">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Remaining Balance</p>
                  <p className="text-lg font-black mt-1">{formatCurrency(totalRemaining)}</p>
                </div>
              </div>

              {/* Installment Contracts Particulars */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <FileText size={14} /> Active Installment Agreements / Contracts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500 font-bold">
                        <th className="py-2">Agreement ID</th>
                        <th className="py-2">Mobile Particulars</th>
                        <th className="py-2">Price Setup</th>
                        <th className="py-2">Down Payment</th>
                        <th className="py-2">Paid</th>
                        <th className="py-2">Remaining</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {customerContracts.map(contract => {
                        const item = items.find(i => i.id === contract.itemId);
                        return (
                          <tr key={contract.id} className="py-2">
                            <td className="py-2 font-mono text-slate-700">{contract.contractNumber}</td>
                            <td className="py-2">
                              <span className="font-semibold text-slate-900">{item ? `${item.brand} ${item.model}` : 'Unknown'}</span>
                              {item?.imei1 && <p className="text-[10px] text-slate-400 font-mono">IMEI: {item.imei1}</p>}
                            </td>
                            <td className="py-2 font-semibold text-slate-800">{formatCurrency(contract.totalPrice)}</td>
                            <td className="py-2 text-slate-650">{formatCurrency(contract.downPayment)}</td>
                            <td className="py-2 text-emerald-650 font-medium">{formatCurrency(contract.totalPaid)}</td>
                            <td className="py-2 text-red-650 font-bold">{formatCurrency(contract.remainingAmount)}</td>
                            <td className="py-2">
                              <span className="uppercase text-[9px] font-bold tracking-wide">
                                {contract.remainingAmount <= 0 ? 'PAID IN FULL' : contract.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Ledger Payments History */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <CreditCard size={14} /> Cash Receipts Log / Transactions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500 font-bold">
                        <th className="py-2">Receipt Date</th>
                        <th className="py-2">Receipt / Slip #</th>
                        <th className="py-2">Agreement ID</th>
                        <th className="py-2">Payment Method</th>
                        <th className="py-2">Collector Signature</th>
                        <th className="py-2 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {customerPayments.map(p => {
                        const contract = contracts.find(c => c.id === p.contractId);
                        return (
                          <tr key={p.id} className="py-2">
                            <td className="py-2 text-slate-650">{formatDate(p.date)}</td>
                            <td className="py-2 font-mono text-slate-700">{p.receiptNumber}</td>
                            <td className="py-2 font-mono text-slate-500">{contract?.contractNumber || 'Initial'}</td>
                            <td className="py-2 uppercase tracking-tight text-slate-500 font-medium">{p.method}</td>
                            <td className="py-2 text-slate-400 italic">{p.receivedBy || 'Authorized Store Manager'}</td>
                            <td className="py-2 text-right text-emerald-600 font-extrabold">{formatCurrency(p.amount)}</td>
                          </tr>
                        );
                      })}
                      {customerPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">No cash receipts logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures Verified Section */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-slate-700 text-xs mt-10">
                <div className="text-center">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">Customer Signature & Thumb Print</p>
                  <p className="text-[10px] text-slate-400">{customer.fullName} • CNIC: {customer.cnic}</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">Store Manager Stamp & Sign</p>
                  <p className="text-[10px] text-slate-400">Hafiz Mobiles Authorized Officer</p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-6 border-t border-slate-200 text-center text-[9px] text-slate-400 italic">
                This account statement represents a digital log. Any discrepancies must be brought to store attention within 7 business days. Thank you for choosing Hafiz Mobiles.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
