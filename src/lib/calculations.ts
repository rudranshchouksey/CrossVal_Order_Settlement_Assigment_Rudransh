export type OrderItemInput = {
  quantity: number
  unitPrice: number
}

export type PaymentInput = {
  amount: number
}

export function calculateOrderTotals(items: OrderItemInput[]) {
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.quantity * item.unitPrice)
  }, 0)

  const orderTotal = subtotal

  return {
    subtotal,
    orderTotal,
  }
}

export function calculateAmountPaid(payments: PaymentInput[]) {
  return payments.reduce((acc, payment) => acc + payment.amount, 0)
}

export function calculateAmountDue(orderTotal: number, amountPaid: number) {
  const due = orderTotal - amountPaid
  return due < 0 ? 0 : due // Protect against negative due amounts conceptually
}

export type OrderStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue'

export function calculateOrderStatus(orderTotal: number, amountPaid: number, dueDate: Date): OrderStatus {
  // Precedence 1: Paid (fully paid order should never be overdue)
  if (amountPaid >= orderTotal && orderTotal > 0) {
    return 'paid'
  }

  // Precedence 2: Overdue (not fully paid AND past due)
  const isPastDue = new Date() > dueDate
  if (isPastDue && amountPaid < orderTotal) {
    return 'overdue'
  }

  // Precedence 3: Partially Paid
  if (amountPaid > 0 && amountPaid < orderTotal) {
    return 'partially_paid'
  }

  // Precedence 4: Pending (no payments)
  return 'pending'
}
