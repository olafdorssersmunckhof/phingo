import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const challenges = await sql`
    SELECT id, game_id, title, description, "order", winner_team_id, created_at
    FROM challenges WHERE game_id = ${gameId} ORDER BY "order"
  `
  return NextResponse.json(challenges)
}
