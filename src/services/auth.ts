import { db } from './db'
import bcrypt from 'bcryptjs'
import { LoginInput, RegisterInput } from '../schemas/auth'

export async function registerUser(input: RegisterInput) {
  // Check for duplicate email
  const existingUser = await db.user.findUnique({
    where: { email: input.email }
  })

  if (existingUser) {
    throw new Error('Email already exists')
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(input.password, salt)

  // Create user
  const user = await db.user.create({
    data: {
      email: input.email,
      password: hashedPassword
    }
  })

  return user
}

export async function loginUser(input: LoginInput) {
  const user = await db.user.findUnique({
    where: { email: input.email }
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValidPassword = await bcrypt.compare(input.password, user.password)
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials')
  }

  return user
}
