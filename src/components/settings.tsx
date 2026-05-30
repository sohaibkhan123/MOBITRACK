'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  User,
  FileText,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShopSettingsData {
  id: string
  shopName: string
  shopAddress: string
  shopPhone: string
  shopEmail: string
  currencySymbol: string
  currencyCode: string
  currencyLocale: string
  ownerName: string
  ownerPhone: string
  taxRate: number
  receiptFooter: string
  createdAt: string
  updatedAt: string
}

interface SettingsFormData {
  shopName: string
  shopAddress: string
  shopPhone: string
  shopEmail: string
  currencySymbol: string
  currencyCode: string
  currencyLocale: string
  ownerName: string
  ownerPhone: string
  taxRate: string
  receiptFooter: string
}

const defaultFormData: SettingsFormData = {
  shopName: 'MobiTrack',
  shopAddress: '',
  shopPhone: '',
  shopEmail: '',
  currencySymbol: '₨',
  currencyCode: 'PKR',
  currencyLocale: 'en-PK',
  ownerName: '',
  ownerPhone: '',
  taxRate: '0',
  receiptFooter: 'Thank you for your business!',
}

const CURRENCY_PRESETS = [
  { symbol: '₨', code: 'PKR', locale: 'en-PK', label: 'Pakistani Rupee (₨ PKR)' },
  { symbol: '₹', code: 'INR', locale: 'en-IN', label: 'Indian Rupee (₹ INR)' },
  { symbol: '$', code: 'USD', locale: 'en-US', label: 'US Dollar ($ USD)' },
  { symbol: '€', code: 'EUR', locale: 'de-DE', label: 'Euro (€ EUR)' },
  { symbol: '£', code: 'GBP', locale: 'en-GB', label: 'British Pound (£ GBP)' },
  { symbol: '﷼', code: 'SAR', locale: 'ar-SA', label: 'Saudi Riyal (﷼ SAR)' },
  { symbol: 'AED', code: 'AED', locale: 'ar-AE', label: 'UAE Dirham (AED)' },
  { symbol: '৳', code: 'BDT', locale: 'bn-BD', label: 'Bangladeshi Taka (৳ BDT)' },
  { symbol: 'R', code: 'ZAR', locale: 'en-ZA', label: 'South African Rand (R ZAR)' },
  { symbol: 'RM', code: 'MYR', locale: 'ms-MY', label: 'Malaysian Ringgit (RM MYR)' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<ShopSettingsData | null>(null)
  const [formData, setFormData] = useState<SettingsFormData>(defaultFormData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ─── Fetch Settings ──────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data: ShopSettingsData = await res.json()
      setSettings(data)
      setFormData({
        shopName: data.shopName,
        shopAddress: data.shopAddress,
        shopPhone: data.shopPhone,
        shopEmail: data.shopEmail,
        currencySymbol: data.currencySymbol,
        currencyCode: data.currencyCode,
        currencyLocale: data.currencyLocale,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        taxRate: data.taxRate.toString(),
        receiptFooter: data.receiptFooter,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ─── Update Form Field ──────────────────────────────────────────────────

  const updateField = (field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ─── Apply Currency Preset ──────────────────────────────────────────────

  const applyCurrencyPreset = (preset: typeof CURRENCY_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      currencySymbol: preset.symbol,
      currencyCode: preset.code,
      currencyLocale: preset.locale,
    }))
  }

  // ─── Reset Form ──────────────────────────────────────────────────────────

  const handleReset = () => {
    if (settings) {
      setFormData({
        shopName: settings.shopName,
        shopAddress: settings.shopAddress,
        shopPhone: settings.shopPhone,
        shopEmail: settings.shopEmail,
        currencySymbol: settings.currencySymbol,
        currencyCode: settings.currencyCode,
        currencyLocale: settings.currencyLocale,
        ownerName: settings.ownerName,
        ownerPhone: settings.ownerPhone,
        taxRate: settings.taxRate.toString(),
        receiptFooter: settings.receiptFooter,
      })
    }
  }

  // ─── Save Settings ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.shopName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Shop name is required',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        shopName: formData.shopName.trim(),
        shopAddress: formData.shopAddress.trim(),
        shopPhone: formData.shopPhone.trim(),
        shopEmail: formData.shopEmail.trim(),
        currencySymbol: formData.currencySymbol.trim(),
        currencyCode: formData.currencyCode.trim(),
        currencyLocale: formData.currencyLocale.trim(),
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        taxRate: parseFloat(formData.taxRate) || 0,
        receiptFooter: formData.receiptFooter.trim(),
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save settings')

      const updated = await res.json()
      setSettings(updated)
      toast({
        title: 'Settings Saved',
        description: 'Your shop settings have been updated successfully',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="size-6" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your shop details, currency, and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="size-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="size-4 text-emerald-600" />
            Shop Information
          </CardTitle>
          <CardDescription>
            Basic details about your mobile shop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shopName" className="flex items-center gap-1.5">
                <Store className="size-3.5 text-muted-foreground" />
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => updateField('shopName', e.target.value)}
                placeholder="e.g. MobiTrack Mobile Shop"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="shopAddress" className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                Shop Address
              </Label>
              <Input
                id="shopAddress"
                value={formData.shopAddress}
                onChange={(e) => updateField('shopAddress', e.target.value)}
                placeholder="e.g. Main Market, Gulberg III, Lahore"
                className="mt-1.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopPhone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                Shop Phone
              </Label>
              <Input
                id="shopPhone"
                value={formData.shopPhone}
                onChange={(e) => updateField('shopPhone', e.target.value)}
                placeholder="e.g. +92 42 35761234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopEmail" className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" />
                Shop Email
              </Label>
              <Input
                id="shopEmail"
                type="email"
                value={formData.shopEmail}
                onChange={(e) => updateField('shopEmail', e.target.value)}
                placeholder="e.g. info@mobitrack.pk"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-amber-600" />
            Currency Settings
          </CardTitle>
          <CardDescription>
            Set the currency symbol and format used throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {CURRENCY_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  onClick={() => applyCurrencyPreset(preset)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    formData.currencyCode === preset.code
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <span className="font-semibold">{preset.symbol}</span>
                  {preset.code}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Currency Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={formData.currencySymbol}
                onChange={(e) => updateField('currencySymbol', e.target.value)}
                placeholder="₨"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency Code</Label>
              <Input
                id="currencyCode"
                value={formData.currencyCode}
                onChange={(e) => updateField('currencyCode', e.target.value)}
                placeholder="PKR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencyLocale">Locale</Label>
              <Input
                id="currencyLocale"
                value={formData.currencyLocale}
                onChange={(e) => updateField('currencyLocale', e.target.value)}
                placeholder="en-PK"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Preview</p>
            <p className="text-lg font-bold">
              {formData.currencySymbol} 25,000{' '}
              <span className="text-sm font-normal text-muted-foreground">{formData.currencyCode}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-violet-600" />
            Owner Information
          </CardTitle>
          <CardDescription>
            Shop owner details for receipts and records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="e.g. Muhammad Ali"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Owner Phone</Label>
              <Input
                id="ownerPhone"
                value={formData.ownerPhone}
                onChange={(e) => updateField('ownerPhone', e.target.value)}
                placeholder="e.g. +92 301 5556677"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt & Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-rose-600" />
            Receipt & Tax
          </CardTitle>
          <CardDescription>
            Configure tax rate and receipt footer message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                step="0.5"
                value={formData.taxRate}
                onChange={(e) => updateField('taxRate', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Applied to sale prices. Set to 0 for no tax.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
            <Input
              id="receiptFooter"
              value={formData.receiptFooter}
              onChange={(e) => updateField('receiptFooter', e.target.value)}
              placeholder="e.g. Thank you for your business!"
            />
          </div>

          {/* Receipt Preview */}
          <div className="rounded-lg border-2 border-dashed p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt Preview</p>
            <div className="text-center space-y-1">
              <p className="text-base font-bold">{formData.shopName || 'MobiTrack'}</p>
              {formData.shopAddress && <p className="text-xs text-muted-foreground">{formData.shopAddress}</p>}
              {formData.shopPhone && <p className="text-xs text-muted-foreground">Tel: {formData.shopPhone}</p>}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground italic">{formData.receiptFooter}</p>
              {formData.ownerName && (
                <p className="text-xs text-muted-foreground">Owner: {formData.ownerName}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4 text-muted-foreground" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {settings?.updatedAt
                  ? new Date(settings.updatedAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Version</p>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
