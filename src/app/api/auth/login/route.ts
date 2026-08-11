import { NextRequest, NextResponse } from 'next/server'
import { LoginSchema } from '@/schemas/auth'
import { loginUser } from '@/services/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const user = await loginUser(parsed.data)
    await createSession(user.id)

    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
