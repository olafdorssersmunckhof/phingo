import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const players = await sql`
    SELECT id, game_id, name, created_at FROM players WHERE game_id = ${gameId} ORDER BY created_at
  `
  return NextResponse.json(players)
}
