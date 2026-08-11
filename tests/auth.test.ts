import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerUser, loginUser } from '../src/services/auth'
import { db } from '../src/services/db'
import bcrypt from 'bcryptjs'

// Mock the db service
vi.mock('../src/services/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('Auth Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerUser', () => {
    it('throws error if email already exists', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: '1', email: 'test@test.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() })

      await expect(registerUser({ email: 'test@test.com', password: 'password123' })).rejects.toThrow('Email already exists')
    })

    it('creates a user with hashed password', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({ id: '2', email: 'new@test.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() })

      const user = await registerUser({ email: 'new@test.com', password: 'password123' })
      expect(user.id).toBe('2')
      expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@test.com',
        })
      }))
    })
  })

  describe('loginUser', () => {
    it('throws error for invalid email', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      await expect(loginUser({ email: 'nonexistent@test.com', password: 'password' })).rejects.toThrow('Invalid credentials')
    })

    it('throws error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: '1', email: 'test@test.com', password: hashedPassword, createdAt: new Date(), updatedAt: new Date() })

      await expect(loginUser({ email: 'test@test.com', password: 'wrong_password' })).rejects.toThrow('Invalid credentials')
    })

    it('returns user for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: '1', email: 'test@test.com', password: hashedPassword, createdAt: new Date(), updatedAt: new Date() })

      const user = await loginUser({ email: 'test@test.com', password: 'correct_password' })
      expect(user.id).toBe('1')
    })
  })
})
