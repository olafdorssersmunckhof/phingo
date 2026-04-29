import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const teams = await sql`SELECT id, name, join_code, created_at FROM teams WHERE game_id = ${gameId} ORDER BY created_at`
  return NextResponse.json(teams)
}
