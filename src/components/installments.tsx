'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  fullName: string
  phone: string
}

interface Item {
  id: string
  brand: string
  model: string
  variant: string | null
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

interface InstallmentRow {
  installmentNumber: number
  expectedDate: string
  expectedAmount: number
  amountPaid: number
  dateCollected: string | null
  method: string | null
  receiptNumber: string | null
  status: 'PAID' | 'OVERDUE' | 'UPCOMING'
}

interface QuickPayForm {
  contractId: string
  customerId: string
  amount: string
  date: string
  method: string
  receivedBy: string
  receiptNumber: string
  nextDueDateSet: string
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

function addPeriod(dateStr: string, frequency: string, count: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  switch (frequency) {
    case 'Weekly':
      d.setDate(d.getDate() + count * 7)
      break
    case 'Bi-weekly':
      d.setDate(d.getDate() + count * 14)
      break
    case 'Monthly':
    default:
      d.setMonth(d.getMonth() + count)
      break
  }
  return d.toISOString().split('T')[0]
}

function buildInstallmentSchedule(contract: Contract): InstallmentRow[] {
  const schedule: InstallmentRow[] = []
  const sortedPayments = [...contract.payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const today = new Date().toISOString().split('T')[0]

  for (let i = 1; i <= contract.installmentsCount; i++) {
    const expectedDate = addPeriod(contract.saleDate, contract.frequency, i)
    const payment = sortedPayments[i - 1] || null

    let status: InstallmentRow['status']
    if (payment) {
      status = 'PAID'
    } else if (expectedDate < today) {
      status = 'OVERDUE'
    } else {
      status = 'UPCOMING'
    }

    schedule.push({
      installmentNumber: i,
      expectedDate,
      expectedAmount: contract.installmentAmount,
      amountPaid: payment?.amount || 0,
      dateCollected: payment?.date || null,
      method: payment?.method || null,
      receiptNumber: payment?.receiptNumber || null,
      status,
    })
  }
  return schedule
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const METHOD_OPTIONS = ['Cash', 'EasyPaisa', 'Bank Transfer', 'JazzCash'] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function InstallmentsPage() {
  const { toast } = useToast()
  const { setSelectedContractId, setCurrentPage } = useAppStore()

  // Data state
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [frequencyFilter, setFrequencyFilter] = useState('All')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Quick Pay dialog state
  const [quickPayOpen, setQuickPayOpen] = useState(false)
  const [quickPayContract, setQuickPayContract] = useState<Contract | null>(null)
  const [quickPayForm, setQuickPayForm] = useState<QuickPayForm>({
    contractId: '',
    customerId: '',
    amount: '',
    date: getTodayStr(),
    method: 'Cash',
    receivedBy: 'System',
    receiptNumber: '',
    nextDueDateSet: '',
  })
  const [submitting, setSubmitting] = useState(false)

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

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments')
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch payments', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([fetchContracts(), fetchPayments()])
      setLoading(false)
    }
    loadAll()
  }, [fetchContracts, fetchPayments])

  // ─── Derived Summary Values ─────────────────────────────────────────────

  const today = getTodayStr()

  const totalOutstanding = contracts
    .filter((c) => c.status === 'Running')
    .reduce((sum, c) => sum + (c.totalPrice - c.totalPaid), 0)

  const totalInstallmentsCount = contracts.reduce((sum, c) => sum + c.installmentsCount, 0)
  const totalPaidInstallments = contracts.reduce(
    (sum, c) => sum + c.payments.length,
    0
  )

  const overdueContracts = contracts.filter(
    (c) => c.status === 'Running' && c.nextDueDate && c.nextDueDate < today
  )
  const overdueCount = overdueContracts.length

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const collectedThisMonth = payments
    .filter((p) => {
      const d = new Date(p.date + 'T00:00:00')
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // ─── Computed Schedule Status ────────────────────────────────────────────

  function getContractDisplayStatus(contract: Contract): string {
    if (contract.status === 'Completed') return 'Completed'
    if (contract.status === 'Defaulted') return 'Defaulted'
    // Running: check if overdue
    if (contract.status === 'Running' && contract.nextDueDate && contract.nextDueDate < today) {
      return 'Overdue'
    }
    return 'Running'
  }

  // ─── Filtered Data ──────────────────────────────────────────────────────

  const filteredContracts = contracts.filter((c) => {
    const displayStatus = getContractDisplayStatus(c)

    // Status filter
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Overdue' && displayStatus === 'Overdue') ||
      displayStatus === statusFilter

    // Frequency filter
    const matchesFrequency =
      frequencyFilter === 'All' || c.frequency === frequencyFilter

    // Search
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      c.contractNumber.toLowerCase().includes(query) ||
      c.customer.fullName.toLowerCase().includes(query) ||
      c.item.brand.toLowerCase().includes(query) ||
      c.item.model.toLowerCase().includes(query) ||
      (c.item.variant && c.item.variant.toLowerCase().includes(query))

    return matchesStatus && matchesFrequency && matchesSearch
  })

  // ─── Navigation ─────────────────────────────────────────────────────────

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId)
    setCurrentPage('contract-detail')
  }

  // ─── Expand Toggle ─────────────────────────────────────────────────────

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Quick Pay ──────────────────────────────────────────────────────────

  const openQuickPay = (contract: Contract) => {
    const schedule = buildInstallmentSchedule(contract)
    const nextUnpaid = schedule.find((s) => s.status !== 'PAID')
    const nextDue = nextUnpaid
      ? nextUnpaid.expectedDate
      : addPeriod(contract.saleDate, contract.frequency, contract.installmentsCount + 1)

    setQuickPayContract(contract)
    setQuickPayForm({
      contractId: contract.id,
      customerId: contract.customerId,
      amount: String(contract.installmentAmount),
      date: getTodayStr(),
      method: 'Cash',
      receivedBy: 'System',
      receiptNumber: '',
      nextDueDateSet: nextDue,
    })
    setQuickPayOpen(true)
  }

  const handleQuickPaySubmit = async () => {
    if (!quickPayForm.amount || !quickPayForm.date) {
      toast({ title: 'Validation Error', description: 'Amount and date are required', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        contractId: quickPayForm.contractId,
        customerId: quickPayForm.customerId,
        amount: parseFloat(quickPayForm.amount) || 0,
        date: quickPayForm.date,
        method: quickPayForm.method,
        receivedBy: quickPayForm.receivedBy || 'System',
        receiptNumber: quickPayForm.receiptNumber || '',
        nextDueDateSet: quickPayForm.nextDueDateSet || null,
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to record payment')

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(payload.amount)} for ${quickPayContract?.contractNumber} has been recorded`,
      })

      setQuickPayOpen(false)
      setQuickPayContract(null)
      await fetchContracts()
      await fetchPayments()
    } catch {
      toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Status Badge ───────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Running':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            <Clock className="size-3 mr-1" />
            Running
          </Badge>
        )
      case 'Completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="size-3 mr-1" />
            Completed
          </Badge>
        )
      case 'Defaulted':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
            <X className="size-3 mr-1" />
            Defaulted
          </Badge>
        )
      case 'Overdue':
        return (
          <Badge variant="destructive" className="dark:bg-red-950 dark:text-red-300 dark:border-red-800">
            <AlertTriangle className="size-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // ─── Method Badge ───────────────────────────────────────────────────────

  const MethodBadge = ({ method }: { method: string }) => {
    const styles: Record<string, string> = {
      Cash: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      'Bank Transfer': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      EasyPaisa: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
      JazzCash: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    }
    return (
      <Badge className={styles[method] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'}>
        {method}
      </Badge>
    )
  }

  // ─── Installment Status Badge ───────────────────────────────────────────

  const InstallmentStatusBadge = ({ status }: { status: InstallmentRow['status'] }) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            ✓ PAID
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
            ! OVERDUE
          </Badge>
        )
      case 'UPCOMING':
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
            UPCOMING
          </Badge>
        )
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────

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
            <CreditCard className="size-6 text-emerald-600" />
            Installments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all installment schedules and payment statuses
          </p>
        </div>
      </div>

      {/* ─── Summary Cards ──────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installments Paid */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installments Paid</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalPaidInstallments}/{totalInstallmentsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Installments</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {overdueCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collected This Month */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected This Month</p>
                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  {formatCurrency(collectedThisMonth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters ──────────────────────────────────────────────────────── */}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, contract #, brand or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Running">Running</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Defaulted">Defaulted</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Frequencies</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── Installment Schedule Table ───────────────────────────────────── */}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Item</TableHead>
                  <TableHead className="hidden lg:table-cell">Installment Plan</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden xl:table-cell">Total / Paid / Remaining</TableHead>
                  <TableHead className="hidden md:table-cell">Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      {searchQuery || statusFilter !== 'All' || frequencyFilter !== 'All'
                        ? 'No contracts match your filters'
                        : 'No contracts found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const displayStatus = getContractDisplayStatus(contract)
                    const paidCount = contract.payments.length
                    const totalCount = contract.installmentsCount
                    const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0
                    const remaining = contract.totalPrice - contract.totalPaid
                    const isOverdue = displayStatus === 'Overdue'
                    const schedule = buildInstallmentSchedule(contract)

                    return (
                      <>
                        <TableRow key={contract.id} className="group">
                          {/* Expand Button */}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0"
                              onClick={() => toggleRowExpand(contract.id)}
                            >
                              {expandedRows.has(contract.id) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </TableCell>

                          {/* Contract # (clickable) */}
                          <TableCell>
                            <button
                              onClick={() => handleViewContract(contract.id)}
                              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {contract.contractNumber}
                            </button>
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div>
                              <div className="font-medium">{contract.customer.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {contract.customer.phone}
                              </div>
                            </div>
                          </TableCell>

                          {/* Item */}
                          <TableCell className="hidden md:table-cell">
                            <div>
                              {contract.item.brand} {contract.item.model}
                              {contract.item.variant ? ` (${contract.item.variant})` : ''}
                            </div>
                          </TableCell>

                          {/* Installment Plan */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm">
                              {contract.installmentsCount} × {formatCurrency(contract.installmentAmount)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({contract.frequency})
                            </span>
                          </TableCell>

                          {/* Progress */}
                          <TableCell>
                            <div className="min-w-[100px]">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{paidCount}/{totalCount} paid</span>
                                <span className="font-medium">{progressPercent}%</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          </TableCell>

                          {/* Total / Paid / Remaining */}
                          <TableCell className="hidden xl:table-cell">
                            <div className="text-xs space-y-0.5">
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-medium">{formatCurrency(contract.totalPrice)}</span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Paid:</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(contract.totalPaid)}</span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Rem:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(remaining)}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Next Due */}
                          <TableCell className="hidden md:table-cell">
                            {contract.nextDueDate ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-3 text-muted-foreground" />
                                <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                  {formatDate(contract.nextDueDate)}
                                </span>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusBadge status={displayStatus} />
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0 text-emerald-600 hover:text-emerald-700"
                                onClick={() => handleViewContract(contract.id)}
                                title="View Details"
                              >
                                <Eye className="size-4" />
                              </Button>
                              {contract.status === 'Running' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-8 p-0 text-emerald-600 hover:text-emerald-700"
                                  onClick={() => openQuickPay(contract)}
                                  title="Quick Pay"
                                >
                                  <CreditCard className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* ─── Expanded Installment Schedule ─────────────────── */}
                        {expandedRows.has(contract.id) && (
                          <TableRow key={`${contract.id}-schedule`} className="bg-muted/30">
                            <TableCell colSpan={10} className="p-0">
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CreditCard className="size-4 text-emerald-600" />
                                  <h4 className="text-sm font-semibold">Installment Schedule</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {paidCount} of {totalCount} paid
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    Total Paid: {formatCurrency(contract.totalPaid)} / {formatCurrency(contract.totalPrice)}
                                  </span>
                                </div>

                                <div className="max-h-96 overflow-y-auto rounded-md border [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                                        <TableHead className="text-center w-12">No.</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead className="text-right">Expected Amount</TableHead>
                                        <TableHead className="text-right">Amount Paid</TableHead>
                                        <TableHead>Date Collected</TableHead>
                                        <TableHead className="hidden md:table-cell">Method</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {schedule.map((row) => (
                                        <TableRow
                                          key={row.installmentNumber}
                                          className={
                                            row.status === 'PAID'
                                              ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                                              : row.status === 'OVERDUE'
                                              ? 'bg-red-50/30 dark:bg-red-950/10'
                                              : ''
                                          }
                                        >
                                          <TableCell className="text-center font-medium">
                                            {row.installmentNumber}
                                          </TableCell>
                                          <TableCell>
                                            <span className={row.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                              {formatDate(row.expectedDate)}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {formatCurrency(row.expectedAmount)}
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            {row.status === 'PAID' ? formatCurrency(row.amountPaid) : '—'}
                                          </TableCell>
                                          <TableCell>
                                            {row.status === 'PAID' && row.dateCollected
                                              ? formatDate(row.dateCollected)
                                              : '—'}
                                          </TableCell>
                                          <TableCell className="hidden md:table-cell">
                                            {row.method ? (
                                              <MethodBadge method={row.method} />
                                            ) : (
                                              '—'
                                            )}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <InstallmentStatusBadge status={row.status} />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Quick Pay Dialog ─────────────────────────────────────────────── */}

      <Dialog open={quickPayOpen} onOpenChange={setQuickPayOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-emerald-600" />
              Quick Pay — {quickPayContract?.contractNumber}
            </DialogTitle>
            <DialogDescription>
              Record an installment payment for{' '}
              <span className="font-semibold text-foreground">
                {quickPayContract?.customer.fullName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Customer & Item Info */}
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{quickPayContract?.customer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{quickPayContract?.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium">
                  {quickPayContract?.item.brand} {quickPayContract?.item.model}
                  {quickPayContract?.item.variant ? ` (${quickPayContract.item.variant})` : ''}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-red-600">
                  {quickPayContract ? formatCurrency(quickPayContract.totalPrice - quickPayContract.totalPaid) : '₨ 0'}
                </span>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qp-amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qp-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={quickPayForm.amount}
                  onChange={(e) =>
                    setQuickPayForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Installment: {quickPayContract ? formatCurrency(quickPayContract.installmentAmount) : '₨ 0'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qp-date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qp-date"
                  type="date"
                  value={quickPayForm.date}
                  onChange={(e) =>
                    setQuickPayForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Method & Received By */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={quickPayForm.method}
                  onValueChange={(val) =>
                    setQuickPayForm((prev) => ({ ...prev, method: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qp-receivedBy">Received By</Label>
                <Input
                  id="qp-receivedBy"
                  placeholder="System"
                  value={quickPayForm.receivedBy}
                  onChange={(e) =>
                    setQuickPayForm((prev) => ({ ...prev, receivedBy: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Receipt # & Next Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qp-receipt">Receipt Number</Label>
                <Input
                  id="qp-receipt"
                  placeholder="e.g. R-10901"
                  value={quickPayForm.receiptNumber}
                  onChange={(e) =>
                    setQuickPayForm((prev) => ({ ...prev, receiptNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qp-nextDue">Next Due Date</Label>
                <Input
                  id="qp-nextDue"
                  type="date"
                  value={quickPayForm.nextDueDateSet}
                  onChange={(e) =>
                    setQuickPayForm((prev) => ({ ...prev, nextDueDateSet: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickPayOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickPaySubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
