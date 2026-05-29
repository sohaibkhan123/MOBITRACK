import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendorPayments = await db.vendorPayment.findMany({
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendorPayments)
  } catch (error) {
    console.error('Failed to fetch vendor payments:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, amount, date, method, receiptNumber } = body

    if (!vendorId || !amount || !date) {
      return NextResponse.json(
        { error: 'Vendor ID, amount, and date are required' },
        { status: 400 }
      )
    }

    const vendorPayment = await db.vendorPayment.create({
      data: {
        vendorId,
        amount: amount || 0,
        date,
        method: method || 'Cash',
        receiptNumber: receiptNumber || '',
      },
      include: {
        vendor: true,
      },
    })

    // Update vendor totalPaid
    await db.vendor.update({
      where: { id: vendorId },
      data: {
        totalPaid: { increment: amount },
      },
    })

    return NextResponse.json(vendorPayment, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor payment:', error)
    return NextResponse.json({ error: 'Failed to create vendor payment' }, { status: 500 })
  }
}
