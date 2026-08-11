import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOrderStatus, calculateAmountPaid, calculateAmountDue } from '../src/lib/calculations'
import { recordPayment } from '../src/services/payments'
import { db } from '../src/services/db'
import { PaymentError } from '../src/lib/errors'

vi.mock('../src/services/db', () => ({
  db: {
    payment: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return await cb({
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'order1', userId: 'user1' }]),
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'order1',
            userId: 'user1',
            items: [{ quantity: 1, unitPrice: 1000 }], // total 1000
            payments: [{ amount: 600 }] // paid 600, due 400
          })
        },
        payment: {
          create: vi.fn().mockResolvedValue({ id: 'pay1', amount: 300 }),
        }
      })
    })
  },
}))

describe('Payment Domain Calculations', () => {
  const tomorrow = new Date(Date.now() + 86400000)
  const yesterday = new Date(Date.now() - 86400000)

  it('calculates amount paid', () => {
    expect(calculateAmountPaid([{ amount: 100 }, { amount: 200 }])).toBe(300)
    expect(calculateAmountPaid([])).toBe(0)
  })

  it('calculates amount due', () => {
    expect(calculateAmountDue(1000, 600)).toBe(400)
    expect(calculateAmountDue(1000, 1000)).toBe(0)
    expect(calculateAmountDue(1000, 1200)).toBe(0) // Protect negative
  })

  describe('calculateOrderStatus', () => {
    it('is pending with no payments', () => {
      expect(calculateOrderStatus(1000, 0, tomorrow)).toBe('pending')
    })
    
    it('is partially_paid with partial payment', () => {
      expect(calculateOrderStatus(1000, 500, tomorrow)).toBe('partially_paid')
    })

    it('is paid with full payment', () => {
      expect(calculateOrderStatus(1000, 1000, tomorrow)).toBe('paid')
    })

    it('is overdue when unpaid and past due', () => {
      expect(calculateOrderStatus(1000, 0, yesterday)).toBe('overdue')
    })

    it('is overdue when partially paid and past due', () => {
      expect(calculateOrderStatus(1000, 500, yesterday)).toBe('overdue')
    })

    it('is paid when past due but fully paid', () => {
      expect(calculateOrderStatus(1000, 1000, yesterday)).toBe('paid')
    })
  })
})

describe('Payment Service (Concurrency logic tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects overpayment and throws custom structured error', async () => {
    // Current due is 400. We try to pay 500.
    const input = { amount: 500, paymentDate: new Date().toISOString() }
    
    await expect(recordPayment('user1', 'order1', input)).rejects.toThrow(PaymentError)
    await expect(recordPayment('user1', 'order1', input)).rejects.toThrow('Payment exceeds the remaining balance.')
  })

  it('accepts exact remaining payment', async () => {
    // Current due is 400. Try to pay exactly 400.
    const input = { amount: 400, paymentDate: new Date().toISOString() }
    const result = await recordPayment('user1', 'order1', input)
    
    expect(result.id).toBe('pay1')
  })
})
