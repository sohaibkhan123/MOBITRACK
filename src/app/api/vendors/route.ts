import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendors = await db.vendor.findMany({
      include: {
        inventoryItems: true,
        vendorPayments: true,
        vendorContracts: {
          include: {
            item: true,
            installments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Failed to fetch vendors:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, company, phone, address } = body

    if (!name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const vendor = await db.vendor.create({
      data: {
        name,
        company: company || '',
        phone: phone || '',
        address: address || null,
      },
    })
    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor:', error)
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
