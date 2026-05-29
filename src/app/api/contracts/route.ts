import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const contracts = await db.contract.findMany({
      include: {
        customer: true,
        item: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      contractNumber,
      customerId,
      itemId,
      saleDate,
      purchasePrice,
      totalPrice,
      totalProfit,
      downPayment,
      remainingAmount,
      installmentsCount,
      installmentAmount,
      profitPerInstallment,
      principalPerInstallment,
      frequency,
      nextDueDate,
      totalPaid,
      status,
    } = body

    if (!contractNumber || !customerId || !itemId || !saleDate) {
      return NextResponse.json(
        { error: 'Contract number, customer, item, and sale date are required' },
        { status: 400 }
      )
    }

    const contract = await db.contract.create({
      data: {
        contractNumber,
        customerId,
        itemId,
        saleDate,
        purchasePrice: purchasePrice || 0,
        totalPrice: totalPrice || 0,
        totalProfit: totalProfit || 0,
        downPayment: downPayment || 0,
        remainingAmount: remainingAmount || 0,
        installmentsCount: installmentsCount || 1,
        installmentAmount: installmentAmount || 0,
        profitPerInstallment: profitPerInstallment || 0,
        principalPerInstallment: principalPerInstallment || 0,
        frequency: frequency || 'Monthly',
        nextDueDate: nextDueDate || null,
        totalPaid: totalPaid || 0,
        status: status || 'Running',
      },
      include: {
        customer: true,
        item: true,
      },
    })

    // Set the inventory item status to 'Sold'
    await db.inventoryItem.update({
      where: { id: itemId },
      data: { status: 'Sold' },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
