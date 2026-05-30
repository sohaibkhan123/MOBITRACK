'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  DollarSign,
  Package,
  TrendingUp,
  Monitor,
  Store,
  CreditCard,
  AlertTriangle,
  CalendarClock,
  Wallet,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Plus,
  Sparkles,
  BarChart3,
  LayoutDashboard,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Types ───────────────────────────────────────────────────────────────────

interface ShopSettings {
  id: string
  shopName: string
  shopAddress: string
  shopPhone: string
  shopEmail: string
  currencySymbol: string
  currencyCode: string
  currencyLocale: string
  ownerName: string
  ownerPhone: string
  taxRate: number
  receiptFooter: string
}

interface DashboardData {
  totalCustomers: number
  activeCustomers: number
  totalContracts: number
  activeContracts: number
  completedContracts: number
  overdueContracts: number
  totalOutstanding: number
  overdueAmount: number
  collectedThisMonth: number
  totalInventory: number
  availableInventory: number
  soldInventory: number
  totalVendors: number
  recentPayments: RecentPayment[]
  upcomingPayments: UpcomingPayment[]
  collectionData: CollectionDay[]
  settings: ShopSettings
}

interface RecentPayment {
  id: string
  amount: number
  date: string
  method: string
  customer: { fullName: string }
  contract: { item: { brand: string; model: string } }
}

interface UpcomingPayment {
  id: string
  nextDueDate: string
  installmentAmount: number
  customer: { fullName: string }
  item: { brand: string; model: string }
}

interface CollectionDay {
  date: string
  total: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, settings: ShopSettings | null): string {
  const symbol = settings?.currencySymbol || '₨'
  return symbol + ' ' + amount.toLocaleString(settings?.currencyLocale || 'en-PK')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Skeleton loaders ────────────────────────────────────────────────────────

function NavCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const { setCurrentPage, setOpenAddContractOnNavigate } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to fetch dashboard data')
      }
      const json: DashboardData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  // Get settings from data
  const settings = data?.settings || null

  // ── Navigation cards ───────────────────────────────────────────────────

  const navCards = data
    ? [
        {
          title: 'Installments',
          description: 'Track schedules & payments',
          icon: CalendarClock,
          mainValue: data.activeContracts.toString(),
          subLabel: `${data.activeContracts} active contracts`,
          badge: data.overdueContracts > 0
            ? { label: `${data.overdueContracts} overdue`, variant: 'destructive' as const }
            : null,
          gradient: 'from-orange-500 to-amber-500',
          iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
          onClick: () => setCurrentPage('installments'),
        },
        {
          title: 'Inventory',
          description: 'Manage mobile phone stock',
          icon: Package,
          mainValue: data.availableInventory.toString(),
          subLabel: `${data.availableInventory} available · ${data.soldInventory} sold`,
          badge: null,
          gradient: 'from-teal-500 to-cyan-500',
          iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-500',
          onClick: () => setCurrentPage('inventory'),
        },
        {
          title: 'Customers',
          description: 'Customer records & accounts',
          icon: Users,
          mainValue: data.totalCustomers.toString(),
          subLabel: `${data.activeCustomers} active customers`,
          badge: null,
          gradient: 'from-rose-500 to-pink-500',
          iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
          onClick: () => setCurrentPage('customers'),
        },
        {
          title: 'Contracts',
          description: 'Installment contracts',
          icon: FileText,
          mainValue: data.totalContracts.toString(),
          subLabel: `${data.completedContracts} completed`,
          badge: data.overdueContracts > 0
            ? { label: `${data.overdueContracts} overdue`, variant: 'destructive' as const }
            : null,
          gradient: 'from-violet-500 to-purple-500',
          iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
          onClick: () => setCurrentPage('contracts'),
        },
        {
          title: 'Payments',
          description: 'Payment records & history',
          icon: CreditCard,
          mainValue: formatCurrency(data.collectedThisMonth, settings),
          subLabel: 'Collected this month',
          badge: null,
          gradient: 'from-emerald-500 to-green-500',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500',
          onClick: () => setCurrentPage('payments'),
        },
        {
          title: 'Vendors',
          description: 'Vendor management',
          icon: Store,
          mainValue: data.totalVendors.toString(),
          subLabel: 'Registered vendors',
          badge: null,
          gradient: 'from-sky-500 to-blue-500',
          iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
          onClick: () => setCurrentPage('vendors'),
        },
        {
          title: 'Vendor Payables',
          description: 'Vendor installment tracking',
          icon: Wallet,
          mainValue: settings?.currencySymbol || '₨',
          subLabel: 'Vendor purchase installments',
          badge: null,
          gradient: 'from-fuchsia-500 to-pink-500',
          iconBg: 'bg-gradient-to-br from-fuchsia-500 to-pink-500',
          onClick: () => setCurrentPage('vendor-contracts'),
        },
        {
          title: 'Due Tracking',
          description: 'Overdue & upcoming payments',
          icon: AlertTriangle,
          mainValue: data.overdueContracts.toString(),
          subLabel: data.overdueAmount > 0 ? `${formatCurrency(data.overdueAmount, settings)} overdue` : 'No overdue',
          badge: data.overdueContracts > 0
            ? { label: 'Action needed', variant: 'destructive' as const }
            : null,
          gradient: data.overdueContracts > 0
            ? 'from-red-500 to-rose-500'
            : 'from-emerald-500 to-green-500',
          iconBg: data.overdueContracts > 0
            ? 'bg-gradient-to-br from-red-500 to-rose-500'
            : 'bg-gradient-to-br from-emerald-500 to-green-500',
          onClick: () => setCurrentPage('due-tracking'),
        },
        {
          title: 'Admin Settings',
          description: 'Shop name, currency & more',
          icon: Settings,
          mainValue: '⚙️',
          subLabel: 'Configure your shop',
          badge: null,
          gradient: 'from-slate-500 to-gray-600',
          iconBg: 'bg-gradient-to-br from-slate-500 to-gray-600',
          onClick: () => setCurrentPage('settings'),
        },
      ]
    : []

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="pt-8 pb-6 sm:pt-12 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                {settings?.shopName || 'MobiTrack'}
              </h1>
              <p className="text-muted-foreground text-base mt-1">
                {settings?.shopAddress
                  ? `${settings.shopAddress} — Mobile Shop Installment Management`
                  : 'Mobile Shop Installment Management System'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Admin Dashboard</span>
                {typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).electronAPI && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800">
                    <Monitor className="h-3 w-3 mr-1" />
                    Desktop
                  </Badge>
                )}
              </div>
              {settings?.currencyCode && (
                <Badge variant="outline" className="text-xs">
                  {settings.currencySymbol} {settings.currencyCode}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Error state with retry */}
        {error && !loading && (
          <div className="mb-8 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Failed to load dashboard data: {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboard}
                className="ml-4 shrink-0 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats Bar */}
        {!loading && data && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-bold">{formatCurrency(data.totalOutstanding, settings)}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">This Month</p>
                  <p className="text-lg font-bold">{formatCurrency(data.collectedThisMonth, settings)}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${data.overdueContracts > 0 ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-emerald-500 to-green-500'}`}>
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                  <p className={`text-lg font-bold ${data.overdueContracts > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {data.overdueContracts} contract{data.overdueContracts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-sm">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">In Stock</p>
                  <p className="text-lg font-bold">{data.availableInventory} items</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground">Quick Navigation</h2>
          </div>
          <p className="text-sm text-muted-foreground">Click on any section to manage</p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <NavCardSkeleton key={i} />)
            : navCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="group relative cursor-pointer rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-transparent active:scale-[0.98]"
                    onClick={card.onClick}
                  >
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground group-hover:text-white transition-colors duration-300">{card.title}</h3>
                            {card.badge && (
                              <Badge variant={card.badge.variant} className="text-[10px] px-1.5 py-0 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors duration-300">
                                {card.badge.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xl font-extrabold text-foreground group-hover:text-white transition-colors duration-300">{card.mainValue}</p>
                          <p className="text-xs text-muted-foreground group-hover:text-white/80 truncate transition-colors duration-300">{card.subLabel}</p>
                        </div>
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-lg group-hover:bg-white/20 transition-all duration-300`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-xs font-semibold text-muted-foreground group-hover:text-white/90 transition-all duration-300">
                        <span>Open section</span>
                        <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1 duration-300" />
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-5 transition-all duration-300 hover:shadow-lg hover:border-orange-400 hover:bg-orange-50 dark:hover:border-orange-700"
              onClick={() => {
                setOpenAddContractOnNavigate(true)
                setCurrentPage('contracts')
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">New Installment Sale</h3>
                  <p className="text-xs text-muted-foreground">Create contract with auto-invoice</p>
                </div>
                <Plus className="h-5 w-5 text-orange-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </div>

            <div
              className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-5 transition-all duration-300 hover:shadow-lg hover:border-red-400 hover:bg-red-50 dark:hover:border-red-700"
              onClick={() => setCurrentPage('due-tracking')}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-md">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">Check Overdue</h3>
                  <p className="text-xs text-muted-foreground">Follow up on overdue payments</p>
                </div>
                <ArrowRight className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
              </div>
            </div>

            <div
              className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-5 transition-all duration-300 hover:shadow-lg hover:border-teal-400 hover:bg-teal-50 dark:hover:border-teal-700"
              onClick={() => setCurrentPage('inventory')}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">Add Inventory</h3>
                  <p className="text-xs text-muted-foreground">Add new mobile phones to stock</p>
                </div>
                <Plus className="h-5 w-5 text-teal-400 group-hover:text-teal-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Due Payments */}
        {!loading && data && data.upcomingPayments.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold text-foreground">Upcoming Due Payments</h2>
              </div>
              <button
                onClick={() => setCurrentPage('due-tracking')}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="divide-y">
                {data.upcomingPayments.slice(0, 5).map((p) => {
                  const isOverdue = new Date(p.nextDueDate + 'T00:00:00') < new Date()
                  return (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isOverdue ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'} shadow-sm`}>
                          {isOverdue ? (
                            <AlertTriangle className="h-5 w-5 text-white" />
                          ) : (
                            <Clock className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{p.customer.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.item.brand} {p.item.model}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-bold">{formatCurrency(p.installmentAmount, settings)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <CalendarClock className="h-3 w-3 text-muted-foreground" />
                          <p className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}>
                            {formatDate(p.nextDueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Payments */}
        {!loading && data && data.recentPayments.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-foreground">Recent Payments</h2>
              </div>
              <button
                onClick={() => setCurrentPage('payments')}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="divide-y">
                {data.recentPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.customer.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.contract.item.brand} {p.contract.item.model}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(p.amount, settings)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  )
}

export default DashboardPage
