import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('gameId')

  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 })

  const submissions = await sql`
    SELECT s.id, s.challenge_id, s.photo_url, s.submitted_at
    FROM submissions s
    JOIN challenges c ON c.id = s.challenge_id
    WHERE s.team_id = ${teamId} AND c.game_id = ${gameId}
  `
  return NextResponse.json(submissions)
}
