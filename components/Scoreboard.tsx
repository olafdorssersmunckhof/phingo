'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Team } from '@/lib/types'

interface ScoreEntry {
  team: Team
  wins: number
}

export function Scoreboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<ScoreEntry[]>([])

  const fetchScores = useCallback(async () => {
    const [tRes, cRes] = await Promise.all([
      fetch(`/api/games/${gameId}/teams`),
      fetch(`/api/games/${gameId}/challenges`),
    ])
    if (!tRes.ok || !cRes.ok) return

    const teams: Team[] = await tRes.json()
    const challenges: { winner_team_id: string | null }[] = await cRes.json()

    const winCounts: Record<string, number> = {}
    challenges.forEach(c => {
      if (c.winner_team_id) winCounts[c.winner_team_id] = (winCounts[c.winner_team_id] ?? 0) + 1
    })

    setScores(
      teams
        .map(t => ({ team: t, wins: winCounts[t.id] ?? 0 }))
        .sort((a, b) => b.wins - a.wins)
    )
  }, [gameId])

  useEffect(() => { fetchScores() }, [fetchScores])

  if (scores.length === 0) return <p className="text-gray-400 text-sm">No teams yet</p>

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end mb-1">
        <button onClick={fetchScores} className="text-amber-600 text-sm">↻ Refresh</button>
      </div>
      {scores.map((entry, i) => (
        <div key={entry.team.id} className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-400 font-bold w-6">{i + 1}</span>
          <span className="flex-1 font-medium">{entry.team.name}</span>
          <span className="text-amber-600 font-bold">{entry.wins} {entry.wins === 1 ? 'win' : 'wins'}</span>
        </div>
      ))}
    </div>
  )
}
