import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { GameStatus } from '@/lib/types'

const VALID_STATUSES: GameStatus[] = ['lobby', 'active', 'closed']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const { host_token, status } = await request.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const [game] = await sql`
    SELECT host_token FROM games WHERE id = ${gameId}
  `

  if (!game || game.host_token !== host_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await sql`UPDATE games SET status = ${status} WHERE id = ${gameId}`

  return NextResponse.json({ success: true })
}
