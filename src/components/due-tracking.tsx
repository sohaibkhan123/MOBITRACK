'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Clock,
  Calendar,
  Phone,
  CheckCircle2,
  Download,
  Loader2,
  Bell,
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  fullName: string
  fatherName: string | null
  cnic: string | null
  phone: string
  altPhone: string | null
  address: string | null
}

interface Item {
  id: string
  brand: string
  model: string
  variant: string | null
  imei1: string | null
  color: string | null
}

interface Payment {
  id: string
  amount: number
  date: string
  method: string
  receiptNumber: string
  nextDueDateSet: string | null
}

interface Contract {
  id: string
  contractNumber: string
  customerId: string
  itemId: string
  saleDate: string
  purchasePrice: number
  totalPrice: number
  totalProfit: number
  downPayment: number
  remainingAmount: number
  installmentsCount: number
  installmentAmount: number
  profitPerInstallment: number
  principalPerInstallment: number
  frequency: string
  nextDueDate: string | null
  totalPaid: number
  status: string
  customer: Customer
  item: Item
  payments: Payment[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return '₨ ' + amount.toLocaleString('en-PK')
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  due.setHours(0, 0, 0, 0)
  const diff = today.getTime() - due.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function isOverdue(contract: Contract): boolean {
  if (contract.status !== 'Running' || !contract.nextDueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(contract.nextDueDate + 'T00:00:00')
  due.setHours(0, 0, 0, 0)
  return due < today
}

function isDueToday(contract: Contract): boolean {
  if (contract.status !== 'Running' || !contract.nextDueDate) return false
  return contract.nextDueDate === getTodayStr()
}

// ─── Excel Export ───────────────────────────────────────────────────────────

function exportToExcel(contracts: Contract[], filename: string) {
  const rows = contracts.map((c) => ({
    'Contract Number': c.contractNumber,
    'Status': c.status,
    'Sale Date': c.saleDate,
    'Next Due Date': c.nextDueDate || '',
    'Total Price': c.totalPrice,
    'Down Payment': c.downPayment,
    'Total Paid': c.totalPaid,
    'Remaining Amount': c.remainingAmount,
    'Installment Amount': c.installmentAmount,
    'Frequency': c.frequency,
    'Customer Name': c.customer.fullName,
    'Father Name': c.customer.fatherName || '',
    'CNIC': c.customer.cnic || '',
    'Phone': c.customer.phone,
    'Alt Phone': c.customer.altPhone || '',
    'Address': c.customer.address || '',
    'Mobile Brand': c.item.brand,
    'Model': c.item.model,
    'IMEI': c.item.imei1 || '',
    'Color': c.item.color || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Due Tracking')
  XLSX.writeFile(wb, filename)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DueTrackingPage() {
  const { toast } = useToast()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  // ─── Fetch Data ─────────────────────────────────────────────────────────

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts')
      if (!res.ok) throw new Error('Failed to fetch contracts')
      const data = await res.json()
      setContracts(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch contracts', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await fetchContracts()
      setLoading(false)
    }
    load()
  }, [fetchContracts])

  // ─── Derived Data ───────────────────────────────────────────────────────

  const overdueContracts = contracts.filter(isOverdue)
  const dueTodayContracts = contracts.filter(isDueToday)

  const totalOverdueAmount = overdueContracts.reduce((sum, c) => sum + c.remainingAmount, 0)
  const totalDueTodayAmount = dueTodayContracts.reduce((sum, c) => sum + c.installmentAmount, 0)

  // ─── Export Handlers ────────────────────────────────────────────────────

  const handleExportPending = () => {
    if (overdueContracts.length === 0) {
      toast({ title: 'No Data', description: 'No overdue contracts to export' })
      return
    }
    exportToExcel(overdueContracts, `MobiTrack_Overdue_${getTodayStr()}.xlsx`)
    toast({ title: 'Exported', description: 'Overdue contracts exported successfully' })
  }

  const handleExportAll = () => {
    if (contracts.length === 0) {
      toast({ title: 'No Data', description: 'No contracts to export' })
      return
    }
    exportToExcel(contracts, `MobiTrack_All_Contracts_${getTodayStr()}.xlsx`)
    toast({ title: 'Exported', description: 'All contracts exported successfully' })
  }

  // ─── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertCircle className="size-6 text-rose-500" />
            Due Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track overdue installments and payments due today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPending}>
            <Download className="size-4 mr-2" />
            Export Pending
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="size-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {overdueContracts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalOverdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {dueTodayContracts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Today Amount</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatCurrency(totalDueTodayAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Overdue Installments Section ─────────────────────────────────── */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="size-5 text-rose-500" />
          <h2 className="text-lg font-semibold">Overdue Installments</h2>
          {overdueContracts.length > 0 && (
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
              {overdueContracts.length}
            </Badge>
          )}
        </div>

        {overdueContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="size-12 mx-auto text-emerald-500 mb-3" />
              <p className="text-muted-foreground font-medium">No overdue installments</p>
              <p className="text-muted-foreground text-sm mt-1">All payments are up to date!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overdueContracts.map((contract) => {
              const daysOverdue = getDaysOverdue(contract.nextDueDate!)
              return (
                <Card
                  key={contract.id}
                  className="border-l-4 border-l-rose-500 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Customer + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {contract.customer.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contract.contractNumber}
                        </p>
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 shrink-0 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                        {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          Due Date
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          {formatDate(contract.nextDueDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Installment</span>
                        <span className="font-medium">
                          {formatCurrency(contract.installmentAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Pending</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(contract.remainingAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                      {contract.item.brand} {contract.item.model}
                      {contract.item.variant ? ` (${contract.item.variant})` : ''}
                      {contract.item.color ? ` — ${contract.item.color}` : ''}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`tel:${contract.customer.phone}`}>
                          <Phone className="size-3.5 mr-1.5" />
                          Call Now
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          toast({
                            title: 'Reminder Sent',
                            description: `Reminder queued for ${contract.customer.fullName}`,
                          })
                        }
                      >
                        <Bell className="size-3.5 mr-1.5" />
                        Remind
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Due Today Section ────────────────────────────────────────────── */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="size-5 text-teal-500" />
          <h2 className="text-lg font-semibold">Due Today</h2>
          {dueTodayContracts.length > 0 && (
            <Badge className="bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
              {dueTodayContracts.length}
            </Badge>
          )}
        </div>

        {dueTodayContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="size-12 mx-auto text-teal-500 mb-3" />
              <p className="text-muted-foreground font-medium">No installments due today</p>
              <p className="text-muted-foreground text-sm mt-1">
                Check back later for upcoming due dates
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dueTodayContracts.map((contract) => (
              <Card
                key={contract.id}
                className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: Customer + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {contract.customer.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contract.contractNumber}
                      </p>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100 shrink-0 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
                      Due Today
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Installment</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {formatCurrency(contract.installmentAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">
                        {formatCurrency(contract.remainingAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="size-3.5" />
                        Phone
                      </span>
                      <span className="font-medium">{contract.customer.phone}</span>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                    {contract.item.brand} {contract.item.model}
                    {contract.item.variant ? ` (${contract.item.variant})` : ''}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={`tel:${contract.customer.phone}`}>
                        <Phone className="size-3.5 mr-1.5" />
                        Call Now
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        toast({
                          title: 'Reminder Sent',
                          description: `Reminder queued for ${contract.customer.fullName}`,
                        })
                      }
                    >
                      <Bell className="size-3.5 mr-1.5" />
                      Remind
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
