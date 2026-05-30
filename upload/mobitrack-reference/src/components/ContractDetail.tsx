import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Calendar, Smartphone, User, FileText, Printer, X } from 'lucide-react';
import { usePayments, useCustomers, useInventory, useVendorContracts, useVendorInstallments } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { Contract } from '../types';

export default function ContractDetail({ contract, goBack, goToVendorPayables }: { contract: Contract, goBack: () => void, goToVendorPayables?: () => void }) {
  const { payments } = usePayments();
  const { customers } = useCustomers();
  const { items } = useInventory();
  const { vendorContracts } = useVendorContracts();
  const [showPrintInvoice, setShowPrintInvoice] = useState(false);

  const customer = customers.find(c => c.id === contract.customerId);
  const item = items.find(i => i.id === contract.itemId);
  const contractPayments = payments.filter(p => p.contractId === contract.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const vendorContract = vendorContracts.find(vc => vc.itemId === contract.itemId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Contract {contract.contractNumber}</h2>
            <p className="text-sm text-slate-500">Starts: {formatDate(contract.saleDate)} • Status: <span className="font-semibold text-indigo-600 capitalize">{contract.status}</span></p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrintInvoice(true)}
          className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-extrabold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Printer size={14} />
          Print Installment Tracking Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Total Price</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(contract.totalPrice)}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Original Cost</span>
              <span className="font-semibold">{formatCurrency(contract.purchasePrice || 0)}</span>
            </div>
            {vendorContract && (
               <div className="flex justify-between text-xs text-gray-550">
                 <span>- Vendor Adv. Paid</span>
                 <span>{formatCurrency(vendorContract.advancePaid)}</span>
               </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Expected Profit</span>
              <span className="font-semibold text-green-600">{formatCurrency(contract.totalProfit || 0)}</span>
            </div>
            
            {vendorContract && (
               <>
                  <div className="flex justify-between text-sm mt-2 border-t border-gray-50 pt-2 text-blue-700 font-medium bg-blue-50 -mx-6 px-6 py-2">
                     <span>Vendor Paid </span>
                     <span>{formatCurrency(vendorContract.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-700 font-medium bg-blue-50 -mx-6 px-6 pb-2 border-b border-gray-105">
                     <span>Realized Profit so far</span>
                     <span>{formatCurrency(contract.totalPaid - vendorContract.totalPaid)}</span>
                  </div>
               </>
            )}

            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Down Payment</span>
              <span className="font-semibold">{formatCurrency(contract.downPayment)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-505">Paid Amount</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(contract.totalPaid)}</p>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-bold">{Math.round((contract.totalPaid / contract.totalPrice) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-150 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${(contract.totalPaid / contract.totalPrice) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm bg-red-50 col-span-1">
          <p className="text-sm font-medium text-red-600">Remaining Balance</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(contract.remainingAmount)}</p>
          <p className="text-sm text-red-600 mt-3 font-medium">Next Due: {formatDate(contract.nextDueDate)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1">
          <p className="text-sm font-medium text-gray-500">Installment Setup</p>
          <h3 className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(contract.installmentAmount)} / {contract.frequency.toLowerCase()}</h3>
          <p className="text-sm text-gray-500">{contract.installmentsCount} installments expected</p>
           <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Principal Portion</span>
              <span className="font-medium text-gray-900">{formatCurrency(contract.principalPerInstallment || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Profit Portion</span>
              <span className="font-medium text-green-650">{formatCurrency(contract.profitPerInstallment || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-55 font-bold text-gray-800">
              Payment History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Due Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-sm">
                  {contractPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-650 font-sans">{formatDate(p.date)}</td>
                      <td className="px-6 py-4 text-gray-650 font-mono">{p.receiptNumber}</td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 text-gray-650 font-sans">
                        {p.nextDueDateSet ? formatDate(p.nextDueDateSet) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {contractPayments.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic font-sans animate-pulse">No payments recorded yet for this contract.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <User className="text-gray-400" />
                <h3 className="font-bold text-gray-800">Customer Details</h3>
             </div>
             {customer ? (
               <div className="space-y-3">
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Name</p>
                   <p className="font-semibold text-gray-900">{customer.fullName}</p>
                 </div>
                 {customer.fatherName && (
                   <div>
                     <p className="text-xs text-gray-500 uppercase">Father's Name</p>
                     <p className="font-semibold text-gray-900">{customer.fatherName}</p>
                   </div>
                 )}
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Contact</p>
                   <p className="text-sm text-gray-700">{customer.phone}</p>
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">CNIC</p>
                   <p className="text-sm font-mono text-gray-700">{customer.cnic}</p>
                 </div>
                 {customer.address && (
                   <div>
                     <p className="text-xs text-gray-500 uppercase">Address</p>
                     <p className="text-sm text-gray-700">{customer.address}</p>
                   </div>
                 )}
               </div>
             ) : (
               <p className="text-gray-550 italic">Customer not found</p>
             )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <Smartphone className="text-gray-400" />
                <h3 className="font-bold text-gray-800">Item Details</h3>
             </div>
             {item ? (
               <div className="space-y-3">
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Product</p>
                   <p className="font-semibold text-gray-900">{item.brand} {item.model}</p>
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">IMEI</p>
                   <p className="text-sm font-mono text-gray-700">{item.imei1 || 'N/A'}</p>
                 </div>
                 {vendorContract && (
                   <div className="pt-3 border-t border-gray-100">
                     <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-800 font-semibold uppercase">Vendor Payables Link</p>
                        {goToVendorPayables && (
                           <button onClick={goToVendorPayables} className="text-xs text-indigo-600 hover:text-indigo-805 flex items-center gap-1 font-semibold cursor-pointer">
                              <span>View</span>
                              <ArrowLeft size={12} className="rotate-180" />
                           </button>
                        )}
                     </div>
                     <p className="text-sm text-gray-650">Balance: <span className="font-semibold text-red-650">{formatCurrency(vendorContract.remainingAmount)}</span></p>
                     <p className="text-sm text-gray-650">Inst: {formatCurrency(vendorContract.installmentAmount)} / mo</p>
                     {(() => {
                        if (vendorContract.installmentAmount > 0 && contract.installmentAmount > 0) {
                           const customerInstPaid = Math.floor(contract.totalPaid / contract.installmentAmount);
                           const vendorInstPaid = Math.floor(vendorContract.totalPaid / vendorContract.installmentAmount);
                           if (customerInstPaid > vendorInstPaid) {
                              return (
                                 <div className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded">
                                    Alert: Vendor payment lagging behind customer receipts by {customerInstPaid - vendorInstPaid} installment(s).
                                 </div>
                              );
                           } else if (vendorInstPaid >= customerInstPaid) {
                              return (
                                 <div className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded">
                                    Vendor payments are up to date with receipts.
                                 </div>
                              );
                           }
                        }
                        return null;
                     })()}
                   </div>
                 )}
               </div>
             ) : (
               <p className="text-gray-500 italic">Item not found</p>
             )}
          </div>
        </div>
      </div>

      {/* Printable Installment Tracking Form & Invoice Modal */}
      {showPrintInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-invoice-area, #printable-invoice-area * {
                visibility: visible !important;
              }
              #printable-invoice-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 2.5cm !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print truncate">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-indigo-400" />
                <span className="font-extrabold text-sm uppercase tracking-wider">Hafiz Mobiles • Installment Tracker Print View</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all shadow-md cursor-pointer"
                >
                  Confirm and Print Now
                </button>
                <button
                  onClick={() => setShowPrintInvoice(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Frame Area */}
            <div id="printable-invoice-area" className="p-8 overflow-y-auto bg-white text-slate-850 space-y-6">
              {/* Brand Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">HAFIZ MOBILES</h1>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Installments Tracking Card & Sale Invoice</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Sadiqabad Road / Hall Road, Lahore, Pakistan • Contact: +92 300 1234567</p>
                </div>
                <div className="text-right">
                  {/* Print Status Badge */}
                  <span className={`inline-block text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded text-white ${
                    contract.remainingAmount <= 0 
                      ? 'bg-emerald-650' 
                      : contract.totalPaid > contract.downPayment 
                        ? 'bg-amber-600' 
                        : 'bg-red-600'
                  }`}>
                    STATUS: {contract.remainingAmount <= 0 
                      ? 'PAID IN FULL' 
                      : contract.totalPaid > contract.downPayment 
                        ? 'PARTICALLY PAID' 
                        : 'UNPAID / REGISTERED'}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-2">Agreement ID</p>
                  <p className="text-xs font-mono font-extrabold text-slate-800">{contract.contractNumber}</p>
                </div>
              </div>

              {/* Customer Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Customer Profile</h3>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><span className="font-bold text-slate-950">Name:</span> {customer?.fullName || 'N/A'}</p>
                    <p><span className="font-bold text-slate-950">Father's Name:</span> {customer?.fatherName || 'N/A'}</p>
                    <p><span className="font-bold text-slate-950">CNIC:</span> <span className="font-mono">{customer?.cnic || 'N/A'}</span></p>
                    <p><span className="font-bold text-slate-950">Phone Number:</span> {customer?.phone || 'N/A'}</p>
                    <p><span className="font-bold text-slate-950">Address:</span> {customer?.address || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Asset Particulars</h3>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><span className="font-bold text-slate-950">Device Details:</span> {item ? `${item.brand} ${item.model}` : 'N/A'}</p>
                    <p><span className="font-bold text-slate-950">IMEI Security ID:</span> <span className="font-mono">{item?.imei1 || 'N/A'}</span></p>
                    <p><span className="font-bold text-slate-950">Sale Timestamp:</span> {formatDate(contract.saleDate)}</p>
                    <p><span className="font-bold text-slate-950">Installments Duration:</span> {contract.installmentsCount} Months ({contract.frequency})</p>
                  </div>
                </div>
              </div>

              {/* Installment Financial Accounting Ledgers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Gross Contract Value</p>
                  <p className="text-base font-black text-slate-900 mt-1">{formatCurrency(contract.totalPrice)}</p>
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Down Payment Received</p>
                  <p className="text-base font-black text-blue-600 mt-1">{formatCurrency(contract.downPayment)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-700">Total Installments Paid</p>
                  <p className="text-base font-black text-emerald-600 mt-1">{formatCurrency(contract.totalPaid)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-red-700">Remaining Balance Due</p>
                  <p className="text-base font-black text-red-600 mt-1">{formatCurrency(contract.remainingAmount)}</p>
                </div>
              </div>

              {/* Installments Breakdown Tracking Schedule Form */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-1.5">
                  <h3 className="text-xs font-black uppercase text-slate-950 tracking-widest">
                     Installment Plan Tracking Form & Payments Schedule
                  </h3>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-600">Next Installment Due:</span> <span className="font-extrabold text-red-650">{formatDate(contract.nextDueDate)}</span>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-350 font-bold text-slate-500 font-sans">
                        <th className="py-2">No. / Installment</th>
                        <th className="py-2">Expected Date</th>
                        <th className="py-2">Expected Amount</th>
                        <th className="py-2">Amount Paid</th>
                        <th className="py-2">Date Collected</th>
                        <th className="py-2 font-sans">Tracking Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-705">
                      {Array.from({ length: contract.installmentsCount }).map((_, idx) => {
                        const expectedPaymentNumber = idx + 1;
                        const paymentMade = contractPayments[idx];
                        const expectedAmount = contract.installmentAmount;
                        
                        return (
                          <tr key={idx} className="py-2">
                            <td className="py-2 font-mono font-bold text-slate-900">Installment #{expectedPaymentNumber}</td>
                            <td className="py-2 text-slate-500 font-sans">
                              {(() => {
                                const saleDateObj = new Date(contract.saleDate);
                                saleDateObj.setMonth(saleDateObj.getMonth() + expectedPaymentNumber);
                                return saleDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                              })()}
                            </td>
                            <td className="py-2 font-semibold text-slate-800">{formatCurrency(expectedAmount)}</td>
                            <td className="py-2">
                              {paymentMade ? (
                                <span className="text-emerald-700 font-extrabold">{formatCurrency(paymentMade.amount)}</span>
                              ) : (
                                <span className="text-red-700 font-bold">{formatCurrency(0)}</span>
                              )}
                            </td>
                            <td className="py-2 text-slate-500 font-sans">
                              {paymentMade ? formatDate(paymentMade.date) : 'Pending Collection'}
                            </td>
                            <td className="py-2 font-sans">
                              {paymentMade ? (
                                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  PAID ({paymentMade.receiptNumber})
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-black tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                  UNPAID BALANCE
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures Verified Section */}
              <div className="pt-8 grid grid-cols-2 gap-12 text-slate-700 text-xs mt-6">
                <div className="text-center">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">Customer Signature</p>
                  <p className="text-[10px] text-slate-400">{customer?.fullName || 'Purchaser'}</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">For Hafiz Mobiles</p>
                  <p className="text-[10px] text-slate-400">Authorized Officer Signature</p>
                </div>
              </div>

              {/* Terms & Conditions footer note */}
              <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                <p className="font-bold uppercase text-slate-700">Important Notices:</p>
                <p>1. Payments are due by the designated monthly cycle date. A delay may lead to device registration lock features activation or legal steps.</p>
                <p>2. Hafiz Mobiles reserves full security title over the smartphone until all remaining balance installments are cleared in full.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
