import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Smartphone, Package, Image as ImageIcon } from 'lucide-react';
import { useInventory, useVendors, useVendorContracts } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';
import { addDoc, collection, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { InventoryItem } from '../types';

export default function Inventory({ goToVendor, goToVendorPayables }: { goToVendor?: (id: string) => void, goToVendorPayables?: () => void }) {
  const { items, loading } = useInventory();
  const { vendors } = useVendors();
  const { vendorContracts } = useVendorContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [imageUrlData, setImageUrlData] = useState<string>('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for firestore
        alert("Image size must be less than 1MB");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrlData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.imei1?.includes(searchTerm);
    const matchesType = filterType === 'All' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    setItemToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!itemToDeleteId) return;
    const itemToDelete = items.find(i => i.id === itemToDeleteId);
    try {
      if (itemToDelete && itemToDelete.vendorId) {
        try {
          await updateDoc(doc(db, 'vendors', itemToDelete.vendorId), {
            totalPurchases: increment(-itemToDelete.purchasePrice)
          });
        } catch (vendorError) {
          console.warn("Could not update vendor totalPurchases", vendorError);
        }
      }
      await deleteDoc(doc(db, 'inventory', itemToDeleteId));
      setItemToDeleteId(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. " + (error instanceof Error ? error.message : ""));
      setItemToDeleteId(null);
    }
  };

  const [purchaseType, setPurchaseType] = useState<'Cash' | 'Installment'>('Cash');
  const [purchasePriceState, setPurchasePriceState] = useState<number>(0);
  const [advancePaidState, setAdvancePaidState] = useState<number>(0);
  const [installmentsCountState, setInstallmentsCountState] = useState<number>(1);

  const calculatedInstallmentAmount = installmentsCountState > 0 
    ? Math.max(0, (purchasePriceState - advancePaidState) / installmentsCountState) 
    : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      variant: formData.get('variant') as string,
      color: formData.get('color') as string,
      ram: formData.get('ram') as string,
      storage: formData.get('storage') as string,
      imei1: formData.get('imei1') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      salePrice: Number(formData.get('salePrice')),
      vendorId: formData.get('vendorId') as string,
      imageUrl: imageUrlData || (formData.get('imageUrl') as string),
      type: formData.get('type') as 'Mobile' | 'Accessory',
      status: 'Available' as const,
      purchaseDate: new Date().toISOString(),
    };

    if (editingItem) {
      await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
      
      // Update vendor totalPurchases if vendor changed or price changed
      if (itemData.vendorId && (!editingItem.vendorId || editingItem.vendorId !== itemData.vendorId || editingItem.purchasePrice !== itemData.purchasePrice)) {
         if (editingItem.vendorId) {
            await updateDoc(doc(db, 'vendors', editingItem.vendorId), {
               totalPurchases: increment(-editingItem.purchasePrice)
            });
         }
         await updateDoc(doc(db, 'vendors', itemData.vendorId), {
            totalPurchases: increment(itemData.purchasePrice)
         });
      }
    } else {
      const docRef = await addDoc(collection(db, 'inventory'), itemData);
      if (itemData.vendorId) {
         if (purchaseType === 'Cash') {
           await updateDoc(doc(db, 'vendors', itemData.vendorId), {
              totalPurchases: increment(itemData.purchasePrice)
           });
         } else {
           // Create Vendor Contract
           const advancePaid = Number(formData.get('advancePaid'));
           const installmentsCount = Number(formData.get('installmentsCount'));
           const installmentAmount = Number(formData.get('installmentAmount'));
           const nextDueDate = formData.get('nextDueDate') as string;
           
           await addDoc(collection(db, 'vendorContracts'), {
             vendorId: itemData.vendorId,
             itemId: docRef.id,
             purchaseDate: itemData.purchaseDate,
             purchasePrice: itemData.purchasePrice,
             advancePaid,
             installmentsCount,
             installmentAmount,
             remainingAmount: itemData.purchasePrice - advancePaid,
             totalPaid: advancePaid,
             nextDueDate,
             status: 'Running'
           });

           if (advancePaid > 0) {
             await updateDoc(doc(db, 'vendors', itemData.vendorId), {
                totalPurchases: increment(itemData.purchasePrice),
                totalPaid: increment(advancePaid)
             });
           } else {
             await updateDoc(doc(db, 'vendors', itemData.vendorId), {
                totalPurchases: increment(itemData.purchasePrice)
             });
           }
         }
      }
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setImageUrlData('');
    setPurchaseType('Cash');
  };

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imeisText = formData.get('imeis') as string;
    const imeis = imeisText.split('\n').map(i => i.trim()).filter(i => i.length > 0);
    
    if (imeis.length === 0) {
      alert("Please enter at least one IMEI.");
      return;
    }

    const baseData = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      type: 'Mobile' as const,
      purchasePrice: Number(formData.get('purchasePrice')),
      salePrice: Number(formData.get('salePrice')),
      vendorId: formData.get('vendorId') as string,
      imageUrl: formData.get('imageUrl') as string,
      status: 'Available' as const,
      purchaseDate: new Date().toISOString(),
    };

    let totalPurchasePrice = 0;
    
    for (const imei of imeis) {
      await addDoc(collection(db, 'inventory'), { ...baseData, imei1: imei });
      totalPurchasePrice += baseData.purchasePrice;
    }

    if (baseData.vendorId && totalPurchasePrice > 0) {
       await updateDoc(doc(db, 'vendors', baseData.vendorId), {
          totalPurchases: increment(totalPurchasePrice)
       });
    }

    setIsBulkModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by brand, model or IMEI..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-650 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Mobile">Mobiles</option>
            <option value="Accessory">Accessories</option>
          </select>
          <button 
            onClick={() => { setEditingItem(null); setImageUrlData(''); setPurchasePriceState(0); setAdvancePaidState(0); setInstallmentsCountState(1); setPurchaseType('Cash'); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm shadow-md shadow-indigo-150 active:scale-95"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IMEI / S.N</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pricing & Profit</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const vendor = vendors.find(v => v.id === item.vendorId);
                const profit = item.salePrice - item.purchasePrice;
                return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.model} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          {item.type === 'Mobile' ? <Smartphone size={20} /> : <Package size={20} />}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.brand} {item.model}</p>
                        <p className="text-xs text-gray-500">{item.type} • {item.color || 'No color'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vendor ? (
                      <div className="flex flex-col items-start gap-1">
                        <button 
                          onClick={() => goToVendor && goToVendor(vendor.id)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {vendor.company}
                        </button>
                        {vendorContracts.some(vc => vc.itemId === item.id) && goToVendorPayables && (
                           <button onClick={goToVendorPayables} className="text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-0.5 rounded font-medium border border-red-100">
                             Payables
                           </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-gray-600">{item.imei1 || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-between items-center max-w-[150px] mb-1">
                      <span className="text-xs text-gray-500">Sale:</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.salePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center max-w-[150px] mb-1">
                      <span className="text-xs text-gray-500">Cost:</span>
                      <span className="text-xs text-gray-500">{formatCurrency(item.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center max-w-[150px] pt-1 border-t border-gray-100">
                      <span className="text-xs font-medium text-green-600">Profit:</span>
                      <span className="text-xs font-bold text-green-600">{formatCurrency(profit)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      item.status === 'Available' ? "bg-green-50 text-green-600" :
                      item.status === 'Sold' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingItem(item); setImageUrlData(''); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No items found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => { setIsModalOpen(false); setImageUrlData(''); }} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                  <select name="type" defaultValue={editingItem?.type || 'Mobile'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Mobile">Mobile</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Brand (Company)</label>
                  <input name="brand" defaultValue={editingItem?.brand} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Image URL or Upload</label>
                  <div className="flex gap-2">
                     <input name="imageUrl" defaultValue={editingItem?.imageUrl} placeholder="https://..." className="flex-1 w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                     <div className="relative flex-1">
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-full h-full px-4 py-2 border border-gray-200 border-dashed rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 transition-colors">
                           {imageUrlData ? 'Image Uploaded' : 'Or Upload File'}
                        </div>
                     </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Model</label>
                  <input name="model" defaultValue={editingItem?.model} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">IMEI 1</label>
                  <input name="imei1" defaultValue={editingItem?.imei1} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Purchase Price</label>
                  <input 
                    name="purchasePrice" 
                    type="number" 
                    defaultValue={editingItem?.purchasePrice} 
                    onChange={e => setPurchasePriceState(Number(e.target.value))}
                    required 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Sale Price</label>
                  <input name="salePrice" type="number" defaultValue={editingItem?.salePrice} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Vendor</label>
                  <select name="vendorId" defaultValue={editingItem?.vendorId || ''} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.company})</option>
                    ))}
                  </select>
                </div>
                
                {!editingItem && (
                   <div className="col-span-2 space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={purchaseType === 'Cash'} onChange={() => setPurchaseType('Cash')} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Cash Purchase</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={purchaseType === 'Installment'} onChange={() => setPurchaseType('Installment')} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Installment Purchase</span>
                        </label>
                      </div>

                      {purchaseType === 'Installment' && (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                             <label className="text-xs font-semibold text-gray-500 uppercase">Advance</label>
                             <input 
                               name="advancePaid" 
                               type="number" 
                               required 
                               value={advancePaidState}
                               onChange={e => setAdvancePaidState(Number(e.target.value))}
                               className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-xs font-semibold text-gray-500 uppercase"># Installments</label>
                             <input 
                               name="installmentsCount" 
                               type="number" 
                               required 
                               value={installmentsCountState}
                               onChange={e => setInstallmentsCountState(Number(e.target.value))}
                               className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-xs font-semibold text-gray-500 uppercase">Inst Amount</label>
                             <input 
                               name="installmentAmount" 
                               type="number" 
                               required 
                               value={calculatedInstallmentAmount}
                               readOnly
                               className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-100 outline-none text-sm text-gray-600" 
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-xs font-semibold text-gray-500 uppercase">First Due Date</label>
                             <input name="nextDueDate" type="date" required className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                      )}
                   </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setImageUrlData(''); }} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Bulk Add Mobiles</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
              <div className="flex gap-4">
                 <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Vendor</label>
                      <select name="vendorId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.company}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Brand</label>
                      <input name="brand" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Model</label>
                      <input name="model" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Purchase Price (Per Unit)</label>
                      <input name="purchasePrice" type="number" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Sale Price (Per Unit)</label>
                      <input name="salePrice" type="number" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>
                 <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">IMEIs (One per line)</label>
                    <textarea name="imeis" required rows={14} placeholder="351234567890123&#10;351234567890124&#10;..." className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"></textarea>
                 </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Bulk Add Items</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDeleteId(null)} 
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
