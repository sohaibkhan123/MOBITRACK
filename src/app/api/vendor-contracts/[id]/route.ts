import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const vendorContract = await db.vendorContract.update({
      where: { id },
      data: {
        vendorId: body.vendorId,
        itemId: body.itemId,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        advancePaid: body.advancePaid,
        installmentsCount: body.installmentsCount,
        installmentAmount: body.installmentAmount,
        remainingAmount: body.remainingAmount,
        totalPaid: body.totalPaid,
        nextDueDate: body.nextDueDate ?? null,
        status: body.status,
      },
      include: {
        vendor: true,
        item: true,
      },
    })
    return NextResponse.json(vendorContract)
  } catch (error) {
    console.error('Failed to update vendor contract:', error)
    return NextResponse.json({ error: 'Failed to update vendor contract' }, { status: 500 })
  }
}
