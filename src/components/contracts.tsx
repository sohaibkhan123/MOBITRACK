'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  Eye,
  CreditCard,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  fullName: string
  phone: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  variant: string | null
  purchasePrice: number
  salePrice: number
  status: string
}

interface Payment {
  id: string
  amount: number
  date: string
  method: string
  receiptNumber: string
  nextDueDateSet: string | null
  createdAt: string
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
  item: {
    id: string
    brand: string
    model: string
    variant: string | null
  }
  payments: Payment[]
}

interface ContractFormData {
  contractNumber: string
  customerId: string
  itemId: string
  saleDate: string
  purchasePrice: number
  totalPrice: number
  downPayment: number
  installmentsCount: number
  installmentAmount: number
  frequency: string
  nextDueDate: string
  status: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculateNextDueDate(saleDate: string, frequency: string): string {
  if (!saleDate) return ''
  const d = new Date(saleDate + 'T00:00:00')
  switch (frequency) {
    case 'Weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'Bi-weekly':
      d.setDate(d.getDate() + 14)
      break
    case 'Monthly':
    default:
      d.setMonth(d.getMonth() + 1)
      break
  }
  return d.toISOString().split('T')[0]
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function generateContractNumber(existingContracts: Contract[]): string {
  const year = new Date().getFullYear()
  const existingNumbers = existingContracts
    .map((c) => {
      const match = c.contractNumber.match(/MT-\d{4}-(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => n > 0)
  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001
  return `MT-${year}-${nextNum}`
}

function getInitialFormData(contracts: Contract[]): ContractFormData {
  return {
    contractNumber: generateContractNumber(contracts),
    customerId: '',
    itemId: '',
    saleDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    totalPrice: 0,
    downPayment: 0,
    installmentsCount: 1,
    installmentAmount: 0,
    frequency: 'Monthly',
    nextDueDate: '',
    status: 'Running',
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContractsPage() {
  const { toast } = useToast()
  const { setSelectedContractId, setCurrentPage, openAddContractOnNavigate, setOpenAddContractOnNavigate } = useAppStore()

  // Track if navigated from installments page for auto-redirect after contract creation
  const [navigatedFromInstallments, setNavigatedFromInstallments] = useState(false)

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId)
    setCurrentPage('contract-detail')
  }

  // Data state
  const [contracts, setContracts] = useState<Contract[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState<ContractFormData>(getInitialFormData([]))
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Track if nextDueDate was manually set by user
  const [nextDueDateManual, setNextDueDateManual] = useState(false)

  // Quick Pay dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payContract, setPayContract] = useState<Contract | null>(null)
  const [payForm, setPayForm] = useState({ amount: '', date: '', method: 'Cash', receiptNumber: '', nextDueDateSet: '' })
  const [paySubmitting, setPaySubmitting] = useState(false)

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

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' })
    }
  }, [toast])

  const fetchAvailableItems = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const data: InventoryItem[] = await res.json()
      // Filter for Available items only (and include the item being edited)
      const filtered = data.filter(
        (item) =>
          item.status === 'Available' ||
          (editingContract && item.id === editingContract.itemId)
      )
      setAvailableItems(filtered)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch inventory', variant: 'destructive' })
    }
  }, [toast, editingContract])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([fetchContracts(), fetchCustomers()])
      setLoading(false)
    }
    loadAll()
  }, [fetchContracts, fetchCustomers])

  useEffect(() => {
    if (dialogOpen) {
      fetchAvailableItems()
    }
  }, [dialogOpen, fetchAvailableItems])

  // Handle navigate-from-installments: open Add Contract dialog automatically
  // Wait for loading to complete so contracts are available for number generation
  useEffect(() => {
    if (openAddContractOnNavigate && !loading) {
      setNavigatedFromInstallments(true)
      setEditingContract(null)
      setFormData(getInitialFormData(contracts))
      setNextDueDateManual(false)
      setDialogOpen(true)
      // Use a small timeout to ensure state is set before clearing the flag
      setTimeout(() => {
        setOpenAddContractOnNavigate(false)
      }, 100)
    }
  }, [openAddContractOnNavigate, loading, contracts, setOpenAddContractOnNavigate])

  // ─── Auto-calculation ───────────────────────────────────────────────────

  const computeDerived = (form: ContractFormData) => {
    const remainingAmount = Math.max(0, form.totalPrice - form.downPayment)
    const installmentAmount =
      form.installmentsCount > 0 ? Math.ceil(remainingAmount / form.installmentsCount) : 0
    const totalProfit = Math.max(0, form.totalPrice - form.purchasePrice)
    const profitPerInstallment =
      form.installmentsCount > 0 ? Math.round(totalProfit / form.installmentsCount) : 0
    const principalPerInstallment = Math.max(0, installmentAmount - profitPerInstallment)
    return { remainingAmount, installmentAmount, totalProfit, profitPerInstallment, principalPerInstallment }
  }

  // ─── Form Handlers ──────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingContract(null)
    setFormData(getInitialFormData(contracts))
    setNextDueDateManual(false)
    setDialogOpen(true)
  }

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      contractNumber: contract.contractNumber,
      customerId: contract.customerId,
      itemId: contract.itemId,
      saleDate: contract.saleDate,
      purchasePrice: contract.purchasePrice,
      totalPrice: contract.totalPrice,
      downPayment: contract.downPayment,
      installmentsCount: contract.installmentsCount,
      installmentAmount: contract.installmentAmount,
      frequency: contract.frequency,
      nextDueDate: contract.nextDueDate || '',
      status: contract.status,
    })
    setDialogOpen(true)
  }

  const handleFieldChange = (field: keyof ContractFormData, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-fill purchasePrice when item is selected
      if (field === 'itemId') {
        const item = availableItems.find((i) => i.id === value)
        if (item) {
          updated.purchasePrice = item.purchasePrice
          if (item.salePrice && !editingContract) {
            updated.totalPrice = item.salePrice
          }
        }
      }

      // Auto-calculate nextDueDate for new contracts when relevant fields change
      if (!editingContract) {
        const shouldAutoCalc =
          (field === 'saleDate' || field === 'frequency' || field === 'downPayment' || field === 'installmentsCount')

        if (field === 'nextDueDate') {
          // User manually edited nextDueDate
          setNextDueDateManual(true)
        } else if (shouldAutoCalc && !nextDueDateManual) {
          const saleDate = field === 'saleDate' ? String(value) : updated.saleDate
          const frequency = field === 'frequency' ? String(value) : updated.frequency
          const downPayment = field === 'downPayment' ? Number(value) : updated.downPayment
          const installmentsCount = field === 'installmentsCount' ? Number(value) : updated.installmentsCount

          if (saleDate && (downPayment > 0 || installmentsCount > 1)) {
            updated.nextDueDate = calculateNextDueDate(saleDate, frequency)
          }
        }
      }

      return updated
    })
  }

  const handleSubmit = async () => {
    if (!formData.contractNumber || !formData.customerId || !formData.itemId || !formData.saleDate) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const derived = computeDerived(formData)
      const payload = {
        contractNumber: formData.contractNumber,
        customerId: formData.customerId,
        itemId: formData.itemId,
        saleDate: formData.saleDate,
        purchasePrice: formData.purchasePrice,
        totalPrice: formData.totalPrice,
        totalProfit: derived.totalProfit,
        downPayment: formData.downPayment,
        remainingAmount: derived.remainingAmount,
        installmentsCount: formData.installmentsCount,
        installmentAmount: derived.installmentAmount,
        profitPerInstallment: derived.profitPerInstallment,
        principalPerInstallment: derived.principalPerInstallment,
        frequency: formData.frequency,
        nextDueDate: formData.nextDueDate || null,
        totalPaid: editingContract ? editingContract.totalPaid : formData.downPayment,
        status: formData.status,
      }

      if (editingContract) {
        const res = await fetch(`/api/contracts/${editingContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to update contract')
        }
        toast({ title: 'Success', description: 'Contract updated successfully' })
      } else {
        const res = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          // If duplicate contract number, auto-regenerate and retry
          if (errData.error?.includes('contract number') || errData.error?.includes('Contract number')) {
            const newNumber = generateContractNumber(contracts)
            payload.contractNumber = newNumber
            const retryRes = await fetch('/api/contracts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!retryRes.ok) {
              const retryErrData = await retryRes.json().catch(() => ({}))
              throw new Error(retryErrData.error || 'Failed to create contract')
            }
            toast({ title: 'Success', description: `Contract ${newNumber} created successfully` })
          } else {
            throw new Error(errData.error || 'Failed to create contract')
          }
        } else {
          toast({ title: 'Success', description: 'Contract created successfully' })
        }
      }

      setDialogOpen(false)
      await fetchContracts()
      // If navigated from installments, redirect back after successful creation
      if (navigatedFromInstallments && !editingContract) {
        setNavigatedFromInstallments(false)
        setCurrentPage('installments')
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : (editingContract ? 'Failed to update contract' : 'Failed to create contract'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!contractToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/contracts/${contractToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete contract')
      toast({ title: 'Success', description: 'Contract deleted successfully' })
      fetchContracts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete contract', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setContractToDelete(null)
    }
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Filtered data ──────────────────────────────────────────────────────

  const filteredContracts = contracts.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      c.contractNumber.toLowerCase().includes(query) ||
      c.customer.fullName.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  // ─── Derived values for form display ────────────────────────────────────

  const derived = computeDerived(formData)

  // ─── Status badge ───────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Running':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            {status}
          </Badge>
        )
      case 'Completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            {status}
          </Badge>
        )
      case 'Defaulted':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
            <FileText className="size-6" />
            Contracts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage installment contracts and payment tracking
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-fit">
          <Plus className="size-4 mr-2" />
          New Installment Sale
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by contract # or customer name..."
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Contract #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Item</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead className="hidden lg:table-cell">Down Payment</TableHead>
                <TableHead className="hidden lg:table-cell">Remaining</TableHead>
                <TableHead className="hidden md:table-cell">Installments</TableHead>
                <TableHead className="hidden lg:table-cell">Progress</TableHead>
                <TableHead className="hidden xl:table-cell">Next Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                    {searchQuery || statusFilter !== 'All'
                      ? 'No contracts match your filters'
                      : 'No contracts yet. Create your first contract!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <Fragment key={contract.id}>
                    <TableRow className="group">
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
                      <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.customer.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {contract.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          {contract.item.brand} {contract.item.model}
                          {contract.item.variant ? ` (${contract.item.variant})` : ''}
                        </div>
                      </TableCell>
                      <TableCell>{formatPKR(contract.totalPrice)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatPKR(contract.downPayment)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatPKR(contract.remainingAmount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {contract.installmentsCount} × {formatPKR(contract.installmentAmount)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({contract.frequency})
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(() => {
                          const paid = Math.min(
                            contract.installmentsCount,
                            contract.installmentAmount > 0
                              ? Math.round(contract.totalPaid / contract.installmentAmount)
                              : 0
                          )
                          const pct = contract.installmentsCount > 0 ? (paid / contract.installmentsCount) * 100 : 0
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {paid}/{contract.installmentsCount}
                              </span>
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {contract.nextDueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" />
                            {contract.nextDueDate}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {contract.status === 'Running' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPayContract(contract)
                                // Calculate next due date after this payment
                                const nextDue = contract.nextDueDate
                                  ? calculateNextDueDate(contract.nextDueDate, contract.frequency)
                                  : calculateNextDueDate(contract.saleDate, contract.frequency)
                                setPayForm({
                                  amount: String(contract.installmentAmount),
                                  date: new Date().toISOString().split('T')[0],
                                  method: 'Cash',
                                  receiptNumber: '',
                                  nextDueDateSet: nextDue,
                                })
                                setPayDialogOpen(true)
                              }}
                              className="h-7 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              title="Quick Pay"
                            >
                              <CreditCard className="size-3" />
                              <span className="hidden sm:inline text-xs">Pay</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-emerald-600 hover:text-emerald-700"
                            onClick={() => handleViewContract(contract.id)}
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => openEditDialog(contract)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              setContractToDelete(contract)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Payment History Row */}
                    {expandedRows.has(contract.id) && (
                      <TableRow key={`${contract.id}-payments`} className="bg-muted/30">
                        <TableCell colSpan={12} className="p-0">
                          <div className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="size-4 text-muted-foreground" />
                              <h4 className="text-sm font-semibold">Payment History</h4>
                              <Badge variant="secondary" className="text-xs">
                                {contract.payments.length} payment{contract.payments.length !== 1 ? 's' : ''}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                Total Paid: {formatPKR(contract.totalPaid)} / {formatPKR(contract.totalPrice)}
                              </span>
                            </div>
                            {contract.payments.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No payments recorded yet
                              </p>
                            ) : (
                              <div className="max-h-64 overflow-y-auto rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Method</TableHead>
                                      <TableHead>Receipt #</TableHead>
                                      <TableHead>Next Due Set</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {contract.payments.map((payment) => (
                                      <TableRow key={payment.id}>
                                        <TableCell>{payment.date}</TableCell>
                                        <TableCell className="font-medium">
                                          {formatPKR(payment.amount)}
                                        </TableCell>
                                        <TableCell>{payment.method}</TableCell>
                                        <TableCell>{payment.receiptNumber || '—'}</TableCell>
                                        <TableCell>
                                          {payment.nextDueDateSet || '—'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Contracts</div>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Running</div>
            <div className="text-2xl font-bold text-amber-600">
              {contracts.filter((c) => c.status === 'Running').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-emerald-600">
              {contracts.filter((c) => c.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="text-2xl font-bold">
              {formatPKR(contracts.reduce((sum, c) => sum + c.remainingAmount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Add/Edit Dialog ──────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'Edit Contract' : 'Add New Contract'}
            </DialogTitle>
            <DialogDescription>
              {editingContract
                ? 'Update contract details below'
                : 'Fill in the details to create a new installment contract'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row 1: Contract Number & Sale Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractNumber">
                  Contract Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => handleFieldChange('contractNumber', e.target.value)}
                  placeholder="MT-2026-1001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">
                  Sale Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => handleFieldChange('saleDate', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Customer & Item */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(v) => handleFieldChange('customerId', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Item <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(v) => handleFieldChange('itemId', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.brand} {item.model}
                        {item.variant ? ` (${item.variant})` : ''} — {formatPKR(item.salePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Purchase Price & Total Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => handleFieldChange('purchasePrice', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Auto-filled from item</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPrice">Total Price (Sale)</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => handleFieldChange('totalPrice', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Row 4: Down Payment & Remaining */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="downPayment">Down Payment</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={(e) => handleFieldChange('downPayment', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Remaining Amount</Label>
                <Input
                  value={formatPKR(derived.remainingAmount)}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-calculated</p>
              </div>
            </div>

            {/* Row 5: Profit info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Profit</Label>
                <Input
                  value={formatPKR(derived.totalProfit)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Profit/Installment</Label>
                <Input
                  value={formatPKR(derived.profitPerInstallment)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Principal/Installment</Label>
                <Input
                  value={formatPKR(derived.principalPerInstallment)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Row 6: Installments, Frequency, Installment Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installmentsCount"># of Installments</Label>
                <Input
                  id="installmentsCount"
                  type="number"
                  min={1}
                  value={formData.installmentsCount}
                  onChange={(e) =>
                    handleFieldChange('installmentsCount', Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => handleFieldChange('frequency', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Installment Amount</Label>
                <Input
                  value={formatPKR(derived.installmentAmount)}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-calculated</p>
              </div>
            </div>

            {/* Row 7: Next Due Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => handleFieldChange('nextDueDate', e.target.value)}
                />
                {!editingContract && !nextDueDateManual && formData.saleDate && (formData.downPayment > 0 || formData.installmentsCount > 1) && (
                  <p className="text-xs text-emerald-600 mt-1">Auto-calculated based on sale date & frequency</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleFieldChange('status', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Defaulted">Defaulted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editingContract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Quick Pay Dialog ───────────────────────────────────────────────── */}

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Quick Pay Installment
            </DialogTitle>
            <DialogDescription>
              Record a payment for{' '}
              <span className="font-medium">{payContract?.customer.fullName}</span>
              {payContract && (
                <>
                  {' '}— {payContract.item.brand} {payContract.item.model}
                  <span className="block mt-1 text-xs">
                    Remaining: {formatPKR(payContract.remainingAmount)} · Installment:{' '}
                    {formatPKR(payContract.installmentAmount)}
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
              {payContract && (
                <p className="text-xs text-muted-foreground mt-1">
                  Default installment amount: {formatPKR(payContract.installmentAmount)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pay-date">Date *</Label>
              <Input
                id="pay-date"
                type="date"
                value={payForm.date}
                onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
              />
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
                  <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                  <SelectItem value="JazzCash">JazzCash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-receipt">Receipt Number</Label>
              <Input
                id="pay-receipt"
                value={payForm.receiptNumber}
                onChange={(e) => setPayForm({ ...payForm, receiptNumber: e.target.value })}
                placeholder="Optional receipt #"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              disabled={paySubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!payContract || !payForm.amount || !payForm.date) {
                  toast({ title: 'Validation Error', description: 'Amount and date are required', variant: 'destructive' })
                  return
                }
                const amount = parseFloat(payForm.amount)
                if (isNaN(amount) || amount <= 0) {
                  toast({ title: 'Validation Error', description: 'Please enter a valid amount', variant: 'destructive' })
                  return
                }
                setPaySubmitting(true)
                try {
                  const res = await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contractId: payContract.id,
                      customerId: payContract.customerId,
                      amount,
                      date: payForm.date,
                      method: payForm.method,
                      receivedBy: 'System',
                      receiptNumber: payForm.receiptNumber,
                      nextDueDateSet: payForm.nextDueDateSet || null,
                    }),
                  })
                  if (!res.ok) throw new Error('Failed to record payment')
                  toast({ title: 'Success', description: `Payment of ${formatPKR(amount)} recorded for ${payContract.customer.fullName}` })
                  setPayDialogOpen(false)
                  setPayContract(null)
                  fetchContracts()
                } catch {
                  toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' })
                } finally {
                  setPaySubmitting(false)
                }
              }}
              disabled={paySubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {paySubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract{' '}
              <span className="font-semibold">{contractToDelete?.contractNumber}</span>? This will
              also delete all related payments and set the inventory item back to Available. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
