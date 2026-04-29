'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Game } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = { lobby: 'Lobby', active: 'Active', closed: 'Closed' }
const STATUS_COLOR: Record<string, string> = {
  lobby: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function DashboardPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [meRes, gamesRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/games')])
    if (!meRes.ok) { router.push('/host/login'); return }
    const me = await meRes.json()
    setUsername(me.username)
    if (gamesRes.ok) setGames(await gamesRes.json())
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function deleteGame(gameId: string, gameName: string) {
    if (!confirm(`Delete "${gameName}"? This cannot be undone.`)) return
    setDeleting(gameId)
    await fetch(`/api/games/${gameId}`, { method: 'DELETE' })
    setDeleting(null)
    fetchData()
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-800">My Games</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-amber-600">{username}</span>
          <button onClick={logout} className="text-sm text-amber-600 underline">Log out</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/host/new" className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
          + New Game
        </Link>
        <button onClick={fetchData} className="border-2 border-amber-300 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {games.length === 0 && (
        <p className="text-amber-600 text-center py-8">No games yet. Create your first one!</p>
      )}

      <div className="flex flex-col gap-3">
        {games.map(game => (
          <div key={game.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between gap-3">
            <button onClick={() => router.push(`/host/${game.id}`)} className="flex-1 text-left">
              <div className="font-semibold text-amber-900">{game.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm text-amber-600">{game.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[game.status]}`}>
                  {STATUS_LABEL[game.status]}
                </span>
              </div>
            </button>
            <button
              onClick={() => deleteGame(game.id, game.name)}
              disabled={deleting === game.id}
              className="text-red-400 hover:text-red-600 text-sm px-2 py-1 disabled:opacity-50"
            >
              {deleting === game.id ? '…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>

      <Link href="/" className="block mt-8 text-center text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
