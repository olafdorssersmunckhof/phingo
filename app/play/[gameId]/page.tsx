'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import type { Game, Challenge, Player } from '@/lib/types'

export default function PlayerGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const [game, setGame] = useState<Game | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())

  const playerId = typeof window !== 'undefined' ? localStorage.getItem('player_id') : null

  const loadData = useCallback(async () => {
    const [gRes, cRes, pRes] = await Promise.all([
      fetch(`/api/games/${gameId}`),
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/players`),
    ])
    if (gRes.ok) setGame(await gRes.json())
    if (cRes.ok) setChallenges(await cRes.json())
    if (pRes.ok) setPlayers(await pRes.json())

    if (playerId) {
      const sRes = await fetch(`/api/players/${playerId}/submissions?gameId=${gameId}`)
      if (sRes.ok) {
        const subs: { challenge_id: string }[] = await sRes.json()
        setSubmittedIds(new Set(subs.map(s => s.challenge_id)))
      }
    }
  }, [gameId, playerId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [loadData])

  function challengeStatus(c: Challenge): { label: string; color: string } {
    if (c.winner_player_id) {
      const winner = players.find(p => p.id === c.winner_player_id)
      return { label: `Winner: ${winner?.name ?? '—'}`, color: 'text-green-600' }
    }
    if (submittedIds.has(c.id)) return { label: 'Submitted', color: 'text-amber-500' }
    return { label: 'Not submitted', color: 'text-gray-400' }
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center bg-amber-50">Loading...</div>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-amber-800">{game.name}</h1>
        <Link href={`/play/${gameId}/scoreboard`} className="text-amber-600 text-sm font-medium">Scoreboard →</Link>
      </div>
      <div className="flex flex-col gap-2">
        {challenges.map(c => {
          const status = challengeStatus(c)
          return (
            <Link key={c.id} href={`/play/${gameId}/challenges/${c.id}`}
              className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex justify-between items-center hover:border-amber-400 transition-colors">
              <span className="font-medium text-sm">{c.title}</span>
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
