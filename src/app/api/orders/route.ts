import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { CreateOrderSchema } from '@/schemas/orders'
import { createOrder, listOrders } from '@/services/orders'

export async function GET() {
  try {
    const user = await requireAuth()
    const orders = await listOrders(user.id)
    return NextResponse.json(orders)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const parsed = CreateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const order = await createOrder(user.id, parsed.data)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
