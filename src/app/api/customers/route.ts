import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        contracts: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      fatherName,
      cnic,
      phone,
      altPhone,
      address,
      city,
      occupation,
      income,
      guarantorName,
      guarantorPhone,
      status,
    } = body

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        fullName,
        fatherName: fatherName || null,
        cnic: cnic || '',
        phone: phone || '',
        altPhone: altPhone || null,
        address: address || null,
        city: city || null,
        occupation: occupation || null,
        income: income || null,
        guarantorName: guarantorName || null,
        guarantorPhone: guarantorPhone || null,
        status: status || 'Active',
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Failed to create customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
