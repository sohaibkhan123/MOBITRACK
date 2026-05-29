'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Search, DollarSign, CreditCard } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  fullName: string
  phone: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  variant?: string | null
}

interface Contract {
  id: string
  contractNumber: string
  itemId: string
  customerId: string
  remainingAmount: number
  installmentAmount: number
  nextDueDate?: string | null
  status: string
  item: InventoryItem
  customer: Customer
}

interface Payment {
  id: string
  contractId: string
  customerId: string
  amount: number
  date: string
  method: string
  receivedBy: string
  receiptNumber: string
  nextDueDateSet?: string | null
  customer: Customer
  contract: {
    id: string
    contractNumber: string
    item: InventoryItem
    remainingAmount: number
    installmentAmount: number
    nextDueDate?: string | null
  }
}

interface PaymentFormData {
  contractId: string
  customerId: string
  amount: string
  date: string
  method: string
  receivedBy: string
  receiptNumber: string
  nextDueDateSet: string
}

const EMPTY_FORM: PaymentFormData = {
  contractId: '',
  customerId: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  method: 'Cash',
  receivedBy: '',
  receiptNumber: '',
  nextDueDateSet: '',
}

const METHOD_OPTIONS = ['Cash', 'EasyPaisa', 'Bank Transfer', 'JazzCash'] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

function getMethodBadgeClass(method: string): string {
  switch (method) {
    case 'Cash':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    case 'EasyPaisa':
      return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800'
    case 'Bank Transfer':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    case 'JazzCash':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getItemDisplay(item: InventoryItem): string {
  const parts = [item.brand, item.model]
  if (item.variant) parts.push(item.variant)
  return parts.join(' ')
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { toast } = useToast()

  // Data state
  const [payments, setPayments] = useState<Payment[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM)

  // ─── Fetch data ──────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments')
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      })
    }
  }, [toast])

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts')
      if (!res.ok) throw new Error('Failed to fetch contracts')
      const data: Contract[] = await res.json()
      setContracts(data.filter((c) => c.status === 'Running'))
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPayments(), fetchContracts()])
      setLoading(false)
    }
    loadData()
  }, [fetchPayments, fetchContracts])

  // ─── Computed values ─────────────────────────────────────────────────────

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const todayStr = now.toISOString().split('T')[0]

  const totalCollectedThisMonth = payments
    .filter((p) => {
      const d = new Date(p.date + 'T00:00:00')
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  const totalCollectedAllTime = payments.reduce((sum, p) => sum + p.amount, 0)

  const paymentsToday = payments.filter((p) => p.date === todayStr).length

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        p.customer?.fullName?.toLowerCase().includes(q) ||
        p.contract?.contractNumber?.toLowerCase().includes(q) ||
        p.receiptNumber?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Method filter
    if (methodFilter !== 'All' && p.method !== methodFilter) return false

    return true
  })

  // ─── Contract selection handler ──────────────────────────────────────────

  const selectedContract = contracts.find((c) => c.id === form.contractId)

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId)
    setForm((prev) => ({
      ...prev,
      contractId,
      customerId: contract?.customerId || '',
      amount: contract?.installmentAmount
        ? String(contract.installmentAmount)
        : prev.amount,
      nextDueDateSet: contract?.nextDueDate || '',
    }))
  }

  // ─── CRUD Handlers ──────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingPayment(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setForm({
      contractId: payment.contractId,
      customerId: payment.customerId,
      amount: String(payment.amount),
      date: payment.date,
      method: payment.method,
      receivedBy: payment.receivedBy,
      receiptNumber: payment.receiptNumber,
      nextDueDateSet: payment.nextDueDateSet || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.contractId || !form.amount || !form.date) {
      toast({
        title: 'Validation Error',
        description: 'Contract, amount, and date are required',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        contractId: form.contractId,
        customerId: form.customerId,
        amount: parseFloat(form.amount) || 0,
        date: form.date,
        method: form.method,
        receivedBy: form.receivedBy || 'System',
        receiptNumber: form.receiptNumber || '',
        nextDueDateSet: form.nextDueDateSet || null,
      }

      if (editingPayment) {
        const res = await fetch(`/api/payments/${editingPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update payment')
        toast({
          title: 'Payment Updated',
          description: `Payment of ${formatPKR(payload.amount)} has been updated`,
        })
      } else {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create payment')
        toast({
          title: 'Payment Recorded',
          description: `Payment of ${formatPKR(payload.amount)} has been recorded`,
        })
      }

      setFormOpen(false)
      setForm(EMPTY_FORM)
      setEditingPayment(null)
      await fetchPayments()
      await fetchContracts()
    } catch {
      toast({
        title: 'Error',
        description: editingPayment
          ? 'Failed to update payment'
          : 'Failed to record payment',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/payments/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete payment')
      toast({
        title: 'Payment Deleted',
        description: `Payment of ${formatPKR(deleteTarget.amount)} has been deleted`,
      })
      setDeleteTarget(null)
      await fetchPayments()
      await fetchContracts()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      })
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Payments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage installment payments and receipts
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="w-fit">
            <Plus className="size-4" />
            Record Payment
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-600" />
                Collected This Month
              </CardDescription>
              <CardTitle className="text-xl text-emerald-700 dark:text-emerald-400">
                {formatPKR(totalCollectedThisMonth)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="size-4 text-teal-600" />
                Total Collected All Time
              </CardDescription>
              <CardTitle className="text-xl text-teal-700 dark:text-teal-400">
                {formatPKR(totalCollectedAllTime)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="size-4 text-amber-600" />
                Payments Today
              </CardDescription>
              <CardTitle className="text-xl text-amber-700 dark:text-amber-400">
                {paymentsToday}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, contract #, or receipt #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Methods</SelectItem>
                  {METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading payments...</div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  No payments found
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {searchQuery || methodFilter !== 'All'
                    ? 'Try adjusting your search or filter'
                    : 'Record your first payment to get started'}
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="hidden md:table-cell">Received By</TableHead>
                      <TableHead className="hidden lg:table-cell">Receipt #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.customer?.fullName || '—'}
                            </div>
                            {payment.customer?.phone && (
                              <div className="text-xs text-muted-foreground">
                                {payment.customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{payment.contract?.contractNumber || '—'}</TableCell>
                        <TableCell>
                          {payment.contract?.item
                            ? getItemDisplay(payment.contract.item)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPKR(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getMethodBadgeClass(payment.method)}
                          >
                            {payment.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {payment.receivedBy || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {payment.receiptNumber || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(payment)}
                              title="Edit payment"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(payment)}
                              title="Delete payment"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Create / Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Edit Payment' : 'Record Payment'}
            </DialogTitle>
            <DialogDescription>
              {editingPayment
                ? 'Update payment details below.'
                : 'Fill in the details to record a new installment payment.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Contract */}
            <div className="grid gap-2">
              <Label htmlFor="contractId">
                Contract <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.contractId}
                onValueChange={handleContractChange}
                disabled={!!editingPayment}
              >
                <SelectTrigger id="contractId" className="w-full">
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNumber} — {getItemDisplay(contract.item)}{' '}
                      ({contract.customer?.fullName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer (auto-fill) */}
            <div className="grid gap-2">
              <Label htmlFor="customerId">Customer</Label>
              <Input
                id="customerId"
                value={
                  selectedContract?.customer?.fullName ||
                  (editingPayment?.customer?.fullName ?? '')
                }
                disabled
                className="bg-muted"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
                {selectedContract?.installmentAmount && !editingPayment && (
                  <p className="text-xs text-muted-foreground">
                    Installment: {formatPKR(selectedContract.installmentAmount)} | Remaining:{' '}
                    {formatPKR(selectedContract.remainingAmount)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Method & Received By */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={form.method}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, method: val }))
                  }
                >
                  <SelectTrigger id="method" className="w-full">
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
              <div className="grid gap-2">
                <Label htmlFor="receivedBy">Received By</Label>
                <Input
                  id="receivedBy"
                  placeholder="e.g. Hafiz Mobiles Store"
                  value={form.receivedBy}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, receivedBy: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Receipt Number & Next Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  placeholder="e.g. R-10901"
                  value={form.receiptNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      receiptNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextDueDateSet">Next Due Date</Label>
                <Input
                  id="nextDueDateSet"
                  type="date"
                  value={form.nextDueDateSet}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      nextDueDateSet: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {editingPayment ? 'Updating...' : 'Recording...'}
                </span>
              ) : editingPayment ? (
                'Update Payment'
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payment of{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget ? formatPKR(deleteTarget.amount) : ''}
              </span>{' '}
              for{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.customer?.fullName || ''}
              </span>
              ? This will revert the contract totals and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
