import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payments = await db.payment.findMany({
      include: {
        customer: true,
        contract: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contractId, customerId, amount, date, method, receivedBy, receiptNumber, nextDueDateSet } = body

    if (!contractId || !customerId || !amount || !date) {
      return NextResponse.json(
        { error: 'Contract ID, customer ID, amount, and date are required' },
        { status: 400 }
      )
    }

    // Create the payment
    const payment = await db.payment.create({
      data: {
        contractId,
        customerId,
        amount: amount || 0,
        date,
        method: method || 'Cash',
        receivedBy: receivedBy || 'System',
        receiptNumber: receiptNumber || '',
        nextDueDateSet: nextDueDateSet || null,
      },
      include: {
        customer: true,
        contract: {
          include: {
            item: true,
          },
        },
      },
    })

    // Update the related contract
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    })
    if (contract) {
      const newTotalPaid = contract.totalPaid + amount
      const newRemainingAmount = contract.remainingAmount - amount
      const newStatus = newRemainingAmount <= 0 ? 'Completed' : 'Running'
      const newNextDueDate = nextDueDateSet || contract.nextDueDate

      await db.contract.update({
        where: { id: contractId },
        data: {
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          nextDueDate: newNextDueDate,
        },
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Failed to create payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
