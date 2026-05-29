import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        customer: true,
        item: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    return NextResponse.json(contract)
  } catch (error) {
    console.error('Failed to fetch contract:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const contract = await db.contract.update({
      where: { id },
      data: {
        contractNumber: body.contractNumber,
        customerId: body.customerId,
        itemId: body.itemId,
        saleDate: body.saleDate,
        purchasePrice: body.purchasePrice,
        totalPrice: body.totalPrice,
        totalProfit: body.totalProfit,
        downPayment: body.downPayment,
        remainingAmount: body.remainingAmount,
        installmentsCount: body.installmentsCount,
        installmentAmount: body.installmentAmount,
        profitPerInstallment: body.profitPerInstallment,
        principalPerInstallment: body.principalPerInstallment,
        frequency: body.frequency,
        nextDueDate: body.nextDueDate ?? null,
        totalPaid: body.totalPaid,
        status: body.status,
      },
      include: {
        customer: true,
        item: true,
      },
    })
    return NextResponse.json(contract)
  } catch (error) {
    console.error('Failed to update contract:', error)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get the contract first to find the item
    const contract = await db.contract.findUnique({
      where: { id },
    })
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Set the inventory item status back to 'Available'
    await db.inventoryItem.update({
      where: { id: contract.itemId },
      data: { status: 'Available' },
    })

    // Delete related payments first
    await db.payment.deleteMany({
      where: { contractId: id },
    })

    await db.contract.delete({ where: { id } })
    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Failed to delete contract:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
