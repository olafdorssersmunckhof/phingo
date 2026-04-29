import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sql } from '@/lib/db'
import { sessionOptions, type SessionData } from '@/lib/session'

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

async function ownsGame(hostId: string, gameId: string): Promise<boolean> {
  const [game] = await sql`SELECT id FROM games WHERE id = ${gameId} AND host_id = ${hostId}`
  return !!game
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const [game] = await sql`SELECT id, code, name, status, created_at FROM games WHERE id = ${gameId}`
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(game)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const session = await getSession()
  if (!session.hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsGame(session.hostId, gameId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  if (body.status) {
    await sql`UPDATE games SET status = ${body.status} WHERE id = ${gameId}`
  }

  if (body.name) {
    await sql`UPDATE games SET name = ${body.name} WHERE id = ${gameId}`
  }

  if (Array.isArray(body.challenges)) {
    await sql`DELETE FROM challenges WHERE game_id = ${gameId}`
    for (let i = 0; i < body.challenges.length; i++) {
      const c = body.challenges[i] as { title: string; description?: string }
      await sql`INSERT INTO challenges (game_id, title, description, "order") VALUES (${gameId}, ${c.title}, ${c.description ?? null}, ${i})`
    }
  }

  if (Array.isArray(body.teamNames)) {
    for (const t of body.teamNames as { id: string; name: string }[]) {
      await sql`UPDATE teams SET name = ${t.name} WHERE id = ${t.id} AND game_id = ${gameId}`
    }
  }

  const [game] = await sql`SELECT id, code, name, status FROM games WHERE id = ${gameId}`
  return NextResponse.json(game)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const session = await getSession()
  if (!session.hostId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsGame(session.hostId, gameId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await sql`DELETE FROM games WHERE id = ${gameId}`
  return NextResponse.json({ ok: true })
}
