// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getOrderRoute, PUT as updateOrderRoute, DELETE as deleteOrderRoute } from '@/app/api/orders/[id]/route'
import { POST as recordPaymentRoute } from '@/app/api/orders/[id]/payments/route'
import { encrypt } from '@/lib/session'
import { db } from '@/services/db'

const mockCookies = {
  get: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies)
}))

vi.mock('@/services/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    order: { 
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn(async (cb) => {
      return await cb({
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'order_user_B', userId: 'userB' }]),
        order: { findUnique: vi.fn() },
        orderItem: { deleteMany: vi.fn() }
      })
    })
  }
}))

describe('User Isolation API Tests', () => {
  let userAToken: string;

  beforeEach(async () => {
    vi.clearAllMocks()

    // User A is logged in
    userAToken = await encrypt({ userId: 'userA', expiresAt: new Date(Date.now() + 86400000) })
    mockCookies.get.mockReturnValue({ value: userAToken })
    
    // Auth fetches the user successfully
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'userA', email: 'demo@example.com' } as any)
  })

  it('rejects GET for another user\'s order (HTTP 404)', async () => {
    // The DB will return null because the where clause includes `userId: 'userA'` but the order belongs to userB, 
    // OR we just simulate Prisma returning null when it doesn't match both conditions.
    vi.mocked(db.order.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/orders/order_user_B')
    const res = await getOrderRoute(req, { params: Promise.resolve({ id: 'order_user_B' }) })

    expect(res.status).toBe(404)
  })

  it('rejects UPDATE for another user\'s order (HTTP 404)', async () => {
    // Mocking the transaction for updateOrder where findUnique fails due to userId mismatch
    vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
      return await cb({
        order: { findUnique: vi.fn().mockResolvedValue(null) }
      } as any)
    })

    const req = new NextRequest('http://localhost:3000/api/orders/order_user_B', {
      method: 'PUT',
      body: JSON.stringify({
        customer: 'Hacked',
        dueDate: new Date().toISOString(),
        items: [{ description: 'Hacked', quantity: 1, unitPrice: 100 }]
      })
    })
    const res = await updateOrderRoute(req, { params: Promise.resolve({ id: 'order_user_B' }) })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Not Found or Forbidden')
  })

  it('rejects DELETE for another user\'s order (HTTP 404)', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/orders/order_user_B', { method: 'DELETE' })
    const res = await deleteOrderRoute(req, { params: Promise.resolve({ id: 'order_user_B' }) })

    expect(res.status).toBe(404)
  })

  it('rejects POST a payment against another user\'s order (HTTP 404)', async () => {
    // We already mocked $transaction above to return queryRaw with userId: 'userB'
    
    const req = new NextRequest('http://localhost:3000/api/orders/order_user_B/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, paymentDate: new Date().toISOString() })
    })
    const res = await recordPaymentRoute(req, { params: Promise.resolve({ id: 'order_user_B' }) })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Not Found or Forbidden')
  })
})
