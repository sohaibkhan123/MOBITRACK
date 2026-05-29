'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Smartphone,
  User,
  FileText,
  Printer,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ContractDetailProps {
  contractId: string
  onBack: () => void
}

interface Customer {
  id: string
  fullName: string
  fatherName: string | null
  cnic: string
  phone: string
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
  vendor: {
    id: string
    name: string
    company: string
    phone: string
  }
  item: {
    id: string
    brand: string
    model: string
  }
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

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContractDetail({ contractId, onBack }: ContractDetailProps) {
  const { toast } = useToast()

  // Data state
  const [contract, setContract] = useState<Contract | null>(null)
  const [vendorContract, setVendorContract] = useState<VendorContract | null>(null)
  const [loading, setLoading] = useState(true)

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false)

  // ─── Fetch Data ─────────────────────────────────────────────────────────

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/contracts/${contractId}`)
      if (!res.ok) throw new Error('Failed to fetch contract')
      const data = await res.json()
      setContract(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch contract details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [contractId, toast])

  const fetchVendorContract = useCallback(async (itemId: string) => {
    try {
      const res = await fetch('/api/vendor-contracts')
      if (!res.ok) throw new Error('Failed to fetch vendor contracts')
      const data: VendorContract[] = await res.json()
      const matched = data.find((vc) => vc.itemId === itemId) || null
      setVendorContract(matched)
    } catch {
      // Non-critical — just don't show vendor section
      setVendorContract(null)
    }
  }, [])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  useEffect(() => {
    if (contract?.itemId) {
      fetchVendorContract(contract.itemId)
    }
  }, [contract?.itemId, fetchVendorContract])

  // ─── Status Badge ───────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Running':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            <Clock className="size-3 mr-1" />
            {status}
          </Badge>
        )
      case 'Completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle2 className="size-3 mr-1" />
            {status}
          </Badge>
        )
      case 'Defaulted':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <AlertTriangle className="size-3 mr-1" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // ─── Payment Method Badge ───────────────────────────────────────────────

  const MethodBadge = ({ method }: { method: string }) => {
    const styles: Record<string, string> = {
      Cash: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Bank Transfer': 'bg-amber-100 text-amber-800 border-amber-200',
      'EasyPaisa': 'bg-teal-100 text-teal-800 border-teal-200',
      'JazzCash': 'bg-rose-100 text-rose-800 border-rose-200',
    }
    return (
      <Badge className={styles[method] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {method}
      </Badge>
    )
  }

  // ─── Build Installment Tracking Plan ────────────────────────────────────

  const buildInstallmentPlan = () => {
    if (!contract) return []
    const plan = []
    const sortedPayments = [...contract.payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (let i = 1; i <= contract.installmentsCount; i++) {
      const expectedDate = addMonths(contract.saleDate, i)
      const payment = sortedPayments[i - 1] || null

      plan.push({
        installmentNumber: i,
        expectedDate,
        expectedAmount: contract.installmentAmount,
        amountPaid: payment?.amount || 0,
        dateCollected: payment?.date || null,
        receiptNumber: payment?.receiptNumber || null,
        status: payment ? 'PAID' as const : 'UNPAID BALANCE' as const,
      })
    }
    return plan
  }

  // ─── Computed Values ────────────────────────────────────────────────────

  const paidPercentage = contract
    ? Math.round((contract.totalPaid / contract.totalPrice) * 100)
    : 0

  const realizedProfit = contract && vendorContract
    ? contract.totalPaid - (vendorContract.totalPaid + vendorContract.advancePaid)
    : 0

  const vendorPaymentLag = contract && vendorContract
    ? contract.totalPaid - (vendorContract.totalPaid + vendorContract.advancePaid)
    : 0

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">Contract not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="size-6 text-emerald-600" />
              {contract.contractNumber}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Sale Date: {formatDate(contract.saleDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={contract.status} />
          <Button onClick={() => setPrintModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="size-4 mr-2" />
            Print Tracking Form
          </Button>
        </div>
      </div>

      {/* Main Grid: Info Cards + Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Cards + Payment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* 4 Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Price Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="size-4 text-amber-600" />
                  Total Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(contract.totalPrice)}
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Purchase Price</span>
                    <span className="font-medium text-foreground">{formatCurrency(contract.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Profit</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(contract.totalProfit)}</span>
                  </div>
                  {vendorContract && (
                    <div className="flex justify-between">
                      <span>Vendor Advance Paid</span>
                      <span className="font-medium text-foreground">{formatCurrency(vendorContract.advancePaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span>Down Payment</span>
                    <span className="font-medium text-foreground">{formatCurrency(contract.downPayment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paid Amount Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="size-4 text-emerald-600" />
                  Paid Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(contract.totalPaid)}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{paidPercentage}%</span>
                  </div>
                  <Progress value={paidPercentage} className="h-2.5" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  of {formatCurrency(contract.totalPrice)} total
                </div>
              </CardContent>
            </Card>

            {/* Remaining Balance Card */}
            <Card className="border-red-200 dark:border-red-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-500" />
                  Remaining Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(contract.remainingAmount - contract.totalPaid + contract.downPayment > 0
                    ? contract.totalPrice - contract.totalPaid
                    : 0)}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Next Due Date</span>
                    <span className="font-medium text-foreground">
                      {formatDate(contract.nextDueDate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installment Setup Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-amber-600" />
                  Installment Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(contract.installmentAmount)}
                  <span className="text-sm font-normal text-muted-foreground"> / {contract.frequency}</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Installments</span>
                    <span className="font-medium text-foreground">{contract.installmentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Principal Portion</span>
                    <span className="font-medium text-foreground">{formatCurrency(contract.principalPerInstallment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Portion</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(contract.profitPerInstallment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Payables Section */}
          {vendorContract && (
            <Card className="border-amber-200 dark:border-amber-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Vendor Payables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor</p>
                    <p className="text-sm font-semibold">{vendorContract.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendorContract.vendor.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor Paid</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(vendorContract.totalPaid + vendorContract.advancePaid)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(vendorContract.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Realized Profit</p>
                    <p className={`text-sm font-semibold ${realizedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(realizedProfit)}
                    </p>
                    {vendorPaymentLag > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="size-3" />
                        Vendor payment lag: {formatCurrency(vendorPaymentLag)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-600" />
                Payment History
                <Badge variant="secondary" className="text-xs ml-1">
                  {contract.payments.length} payment{contract.payments.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No payments recorded yet
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Next Due Target</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...contract.payments]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {formatDate(payment.date)}
                            </TableCell>
                            <TableCell>
                              {payment.receiptNumber || '—'}
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <MethodBadge method={payment.method} />
                            </TableCell>
                            <TableCell>
                              {formatDate(payment.nextDueDateSet)}
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

        {/* Right Column: Customer & Item Details */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-5 text-emerald-600" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-semibold">{contract.customer.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father Name</p>
                  <p className="text-sm">{contract.customer.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{contract.customer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNIC</p>
                  <p className="text-sm font-mono">{contract.customer.cnic || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{contract.customer.address || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="size-5 text-amber-600" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Brand / Model</p>
                  <p className="text-sm font-semibold">
                    {contract.item.brand} {contract.item.model}
                    {contract.item.variant ? ` (${contract.item.variant})` : ''}
                  </p>
                </div>
                {contract.item.color && (
                  <div>
                    <p className="text-xs text-muted-foreground">Color</p>
                    <p className="text-sm">{contract.item.color}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">IMEI</p>
                  <p className="text-sm font-mono">{contract.item.imei1 || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Summary */}
          <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                Quick Summary
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400">Contract Value</span>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">{formatCurrency(contract.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400">Down Payment</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">{formatCurrency(contract.downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400">Total Collected</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">{formatCurrency(contract.totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-2">
                  <span className="text-emerald-700 dark:text-emerald-400">Balance Due</span>
                  <span className="font-bold text-red-600">{formatCurrency(contract.totalPrice - contract.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400">Profit Earned</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">{formatCurrency(contract.totalProfit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Print Tracking Form Modal ──────────────────────────────────────── */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Print Installment Tracking Form</DialogTitle>
          </DialogHeader>

          {/* Printable Area */}
          <div id="printable-area" className="p-8 print-area">
            {/* Letterhead */}
            <div className="text-center border-b-2 border-emerald-700 pb-4 mb-6">
              <h1 className="text-3xl font-bold text-emerald-800 tracking-wider">HAFIZ MOBILES</h1>
              <p className="text-sm text-muted-foreground mt-1">Installment Tracking Form</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contract: {contract.contractNumber} | Date: {formatDate(contract.saleDate)}
              </p>
            </div>

            {/* Customer Profile */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1 mb-3">
                Customer Profile
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Full Name: </span>
                  <span className="font-semibold">{contract.customer.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Father Name: </span>
                  <span className="font-semibold">{contract.customer.fatherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CNIC: </span>
                  <span className="font-mono font-semibold">{contract.customer.cnic || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-semibold">{contract.customer.phone || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-semibold">{contract.customer.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Asset Particulars */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1 mb-3">
                Asset Particulars
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Device: </span>
                  <span className="font-semibold">
                    {contract.item.brand} {contract.item.model}
                    {contract.item.variant ? ` (${contract.item.variant})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IMEI: </span>
                  <span className="font-mono font-semibold">{contract.item.imei1 || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sale Date: </span>
                  <span className="font-semibold">{formatDate(contract.saleDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Installments Duration: </span>
                  <span className="font-semibold">{contract.installmentsCount} × {contract.frequency}</span>
                </div>
              </div>
            </div>

            {/* Financial Accounting */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1 mb-3">
                Financial Accounting
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-muted-foreground">Gross Contract Value</span>
                  <span className="font-bold">{formatCurrency(contract.totalPrice)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-muted-foreground">Down Payment</span>
                  <span className="font-bold">{formatCurrency(contract.downPayment)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(contract.totalPaid)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-muted-foreground">Remaining Balance</span>
                  <span className="font-bold text-red-600">{formatCurrency(contract.totalPrice - contract.totalPaid)}</span>
                </div>
              </div>
            </div>

            {/* Installment Plan Tracking Form */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1 mb-3">
                Installment Plan Tracking Form
              </h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50 dark:bg-emerald-950/30">
                    <TableHead className="text-center w-12">No.</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead className="text-right">Expected Amount</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Date Collected</TableHead>
                    <TableHead className="text-center">Tracking Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildInstallmentPlan().map((row) => (
                    <TableRow key={row.installmentNumber}>
                      <TableCell className="text-center font-medium">{row.installmentNumber}</TableCell>
                      <TableCell>{formatDate(row.expectedDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.expectedAmount)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.status === 'PAID' ? formatCurrency(row.amountPaid) : '—'}
                      </TableCell>
                      <TableCell>
                        {row.status === 'PAID' && row.dateCollected
                          ? `${formatDate(row.dateCollected)}${row.receiptNumber ? ` (${row.receiptNumber})` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.status === 'PAID' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                            ✓ PAID
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            UNPAID BALANCE
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Signatures */}
            <div className="mt-12 grid grid-cols-2 gap-16">
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2 mt-16">
                  <p className="text-sm font-semibold">Customer Signature</p>
                  <p className="text-xs text-muted-foreground">{contract.customer.fullName}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2 mt-16">
                  <p className="text-sm font-semibold">For Hafiz Mobiles</p>
                  <p className="text-xs text-muted-foreground">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-8 border-t pt-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Terms & Conditions
              </h3>
              <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside">
                <li>The customer agrees to pay all installments on their respective due dates as outlined above.</li>
                <li>Late payments may incur additional charges as per the shop&apos;s policy.</li>
                <li>In case of default, Hafiz Mobiles reserves the right to repossess the asset.</li>
                <li>The asset remains the property of Hafiz Mobiles until full payment is received.</li>
                <li>Any dispute shall be resolved in the jurisdiction of the local courts.</li>
                <li>This form serves as both a receipt and a tracking document for all installment payments.</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons (not printed) */}
          <div className="flex items-center justify-end gap-3 p-4 border-t no-print">
            <Button variant="outline" onClick={() => setPrintModalOpen(false)}>
              <X className="size-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="size-4 mr-2" />
              Print Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
