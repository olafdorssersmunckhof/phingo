import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const rows = await sql`
    SELECT s.challenge_id, COUNT(*)::int AS count
    FROM submissions s
    JOIN challenges c ON c.id = s.challenge_id
    WHERE c.game_id = ${gameId}
    GROUP BY s.challenge_id
  `
  const counts: Record<string, number> = {}
  rows.forEach((r) => {
    counts[r.challenge_id] = r.count
  })
  return NextResponse.json(counts)
}
