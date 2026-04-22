import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ sql: mockSql }))

import { POST } from './route'

describe('POST /api/games', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/games', {
      method: 'POST',
      body: JSON.stringify({ challenges: [{ title: 'c1' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when challenges is empty', async () => {
    const req = new Request('http://localhost/api/games', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', challenges: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns id, code, and host_token on success', async () => {
    mockSql
      .mockResolvedValueOnce([]) // code check: no existing game
      .mockResolvedValueOnce([{ id: 'g1', code: 'ABCD', host_token: 'tok' }]) // insert game
      .mockResolvedValueOnce([]) // insert challenge

    const req = new Request('http://localhost/api/games', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', challenges: [{ title: 'c1' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('g1')
    expect(data.code).toBe('ABCD')
    expect(data.host_token).toBe('tok')
  })
})
