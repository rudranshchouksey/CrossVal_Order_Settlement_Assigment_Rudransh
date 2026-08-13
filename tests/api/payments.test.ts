// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/orders/[id]/payments/route'
import { encrypt } from '@/lib/session'
import { db } from '@/services/db'

const mockCookies = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: vi.fn(() => mockCookies) }))

vi.mock('@/services/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    payment: { create: vi.fn() },
    $transaction: vi.fn()
  }
}))

describe('Payment API Tests', () => {
  let userAToken: string;

  beforeEach(async () => {
    vi.clearAllMocks()

    userAToken = await encrypt({ userId: 'userA', expiresAt: new Date(Date.now() + 86400000) })
    mockCookies.get.mockReturnValue({ value: userAToken })
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'userA', email: 'demo@example.com' } as any)
  })

  it('rejects payment exceeding remaining balance (HTTP 422)', async () => {
    vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
      return await cb({
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'order1', userId: 'userA' }]),
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'order1',
            userId: 'userA',
            items: [{ quantity: 1, unitPrice: 100000 }], // Total $1000.00
            payments: [{ amount: 60000 }] // Paid $600.00, Remaining $400.00
          })
        },
        payment: { create: vi.fn() }
      } as any)
    })

    const req = new NextRequest('http://localhost:3000/api/orders/order1/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 50000, paymentDate: new Date().toISOString() })
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'order1' }) })

    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error.code).toBe('PAYMENT_EXCEEDS_BALANCE')
    expect(json.error.details.requested).toBe(50000)
    expect(json.error.details.remaining).toBe(40000)
  })

  it('accepts payment exactly equal to remaining balance (HTTP 201)', async () => {
    vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'order1', userId: 'userA' }]),
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'order1',
            userId: 'userA',
            items: [{ quantity: 1, unitPrice: 100000 }],
            payments: [{ amount: 60000 }]
          })
        },
        payment: { 
          create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'pay1', ...args.data })) 
        }
      }
      return await cb(mockTx as any)
    })

    const req = new NextRequest('http://localhost:3000/api/orders/order1/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 40000, paymentDate: new Date().toISOString() })
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'order1' }) })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.amount).toBe(40000)
  })

  it('rejects $1 payment when balance is already $0 (HTTP 422)', async () => {
    vi.mocked(db.$transaction).mockImplementationOnce(async (cb) => {
      return await cb({
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'order1', userId: 'userA' }]),
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'order1',
            userId: 'userA',
            items: [{ quantity: 1, unitPrice: 100000 }],
            payments: [{ amount: 60000 }, { amount: 40000 }] // Paid $1000.00, Remaining $0
          })
        },
        payment: { create: vi.fn() }
      } as any)
    })

    const req = new NextRequest('http://localhost:3000/api/orders/order1/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, paymentDate: new Date().toISOString() }) // Try to pay $1
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'order1' }) })

    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error.code).toBe('PAYMENT_EXCEEDS_BALANCE')
  })
})
