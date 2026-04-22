import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')

  const submissions = gameId
    ? await sql`
        SELECT s.challenge_id, s.photo_url FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.player_id = ${playerId} AND c.game_id = ${gameId}
      `
    : await sql`SELECT challenge_id, photo_url FROM submissions WHERE player_id = ${playerId}`

  return NextResponse.json(submissions)
}
