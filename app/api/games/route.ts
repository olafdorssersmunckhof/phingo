import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export async function POST(request: Request) {
  const { name, challenges } = await request.json()

  if (!name || !Array.isArray(challenges) || challenges.length === 0) {
    return NextResponse.json(
      { error: 'name and at least one challenge are required' },
      { status: 400 }
    )
  }

  // Find a unique 4-char code
  let code = generateCode()
  for (let i = 0; i < 10; i++) {
    const existing = await sql`SELECT id FROM games WHERE code = ${code}`
    if (existing.length === 0) break
    code = generateCode()
  }

  const [game] = await sql`
    INSERT INTO games (name, code, status)
    VALUES (${name}, ${code}, 'lobby')
    RETURNING id, code, host_token
  `

  if (!game) {
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }

  for (let i = 0; i < challenges.length; i++) {
    const c = challenges[i] as { title: string; description?: string }
    await sql`
      INSERT INTO challenges (game_id, title, description, "order")
      VALUES (${game.id}, ${c.title}, ${c.description ?? null}, ${i})
    `
  }

  return NextResponse.json({
    id: game.id,
    code: game.code,
    host_token: game.host_token,
  })
}
