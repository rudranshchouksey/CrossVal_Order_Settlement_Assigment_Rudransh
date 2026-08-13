import { vi } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => {
  return {
    cookies: vi.fn().mockImplementation(() => {
      return {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      }
    })
  }
})
