import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOrderTotals } from '../src/lib/calculations'
import { getOrder, createOrder } from '../src/services/orders'
import { db } from '../src/services/db'

vi.mock('../src/services/db', () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    orderItem: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      // Very basic transaction mock
      return await cb({
        order: {
          create: vi.mocked(db.order.create),
          findUnique: vi.mocked(db.order.findUnique),
          update: vi.mocked(db.order.update),
        },
        orderItem: {
          deleteMany: vi.mocked(db.orderItem.deleteMany),
        }
      })
    })
  },
}))

describe('Order Calculations', () => {
  it('calculates totals correctly for single line item', () => {
    const items = [{ quantity: 1, unitPrice: 1000 }]
    const totals = calculateOrderTotals(items)
    expect(totals.subtotal).toBe(1000)
    expect(totals.orderTotal).toBe(1000)
  })

  it('calculates totals correctly for multiple line items', () => {
    const items = [
      { quantity: 2, unitPrice: 1000 },
      { quantity: 1, unitPrice: 500 }
    ]
    const totals = calculateOrderTotals(items)
    expect(totals.subtotal).toBe(2500)
    expect(totals.orderTotal).toBe(2500)
  })

  it('calculates totals correctly with zero price', () => {
    const items = [{ quantity: 5, unitPrice: 0 }]
    const totals = calculateOrderTotals(items)
    expect(totals.subtotal).toBe(0)
    expect(totals.orderTotal).toBe(0)
  })
})

describe('Order Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrder', () => {
    it('throws error if order not found or not owned', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null)
      await expect(getOrder('user1', 'order1')).rejects.toThrow('Order not found')
      expect(db.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1', userId: 'user1' },
        include: { items: true }
      })
    })

    it('returns order with calculated totals', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        customer: 'Test',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [{ id: 'item1', orderId: 'order1', description: 'Item 1', quantity: 2, unitPrice: 1000 }]
      } as any)

      const order = await getOrder('user1', 'order1')
      expect(order.id).toBe('order1')
      expect(order.subtotal).toBe(2000)
      expect(order.orderTotal).toBe(2000)
    })
  })

  describe('createOrder', () => {
    it('creates order and returns with totals', async () => {
      vi.mocked(db.order.create).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        customer: 'Customer 1',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [{ id: 'item1', orderId: 'order1', description: 'Item 1', quantity: 1, unitPrice: 500 }]
      } as any)

      const payload = {
        customer: 'Customer 1',
        dueDate: new Date().toISOString(),
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 500 }]
      }

      const order = await createOrder('user1', payload)
      expect(db.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          customer: 'Customer 1'
        }),
        include: { items: true }
      })
      expect(order.subtotal).toBe(500)
    })
  })
})
