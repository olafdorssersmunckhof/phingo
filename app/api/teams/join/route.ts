import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: Request) {
  const { joinCode } = await req.json()

  if (!joinCode) {
    return NextResponse.json({ error: 'Join code required' }, { status: 400 })
  }

  const [team] = await sql`SELECT id, game_id, name FROM teams WHERE join_code = ${joinCode.toUpperCase()}`
  if (!team) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })
  }

  const [game] = await sql`SELECT status FROM games WHERE id = ${team.game_id}`
  if (game?.status === 'closed') {
    return NextResponse.json({ error: 'This game has ended' }, { status: 400 })
  }

  return NextResponse.json({ teamId: team.id, gameId: team.game_id, teamName: team.name })
}
