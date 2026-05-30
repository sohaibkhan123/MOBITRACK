import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendorInstallments = await db.vendorInstallmentPayment.findMany({
      include: {
        vendorContract: {
          include: {
            vendor: true,
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendorInstallments)
  } catch (error) {
    console.error('Failed to fetch vendor installments:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor installments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorContractId, vendorId, amount, date, method } = body

    if (!vendorContractId || !vendorId || !amount || !date) {
      return NextResponse.json(
        { error: 'Vendor contract ID, vendor ID, amount, and date are required' },
        { status: 400 }
      )
    }

    // Create the vendor installment payment
    const installment = await db.vendorInstallmentPayment.create({
      data: {
        vendorContractId,
        vendorId,
        amount: amount || 0,
        date,
        method: method || 'Cash',
      },
      include: {
        vendorContract: {
          include: {
            vendor: true,
            item: true,
          },
        },
      },
    })

    // Update the vendor contract totals
    const vendorContract = await db.vendorContract.findUnique({
      where: { id: vendorContractId },
    })
    if (vendorContract) {
      const newTotalPaid = vendorContract.totalPaid + amount
      const newRemainingAmount = vendorContract.remainingAmount - amount
      const newStatus = newRemainingAmount <= 0 ? 'Completed' : 'Running'

      await db.vendorContract.update({
        where: { id: vendorContractId },
        data: {
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      })
    }

    // Update the vendor totalPaid
    await db.vendor.update({
      where: { id: vendorId },
      data: {
        totalPaid: { increment: amount },
      },
    })

    return NextResponse.json(installment, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor installment:', error)
    return NextResponse.json({ error: 'Failed to create vendor installment' }, { status: 500 })
  }
}
