'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Phone,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vendor {
  id: string
  name: string
  company: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  variant: string | null
  color: string | null
  ram: string | null
  storage: string | null
  imei1: string | null
  imei2: string | null
  purchasePrice: number
  salePrice: number
  minSalePrice: number | null
  supplier: string | null
  vendorId: string | null
  imageUrl: string | null
  purchaseDate: string
  status: 'Available' | 'Sold'
  type: string
  notes: string | null
  vendor: Vendor | null
}

interface FormData {
  brand: string
  model: string
  variant: string
  color: string
  ram: string
  storage: string
  imei1: string
  imei2: string
  purchasePrice: string
  salePrice: string
  minSalePrice: string
  supplier: string
  vendorId: string
  purchaseDate: string
  type: string
  notes: string
}

const emptyForm: FormData = {
  brand: '',
  model: '',
  variant: '',
  color: '',
  ram: '',
  storage: '',
  imei1: '',
  imei2: '',
  purchasePrice: '',
  salePrice: '',
  minSalePrice: '',
  supplier: '',
  vendorId: '',
  purchaseDate: '',
  type: 'Mobile',
  notes: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPKR(amount: number): string {
  return `₨ ${amount.toLocaleString('en-PK')}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InventoryPage() {
  const { toast } = useToast()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch Data ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const data = await res.json()
      setItems(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors')
      if (!res.ok) throw new Error('Failed to fetch vendors')
      const data = await res.json()
      setVendors(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load vendors.',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchItems()
    fetchVendors()
  }, [fetchItems, fetchVendors])

  // ─── Filtered Items ─────────────────────────────────────────────────────

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter

    if (!searchQuery.trim()) return matchesStatus

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      item.brand.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      (item.imei1 && item.imei1.toLowerCase().includes(q)) ||
      (item.imei2 && item.imei2.toLowerCase().includes(q))

    return matchesStatus && matchesSearch
  })

  // ─── Dialog Handlers ────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      brand: item.brand,
      model: item.model,
      variant: item.variant || '',
      color: item.color || '',
      ram: item.ram || '',
      storage: item.storage || '',
      imei1: item.imei1 || '',
      imei2: item.imei2 || '',
      purchasePrice: item.purchasePrice.toString(),
      salePrice: item.salePrice.toString(),
      minSalePrice: item.minSalePrice?.toString() || '',
      supplier: item.supplier || '',
      vendorId: item.vendorId || '',
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split('T')[0]
        : '',
      type: item.type || 'Mobile',
      notes: item.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.brand.trim() || !formData.model.trim() || !formData.purchaseDate) {
      toast({
        title: 'Validation Error',
        description: 'Brand, Model, and Purchase Date are required.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        variant: formData.variant.trim() || null,
        color: formData.color.trim() || null,
        ram: formData.ram.trim() || null,
        storage: formData.storage.trim() || null,
        imei1: formData.imei1.trim() || null,
        imei2: formData.imei2.trim() || null,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        minSalePrice: formData.minSalePrice
          ? Number(formData.minSalePrice)
          : null,
        supplier: formData.supplier.trim() || null,
        vendorId: formData.vendorId || null,
        purchaseDate: formData.purchaseDate,
        type: formData.type,
        notes: formData.notes.trim() || null,
      }

      if (editingItem) {
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update item')

        toast({
          title: 'Item Updated',
          description: `${payload.brand} ${payload.model} has been updated.`,
        })
      } else {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, status: 'Available' }),
        })
        if (!res.ok) throw new Error('Failed to create item')

        toast({
          title: 'Item Added',
          description: `${payload.brand} ${payload.model} has been added to inventory.`,
        })
      }

      setDialogOpen(false)
      fetchItems()
    } catch {
      toast({
        title: 'Error',
        description: editingItem
          ? 'Failed to update item.'
          : 'Failed to add item.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete Handler ─────────────────────────────────────────────────────

  const openDeleteDialog = (item: InventoryItem) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/inventory/${deletingItem.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete item')

      toast({
        title: 'Item Deleted',
        description: `${deletingItem.brand} ${deletingItem.model} has been removed.`,
      })
      setDeleteDialogOpen(false)
      setDeletingItem(null)
      fetchItems()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // ─── Form Field Helper ──────────────────────────────────────────────────

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
            <p className="text-sm text-muted-foreground">
              Manage your mobile phone stock
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by brand, model, or IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Stock Items
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b px-4 py-3 last:border-0"
                >
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-6 w-[70px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[70px]" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No items found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Add your first inventory item to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">
                          {item.brand} {item.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.variant || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.color || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {item.imei1 || '—'}
                        </div>
                        {item.imei2 && (
                          <div className="text-xs font-mono text-muted-foreground">
                            {item.imei2}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatPKR(item.purchasePrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatPKR(item.salePrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.vendor
                            ? item.vendor.company
                              ? `${item.vendor.name} (${item.vendor.company})`
                              : item.vendor.name
                            : item.supplier || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the details of this inventory item.'
                : 'Fill in the details to add a new item to inventory.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row: Brand & Model */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Brand <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="brand"
                  placeholder="e.g. Samsung"
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  Model <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="model"
                  placeholder="e.g. Galaxy S24 Ultra"
                  value={formData.model}
                  onChange={(e) => updateField('model', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Variant & Color */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Input
                  id="variant"
                  placeholder="e.g. 12GB RAM / 512GB"
                  value={formData.variant}
                  onChange={(e) => updateField('variant', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g. Titanium Gray"
                  value={formData.color}
                  onChange={(e) => updateField('color', e.target.value)}
                />
              </div>
            </div>

            {/* Row: RAM & Storage */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ram">RAM</Label>
                <Input
                  id="ram"
                  placeholder="e.g. 12GB"
                  value={formData.ram}
                  onChange={(e) => updateField('ram', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Storage</Label>
                <Input
                  id="storage"
                  placeholder="e.g. 512GB"
                  value={formData.storage}
                  onChange={(e) => updateField('storage', e.target.value)}
                />
              </div>
            </div>

            {/* Row: IMEI 1 & IMEI 2 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imei1">IMEI 1</Label>
                <Input
                  id="imei1"
                  placeholder="e.g. 358920110482910"
                  value={formData.imei1}
                  onChange={(e) => updateField('imei1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei2">IMEI 2</Label>
                <Input
                  id="imei2"
                  placeholder="e.g. 358920110482911"
                  value={formData.imei2}
                  onChange={(e) => updateField('imei2', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Purchase Price & Sale Price */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">
                  Purchase Price <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="e.g. 290000"
                  value={formData.purchasePrice}
                  onChange={(e) => updateField('purchasePrice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="e.g. 360000"
                  value={formData.salePrice}
                  onChange={(e) => updateField('salePrice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSalePrice">Min Sale Price</Label>
                <Input
                  id="minSalePrice"
                  type="number"
                  placeholder="e.g. 345000"
                  value={formData.minSalePrice}
                  onChange={(e) => updateField('minSalePrice', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Supplier & Vendor */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="e.g. Samsung Plaza"
                  value={formData.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor</Label>
                <Select
                  value={formData.vendorId || '_none'}
                  onValueChange={(val) =>
                    updateField('vendorId', val === '_none' ? '' : val)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        {v.company ? ` (${v.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Purchase Date & Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">
                  Purchase Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => updateField('purchaseDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => updateField('type', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
              />
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
              {submitting
                ? 'Saving...'
                : editingItem
                  ? 'Update Item'
                  : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deletingItem?.brand} {deletingItem?.model}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
