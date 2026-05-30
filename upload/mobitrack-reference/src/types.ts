export type ItemStatus = 'Available' | 'Sold' | 'Reserved' | 'Damaged';
export type ItemType = 'Mobile' | 'Accessory';
export type CustomerStatus = 'Active' | 'Closed' | 'Blacklisted';
export type ContractStatus = 'Running' | 'Completed' | 'Overdue' | 'Defaulted';
export type UserRole = 'admin' | 'manager' | 'salesman' | 'recovery' | 'accountant';

export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  color?: string;
  ram?: string;
  storage?: string;
  imei1?: string;
  imei2?: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice?: number;
  supplier?: string;
  vendorId?: string;
  imageUrl?: string;
  purchaseDate: string;
  status: ItemStatus;
  type: ItemType;
  notes?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  fatherName?: string;
  cnic: string;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  occupation?: string;
  income?: number;
  guarantorName?: string;
  guarantorPhone?: string;
  status: CustomerStatus;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  itemId: string;
  saleDate: string;
  
  purchasePrice: number;
  totalPrice: number;
  totalProfit: number;
  downPayment: number;
  remainingAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  profitPerInstallment: number;
  principalPerInstallment: number;
  
  frequency: 'Monthly' | 'Weekly';
  nextDueDate: string;
  totalPaid: number;
  status: ContractStatus;
}

export interface Payment {
  id: string;
  contractId: string;
  customerId: string;
  amount: number;
  date: string;
  method: string;
  receivedBy: string;
  receiptNumber: string;
  nextDueDateSet: string;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  amount: number;
  date: string;
  method: string;
  receiptNumber: string;
}

export interface VendorContract {
  id: string;
  vendorId: string;
  itemId: string;
  purchaseDate: string;
  purchasePrice: number;
  advancePaid: number;
  installmentsCount: number;
  installmentAmount: number;
  remainingAmount: number;
  totalPaid: number;
  nextDueDate: string;
  status: ContractStatus;
}

export interface VendorInstallmentPayment {
  id: string;
  vendorContractId: string;
  vendorId: string;
  amount: number;
  date: string;
  method: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}
