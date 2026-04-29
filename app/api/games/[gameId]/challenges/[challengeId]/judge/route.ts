import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sql } from '@/lib/db'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string; challengeId: string }> }
) {
  const { gameId, challengeId } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [game] = await sql`SELECT id FROM games WHERE id = ${gameId} AND host_id = ${session.hostId}`
  if (!game) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { winner_team_id } = await request.json()

  await sql`
    UPDATE challenges SET winner_team_id = ${winner_team_id} WHERE id = ${challengeId} AND game_id = ${gameId}
  `

  return NextResponse.json({ ok: true })
}
