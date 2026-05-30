import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        inventoryItems: true,
        vendorPayments: {
          orderBy: { createdAt: 'desc' },
        },
        vendorContracts: {
          include: {
            item: true,
            installments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Failed to fetch vendor:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const vendor = await db.vendor.update({
      where: { id },
      data: {
        name: body.name,
        company: body.company,
        phone: body.phone,
        address: body.address ?? null,
      },
    })
    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Failed to update vendor:', error)
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.vendor.delete({ where: { id } })
    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    console.error('Failed to delete vendor:', error)
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
  }
}
