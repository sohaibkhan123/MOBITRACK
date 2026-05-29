import { create } from 'zustand'

export type Page = 'dashboard' | 'inventory' | 'customers' | 'vendors' | 'contracts' | 'payments' | 'due-tracking' | 'vendor-contracts' | 'customer-detail' | 'contract-detail'

interface AppState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  selectedCustomerId: string | null
  setSelectedCustomerId: (id: string | null) => void
  selectedContractId: string | null
  setSelectedContractId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  selectedContractId: null,
  setSelectedContractId: (id) => set({ selectedContractId: id }),
}))
