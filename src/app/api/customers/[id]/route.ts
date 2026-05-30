import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            item: true,
          },
        },
        payments: true,
      },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Failed to fetch customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const customer = await db.customer.update({
      where: { id },
      data: {
        fullName: body.fullName,
        fatherName: body.fatherName ?? null,
        cnic: body.cnic,
        phone: body.phone,
        altPhone: body.altPhone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        occupation: body.occupation ?? null,
        income: body.income ?? null,
        guarantorName: body.guarantorName ?? null,
        guarantorPhone: body.guarantorPhone ?? null,
        status: body.status,
      },
    })
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Failed to update customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Failed to delete customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
