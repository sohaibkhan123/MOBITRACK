'use client'

import { useState, useEffect, useCallback } from 'react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  CreditCard,
  FileText,
  User,
  Printer,
  X,
  Loader2,
  Phone,
  MapPin,
  Briefcase,
  Wallet,
  Eye,
  Smartphone,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  contractNumber: string
  itemId: string
  saleDate: string
  purchasePrice: number
  totalPrice: number
  totalProfit: number
  downPayment: number
  remainingAmount: number
  installmentsCount: number
  installmentAmount: number
  frequency: string
  nextDueDate: string | null
  totalPaid: number
  status: string
  item: {
    id: string
    brand: string
    model: string
    variant: string | null
    imei1: string | null
    imei2: string | null
  }
}

interface Payment {
  id: string
  contractId: string
  amount: number
  date: string
  method: string
  receiptNumber: string
  receivedBy: string
}

interface Customer {
  id: string
  fullName: string
  fatherName: string | null
  cnic: string
  phone: string
  altPhone: string | null
  address: string | null
  city: string | null
  occupation: string | null
  income: number | null
  guarantorName: string | null
  guarantorPhone: string | null
  status: string
  contracts: Contract[]
  payments: Payment[]
}

interface CustomerDetailProps {
  customerId: string
  onBack: () => void
  onViewContract?: (contractId: string) => void
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

function getContractForPayment(contracts: Contract[], contractId: string): Contract | undefined {
  return contracts.find((c) => c.id === contractId)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CustomerDetail({ customerId, onBack, onViewContract }: CustomerDetailProps) {
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [ledgerOpen, setLedgerOpen] = useState(false)

  // ─── Fetch Customer Data ────────────────────────────────────────────────

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/customers/${customerId}`)
      if (!res.ok) throw new Error('Failed to fetch customer')
      const data = await res.json()
      setCustomer(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load customer details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [customerId, toast])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  // ─── Computed Values ────────────────────────────────────────────────────

  const totalPurchaseVolume = customer
    ? customer.contracts.reduce((sum, c) => sum + c.totalPrice, 0)
    : 0
  const totalAmountPaid = customer
    ? customer.contracts.reduce((sum, c) => sum + c.totalPaid, 0)
    : 0
  const totalBalanceDue = customer
    ? customer.contracts.reduce((sum, c) => sum + c.remainingAmount, 0)
    : 0

  // Sort payments by date descending
  const sortedPayments = customer
    ? [...customer.payments].sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date)
        if (dateComp !== 0) return dateComp
        return b.id.localeCompare(a.id)
      })
    : []

  // ─── Status Badge ───────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Running':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            Running
          </Badge>
        )
      case 'Completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            Completed
          </Badge>
        )
      case 'Defaulted':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            Defaulted
          </Badge>
        )
      case 'Overdue':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-muted-foreground">Loading customer details...</span>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <User className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">Customer not found</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-7 w-7 text-emerald-600" />
              {customer.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              {customer.fatherName && (
                <span>S/O: {customer.fatherName}</span>
              )}
              <span className="font-mono">CNIC: {customer.cnic}</span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setLedgerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Account Ledger
        </Button>
      </div>

      {/* ─── 3 Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <Wallet className="h-4 w-4 text-amber-600" />
              Total Purchase Volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchaseVolume)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Total Amount Paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAmountPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <FileText className="h-4 w-4 text-rose-600" />
              Total Balance Due
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalBalanceDue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Customer Info Card ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-medium">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Father Name</p>
              <p className="text-sm">{customer.fatherName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">CNIC</p>
              <p className="text-sm font-mono">{customer.cnic || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Occupation</p>
              <p className="text-sm flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {customer.occupation || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
              <p className="text-sm flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {customer.phone || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Alt Phone</p>
              <p className="text-sm">{customer.altPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
              <p className="text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {customer.address || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">City</p>
              <p className="text-sm">{customer.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Income</p>
              <p className="text-sm font-medium">{customer.income ? formatCurrency(customer.income) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Guarantor</p>
              <p className="text-sm">{customer.guarantorName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Guarantor Phone</p>
              <p className="text-sm">{customer.guarantorPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <StatusBadge status={customer.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Contracts Table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            Installment Contracts
            <Badge variant="secondary" className="text-xs ml-1">
              {customer.contracts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customer.contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No contracts recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Mobile Info</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                            {contract.item.brand} {contract.item.model}
                            {contract.item.variant ? ` (${contract.item.variant})` : ''}
                          </div>
                          {contract.item.imei1 && (
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                              IMEI: {contract.item.imei1}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {onViewContract ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewContract(contract.id)}
                            className="h-8 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View Ledger
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Payment History Table ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Payment History
            <Badge variant="secondary" className="text-xs ml-1">
              {customer.payments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Contract #</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => {
                    const contract = getContractForPayment(customer.contracts, payment.contractId)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.receiptNumber || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contract ? contract.contractNumber : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Printable Account Ledger Modal ──────────────────────────────── */}
      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto print-modal-content">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-lg">Account Ledger Preview</DialogTitle>
            <div className="flex items-center gap-2 print-hide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLedgerOpen(false)}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogHeader>

          {/* Printable Ledger Content */}
          <div className="print-ledger">
            {/* Letterhead */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-wider text-foreground">HAFIZ MOBILES</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Latest Smartphones on Cash &amp; Easy Monthly Installments
              </p>
              <Separator className="mt-3" />
            </div>

            {/* Statement Date */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Customer Account Ledger</h2>
              <div className="text-sm text-muted-foreground">
                Statement Date: <span className="font-medium text-foreground">{formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Customer Profile */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 border rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer Name</p>
                <p className="text-sm font-semibold">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Father Name</p>
                <p className="text-sm font-medium">{customer.fatherName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">CNIC Number</p>
                <p className="text-sm font-mono">{customer.cnic || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Occupation</p>
                <p className="text-sm">{customer.occupation || '—'}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 border rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                <p className="text-sm font-medium">{customer.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Alt Phone</p>
                <p className="text-sm">{customer.altPhone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                <p className="text-sm">{customer.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">City</p>
                <p className="text-sm">{customer.city || '—'}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-3 text-center bg-amber-50 dark:bg-amber-950/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gross Purchased Value</p>
                <p className="text-lg font-bold mt-0.5">{formatCurrency(totalPurchaseVolume)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Net Paid</p>
                <p className="text-lg font-bold mt-0.5 text-emerald-600">{formatCurrency(totalAmountPaid)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center bg-rose-50 dark:bg-rose-950/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Remaining Balance</p>
                <p className={`text-lg font-bold mt-0.5 ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(totalBalanceDue)}
                </p>
              </div>
            </div>

            {/* Installment Contracts Table */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Installment Contracts</h3>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs h-9">Agreement ID</TableHead>
                      <TableHead className="text-xs h-9">Mobile</TableHead>
                      <TableHead className="text-xs h-9 text-right">Price</TableHead>
                      <TableHead className="text-xs h-9 text-right">Down Payment</TableHead>
                      <TableHead className="text-xs h-9 text-right">Paid</TableHead>
                      <TableHead className="text-xs h-9 text-right">Remaining</TableHead>
                      <TableHead className="text-xs h-9">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.contracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-sm">
                          No contracts on record
                        </TableCell>
                      </TableRow>
                    ) : (
                      customer.contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-mono text-xs">{contract.contractNumber}</TableCell>
                          <TableCell className="text-xs">
                            {contract.item.brand} {contract.item.model}
                            {contract.item.variant ? ` (${contract.item.variant})` : ''}
                          </TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(contract.totalPrice)}</TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(contract.downPayment)}</TableCell>
                          <TableCell className="text-xs text-right font-medium text-emerald-600">
                            {formatCurrency(contract.totalPaid)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-rose-600">
                            {formatCurrency(contract.remainingAmount)}
                          </TableCell>
                          <TableCell className="text-xs">
                            <StatusBadge status={contract.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Cash Receipts Log */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-2">Cash Receipts Log</h3>
              <div className="overflow-x-auto border rounded-lg max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs h-9">Date</TableHead>
                      <TableHead className="text-xs h-9">Receipt #</TableHead>
                      <TableHead className="text-xs h-9">Agreement ID</TableHead>
                      <TableHead className="text-xs h-9">Method</TableHead>
                      <TableHead className="text-xs h-9">Collector</TableHead>
                      <TableHead className="text-xs h-9 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                          No payments on record
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPayments.map((payment) => {
                        const contract = getContractForPayment(customer.contracts, payment.contractId)
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs">{formatDate(payment.date)}</TableCell>
                            <TableCell className="text-xs font-mono">{payment.receiptNumber || '—'}</TableCell>
                            <TableCell className="text-xs font-mono">
                              {contract?.contractNumber || '—'}
                            </TableCell>
                            <TableCell className="text-xs">{payment.method}</TableCell>
                            <TableCell className="text-xs">{payment.receivedBy || '—'}</TableCell>
                            <TableCell className="text-xs text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-16 mt-12 mb-8">
              <div className="text-center">
                <div className="border-t border-foreground pt-2 mt-8">
                  <p className="text-sm font-medium">Authorized Signature</p>
                  <p className="text-xs text-muted-foreground">Hafiz Mobiles</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-foreground pt-2 mt-8">
                  <p className="text-sm font-medium">Customer Signature</p>
                  <p className="text-xs text-muted-foreground">{customer.fullName}</p>
                </div>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <Separator className="mb-3" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                DISCLAIMER: This document is a computer-generated account statement and does not require a physical signature to be valid.
                All transactions are subject to verification against original receipts. In case of any discrepancy, please contact
                Hafiz Mobiles within 7 days of the statement date. Late payments are subject to applicable penalties as per the
                installment agreement terms. This ledger is confidential and intended solely for the named customer.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Print CSS (injected once) ───────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the ledger */
          body * {
            visibility: hidden;
          }
          .print-ledger,
          .print-ledger * {
            visibility: visible;
          }
          .print-ledger {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .print-hide {
            display: none !important;
          }
          /* Remove dialog chrome */
          [role="dialog"] > button,
          [role="dialog"] > div:first-child {
            display: none !important;
          }
          [role="dialog"] {
            position: static !important;
            background: white !important;
            max-width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            overflow: visible !important;
          }
          [role="dialog"]::backdrop {
            display: none !important;
          }
          /* Table styling for print */
          .print-ledger table {
            border-collapse: collapse;
          }
          .print-ledger th,
          .print-ledger td {
            border: 1px solid #d1d5db;
            padding: 4px 8px;
          }
          .print-ledger th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Summary boxes for print */
          .print-ledger .bg-amber-50,
          .print-ledger .bg-emerald-50,
          .print-ledger .bg-rose-50 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Badge styling for print */
          .print-ledger span[class*="bg-"] {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  )
}
