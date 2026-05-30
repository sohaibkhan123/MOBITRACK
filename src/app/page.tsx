'use client'

import { useAppStore, type Page } from '@/lib/store'
import { DashboardPage } from '@/components/dashboard'
import { InventoryPage } from '@/components/inventory'
import { CustomersPage } from '@/components/customers'
import { VendorsPage } from '@/components/vendors'
import { ContractsPage } from '@/components/contracts'
import { PaymentsPage } from '@/components/payments'
import { DueTrackingPage } from '@/components/due-tracking'
import { VendorContractsPage } from '@/components/vendor-contracts'
import { ContractDetail } from '@/components/contract-detail'
import { CustomerDetail } from '@/components/customer-detail'
import { InstallmentsPage } from '@/components/installments'
import { useState } from 'react'
import {
  Package,
  Users,
  Store,
  FileText,
  CreditCard,
  Menu,
  X,
  Smartphone,
  ChevronRight,
  Wallet,
  CalendarClock,
  Home as HomeIcon,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
  { page: 'installments', label: 'Installments', icon: <CalendarClock className="h-5 w-5" /> },
  { page: 'inventory', label: 'Inventory', icon: <Package className="h-5 w-5" /> },
  { page: 'customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
  { page: 'vendors', label: 'Vendors', icon: <Store className="h-5 w-5" /> },
  { page: 'contracts', label: 'Contracts', icon: <FileText className="h-5 w-5" /> },
  { page: 'payments', label: 'Payments', icon: <CreditCard className="h-5 w-5" /> },
  { page: 'vendor-contracts', label: 'Vendor Payables', icon: <Wallet className="h-5 w-5" /> },
  { page: 'due-tracking', label: 'Due Tracking', icon: <AlertCircle className="h-5 w-5" /> },
]

function PageContent({ page }: { page: Page }) {
  const { selectedCustomerId, selectedContractId, setSelectedCustomerId, setCurrentPage, setSelectedContractId } = useAppStore()

  const handleBackFromCustomerDetail = () => {
    setSelectedCustomerId(null)
    setCurrentPage('customers')
  }

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId)
    setCurrentPage('contract-detail')
  }

  const handleBackFromContractDetail = () => {
    setSelectedContractId(null)
    setCurrentPage('contracts')
  }

  switch (page) {
    case 'dashboard':
      return <DashboardPage />
    case 'inventory':
      return <InventoryPage />
    case 'customers':
      return <CustomersPage />
    case 'vendors':
      return <VendorsPage />
    case 'contracts':
      return <ContractsPage />
    case 'installments':
      return <InstallmentsPage />
    case 'payments':
      return <PaymentsPage />
    case 'vendor-contracts':
      return <VendorContractsPage />
    case 'due-tracking':
      return <DueTrackingPage />
    case 'customer-detail':
      return selectedCustomerId ? (
        <CustomerDetail
          customerId={selectedCustomerId}
          onBack={handleBackFromCustomerDetail}
          onViewContract={handleViewContract}
        />
      ) : (
        <CustomersPage />
      )
    case 'contract-detail':
      return selectedContractId ? (
        <ContractDetail
          contractId={selectedContractId}
          onBack={handleBackFromContractDetail}
        />
      ) : (
        <ContractsPage />
      )
    default:
      return <DashboardPage />
  }
}

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isDashboard = currentPage === 'dashboard'

  const displayPage = (currentPage === 'customer-detail' ? 'customers' : currentPage === 'contract-detail' ? 'contracts' : currentPage) as Page
  const currentPageLabel = currentPage === 'customer-detail'
    ? 'Customer Detail'
    : currentPage === 'contract-detail'
    ? 'Contract Detail'
    : (navItems.find((item) => item.page === currentPage)?.label || 'Home')

  // Dashboard is a completely separate full-screen page
  if (isDashboard) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardPage />
        <footer className="border-t bg-card py-3 px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 MobiTrack — Mobile Shop Installment Management System
          </p>
        </footer>
      </div>
    )
  }

  // Section pages have sidebar navigation
  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!sidebarCollapsed && (
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">MobiTrack</h1>
                <p className="text-[10px] text-muted-foreground">Installment Manager</p>
              </div>
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm hover:opacity-80 transition-opacity"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                sidebarCollapsed ? 'rotate-0' : 'rotate-180'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = displayPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page)
                  setSidebarOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive && item.page !== 'dashboard'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  item.page === 'dashboard' && 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-border p-4">
            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-3">
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                MobiTrack Pro
              </p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">
                Mobile Shop Installment System
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex">
              {navItems.find((item) => item.page === displayPage)?.icon}
            </div>
            <h2 className="text-lg font-semibold text-foreground">{currentPageLabel}</h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('dashboard')}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <HomeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <PageContent page={currentPage} />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-3 px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 MobiTrack — Mobile Shop Installment Management System
          </p>
        </footer>
      </div>
    </div>
  )
}
