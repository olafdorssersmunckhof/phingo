import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sql } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(req: Request) {
  const { username, password, inviteCode } = await req.json()

  if (!username || !password || !inviteCode) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const [invite] = await sql`
    SELECT code, host_id FROM invite_codes WHERE code = ${inviteCode}
  `
  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }
  if (invite.host_id) {
    return NextResponse.json({ error: 'Invite code already used' }, { status: 400 })
  }

  const [existing] = await sql`SELECT id FROM hosts WHERE username = ${username}`
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  const [host] = await sql`
    INSERT INTO hosts (username, password_hash) VALUES (${username}, ${passwordHash}) RETURNING id, username
  `
  await sql`
    UPDATE invite_codes SET host_id = ${host.id}, used_at = now() WHERE code = ${inviteCode}
  `

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.hostId = host.id
  session.username = host.username
  await session.save()

  return NextResponse.json({ hostId: host.id, username: host.username })
}
