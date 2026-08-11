import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOrderTotals } from '../src/lib/calculations'
import { getOrder, createOrder, updateOrder, deleteOrder } from '../src/services/orders'
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

describe('Order Services (Security and Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrder', () => {
    it('returns order with calculated totals', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        customer: 'Test',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [{ id: 'item1', orderId: 'order1', description: 'Item 1', quantity: 2, unitPrice: 1000 }],
        payments: []
      } as any)

      const order = await getOrder('user1', 'order1')
      expect(order.subtotal).toBe(2000)
    })
  })

  describe('updateOrder', () => {
    it('prevents update if new total is less than amount already paid', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        items: [{ quantity: 1, unitPrice: 1000 }], // original 1000
        payments: [{ amount: 500 }] // paid 500
      } as any)

      // Malicious attempt to change order total to 100
      const payload = {
        customer: 'Test',
        dueDate: new Date().toISOString(),
        items: [{ description: 'Cheap', quantity: 1, unitPrice: 100 }]
      }

      await expect(updateOrder('user1', 'order1', payload)).rejects.toThrow('New order total cannot be less than the amount already paid')
    })
    
    it('allows update if new total is >= amount already paid', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        items: [{ quantity: 1, unitPrice: 1000 }], // original 1000
        payments: [{ amount: 500 }] // paid 500
      } as any)
      
      vi.mocked(db.order.update).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        items: [{ quantity: 1, unitPrice: 600 }] // new total 600 (>= 500)
      } as any)

      const payload = {
        customer: 'Test',
        dueDate: new Date().toISOString(),
        items: [{ description: 'Valid', quantity: 1, unitPrice: 600 }]
      }

      const updated = await updateOrder('user1', 'order1', payload)
      expect(updated.orderTotal).toBe(600)
    })
  })

  describe('deleteOrder', () => {
    it('prevents deletion if payments exist', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        payments: [{ amount: 500 }]
      } as any)

      await expect(deleteOrder('user1', 'order1')).rejects.toThrow('Cannot delete an order that has recorded payments')
    })

    it('allows deletion if no payments exist', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: 'order1',
        userId: 'user1',
        payments: []
      } as any)

      const result = await deleteOrder('user1', 'order1')
      expect(result.success).toBe(true)
      expect(db.order.delete).toHaveBeenCalledWith({ where: { id: 'order1' } })
    })
  })
})
