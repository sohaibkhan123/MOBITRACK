'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  DollarSign,
  Package,
  TrendingUp,
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
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

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

function formatPKR(amount: number): string {
  return '₨ ' + amount.toLocaleString('en-PK')
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
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const { setCurrentPage, setOpenAddContractOnNavigate } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json: DashboardData = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // ── Navigation cards ───────────────────────────────────────────────────

  const navCards = data
    ? [
        {
          title: 'Installments',
          description: 'Track installment schedules & payments',
          icon: CalendarClock,
          mainValue: data.activeContracts.toString(),
          subLabel: `${data.activeContracts} active contracts`,
          badge: data.overdueContracts > 0
            ? { label: `${data.overdueContracts} overdue`, variant: 'destructive' as const }
            : null,
          iconBg: 'bg-emerald-100 dark:bg-emerald-950',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          page: 'installments' as const,
          onClick: () => setCurrentPage('installments'),
        },
        {
          title: 'Inventory',
          description: 'Manage mobile phone stock',
          icon: Package,
          mainValue: data.availableInventory.toString(),
          subLabel: `${data.availableInventory} available · ${data.soldInventory} sold`,
          badge: null,
          iconBg: 'bg-teal-100 dark:bg-teal-950',
          iconColor: 'text-teal-600 dark:text-teal-400',
          page: 'inventory' as const,
          onClick: () => setCurrentPage('inventory'),
        },
        {
          title: 'Customers',
          description: 'Customer records & accounts',
          icon: Users,
          mainValue: data.totalCustomers.toString(),
          subLabel: `${data.activeCustomers} active customers`,
          badge: null,
          iconBg: 'bg-amber-100 dark:bg-amber-950',
          iconColor: 'text-amber-600 dark:text-amber-400',
          page: 'customers' as const,
          onClick: () => setCurrentPage('customers'),
        },
        {
          title: 'Contracts',
          description: 'Manage installment contracts',
          icon: FileText,
          mainValue: data.totalContracts.toString(),
          subLabel: `${data.completedContracts} completed`,
          badge: data.overdueContracts > 0
            ? { label: `${data.overdueContracts} overdue`, variant: 'destructive' as const }
            : null,
          iconBg: 'bg-rose-100 dark:bg-rose-950',
          iconColor: 'text-rose-600 dark:text-rose-400',
          page: 'contracts' as const,
          onClick: () => setCurrentPage('contracts'),
        },
        {
          title: 'Payments',
          description: 'Payment records & history',
          icon: CreditCard,
          mainValue: formatPKR(data.collectedThisMonth),
          subLabel: 'Collected this month',
          badge: null,
          iconBg: 'bg-emerald-100 dark:bg-emerald-950',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          page: 'payments' as const,
          onClick: () => setCurrentPage('payments'),
        },
        {
          title: 'Vendors',
          description: 'Vendor management & payables',
          icon: Store,
          mainValue: data.totalVendors.toString(),
          subLabel: 'Registered vendors',
          badge: null,
          iconBg: 'bg-amber-100 dark:bg-amber-950',
          iconColor: 'text-amber-600 dark:text-amber-400',
          page: 'vendors' as const,
          onClick: () => setCurrentPage('vendors'),
        },
        {
          title: 'Vendor Payables',
          description: 'Vendor installment tracking',
          icon: Wallet,
          mainValue: '₨',
          subLabel: 'Vendor purchase installments',
          badge: null,
          iconBg: 'bg-purple-100 dark:bg-purple-950',
          iconColor: 'text-purple-600 dark:text-purple-400',
          page: 'vendor-contracts' as const,
          onClick: () => setCurrentPage('vendor-contracts'),
        },
        {
          title: 'Due Tracking',
          description: 'Overdue & upcoming payments',
          icon: AlertTriangle,
          mainValue: data.overdueContracts.toString(),
          subLabel: data.overdueAmount > 0 ? `${formatPKR(data.overdueAmount)} overdue` : 'No overdue',
          badge: data.overdueContracts > 0
            ? { label: 'Action needed', variant: 'destructive' as const }
            : null,
          iconBg: data.overdueContracts > 0
            ? 'bg-red-100 dark:bg-red-950'
            : 'bg-emerald-100 dark:bg-emerald-950',
          iconColor: data.overdueContracts > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-emerald-600 dark:text-emerald-400',
          page: 'due-tracking' as const,
          onClick: () => setCurrentPage('due-tracking'),
        },
      ]
    : []

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                MobiTrack
              </h1>
              <p className="text-muted-foreground text-sm">
                Mobile Shop Installment Management System
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {!loading && data && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-sm font-bold">{formatPKR(data.totalOutstanding)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-sm font-bold">{formatPKR(data.collectedThisMonth)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${data.overdueContracts > 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-emerald-100 dark:bg-emerald-950'}`}>
                <AlertTriangle className={`h-4 w-4 ${data.overdueContracts > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className={`text-sm font-bold ${data.overdueContracts > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {data.overdueContracts} contract{data.overdueContracts !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Stock</p>
                <p className="text-sm font-bold">{data.availableInventory} items</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Navigation</h2>
          <p className="text-sm text-muted-foreground">Click on any section to manage</p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <NavCardSkeleton key={i} />)
            : navCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card
                    key={card.title}
                    className="group cursor-pointer hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200"
                    onClick={card.onClick}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{card.title}</h3>
                            {card.badge && (
                              <Badge variant={card.badge.variant} className="text-[10px] px-1.5 py-0">
                                {card.badge.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xl font-bold text-foreground">{card.mainValue}</p>
                          <p className="text-xs text-muted-foreground truncate">{card.subLabel}</p>
                        </div>
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className={`h-6 w-6 ${card.iconColor}`} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Open section <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              className="group cursor-pointer hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 border-dashed"
              onClick={() => {
                setOpenAddContractOnNavigate(true)
                setCurrentPage('contracts')
              }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                  <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">New Installment Sale</h3>
                  <p className="text-xs text-muted-foreground">Create a new contract with auto-invoice</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 border-dashed"
              onClick={() => setCurrentPage('due-tracking')}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Check Overdue</h3>
                  <p className="text-xs text-muted-foreground">View and follow up on overdue payments</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 border-dashed"
              onClick={() => setCurrentPage('inventory')}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                  <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Add Inventory</h3>
                  <p className="text-xs text-muted-foreground">Add new mobile phones to stock</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Due Payments */}
        {!loading && data && data.upcomingPayments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Due Payments</h2>
              <button
                onClick={() => setCurrentPage('due-tracking')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.upcomingPayments.slice(0, 5).map((p) => {
                    const isOverdue = new Date(p.nextDueDate + 'T00:00:00') < new Date()
                    return (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isOverdue ? 'bg-red-100 dark:bg-red-950' : 'bg-amber-100 dark:bg-amber-950'}`}>
                            {isOverdue ? (
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.customer.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.item.brand} {p.item.model}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-semibold">{formatPKR(p.installmentAmount)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <CalendarClock className="h-3 w-3 text-muted-foreground" />
                            <p className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                              {formatDate(p.nextDueDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Payments */}
        {!loading && data && data.recentPayments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
              <button
                onClick={() => setCurrentPage('payments')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.recentPayments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.customer.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.contract.item.brand} {p.contract.item.model}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +{formatPKR(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="mt-6 border-rose-300 dark:border-rose-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Failed to load dashboard data: {error}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
