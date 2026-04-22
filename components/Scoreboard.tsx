'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Player } from '@/lib/types'

interface ScoreEntry {
  player: Player
  wins: number
}

export function Scoreboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<ScoreEntry[]>([])

  const computeScores = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/games/${gameId}/players`),
      fetch(`/api/games/${gameId}/challenges`),
    ])
    if (!pRes.ok || !cRes.ok) return

    const players: Player[] = await pRes.json()
    const challenges: { winner_player_id: string | null }[] = await cRes.json()

    const winCounts: Record<string, number> = {}
    challenges.forEach(c => {
      if (c.winner_player_id) winCounts[c.winner_player_id] = (winCounts[c.winner_player_id] ?? 0) + 1
    })

    setScores(
      players
        .map(p => ({ player: p, wins: winCounts[p.id] ?? 0 }))
        .sort((a, b) => b.wins - a.wins)
    )
  }, [gameId])

  useEffect(() => {
    computeScores()
    const interval = setInterval(computeScores, 4000)
    return () => clearInterval(interval)
  }, [computeScores])

  if (scores.length === 0) return <p className="text-gray-400 text-sm">No players yet</p>

  return (
    <div className="flex flex-col gap-2">
      {scores.map((entry, i) => (
        <div key={entry.player.id} className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-400 font-bold w-6">{i + 1}</span>
          <span className="flex-1 font-medium">{entry.player.name}</span>
          <span className="text-amber-600 font-bold">{entry.wins} {entry.wins === 1 ? 'win' : 'wins'}</span>
        </div>
      ))}
    </div>
  )
}
