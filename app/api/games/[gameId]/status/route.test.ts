import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ sql: mockSql }))

import { PATCH } from './route'

const params = Promise.resolve({ gameId: 'g1' })

describe('PATCH /api/games/[gameId]/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid status', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ host_token: 'tok', status: 'invalid' }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('returns 401 when host_token does not match', async () => {
    mockSql.mockResolvedValueOnce([{ host_token: 'correct' }])
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ host_token: 'wrong', status: 'active' }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockSql
      .mockResolvedValueOnce([{ host_token: 'correct' }])
      .mockResolvedValueOnce([])
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ host_token: 'correct', status: 'active' }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(200)
  })
})
