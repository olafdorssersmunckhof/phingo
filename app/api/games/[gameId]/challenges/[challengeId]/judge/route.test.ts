import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ sql: mockSql }))

import { POST } from './route'

const params = Promise.resolve({ gameId: 'g1', challengeId: 'c1' })

describe('POST /api/games/[gameId]/challenges/[challengeId]/judge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when host_token does not match', async () => {
    mockSql.mockResolvedValueOnce([{ host_token: 'correct' }])
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ host_token: 'wrong', winner_player_id: 'p1' }),
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 401 when game not found', async () => {
    mockSql.mockResolvedValueOnce([])
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ host_token: 'any', winner_player_id: 'p1' }),
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockSql
      .mockResolvedValueOnce([{ host_token: 'correct' }])
      .mockResolvedValueOnce([])
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ host_token: 'correct', winner_player_id: 'p1' }),
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(200)
  })
})
