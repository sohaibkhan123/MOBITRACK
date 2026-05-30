import React from 'react';
import { useContracts, useCustomers, useInventory } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { AlertCircle, Clock, Calendar, Phone, CheckCircle2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DueTracking() {
  const { contracts } = useContracts();
  const { customers } = useCustomers();
  const { items } = useInventory();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const dueToday = contracts.filter(c => c.nextDueDate?.split('T')[0] === todayStr && c.status === 'Running');
  const overdue = contracts.filter(c => {
    const dueDate = new Date(c.nextDueDate);
    return dueDate < today && c.status !== 'Completed';
  });

  const generateExportData = (contractList: any[]) => {
    return contractList.map(contract => {
      const customer = customers.find(c => c.id === contract.customerId);
      const item = items.find(i => i.id === contract.itemId);
      return {
        'Contract Number': contract.contractNumber,
        'Status': contract.status,
        'Sale Date': contract.saleDate ? formatDate(contract.saleDate) : 'N/A',
        'Next Due Date': contract.nextDueDate ? formatDate(contract.nextDueDate) : 'N/A',
        'Total Price': contract.totalPrice,
        'Down Payment': contract.downPayment,
        'Total Paid': contract.totalPaid,
        'Remaining Amount': contract.remainingAmount,
        'Installment Amount': contract.installmentAmount,
        'Frequency': contract.frequency,
        'Customer Name': customer?.fullName || 'N/A',
        'Customer Father Name': customer?.fatherName || 'N/A',
        'Customer CNIC': customer?.cnic || 'N/A',
        'Customer Phone': customer?.phone || 'N/A',
        'Customer Alt Phone': customer?.altPhone || 'N/A',
        'Customer Address': customer?.address || 'N/A',
        'Mobile Brand': item?.brand || 'N/A',
        'Mobile Model': item?.model || 'N/A',
        'Mobile IMEI': item?.imei1 || 'N/A',
        'Mobile Color': item?.color || 'N/A'
      };
    });
  };

  const exportAll = () => {
    const data = generateExportData(contracts);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Contracts");
    XLSX.writeFile(wb, `All_Contracts_${todayStr}.xlsx`);
  };

  const exportOverdue = () => {
    const data = generateExportData(overdue);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Overdue Installments");
    XLSX.writeFile(wb, `Overdue_Installments_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Installments Tracking</h1>
        <div className="flex gap-2">
          <button 
            onClick={exportOverdue}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <Download size={18} />
            Export Pending
          </button>
          <button 
            onClick={exportAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            <Download size={18} />
            Export All
          </button>
        </div>
      </div>

      {/* Overdue Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-red-600">
          <AlertCircle size={24} />
          <h2 className="text-xl font-bold">Overdue Installments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {overdue.map(contract => {
            const customer = customers.find(c => c.id === contract.customerId);
            const daysOverdue = Math.floor((today.getTime() - new Date(contract.nextDueDate).getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={contract.id} className="bg-white rounded-xl border-l-4 border-l-red-500 border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{customer?.fullName}</h3>
                    <p className="text-xs text-gray-500">Contract: {contract.contractNumber}</p>
                  </div>
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">
                    {daysOverdue} Days Overdue
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(contract.nextDueDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Installment:</span>
                    <span className="font-bold text-red-600">{formatCurrency(contract.installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Pending:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(contract.remainingAmount)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`tel:${customer?.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Remind
                  </button>
                </div>
              </div>
            );
          })}
          {overdue.length === 0 && (
            <div className="col-span-full bg-green-50 border border-green-100 p-8 rounded-xl text-center">
              <CheckCircle2 className="mx-auto text-green-500 mb-2" size={32} />
              <p className="text-green-700 font-medium">Great job! No overdue installments at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Due Today Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <Clock size={24} />
          <h2 className="text-xl font-bold">Due Today</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dueToday.map(contract => {
            const customer = customers.find(c => c.id === contract.customerId);
            return (
              <div key={contract.id} className="bg-white rounded-xl border-l-4 border-l-blue-500 border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{customer?.fullName}</h3>
                    <p className="text-xs text-gray-500">Contract: {contract.contractNumber}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">
                    Due Today
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Installment:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(contract.installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">{customer?.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                    Record Payment
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Send SMS
                  </button>
                </div>
              </div>
            );
          })}
          {dueToday.length === 0 && (
            <div className="col-span-full bg-gray-50 border border-gray-100 p-8 rounded-xl text-center text-gray-500">
              No installments due for today.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
