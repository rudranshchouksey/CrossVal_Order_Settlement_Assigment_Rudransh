import { NextRequest, NextResponse } from 'next/server'
import { RegisterSchema } from '@/schemas/auth'
import { registerUser } from '@/services/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const user = await registerUser(parsed.data)
    await createSession(user.id)

    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Email already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
