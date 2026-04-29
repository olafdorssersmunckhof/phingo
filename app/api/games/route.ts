import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sql } from '@/lib/db'
import { sessionOptions, type SessionData } from '@/lib/session'

function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function uniqueGameCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode(4)
    const rows = await sql`SELECT id FROM games WHERE code = ${code}`
    if (rows.length === 0) return code
  }
  return generateCode(4)
}

async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode(6)
    const rows = await sql`SELECT id FROM teams WHERE join_code = ${code}`
    if (rows.length === 0) return code
  }
  return generateCode(6)
}

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const games = await sql`
    SELECT id, code, name, status, created_at FROM games WHERE host_id = ${session.hostId} ORDER BY created_at DESC
  `
  return NextResponse.json(games)
}

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, challenges, teams } = await req.json()

  if (!name || !Array.isArray(challenges) || challenges.length === 0) {
    return NextResponse.json({ error: 'name and at least one challenge are required' }, { status: 400 })
  }
  if (!Array.isArray(teams) || teams.length === 0) {
    return NextResponse.json({ error: 'at least one team is required' }, { status: 400 })
  }

  const code = await uniqueGameCode()
  const [game] = await sql`
    INSERT INTO games (name, code, host_id, status) VALUES (${name}, ${code}, ${session.hostId}, 'lobby') RETURNING id, code
  `

  for (let i = 0; i < challenges.length; i++) {
    const c = challenges[i] as { title: string; description?: string }
    await sql`INSERT INTO challenges (game_id, title, description, "order") VALUES (${game.id}, ${c.title}, ${c.description ?? null}, ${i})`
  }

  const createdTeams: Array<{ id: string; name: string; join_code: string }> = []
  for (const t of teams as { name: string }[]) {
    const joinCode = await uniqueJoinCode()
    const [team] = await sql`INSERT INTO teams (game_id, name, join_code) VALUES (${game.id}, ${t.name}, ${joinCode}) RETURNING id, name, join_code`
    createdTeams.push(team as { id: string; name: string; join_code: string })
  }

  return NextResponse.json({ id: game.id, code: game.code, teams: createdTeams })
}
