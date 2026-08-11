export type OrderItemInput = {
  quantity: number
  unitPrice: number
}

export function calculateOrderTotals(items: OrderItemInput[]) {
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.quantity * item.unitPrice)
  }, 0)

  // In Phase 3, orderTotal is strictly equal to the subtotal.
  const orderTotal = subtotal

  return {
    subtotal,
    orderTotal,
  }
}
