'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
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
// Collapsible removed - using simple conditional rendering instead
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Phone,
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  User,
  Wallet,
  Eye,
} from 'lucide-react'

// Types
interface Contract {
  id: string
  contractNumber: string
  saleDate: string
  totalPrice: number
  totalPaid: number
  remainingAmount: number
  installmentsCount: number
  status: string
  itemId: string
  item?: {
    id: string
    brand: string
    model: string
    variant: string | null
  }
}

interface Payment {
  id: string
  amount: number
  date: string
  method: string
  receiptNumber: string
  contractId: string
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
  createdAt: string
  updatedAt: string
  contracts: Contract[]
  payments: Payment[]
}

interface CustomerFormData {
  fullName: string
  fatherName: string
  cnic: string
  phone: string
  altPhone: string
  address: string
  city: string
  occupation: string
  income: string
  guarantorName: string
  guarantorPhone: string
  status: string
}

const initialFormData: CustomerFormData = {
  fullName: '',
  fatherName: '',
  cnic: '',
  phone: '',
  altPhone: '',
  address: '',
  city: '',
  occupation: '',
  income: '',
  guarantorName: '',
  guarantorPhone: '',
  status: 'Active',
}

function formatPKR(amount: number | null | undefined): string {
  if (amount == null) return 'PKR 0'
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`
}

export function CustomersPage() {
  const { toast } = useToast()
  const { setSelectedCustomerId, setCurrentPage } = useAppStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter customers based on search
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.cnic.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.fatherName && c.fatherName.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    )
  })

  // Toggle expanded row
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Open add dialog
  const handleAdd = () => {
    setEditingCustomer(null)
    setFormData(initialFormData)
    setFormOpen(true)
  }

  // Open edit dialog
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      fullName: customer.fullName,
      fatherName: customer.fatherName || '',
      cnic: customer.cnic,
      phone: customer.phone,
      altPhone: customer.altPhone || '',
      address: customer.address || '',
      city: customer.city || '',
      occupation: customer.occupation || '',
      income: customer.income != null ? String(customer.income) : '',
      guarantorName: customer.guarantorName || '',
      guarantorPhone: customer.guarantorPhone || '',
      status: customer.status,
    })
    setFormOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer)
    setDeleteOpen(true)
  }

  // Submit form (create or update)
  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full Name is required',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        fatherName: formData.fatherName.trim() || null,
        cnic: formData.cnic.trim(),
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        occupation: formData.occupation.trim() || null,
        income: formData.income ? parseFloat(formData.income) : null,
        guarantorName: formData.guarantorName.trim() || null,
        guarantorPhone: formData.guarantorPhone.trim() || null,
        status: formData.status,
      }

      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update customer')
        toast({
          title: 'Customer Updated',
          description: `${formData.fullName} has been updated successfully`,
        })
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create customer')
        toast({
          title: 'Customer Added',
          description: `${formData.fullName} has been added successfully`,
        })
      }

      setFormOpen(false)
      setEditingCustomer(null)
      setFormData(initialFormData)
      fetchCustomers()
    } catch {
      toast({
        title: 'Error',
        description: editingCustomer
          ? 'Failed to update customer'
          : 'Failed to add customer',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete customer
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete customer')
      toast({
        title: 'Customer Deleted',
        description: `${deletingCustomer.fullName} has been deleted`,
      })
      setDeleteOpen(false)
      setDeletingCustomer(null)
      fetchCustomers()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. They may have existing contracts or payments.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Update form field
  const updateField = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Stats
  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status === 'Active').length
  const totalOutstanding = customers.reduce(
    (sum, c) =>
      sum + c.contracts.reduce((s, ct) => s + ct.remainingAmount, 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600" />
            Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your customer records and installment accounts
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-emerald-600" />
              Total Customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4 text-emerald-600" />
              Active Customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-sm">
              <Wallet className="h-4 w-4 text-emerald-600" />
              Outstanding Amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPKR(totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, CNIC, phone, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-muted-foreground">Loading customers...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">
                {search ? 'No customers match your search' : 'No customers yet'}
              </p>
              <p className="text-sm mt-1">
                {search
                  ? 'Try a different search term'
                  : 'Click "Add Customer" to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Father Name</TableHead>
                    <TableHead className="hidden lg:table-cell">CNIC</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Contracts</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Payments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const isExpanded = expandedRows.has(customer.id)
                    return (
                      <Fragment key={customer.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleRow(customer.id)}
                        >
                            <TableCell className="w-10">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {customer.fullName}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {customer.fatherName || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-sm">
                              {customer.cnic || '—'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {customer.phone || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {customer.city || '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  customer.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }
                              >
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              {customer.contracts.length}
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              {customer.payments.length}
                            </TableCell>
                            <TableCell className="text-right">
                              <div
                                className="flex items-center justify-end gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomerId(customer.id)
                                    setCurrentPage('customer-detail')
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(customer)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(customer)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={10} className="p-0 border-0">
                                <div className="bg-muted/30 px-6 py-4 border-b">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Full Name</p>
                                      <p className="text-sm font-medium">{customer.fullName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Father Name</p>
                                      <p className="text-sm">{customer.fatherName || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">CNIC</p>
                                      <p className="text-sm font-mono">{customer.cnic || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p>
                                      <p className="text-sm">{customer.phone || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Alt Phone</p>
                                      <p className="text-sm">{customer.altPhone || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                                      <p className="text-sm">{customer.address || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">City</p>
                                      <p className="text-sm">{customer.city || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Occupation</p>
                                      <p className="text-sm">{customer.occupation || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Income</p>
                                      <p className="text-sm font-medium">{customer.income ? formatPKR(customer.income) : '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Guarantor</p>
                                      <p className="text-sm">{customer.guarantorName || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Guarantor Phone</p>
                                      <p className="text-sm">{customer.guarantorPhone || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                                      <Badge
                                        className={
                                          customer.status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }
                                      >
                                        {customer.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Contracts Summary */}
                                  {customer.contracts.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                        <Wallet className="h-4 w-4 text-emerald-600" />
                                        Contracts ({customer.contracts.length})
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {customer.contracts.map((contract) => (
                                          <Card key={contract.id} className="border shadow-none">
                                            <CardContent className="p-3">
                                              <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-mono text-muted-foreground">
                                                  {contract.contractNumber}
                                                </span>
                                                <Badge
                                                  className={
                                                    contract.status === 'Completed'
                                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0'
                                                      : contract.status === 'Overdue'
                                                        ? 'bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0'
                                                        : 'bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0'
                                                  }
                                                >
                                                  {contract.status}
                                                </Badge>
                                              </div>
                                              {contract.item && (
                                                <p className="text-sm font-medium mb-1">
                                                  {contract.item.brand} {contract.item.model}
                                                  {contract.item.variant ? ` ${contract.item.variant}` : ''}
                                                </p>
                                              )}
                                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                                <span>Total: {formatPKR(contract.totalPrice)}</span>
                                                <span>Paid: {formatPKR(contract.totalPaid)}</span>
                                                <span>Remaining: {formatPKR(contract.remainingAmount)}</span>
                                                <span>Installments: {contract.installmentsCount}</span>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Payments Summary */}
                                  {customer.payments.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                        <Wallet className="h-4 w-4 text-emerald-600" />
                                        Recent Payments ({customer.payments.length})
                                      </h4>
                                      <div className="max-h-48 overflow-y-auto rounded-md border">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs h-8">Date</TableHead>
                                              <TableHead className="text-xs h-8">Amount</TableHead>
                                              <TableHead className="text-xs h-8">Method</TableHead>
                                              <TableHead className="text-xs h-8">Receipt</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {customer.payments
                                              .sort((a, b) => b.date.localeCompare(a.date))
                                              .slice(0, 10)
                                              .map((payment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell className="text-xs py-1.5">
                                                    {payment.date}
                                                  </TableCell>
                                                  <TableCell className="text-xs py-1.5 font-medium">
                                                    {formatPKR(payment.amount)}
                                                  </TableCell>
                                                  <TableCell className="text-xs py-1.5">
                                                    {payment.method}
                                                  </TableCell>
                                                  <TableCell className="text-xs py-1.5 font-mono">
                                                    {payment.receiptNumber || '—'}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}

                                  {customer.contracts.length === 0 &&
                                    customer.payments.length === 0 && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        No contracts or payments recorded yet.
                                      </p>
                                    )}
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

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update customer information below'
                : 'Fill in the details to add a new customer'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Muhammad Ali"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fatherName">Father Name</Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                    placeholder="Iftikhar Ali"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) => updateField('cnic', e.target.value)}
                    placeholder="35201-1234567-9"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+92 301 5556677"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="altPhone">Alt Phone</Label>
                  <Input
                    id="altPhone"
                    value={formData.altPhone}
                    onChange={(e) => updateField('altPhone', e.target.value)}
                    placeholder="+92 300 4443322"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Address & Occupation */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Address & Occupation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Model Town, House 14-B"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Lahore"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    placeholder="School Teacher"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="income">Monthly Income</Label>
                  <Input
                    id="income"
                    type="number"
                    value={formData.income}
                    onChange={(e) => updateField('income', e.target.value)}
                    placeholder="75000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Guarantor & Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Guarantor & Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="guarantorName">Guarantor Name</Label>
                  <Input
                    id="guarantorName"
                    value={formData.guarantorName}
                    onChange={(e) => updateField('guarantorName', e.target.value)}
                    placeholder="Kamran Sajid"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="guarantorPhone">Guarantor Phone</Label>
                  <Input
                    id="guarantorPhone"
                    value={formData.guarantorPhone}
                    onChange={(e) => updateField('guarantorPhone', e.target.value)}
                    placeholder="+92 300 4443322"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField('status', value)}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deletingCustomer?.fullName}
              </span>
              ? This action cannot be undone. All associated contracts and
              payments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
