import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const { challenge_id, player_id, photo_url } = await request.json()

  if (!challenge_id || !player_id || !photo_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [submission] = await sql`
    INSERT INTO submissions (challenge_id, player_id, photo_url)
    VALUES (${challenge_id}, ${player_id}, ${photo_url})
    ON CONFLICT (challenge_id, player_id)
    DO UPDATE SET photo_url = ${photo_url}, submitted_at = now()
    RETURNING id, photo_url
  `

  return NextResponse.json(submission)
}
