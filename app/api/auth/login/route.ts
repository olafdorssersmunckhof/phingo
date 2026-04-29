import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sql } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const [host] = await sql`SELECT id, username, password_hash FROM hosts WHERE username = ${username}`
  if (!host) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const valid = await verifyPassword(password, host.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.hostId = host.id
  session.username = host.username
  await session.save()

  return NextResponse.json({ hostId: host.id, username: host.username })
}
