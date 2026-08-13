// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getOrderRoute } from '@/app/api/orders/[id]/route'
import { calculateOrderStatus, calculateAmountPaid } from '@/lib/calculations'
import { encrypt } from '@/lib/session'
import { db } from '@/services/db'

const mockCookies = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: vi.fn(() => mockCookies) }))

vi.mock('@/services/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    order: { findUnique: vi.fn() }
  }
}))

describe('Status Engine API Integration', () => {
  let userAToken: string;
  const tomorrow = new Date(Date.now() + 86400000).toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()

  beforeEach(async () => {
    vi.clearAllMocks()
    userAToken = await encrypt({ userId: 'userA', expiresAt: new Date(Date.now() + 86400000) })
    mockCookies.get.mockReturnValue({ value: userAToken })
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'userA', email: 'demo@example.com' } as any)
  })

  // Helper to fetch the order from the API and calculate its status exactly as the UI would
  async function fetchAndDeriveStatus(orderId: string) {
    const req = new NextRequest(`http://localhost:3000/api/orders/${orderId}`)
    const res = await getOrderRoute(req, { params: Promise.resolve({ id: orderId }) })
    const data = await res.json()
    const amountPaid = calculateAmountPaid(data.payments || [])
    return calculateOrderStatus(data.orderTotal, amountPaid, new Date(data.dueDate))
  }

  it('evaluates as pending when no payments and not past due', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(tomorrow),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: []
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('pending')
  })

  it('evaluates as partially_paid when partial payment exists', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(tomorrow),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: [{ amount: 500 }]
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('partially_paid')
  })

  it('evaluates as paid when fully paid', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(tomorrow),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: [{ amount: 1000 }]
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('paid')
  })

  it('evaluates as overdue when unpaid and past due', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(yesterday),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: []
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('overdue')
  })

  it('evaluates as overdue when partially paid and past due', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(yesterday),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: [{ amount: 500 }]
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('overdue')
  })

  it('evaluates as paid when past due but fully paid', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      id: 'order1', userId: 'userA', dueDate: new Date(yesterday),
      items: [{ quantity: 1, unitPrice: 1000 }], payments: [{ amount: 1000 }]
    } as any)

    const status = await fetchAndDeriveStatus('order1')
    expect(status).toBe('paid')
  })
})
