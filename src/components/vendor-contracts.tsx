'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  FileText,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Vendor {
  id: string
  name: string
  company: string
  phone: string
}

interface Item {
  id: string
  brand: string
  model: string
  variant: string | null
  imei1: string | null
}

interface VendorInstallment {
  id: string
  amount: number
  date: string
  method: string
}

interface VendorContract {
  id: string
  vendorId: string
  itemId: string
  purchaseDate: string
  purchasePrice: number
  advancePaid: number
  installmentsCount: number
  installmentAmount: number
  remainingAmount: number
  totalPaid: number
  nextDueDate: string | null
  status: string
  vendor: Vendor
  item: Item
  installments: VendorInstallment[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return '₨ ' + amount.toLocaleString('en-PK')
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VendorContractsPage() {
  const { toast } = useToast()

  // Data
  const [contracts, setContracts] = useState<VendorContract[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Pay dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<VendorContract | null>(null)
  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'Cash',
    nextDueDate: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vendor-contracts')
      if (!res.ok) throw new Error('Failed to fetch vendor contracts')
      const data = await res.json()
      setContracts(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load vendor contracts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // ─── Filters ────────────────────────────────────────────────────────────

  const filteredContracts = contracts.filter((c) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      c.vendor.name.toLowerCase().includes(q) ||
      c.vendor.company.toLowerCase().includes(q) ||
      c.item.brand.toLowerCase().includes(q) ||
      c.item.model.toLowerCase().includes(q)
    )
  })

  // ─── Summary stats ──────────────────────────────────────────────────────

  const runningContracts = contracts.filter((c) => c.status === 'Running')
  const completedContracts = contracts.filter((c) => c.status === 'Completed')
  const totalOwed = runningContracts.reduce((sum, c) => sum + c.remainingAmount, 0)

  // ─── Expand rows ───────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Pay installment ────────────────────────────────────────────────────

  const openPayDialog = (contract: VendorContract) => {
    setSelectedContract(contract)
    setPayForm({
      amount: String(contract.installmentAmount),
      method: 'Cash',
      nextDueDate: '',
    })
    setPayDialogOpen(true)
  }

  const handlePay = async () => {
    if (!selectedContract || !payForm.amount) {
      toast({
        title: 'Validation Error',
        description: 'Amount is required',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(payForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      // Create the vendor installment payment
      const res = await fetch('/api/vendor-installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorContractId: selectedContract.id,
          vendorId: selectedContract.vendorId,
          amount,
          date: new Date().toISOString().split('T')[0],
          method: payForm.method,
        }),
      })
      if (!res.ok) throw new Error('Failed to record payment')

      // Update nextDueDate if provided
      if (payForm.nextDueDate) {
        await fetch(`/api/vendor-contracts/${selectedContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextDueDate: payForm.nextDueDate,
          }),
        })
      }

      toast({
        title: 'Success',
        description: `Payment of ${formatCurrency(amount)} recorded for ${selectedContract.vendor.name}`,
      })
      setPayDialogOpen(false)
      setSelectedContract(null)
      fetchContracts()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to record vendor installment payment',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Status badge ───────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'Running') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Running
        </Badge>
      )
    }
    if (status === 'Completed') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  // ─── Method badge ───────────────────────────────────────────────────────

  const MethodBadge = ({ method }: { method: string }) => {
    const styles: Record<string, string> = {
      Cash: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Bank Transfer': 'bg-amber-50 text-amber-700 border-amber-200',
      Cheque: 'bg-rose-50 text-rose-700 border-rose-200',
    }
    return (
      <Badge variant="outline" className={styles[method] || ''}>
        {method}
      </Badge>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="size-6" />
            Vendor Payables
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track vendor installment contracts and payments
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rose-500" />
              Total Owed
            </CardDescription>
            <CardTitle className="text-2xl text-rose-600">
              {formatCurrency(totalOwed)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Active Contracts
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {runningContracts.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Completed Contracts
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {completedContracts.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vendor Contracts
          </CardTitle>
          <CardDescription>Manage vendor installment contracts and record payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name, company, or item brand/model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {filteredContracts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {search
                ? 'No contracts found matching your search.'
                : 'No vendor contracts yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Vendor / Item</TableHead>
                    <TableHead className="hidden md:table-cell">Purchase Details</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Next Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const isExpanded = expandedRows.has(contract.id)
                    return (
                      <Fragment key={contract.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpand(contract.id)}
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(contract.id)
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{contract.vendor.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {contract.vendor.company && `${contract.vendor.company} · `}
                                {contract.item.brand} {contract.item.model}
                                {contract.item.variant ? ` (${contract.item.variant})` : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              <div>
                                <span className="text-muted-foreground">Price:</span>{' '}
                                {formatCurrency(contract.purchasePrice)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Advance: {formatCurrency(contract.advancePaid)} ·{' '}
                                {contract.installmentsCount} × {formatCurrency(contract.installmentAmount)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm">
                              <div className="text-emerald-600">
                                Paid: {formatCurrency(contract.totalPaid)}
                              </div>
                              <div className="text-rose-600 font-semibold">
                                Remaining: {formatCurrency(contract.remainingAmount)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={contract.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {contract.nextDueDate ? (
                              <span className="text-sm">{formatDate(contract.nextDueDate)}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contract.status === 'Running' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPayDialog(contract)}
                                  className="h-8 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                >
                                  <CreditCard className="size-3.5" />
                                  <span className="hidden sm:inline">Pay</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Installment History */}
                        {isExpanded && (
                          <TableRow key={`${contract.id}-detail`} className="bg-muted/30">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-6 py-4 space-y-3">
                                {/* Contract Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Vendor</p>
                                    <p className="text-sm font-medium">{contract.vendor.name}</p>
                                    {contract.vendor.company && (
                                      <p className="text-xs text-muted-foreground">
                                        {contract.vendor.company}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Item</p>
                                    <p className="text-sm font-medium">
                                      {contract.item.brand} {contract.item.model}
                                      {contract.item.variant ? ` (${contract.item.variant})` : ''}
                                    </p>
                                    {contract.item.imei1 && (
                                      <p className="text-xs text-muted-foreground">
                                        IMEI: {contract.item.imei1}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Purchase Date</p>
                                    <p className="text-sm font-medium">
                                      {formatDate(contract.purchaseDate)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Installment Plan</p>
                                    <p className="text-sm font-medium">
                                      {contract.installmentsCount} ×{' '}
                                      {formatCurrency(contract.installmentAmount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Advance: {formatCurrency(contract.advancePaid)}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment History */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="size-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">Installment Payments</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {contract.installments.length} payment
                                      {contract.installments.length !== 1 ? 's' : ''}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      Total Paid: {formatCurrency(contract.totalPaid)} /{' '}
                                      {formatCurrency(contract.purchasePrice)}
                                    </span>
                                  </div>
                                  {contract.installments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                                      No installment payments recorded yet
                                    </p>
                                  ) : (
                                    <div className="max-h-64 overflow-y-auto rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {contract.installments.map((inst) => (
                                            <TableRow key={inst.id}>
                                              <TableCell>{formatDate(inst.date)}</TableCell>
                                              <TableCell className="font-medium">
                                                {formatCurrency(inst.amount)}
                                              </TableCell>
                                              <TableCell>
                                                <MethodBadge method={inst.method} />
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Installment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay Vendor Installment
            </DialogTitle>
            <DialogDescription>
              Record an installment payment for{' '}
              <span className="font-medium">{selectedContract?.vendor.name}</span>
              {selectedContract && (
                <>
                  {' '}— {selectedContract.item.brand} {selectedContract.item.model}
                  <span className="block mt-1 text-xs">
                    Remaining: {formatCurrency(selectedContract.remainingAmount)} · Installment:{' '}
                    {formatCurrency(selectedContract.installmentAmount)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pay-amount">Amount *</Label>
              <Input
                id="pay-amount"
                type="number"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
              {selectedContract && (
                <p className="text-xs text-muted-foreground mt-1">
                  Default installment amount: {formatCurrency(selectedContract.installmentAmount)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pay-method">Payment Method</Label>
              <Select
                value={payForm.method}
                onValueChange={(value) => setPayForm({ ...payForm, method: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-next-due">Next Due Date (optional)</Label>
              <Input
                id="pay-next-due"
                type="date"
                value={payForm.nextDueDate}
                onChange={(e) => setPayForm({ ...payForm, nextDueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
