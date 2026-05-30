import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        vendor: true,
        contracts: true,
        vendorContract: true,
      },
    })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to fetch inventory item:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        brand: body.brand,
        model: body.model,
        variant: body.variant ?? null,
        color: body.color ?? null,
        ram: body.ram ?? null,
        storage: body.storage ?? null,
        imei1: body.imei1 ?? null,
        imei2: body.imei2 ?? null,
        purchasePrice: body.purchasePrice,
        salePrice: body.salePrice,
        minSalePrice: body.minSalePrice ?? null,
        supplier: body.supplier ?? null,
        vendorId: body.vendorId ?? null,
        imageUrl: body.imageUrl ?? null,
        purchaseDate: body.purchaseDate,
        status: body.status,
        type: body.type,
        notes: body.notes ?? null,
      },
      include: {
        vendor: true,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update inventory item:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get the item first to update vendor stats
    const item = await db.inventoryItem.findUnique({
      where: { id },
    })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update vendor totalPurchases if vendorId exists
    if (item.vendorId) {
      await db.vendor.update({
        where: { id: item.vendorId },
        data: {
          totalPurchases: { decrement: item.purchasePrice },
        },
      })
    }

    await db.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Failed to delete inventory item:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
