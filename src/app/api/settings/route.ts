import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let settings = await db.shopSettings.findUnique({
      where: { id: 'shop-settings' },
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await db.shopSettings.create({
        data: { id: 'shop-settings' },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      shopName,
      shopAddress,
      shopPhone,
      shopEmail,
      currencySymbol,
      currencyCode,
      currencyLocale,
      ownerName,
      ownerPhone,
      taxRate,
      receiptFooter,
    } = body

    // Upsert: create if not exists, update if exists
    const settings = await db.shopSettings.upsert({
      where: { id: 'shop-settings' },
      update: {
        ...(shopName !== undefined && { shopName }),
        ...(shopAddress !== undefined && { shopAddress }),
        ...(shopPhone !== undefined && { shopPhone }),
        ...(shopEmail !== undefined && { shopEmail }),
        ...(currencySymbol !== undefined && { currencySymbol }),
        ...(currencyCode !== undefined && { currencyCode }),
        ...(currencyLocale !== undefined && { currencyLocale }),
        ...(ownerName !== undefined && { ownerName }),
        ...(ownerPhone !== undefined && { ownerPhone }),
        ...(taxRate !== undefined && { taxRate }),
        ...(receiptFooter !== undefined && { receiptFooter }),
      },
      create: {
        id: 'shop-settings',
        shopName: shopName || 'MobiTrack',
        shopAddress: shopAddress || '',
        shopPhone: shopPhone || '',
        shopEmail: shopEmail || '',
        currencySymbol: currencySymbol || '₨',
        currencyCode: currencyCode || 'PKR',
        currencyLocale: currencyLocale || 'en-PK',
        ownerName: ownerName || '',
        ownerPhone: ownerPhone || '',
        taxRate: taxRate || 0,
        receiptFooter: receiptFooter || 'Thank you for your business!',
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
