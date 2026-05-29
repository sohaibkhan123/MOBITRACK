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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Store,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
} from 'lucide-react'

// Types
interface InventoryItem {
  id: string
  brand: string
  model: string
  variant?: string | null
  imei1?: string | null
  purchasePrice: number
  salePrice: number
  status: string
  type: string
}

interface VendorPayment {
  id: string
  vendorId: string
  amount: number
  date: string
  method: string
  receiptNumber: string
  createdAt: string
}

interface VendorInstallment {
  id: string
  vendorContractId: string
  vendorId: string
  amount: number
  date: string
  method: string
  createdAt: string
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
  nextDueDate?: string | null
  status: string
  item: InventoryItem
  installments: VendorInstallment[]
}

interface Vendor {
  id: string
  name: string
  company: string
  phone: string
  address?: string | null
  totalPurchases: number
  totalPaid: number
  inventoryItems: InventoryItem[]
  vendorPayments: VendorPayment[]
  vendorContracts: VendorContract[]
  createdAt: string
  updatedAt: string
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function VendorsPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form states
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
  })
  const [payFormData, setPayFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    receiptNumber: '',
  })
  const [installmentFormData, setInstallmentFormData] = useState({
    vendorContractId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vendors')
      if (!res.ok) throw new Error('Failed to fetch vendors')
      const data = await res.json()
      setVendors(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      v.company.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q)
    )
  })

  // Add vendor
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Vendor name is required', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to add vendor')
      toast({ title: 'Success', description: 'Vendor added successfully' })
      setAddDialogOpen(false)
      resetForm()
      fetchVendors()
    } catch {
      toast({ title: 'Error', description: 'Failed to add vendor', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Edit vendor
  const handleEdit = async () => {
    if (!selectedVendor || !formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Vendor name is required', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/vendors/${selectedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to update vendor')
      toast({ title: 'Success', description: 'Vendor updated successfully' })
      setEditDialogOpen(false)
      resetForm()
      setSelectedVendor(null)
      fetchVendors()
    } catch {
      toast({ title: 'Error', description: 'Failed to update vendor', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete vendor
  const handleDelete = async () => {
    if (!selectedVendor) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/vendors/${selectedVendor.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete vendor')
      toast({ title: 'Success', description: 'Vendor deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedVendor(null)
      fetchVendors()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete vendor', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Pay vendor
  const handlePay = async () => {
    if (!selectedVendor || !payFormData.amount || !payFormData.date) {
      toast({ title: 'Validation Error', description: 'Amount and date are required', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/vendor-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          amount: parseFloat(payFormData.amount),
          date: payFormData.date,
          method: payFormData.method,
          receiptNumber: payFormData.receiptNumber,
        }),
      })
      if (!res.ok) throw new Error('Failed to record payment')
      toast({ title: 'Success', description: 'Payment recorded successfully' })
      setPayDialogOpen(false)
      resetPayForm()
      setSelectedVendor(null)
      fetchVendors()
    } catch {
      toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Pay vendor installment
  const handleInstallment = async () => {
    if (!selectedVendor || !installmentFormData.vendorContractId || !installmentFormData.amount || !installmentFormData.date) {
      toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/vendor-installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorContractId: installmentFormData.vendorContractId,
          vendorId: selectedVendor.id,
          amount: parseFloat(installmentFormData.amount),
          date: installmentFormData.date,
          method: installmentFormData.method,
        }),
      })
      if (!res.ok) throw new Error('Failed to record installment')
      toast({ title: 'Success', description: 'Installment payment recorded successfully' })
      setInstallmentDialogOpen(false)
      resetInstallmentForm()
      setSelectedVendor(null)
      fetchVendors()
    } catch {
      toast({ title: 'Error', description: 'Failed to record installment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', company: '', phone: '', address: '' })
  }

  const resetPayForm = () => {
    setPayFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      receiptNumber: '',
    })
  }

  const resetInstallmentForm = () => {
    setInstallmentFormData({
      vendorContractId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
    })
  }

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setFormData({
      name: vendor.name,
      company: vendor.company,
      phone: vendor.phone,
      address: vendor.address || '',
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setDeleteDialogOpen(true)
  }

  const openPayDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    resetPayForm()
    setPayDialogOpen(true)
  }

  const openInstallmentDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    resetInstallmentForm()
    setInstallmentDialogOpen(true)
  }

  const toggleExpand = (vendorId: string) => {
    setExpandedVendor(expandedVendor === vendorId ? null : vendorId)
  }

  // Summary stats
  const totalPurchasesAll = vendors.reduce((s, v) => s + v.totalPurchases, 0)
  const totalPaidAll = vendors.reduce((s, v) => s + v.totalPaid, 0)
  const totalBalanceDue = totalPurchasesAll - totalPaidAll

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Total Vendors
            </CardDescription>
            <CardTitle className="text-2xl">{vendors.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Purchases
            </CardDescription>
            <CardTitle className="text-2xl">{formatPKR(totalPurchasesAll)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Balance Due
            </CardDescription>
            <CardTitle className="text-2xl">{formatPKR(totalBalanceDue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search & Add */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Vendors
              </CardTitle>
              <CardDescription>Manage your vendors and track payments</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setAddDialogOpen(true) }} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading vendors...
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {search ? 'No vendors found matching your search.' : 'No vendors yet. Add your first vendor!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => {
                    const balance = vendor.totalPurchases - vendor.totalPaid
                    const isExpanded = expandedVendor === vendor.id
                    return (
                      <Fragment key={vendor.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpand(vendor.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{vendor.company || '—'}</TableCell>
                          <TableCell className="hidden sm:table-cell">{vendor.phone || '—'}</TableCell>
                          <TableCell className="text-right">{formatPKR(vendor.totalPurchases)}</TableCell>
                          <TableCell className="text-right">{formatPKR(vendor.totalPaid)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={balance > 0 ? 'destructive' : 'secondary'}>
                              {formatPKR(balance)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center hidden lg:table-cell">
                            {vendor.inventoryItems.length}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPayDialog(vendor)}
                                title="Record Payment"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(vendor)}
                                title="Edit Vendor"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(vendor)}
                                title="Delete Vendor"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <TableRow key={`${vendor.id}-detail`}>
                            <TableCell colSpan={9} className="bg-muted/30 p-0">
                              <div className="p-4 space-y-4">
                                {/* Vendor Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {vendor.address && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Address</p>
                                      <p className="text-sm font-medium">{vendor.address}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground">Company</p>
                                    <p className="text-sm font-medium">{vendor.company || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium">{vendor.phone || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Balance Due</p>
                                    <p className="text-sm font-bold text-destructive">
                                      {formatPKR(vendor.totalPurchases - vendor.totalPaid)}
                                    </p>
                                  </div>
                                </div>

                                {/* Vendor Contracts */}
                                {vendor.vendorContracts.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Vendor Contracts ({vendor.vendorContracts.length})
                                      </h4>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openInstallmentDialog(vendor)}
                                      >
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        Pay Installment
                                      </Button>
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {vendor.vendorContracts.map((vc) => (
                                        <Card key={vc.id} className="p-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                              <p className="text-sm font-medium">
                                                {vc.item.brand} {vc.item.model} {vc.variant || ''}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Date: {vc.purchaseDate} | IMEI: {vc.item.imei1 || '—'}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Purchase Price</p>
                                                <p className="text-sm font-medium">{formatPKR(vc.purchasePrice)}</p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Paid</p>
                                                <p className="text-sm font-medium">{formatPKR(vc.totalPaid)}</p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Remaining</p>
                                                <p className="text-sm font-medium">{formatPKR(vc.remainingAmount)}</p>
                                              </div>
                                              <Badge
                                                variant={vc.status === 'Completed' ? 'secondary' : 'destructive'}
                                              >
                                                {vc.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          {/* Installment payments for this contract */}
                                          {vc.installments.length > 0 && (
                                            <div className="mt-2 pt-2 border-t">
                                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Installment Payments ({vc.installments.length})
                                              </p>
                                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {vc.installments.map((inst) => (
                                                  <div
                                                    key={inst.id}
                                                    className="flex items-center justify-between text-xs"
                                                  >
                                                    <span>{inst.date}</span>
                                                    <span className="font-medium">{formatPKR(inst.amount)}</span>
                                                    <span className="text-muted-foreground">{inst.method}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Payment History */}
                                {vendor.vendorPayments.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                      <DollarSign className="h-4 w-4" />
                                      Payment History ({vendor.vendorPayments.length})
                                    </h4>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                      {vendor.vendorPayments.map((vp) => (
                                        <div
                                          key={vp.id}
                                          className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground">{vp.date}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {vp.method}
                                            </Badge>
                                            {vp.receiptNumber && (
                                              <span className="text-xs text-muted-foreground">
                                                Receipt: {vp.receiptNumber}
                                              </span>
                                            )}
                                          </div>
                                          <span className="font-medium">{formatPKR(vp.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Inventory Items */}
                                {vendor.inventoryItems.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                      <Store className="h-4 w-4" />
                                      Inventory Items ({vendor.inventoryItems.length})
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {vendor.inventoryItems.map((item) => (
                                        <div key={item.id} className="text-sm p-2 rounded border">
                                          <p className="font-medium">
                                            {item.brand} {item.model} {item.variant || ''}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Purchase: {formatPKR(item.purchasePrice)} | Status:{' '}
                                            <Badge
                                              variant={
                                                item.status === 'Available'
                                                  ? 'secondary'
                                                  : item.status === 'Sold'
                                                    ? 'destructive'
                                                    : 'outline'
                                              }
                                              className="text-xs"
                                            >
                                              {item.status}
                                            </Badge>
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {vendor.vendorContracts.length === 0 &&
                                  vendor.vendorPayments.length === 0 &&
                                  vendor.inventoryItems.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No contracts, payments, or inventory items for this vendor.
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

      {/* Add Vendor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Vendor
            </DialogTitle>
            <DialogDescription>Add a new vendor to your system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arslan Mahmood"
              />
            </div>
            <div>
              <Label htmlFor="add-company">Company</Label>
              <Input
                id="add-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Samsung Plaza Lahore"
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +92 300 1234567"
              />
            </div>
            <div>
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Hall Road, Lahore"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Vendor
            </DialogTitle>
            <DialogDescription>Update vendor information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arslan Mahmood"
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Samsung Plaza Lahore"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +92 300 1234567"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Hall Road, Lahore"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Vendor Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pay Vendor
            </DialogTitle>
            <DialogDescription>
              Record a payment for {selectedVendor?.name}
              {selectedVendor && (
                <span className="block mt-1 text-xs">
                  Balance Due: {formatPKR(selectedVendor.totalPurchases - selectedVendor.totalPaid)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pay-amount">Amount *</Label>
              <Input
                id="pay-amount"
                type="number"
                value={payFormData.amount}
                onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="pay-date">Date *</Label>
              <Input
                id="pay-date"
                type="date"
                value={payFormData.date}
                onChange={(e) => setPayFormData({ ...payFormData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pay-method">Payment Method</Label>
              <Select
                value={payFormData.method}
                onValueChange={(value) => setPayFormData({ ...payFormData, method: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-receipt">Receipt Number</Label>
              <Input
                id="pay-receipt"
                value={payFormData.receiptNumber}
                onChange={(e) => setPayFormData({ ...payFormData, receiptNumber: e.target.value })}
                placeholder="e.g. RCP-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Installment Dialog */}
      <Dialog open={installmentDialogOpen} onOpenChange={setInstallmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay Installment
            </DialogTitle>
            <DialogDescription>
              Record an installment payment for {selectedVendor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inst-contract">Select Contract *</Label>
              <Select
                value={installmentFormData.vendorContractId}
                onValueChange={(value) =>
                  setInstallmentFormData({ ...installmentFormData, vendorContractId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vendor contract" />
                </SelectTrigger>
                <SelectContent>
                  {selectedVendor?.vendorContracts
                    .filter((vc) => vc.status === 'Running')
                    .map((vc) => (
                      <SelectItem key={vc.id} value={vc.id}>
                        {vc.item.brand} {vc.item.model} - {formatPKR(vc.remainingAmount)} remaining
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedVendor?.vendorContracts.filter((vc) => vc.status === 'Running').length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No active contracts with remaining balance</p>
              )}
            </div>
            <div>
              <Label htmlFor="inst-amount">Amount *</Label>
              <Input
                id="inst-amount"
                type="number"
                value={installmentFormData.amount}
                onChange={(e) => setInstallmentFormData({ ...installmentFormData, amount: e.target.value })}
                placeholder="Enter installment amount"
              />
            </div>
            <div>
              <Label htmlFor="inst-date">Date *</Label>
              <Input
                id="inst-date"
                type="date"
                value={installmentFormData.date}
                onChange={(e) => setInstallmentFormData({ ...installmentFormData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inst-method">Payment Method</Label>
              <Select
                value={installmentFormData.method}
                onValueChange={(value) => setInstallmentFormData({ ...installmentFormData, method: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleInstallment} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Installment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedVendor?.name}</strong>?
              This action cannot be undone. All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
