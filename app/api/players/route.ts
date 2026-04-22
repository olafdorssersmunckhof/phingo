import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const { game_code, name } = await request.json()

  if (!game_code || !name) {
    return NextResponse.json(
      { error: 'game_code and name are required' },
      { status: 400 }
    )
  }

  const [game] = await sql`
    SELECT id, status FROM games WHERE code = ${(game_code as string).toUpperCase()}
  `

  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status === 'closed') return NextResponse.json({ error: 'Game is closed' }, { status: 400 })

  const [player] = await sql`
    INSERT INTO players (game_id, name)
    VALUES (${game.id}, ${name})
    RETURNING id, game_id
  `

  if (!player) {
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
  }

  return NextResponse.json({ player_id: player.id, game_id: player.game_id })
}
