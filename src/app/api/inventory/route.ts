import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const items = await db.inventoryItem.findMany({
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      brand,
      model,
      variant,
      color,
      ram,
      storage,
      imei1,
      imei2,
      purchasePrice,
      salePrice,
      minSalePrice,
      supplier,
      vendorId,
      imageUrl,
      purchaseDate,
      status,
      type,
      notes,
      advancePaid,
      installmentsCount,
      installmentAmount,
    } = body

    if (!brand || !model || !purchaseDate) {
      return NextResponse.json(
        { error: 'Brand, model, and purchaseDate are required' },
        { status: 400 }
      )
    }

    const item = await db.inventoryItem.create({
      data: {
        brand,
        model,
        variant: variant || null,
        color: color || null,
        ram: ram || null,
        storage: storage || null,
        imei1: imei1 || null,
        imei2: imei2 || null,
        purchasePrice: purchasePrice || 0,
        salePrice: salePrice || 0,
        minSalePrice: minSalePrice || null,
        supplier: supplier || null,
        vendorId: vendorId || null,
        imageUrl: imageUrl || null,
        purchaseDate,
        status: status || 'Available',
        type: type || 'Mobile',
        notes: notes || null,
      },
      include: {
        vendor: true,
      },
    })

    // Update vendor stats if vendorId is provided
    if (vendorId) {
      const price = purchasePrice || 0
      await db.vendor.update({
        where: { id: vendorId },
        data: {
          totalPurchases: { increment: price },
          totalPaid: advancePaid ? { increment: advancePaid } : undefined,
        },
      })

      // Create vendor contract if purchase type is installment
      if (installmentsCount && installmentsCount > 1) {
        const advance = advancePaid || 0
        const remaining = price - advance
        await db.vendorContract.create({
          data: {
            vendorId,
            itemId: item.id,
            purchaseDate,
            purchasePrice: price,
            advancePaid: advance,
            installmentsCount,
            installmentAmount: installmentAmount || 0,
            remainingAmount: remaining,
            totalPaid: advance,
            nextDueDate: null,
            status: 'Running',
          },
        })
      }
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Failed to create inventory item:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
