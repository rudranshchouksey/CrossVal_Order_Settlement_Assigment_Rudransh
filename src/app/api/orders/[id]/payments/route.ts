import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { PaymentSchema } from '@/schemas/payments'
import { recordPayment } from '@/services/payments'
import { PaymentError } from '@/lib/errors'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    const parsed = PaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const payment = await recordPayment(user.id, id, parsed.data)
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof PaymentError) {
      return NextResponse.json(error.toJSON(), { status: 422 })
    }
    if (error.message === 'Order not found or access denied') {
      return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
