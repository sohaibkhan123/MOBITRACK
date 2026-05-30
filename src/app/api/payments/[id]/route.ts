import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get the existing payment to calculate the difference
    const existingPayment = await db.payment.findUnique({
      where: { id },
    })
    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const oldAmount = existingPayment.amount
    const newAmount = body.amount ?? oldAmount
    const amountDifference = newAmount - oldAmount

    // Update the payment
    const payment = await db.payment.update({
      where: { id },
      data: {
        contractId: body.contractId,
        customerId: body.customerId,
        amount: body.amount,
        date: body.date,
        method: body.method,
        receivedBy: body.receivedBy,
        receiptNumber: body.receiptNumber,
        nextDueDateSet: body.nextDueDateSet ?? null,
      },
      include: {
        customer: true,
        contract: true,
      },
    })

    // Update contract totals based on the difference
    if (amountDifference !== 0) {
      const contract = await db.contract.findUnique({
        where: { id: existingPayment.contractId },
      })
      if (contract) {
        const updatedTotalPaid = contract.totalPaid + amountDifference
        const updatedRemainingAmount = contract.remainingAmount - amountDifference
        const newStatus = updatedRemainingAmount <= 0 ? 'Completed' : 'Running'

        await db.contract.update({
          where: { id: existingPayment.contractId },
          data: {
            totalPaid: updatedTotalPaid,
            remainingAmount: updatedRemainingAmount,
            status: newStatus,
          },
        })
      }
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Failed to update payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the payment before deleting
    const payment = await db.payment.findUnique({
      where: { id },
    })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Delete the payment
    await db.payment.delete({ where: { id } })

    // Revert the contract totals
    const contract = await db.contract.findUnique({
      where: { id: payment.contractId },
    })
    if (contract) {
      const newTotalPaid = contract.totalPaid - payment.amount
      const newRemainingAmount = contract.remainingAmount + payment.amount

      await db.contract.update({
        where: { id: payment.contractId },
        data: {
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: 'Running', // Set back to Running when payment is deleted
        },
      })
    }

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Failed to delete payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
