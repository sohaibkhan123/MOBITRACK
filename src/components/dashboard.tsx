'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Users,
  FileText,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingUp,
  Store,
  CalendarClock,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ── Chart config ────────────────────────────────────────────────────────────

const chartConfig: ChartConfig = {
  total: {
    label: 'Collection',
    color: 'hsl(160, 60%, 45%)',
  },
}

// ── Skeleton loaders ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DashboardPage() {
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

  // ── Stat card definitions ───────────────────────────────────────────────

  const statsCards = data
    ? [
        {
          title: 'Customers',
          icon: Users,
          mainValue: data.totalCustomers.toString(),
          subValue: `${data.activeCustomers} active`,
          iconBg: 'bg-emerald-100 dark:bg-emerald-950',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          badge: null,
        },
        {
          title: 'Contracts',
          icon: FileText,
          mainValue: data.activeContracts.toString(),
          subValue: `${data.totalContracts} total`,
          iconBg: 'bg-amber-100 dark:bg-amber-950',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badge:
            data.overdueContracts > 0
              ? { label: `${data.overdueContracts} overdue`, variant: 'destructive' as const }
              : null,
        },
        {
          title: 'Outstanding',
          icon: DollarSign,
          mainValue: formatPKR(data.totalOutstanding),
          subValue: `${formatPKR(data.overdueAmount)} overdue`,
          iconBg:
            data.overdueAmount > 0
              ? 'bg-rose-100 dark:bg-rose-950'
              : 'bg-emerald-100 dark:bg-emerald-950',
          iconColor:
            data.overdueAmount > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-emerald-600 dark:text-emerald-400',
          badge: null,
        },
        {
          title: 'Inventory',
          icon: Package,
          mainValue: data.availableInventory.toString(),
          subValue: `${data.soldInventory} sold`,
          iconBg: 'bg-teal-100 dark:bg-teal-950',
          iconColor: 'text-teal-600 dark:text-teal-400',
          badge: null,
        },
        {
          title: 'Collected This Month',
          icon: TrendingUp,
          mainValue: formatPKR(data.collectedThisMonth),
          subValue: 'Monthly collection',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          badge: null,
        },
        {
          title: 'Vendors',
          icon: Store,
          mainValue: data.totalVendors.toString(),
          subValue: 'Registered vendors',
          iconBg: 'bg-amber-100 dark:bg-amber-950',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badge: null,
        },
      ]
    : []

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            MobiTrack — Mobile Shop Installment System
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statsCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription className="text-sm font-medium">
                        {card.title}
                      </CardDescription>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-md ${card.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.mainValue}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {card.subValue}
                        </span>
                        {card.badge && (
                          <Badge variant={card.badge.variant} className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {card.badge.label}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
        </div>

        {/* Collection Chart */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Daily Collections — Last 7 Days
            </CardTitle>
            <CardDescription>Collection amount received per day</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={data.collectionData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={56}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatPKR(value as number)}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ChartContainer>
            ) : null}
          </CardContent>
        </Card>

        {/* Bottom section: two tables */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent Payments
              </CardTitle>
              <CardDescription>Last 5 payments received</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : data && data.recentPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.customer.fullName}
                        </TableCell>
                        <TableCell>
                          {p.contract.item.brand} {p.contract.item.model}
                        </TableCell>
                        <TableCell>{formatPKR(p.amount)}</TableCell>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.method}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recent payments found.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Due Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Upcoming Due Payments
              </CardTitle>
              <CardDescription>Next 10 installments due</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : data && data.upcomingPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.upcomingPayments.map((p) => {
                      const isOverdue =
                        new Date(p.nextDueDate + 'T00:00:00') < new Date()
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.customer.fullName}
                          </TableCell>
                          <TableCell>
                            {p.item.brand} {p.item.model}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="text-muted-foreground h-3.5 w-3.5" />
                              {formatDate(p.nextDueDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              {formatPKR(p.installmentAmount)}
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No upcoming payments due.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

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
