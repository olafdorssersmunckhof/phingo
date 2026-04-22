import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string; challengeId: string }> }
) {
  const { challengeId } = await params
  const submissions = await sql`
    SELECT s.id, s.challenge_id, s.player_id, s.photo_url, s.submitted_at,
           p.name AS player_name
    FROM submissions s
    JOIN players p ON p.id = s.player_id
    WHERE s.challenge_id = ${challengeId}
  `
  return NextResponse.json(submissions)
}
