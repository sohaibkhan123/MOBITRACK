import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch shop settings
    let settings = await db.shopSettings.findUnique({
      where: { id: 'shop-settings' },
    })
    if (!settings) {
      settings = await db.shopSettings.create({
        data: { id: 'shop-settings' },
      })
    }
    // Customer stats
    const totalCustomers = await db.customer.count()
    const activeCustomers = await db.customer.count({
      where: { status: 'Active' },
    })

    // Contract stats
    const totalContracts = await db.contract.count()
    const activeContracts = await db.contract.count({
      where: { status: 'Running' },
    })
    const completedContracts = await db.contract.count({
      where: { status: 'Completed' },
    })

    // Overdue contracts: Running contracts with nextDueDate in the past
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const overdueContractsList = await db.contract.findMany({
      where: {
        status: 'Running',
        nextDueDate: { lt: todayStr },
      },
    })
    const overdueContracts = overdueContractsList.length

    // Total outstanding (sum of remainingAmount for active/overdue contracts)
    const activeAndOverdueContracts = await db.contract.findMany({
      where: {
        status: { in: ['Running'] },
      },
      select: { remainingAmount: true },
    })
    const totalOutstanding = activeAndOverdueContracts.reduce(
      (sum, c) => sum + c.remainingAmount,
      0
    )

    // Overdue amount (sum of remainingAmount for overdue contracts)
    const overdueAmount = overdueContractsList.reduce(
      (sum, c) => sum + c.remainingAmount,
      0
    )

    // Collected this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0]
    const paymentsThisMonth = await db.payment.findMany({
      where: {
        date: { gte: startOfMonthStr },
      },
      select: { amount: true },
    })
    const collectedThisMonth = paymentsThisMonth.reduce(
      (sum, p) => sum + p.amount,
      0
    )

    // Inventory stats
    const totalInventory = await db.inventoryItem.count()
    const availableInventory = await db.inventoryItem.count({
      where: { status: 'Available' },
    })
    const soldInventory = await db.inventoryItem.count({
      where: { status: 'Sold' },
    })

    // Vendor stats
    const totalVendors = await db.vendor.count()

    // Recent payments (last 5)
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        contract: {
          include: {
            item: true,
          },
        },
      },
    })

    // Upcoming payments (contracts with nextDueDate in the future)
    const upcomingPayments = await db.contract.findMany({
      where: {
        status: 'Running',
        nextDueDate: { gte: todayStr },
      },
      include: {
        customer: true,
        item: true,
      },
      orderBy: { nextDueDate: 'asc' },
      take: 10,
    })

    // Collection data (last 7 days)
    const collectionData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayPayments = await db.payment.findMany({
        where: { date: dateStr },
        select: { amount: true },
      })
      const dayTotal = dayPayments.reduce((sum, p) => sum + p.amount, 0)
      collectionData.push({
        date: dateStr,
        total: dayTotal,
      })
    }

    return NextResponse.json({
      totalCustomers,
      activeCustomers,
      totalContracts,
      activeContracts,
      completedContracts,
      overdueContracts,
      totalOutstanding,
      overdueAmount,
      collectedThisMonth,
      totalInventory,
      availableInventory,
      soldInventory,
      totalVendors,
      recentPayments,
      upcomingPayments,
      collectionData,
      settings,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
