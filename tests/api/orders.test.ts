// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getOrderRoute, PUT as updateOrderRoute, DELETE as deleteOrderRoute } from '@/app/api/orders/[id]/route'
import { POST as createOrderRoute, GET as listOrdersRoute } from '@/app/api/orders/route'
import { encrypt } from '@/lib/session'
import { db } from '@/services/db'

const mockCookies = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: vi.fn(() => mockCookies) }))

vi.mock('@/services/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    order: { 
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

describe('Order API Tests', () => {
  let userAToken: string;

  beforeEach(async () => {
    vi.clearAllMocks()

    userAToken = await encrypt({ userId: 'userA', expiresAt: new Date(Date.now() + 86400000) })
    mockCookies.get.mockReturnValue({ value: userAToken })
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'userA', email: 'demo@example.com' } as any)
  })

  describe('Unauthenticated access', () => {
    it('fails without session', async () => {
      mockCookies.get.mockReturnValue(undefined)
      const req = new NextRequest('http://localhost:3000/api/orders', { method: 'POST', body: JSON.stringify({}) })
      const res = await createOrderRoute(req)
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/orders (Create)', () => {
    it('fails with invalid payload (missing customer)', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ dueDate: new Date().toISOString(), items: [{ description: 'Test', quantity: 1, unitPrice: 100 }] })
      })
      const res = await createOrderRoute(req)
      expect(res.status).toBe(400)
    })

    it('fails with invalid quantity', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ customer: 'Acme', dueDate: new Date().toISOString(), items: [{ description: 'Test', quantity: 0, unitPrice: 100 }] })
      })
      const res = await createOrderRoute(req)
      expect(res.status).toBe(400)
    })

    it('fails with negative price', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ customer: 'Acme', dueDate: new Date().toISOString(), items: [{ description: 'Test', quantity: 1, unitPrice: -100 }] })
      })
      const res = await createOrderRoute(req)
      expect(res.status).toBe(400)
    })

    it('succeeds and server calculates totals (client totals ignored)', async () => {
      vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
        return await cb({
          order: {
            create: vi.fn().mockResolvedValue({
              id: 'order1',
              customer: 'Acme',
              items: [{ quantity: 2, unitPrice: 1500 }]
            })
          }
        } as any)
      })

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ 
          customer: 'Acme', 
          dueDate: new Date().toISOString(), 
          items: [{ description: 'Test', quantity: 2, unitPrice: 1500 }],
          orderTotal: 99999999 // Client attempt to override total
        })
      })
      
      const res = await createOrderRoute(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      
      // Server calculates exactly quantity * unitPrice
      expect(json.subtotal).toBe(3000)
      expect(json.orderTotal).toBe(3000)
    })
  })

  describe('GET /api/orders/[id]', () => {
    it('returns order with calculated totals', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValue({
        id: 'order1',
        customer: 'Acme',
        items: [{ quantity: 1, unitPrice: 500 }],
        payments: []
      } as any)

      const req = new NextRequest('http://localhost:3000/api/orders/order1')
      const res = await getOrderRoute(req, { params: Promise.resolve({ id: 'order1' }) })
      
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.orderTotal).toBe(500)
    })
  })

  describe('PUT /api/orders/[id]', () => {
    it('updates successfully and ignores client-provided totals', async () => {
      vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
        return await cb({
          order: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'order1',
              userId: 'userA',
              payments: []
            }),
            update: vi.fn().mockResolvedValue({
              id: 'order1',
              customer: 'Acme Updated',
              items: [{ quantity: 3, unitPrice: 1000 }]
            })
          },
          orderItem: { deleteMany: vi.fn() }
        } as any)
      })

      const req = new NextRequest('http://localhost:3000/api/orders/order1', {
        method: 'PUT',
        body: JSON.stringify({ 
          customer: 'Acme Updated', 
          dueDate: new Date().toISOString(), 
          items: [{ description: 'Test', quantity: 3, unitPrice: 1000 }],
          orderTotal: 1 // Malicious client total
        })
      })
      
      const res = await updateOrderRoute(req, { params: Promise.resolve({ id: 'order1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.orderTotal).toBe(3000)
    })
  })

  describe('DELETE /api/orders/[id]', () => {
    it('deletes successfully if no payments', async () => {
      vi.mocked(db.order.findUnique).mockResolvedValue({
        id: 'order1',
        userId: 'userA',
        payments: []
      } as any)
      
      const req = new NextRequest('http://localhost:3000/api/orders/order1', { method: 'DELETE' })
      const res = await deleteOrderRoute(req, { params: Promise.resolve({ id: 'order1' }) })
      
      expect(res.status).toBe(204)
    })
  })
})
