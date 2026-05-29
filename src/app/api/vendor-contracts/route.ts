import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendorContracts = await db.vendorContract.findMany({
      include: {
        vendor: true,
        item: true,
        installments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendorContracts)
  } catch (error) {
    console.error('Failed to fetch vendor contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor contracts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vendorId,
      itemId,
      purchaseDate,
      purchasePrice,
      advancePaid,
      installmentsCount,
      installmentAmount,
      remainingAmount,
      totalPaid,
      nextDueDate,
      status,
    } = body

    if (!vendorId || !itemId || !purchaseDate) {
      return NextResponse.json(
        { error: 'Vendor ID, item ID, and purchase date are required' },
        { status: 400 }
      )
    }

    const vendorContract = await db.vendorContract.create({
      data: {
        vendorId,
        itemId,
        purchaseDate,
        purchasePrice: purchasePrice || 0,
        advancePaid: advancePaid || 0,
        installmentsCount: installmentsCount || 1,
        installmentAmount: installmentAmount || 0,
        remainingAmount: remainingAmount || 0,
        totalPaid: totalPaid || 0,
        nextDueDate: nextDueDate || null,
        status: status || 'Running',
      },
      include: {
        vendor: true,
        item: true,
      },
    })

    return NextResponse.json(vendorContract, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor contract:', error)
    return NextResponse.json({ error: 'Failed to create vendor contract' }, { status: 500 })
  }
}
