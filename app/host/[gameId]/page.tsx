'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import type { Game, Challenge, Player } from '@/lib/types'

export default function HostDashboard({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const [game, setGame] = useState<Game | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [statusLoading, setStatusLoading] = useState(false)

  const hostToken = typeof window !== 'undefined' ? localStorage.getItem(`host_token_${gameId}`) : null

  const loadData = useCallback(async () => {
    const [gRes, cRes, pRes, sRes] = await Promise.all([
      fetch(`/api/games/${gameId}`),
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/players`),
      fetch(`/api/games/${gameId}/submissions/counts`),
    ])
    if (gRes.ok) setGame(await gRes.json())
    if (cRes.ok) setChallenges(await cRes.json())
    if (pRes.ok) setPlayers(await pRes.json())
    if (sRes.ok) setSubmissionCounts(await sRes.json())
  }, [gameId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [loadData])

  async function updateStatus(status: string) {
    if (!hostToken) return
    setStatusLoading(true)
    await fetch(`/api/games/${gameId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_token: hostToken, status }),
    })
    setGame(prev => (prev ? { ...prev, status: status as Game['status'] } : prev))
    setStatusLoading(false)
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center bg-amber-50">Loading...</div>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold text-amber-800">{game.name}</h1>
        <Link href={`/host/${gameId}/scoreboard`} className="text-amber-600 text-sm font-medium">Scoreboard →</Link>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-4 text-center border border-amber-200">
        <p className="text-sm text-amber-600 mb-1">Room code</p>
        <p className="text-5xl font-mono font-bold tracking-widest text-amber-800">{game.code}</p>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 border border-amber-200">
        {game.status === 'lobby' && (
          <button onClick={() => updateStatus('active')} disabled={statusLoading}
            className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50">
            Start Game
          </button>
        )}
        {game.status === 'active' && (
          <button onClick={() => updateStatus('closed')} disabled={statusLoading}
            className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50">
            Close Game
          </button>
        )}
        {game.status === 'closed' && <p className="text-center text-gray-500 font-medium">Game closed</p>}
      </div>

      <section className="mb-4">
        <h2 className="font-semibold text-amber-700 mb-2">Players ({players.length})</h2>
        <div className="bg-white rounded-xl border border-amber-200 divide-y divide-amber-100">
          {players.length === 0 && <p className="p-4 text-sm text-gray-400">Waiting for players...</p>}
          {players.map(p => <div key={p.id} className="px-4 py-2 text-sm">{p.name}</div>)}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-amber-700 mb-2">Challenges</h2>
        <div className="flex flex-col gap-2">
          {challenges.map(c => (
            <Link key={c.id} href={`/host/${gameId}/challenges/${c.id}`}
              className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex justify-between items-center hover:border-amber-400 transition-colors">
              <span className="font-medium text-sm">{c.title}</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">{submissionCounts[c.id] ?? 0} photos</span>
                {c.winner_player_id ? <span className="text-green-600 font-medium">Judged ✓</span> : <span className="text-amber-500">→</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
