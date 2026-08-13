// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/orders/route'
import { encrypt } from '@/lib/session'
import { db } from '@/services/db'

// We need to mock next/headers to simulate cookies
const mockCookies = {
  get: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies)
}))

// Mock db for the valid session test so it doesn't hit real DB
vi.mock('@/services/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    order: { findMany: vi.fn() }
  }
}))

describe('Authentication API Middleware / Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user1' } as any)
    vi.mocked(db.order.findMany).mockResolvedValue([])
  })

  it('rejects API request without a session cookie (HTTP 401)', async () => {
    mockCookies.get.mockReturnValue(undefined)

    const req = new NextRequest('http://localhost:3000/api/orders')
    const res = await GET()

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('rejects API request with an invalid/expired session cookie (HTTP 401)', async () => {
    mockCookies.get.mockReturnValue({ value: 'invalid.jwt.token' })

    const req = new NextRequest('http://localhost:3000/api/orders')
    const res = await GET()

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('accepts API request with a valid session cookie', async () => {
    // Generate a real valid token using the app's own encrypt function
    const validToken = await encrypt({ userId: 'user1', expiresAt: new Date(Date.now() + 86400000) })

    mockCookies.get.mockReturnValue({ value: validToken })
    
    const req = new NextRequest('http://localhost:3000/api/orders')
    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })
})
