import { db } from './db'
import { CreateOrderInput, UpdateOrderInput } from '../schemas/orders'
import { calculateOrderTotals } from '../lib/calculations'

export async function listOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
  
  return orders.map(order => {
    const { subtotal, orderTotal } = calculateOrderTotals(order.items)
    return { ...order, subtotal, orderTotal }
  })
}

export async function getOrder(userId: string, orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId, userId },
    include: { items: true },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  const { subtotal, orderTotal } = calculateOrderTotals(order.items)
  return { ...order, subtotal, orderTotal }
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  // Use a transaction to ensure atomic creation
  return await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        customer: input.customer,
        dueDate: new Date(input.dueDate),
        items: {
          create: input.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    })

    const { subtotal, orderTotal } = calculateOrderTotals(order.items)
    return { ...order, subtotal, orderTotal }
  })
}

export async function updateOrder(userId: string, orderId: string, input: UpdateOrderInput) {
  return await db.$transaction(async (tx) => {
    // 1. Verify ownership securely inside the transaction
    const existingOrder = await tx.order.findUnique({
      where: { id: orderId, userId }
    })

    if (!existingOrder) {
      throw new Error('Order not found or access denied')
    }

    // 2. Delete existing items
    await tx.orderItem.deleteMany({
      where: { orderId }
    })

    // 3. Update order and create new items
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        customer: input.customer,
        dueDate: new Date(input.dueDate),
        items: {
          create: input.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    })

    const { subtotal, orderTotal } = calculateOrderTotals(updatedOrder.items)
    return { ...updatedOrder, subtotal, orderTotal }
  })
}

export async function deleteOrder(userId: string, orderId: string) {
  // Prisma checks both criteria, deleting safely
  const existingOrder = await db.order.findUnique({
    where: { id: orderId, userId }
  })

  if (!existingOrder) {
    throw new Error('Order not found or access denied')
  }

  await db.order.delete({
    where: { id: orderId },
  })

  return { success: true }
}
