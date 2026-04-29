import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string; challengeId: string }> }
) {
  const { challengeId } = await params
  const submissions = await sql`
    SELECT s.id, s.challenge_id, s.team_id, s.photo_url, s.submitted_at,
           t.name AS team_name
    FROM submissions s
    JOIN teams t ON t.id = s.team_id
    WHERE s.challenge_id = ${challengeId}
  `
  return NextResponse.json(submissions)
}
