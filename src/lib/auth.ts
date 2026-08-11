import { db } from '../services/db'
import { getSession } from './session'

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.userId) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

// Ensure the user owns the order. Throws Error if not found or not owned.
export async function requireOrderOwnership(orderId: string) {
  const user = await requireAuth()
  
  const order = await db.order.findUnique({
    where: { id: orderId }
  })

  if (!order || order.userId !== user.id) {
    throw new Error('NOT_FOUND_OR_FORBIDDEN')
  }

  return order
}
