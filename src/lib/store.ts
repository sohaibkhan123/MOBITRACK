import { create } from 'zustand'

export type Page = 'dashboard' | 'inventory' | 'customers' | 'vendors' | 'contracts' | 'payments'

interface AppState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
}))
