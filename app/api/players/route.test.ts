import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ sql: mockSql }))

import { POST } from './route'

describe('POST /api/players', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ game_code: 'ABCD' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when game not found', async () => {
    mockSql.mockResolvedValueOnce([]) // no game found
    const req = new Request('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ game_code: 'XXXX', name: 'Alice' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 400 when game is closed', async () => {
    mockSql.mockResolvedValueOnce([{ id: 'g1', status: 'closed' }])
    const req = new Request('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ game_code: 'ABCD', name: 'Alice' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns player_id and game_id on success', async () => {
    mockSql
      .mockResolvedValueOnce([{ id: 'g1', status: 'lobby' }])
      .mockResolvedValueOnce([{ id: 'p1', game_id: 'g1' }])
    const req = new Request('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ game_code: 'ABCD', name: 'Alice' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.player_id).toBe('p1')
    expect(data.game_id).toBe('g1')
  })
})
