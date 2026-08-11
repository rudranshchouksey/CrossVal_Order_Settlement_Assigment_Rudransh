import { db } from './db'
import { CreatePaymentInput } from '../schemas/payments'
import { calculateOrderTotals, calculateAmountPaid, calculateAmountDue } from '../lib/calculations'
import { PaymentError } from '../lib/errors'

export async function recordPayment(userId: string, orderId: string, input: CreatePaymentInput) {
  return await db.$transaction(async (tx) => {
    // 1. Lock the order row to prevent concurrent payment races
    // Note: We use Prisma's raw query to execute a SELECT ... FOR UPDATE.
    // The query returns the locked row(s), blocking other transactions from modifying it.
    const lockedOrder: any[] = await tx.$queryRaw`SELECT id, "userId" FROM "Order" WHERE id = ${orderId} FOR UPDATE`

    if (lockedOrder.length === 0) {
      throw new Error('Order not found or access denied')
    }

    if (lockedOrder[0].userId !== userId) {
      throw new Error('Order not found or access denied')
    }

    // 2. Fetch the full order state along with existing items and payments
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    })

    if (!order) {
      throw new Error('Order not found or access denied')
    }

    // 3. Calculate current state
    const { orderTotal } = calculateOrderTotals(order.items)
    const amountPaid = calculateAmountPaid(order.payments)
    const amountDue = calculateAmountDue(orderTotal, amountPaid)

    // 4. Validate payment amount
    if (input.amount <= 0) {
      throw new PaymentError('Payment amount must be greater than zero.', 'INVALID_PAYMENT_AMOUNT')
    }

    if (input.amount > amountDue) {
      throw new PaymentError('Payment exceeds the remaining balance.', 'PAYMENT_EXCEEDS_BALANCE', {
        requested: input.amount,
        remaining: amountDue,
      })
    }

    // 5. Record the payment
    const payment = await tx.payment.create({
      data: {
        orderId,
        amount: input.amount,
        paymentDate: new Date(input.paymentDate),
        note: input.note,
      },
    })

    return payment
  })
}
