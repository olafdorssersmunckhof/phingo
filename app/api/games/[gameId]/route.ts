import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const [game] = await sql`SELECT id, code, name, status, created_at FROM games WHERE id = ${gameId}`
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(game)
}
