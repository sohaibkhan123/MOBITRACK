import React, { useState } from 'react';
import { Plus, Search, Calendar, User, Smartphone, AlertCircle, CheckCircle2, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useContracts, useCustomers, useInventory } from '../hooks/useData';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Contract } from '../types';
import ContractDetail from './ContractDetail';

export default function Contracts({ goToVendorPayables }: { goToVendorPayables?: () => void }) {
  const { contracts, loading: contractsLoading } = useContracts();
  const { customers } = useCustomers();
  const { items } = useInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [contractToDelete, setContractToDelete] = useState<{id: string, itemId: string} | null>(null);

  // When editing, we also want to allow the currently selected mobile for the contract.
  const availableMobiles = items.filter(i => 
    (i.status === 'Available' && i.type === 'Mobile') || 
    (editingContract && i.id === editingContract.itemId)
  );

  const filteredContracts = contracts.filter(c => {
    const customer = customers.find(cust => cust.id === c.customerId);
    return (
      c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDeleteContract = (id: string, itemId: string) => {
    setContractToDelete({id, itemId});
  };

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      await deleteDoc(doc(db, 'contracts', contractToDelete.id));
      await updateDoc(doc(db, 'inventory', contractToDelete.itemId), { status: 'Available' });
      setContractToDelete(null);
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Failed to delete contract. " + (error instanceof Error ? error.message : ""));
      setContractToDelete(null);
    }
  };

  const exportToExcel = () => {
    import('xlsx').then(XLSX => {
      const data = filteredContracts.map(contract => {
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
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All Installments");
      XLSX.writeFile(wb, `All_Installments_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const handleContractSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemId = formData.get('itemId') as string;
    const selectedItem = items.find(i => i.id === itemId);
    const purchasePrice = selectedItem ? selectedItem.purchasePrice : 0;
    
    const totalPrice = Number(formData.get('totalPrice'));
    const downPayment = Number(formData.get('downPayment'));
    const installmentsCount = Number(formData.get('installmentsCount'));
    const remainingAmount = totalPrice - downPayment;
    const installmentAmount = Math.ceil(remainingAmount / installmentsCount);
    const totalProfit = totalPrice - purchasePrice;
    const profitPerInstallment = Number((totalProfit / installmentsCount).toFixed(2));
    const principalPerInstallment = Number((installmentAmount - profitPerInstallment).toFixed(2));
    
    if (editingContract) {
      await updateDoc(doc(db, 'contracts', editingContract.id), {
        customerId: formData.get('customerId') as string,
        itemId: itemId,
        totalPrice,
        totalProfit,
        purchasePrice,
        downPayment,
        remainingAmount,
        installmentsCount,
        installmentAmount,
        profitPerInstallment,
        principalPerInstallment,
        frequency: formData.get('frequency') as 'Monthly' | 'Weekly',
        nextDueDate: formData.get('nextDueDate') as string,
      });

      if (editingContract.itemId !== itemId) {
        await updateDoc(doc(db, 'inventory', editingContract.itemId), { status: 'Available' });
        await updateDoc(doc(db, 'inventory', itemId), { status: 'Sold' });
      }
    } else {
      const contractData = {
        contractNumber: `MT-${Date.now().toString().slice(-6)}`,
        customerId: formData.get('customerId') as string,
        itemId: itemId,
        saleDate: new Date().toISOString(),
        purchasePrice,
        totalPrice,
        totalProfit,
        downPayment,
        remainingAmount,
        installmentsCount,
        installmentAmount,
        profitPerInstallment,
        principalPerInstallment,
        frequency: formData.get('frequency') as 'Monthly' | 'Weekly',
        nextDueDate: formData.get('nextDueDate') as string,
        totalPaid: downPayment,
        status: 'Running',
      };

      await addDoc(collection(db, 'contracts'), contractData);
      await updateDoc(doc(db, 'inventory', itemId), { status: 'Sold' });
    }
    
    setIsModalOpen(false);
    setEditingContract(null);
  };

  if (selectedContractId) {
    const selectedContract = contracts.find(c => c.id === selectedContractId);
    if (selectedContract) {
      return <ContractDetail contract={selectedContract} goBack={() => setSelectedContractId(null)} goToVendorPayables={goToVendorPayables} />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by contract # or customer..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm"
          >
            <Download size={20} />
            Export to Excel
          </button>
          <button 
            onClick={() => { setEditingContract(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New Installment Sale
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Due</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((contract) => {
                const customer = customers.find(c => c.id === contract.customerId);
                const item = items.find(i => i.id === contract.itemId);
                return (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{contract.contractNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(contract.saleDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{customer?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{item?.brand} {item?.model}</p>
                      <p className="text-xs text-gray-500">IMEI: {item?.imei1}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Paid: {Math.round((contract.totalPaid / contract.totalPrice) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(contract.totalPaid / contract.totalPrice) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(contract.remainingAmount)} left</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(contract.nextDueDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        contract.status === 'Running' ? "bg-blue-50 text-blue-600" :
                        contract.status === 'Completed' ? "bg-green-50 text-green-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedContractId(contract.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => { setEditingContract(contract); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Contract"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteContract(contract.id, contract.itemId)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Contract"
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
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">New Installment Contract</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleContractSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Select Customer</label>
                  <select name="customerId" defaultValue={editingContract?.customerId || ''} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.cnic})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Select Mobile</label>
                  <select name="itemId" defaultValue={editingContract?.itemId || ''} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose Mobile...</option>
                    {availableMobiles.map(i => (
                      <option key={i.id} value={i.id}>{i.brand} {i.model} - {formatCurrency(i.salePrice)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Total Sale Price</label>
                  <input name="totalPrice" type="number" defaultValue={editingContract?.totalPrice} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Down Payment</label>
                  <input name="downPayment" type="number" defaultValue={editingContract?.downPayment} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Number of Installments</label>
                  <input name="installmentsCount" type="number" defaultValue={editingContract?.installmentsCount || 12} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Frequency</label>
                    <select name="frequency" defaultValue={editingContract?.frequency || 'Monthly'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">First Installment Due Date</label>
                    <input type="date" name="nextDueDate" defaultValue={editingContract?.nextDueDate?.split('T')[0]} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                   {editingContract ? 'Update Contract' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Contract</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this installment contract? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setContractToDelete(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteContract} 
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
