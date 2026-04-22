import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string; challengeId: string }> }
) {
  const { gameId, challengeId } = await params
  const { host_token, winner_player_id } = await request.json()

  const [game] = await sql`
    SELECT host_token FROM games WHERE id = ${gameId}
  `

  if (!game || game.host_token !== host_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await sql`
    UPDATE challenges
    SET winner_player_id = ${winner_player_id}
    WHERE id = ${challengeId} AND game_id = ${gameId}
  `

  return NextResponse.json({ success: true })
}
