'use client'

import { useState, use, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { Game, Challenge, Team } from '@/lib/types'

export default function PlayerGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const [game, setGame] = useState<Game | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const teamId = typeof window !== 'undefined' ? localStorage.getItem('team_id') : null
  const teamName = typeof window !== 'undefined' ? localStorage.getItem('team_name') : null

  const fetchData = useCallback(async () => {
    const requests: Promise<Response>[] = [
      fetch(`/api/games/${gameId}`),
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/teams`),
    ]
    if (teamId) requests.push(fetch(`/api/teams/${teamId}/submissions?gameId=${gameId}`))
    const [gRes, cRes, tRes, sRes] = await Promise.all(requests)
    if (gRes.ok) setGame(await gRes.json())
    if (cRes.ok) setChallenges(await cRes.json())
    if (tRes.ok) setTeams(await tRes.json())
    if (sRes?.ok) {
      const subs: { challenge_id: string }[] = await sRes.json()
      setSubmittedIds(new Set(subs.map(s => s.challenge_id)))
    }
    setLoading(false)
  }, [gameId, teamId])

  useEffect(() => { fetchData() }, [fetchData])

  function challengeStatus(c: Challenge): { label: string; color: string } {
    if (c.winner_team_id) {
      const winner = teams.find(t => t.id === c.winner_team_id)
      return { label: `Winner: ${winner?.name ?? '—'}`, color: 'text-green-600' }
    }
    if (submittedIds.has(c.id)) return { label: 'Submitted', color: 'text-amber-500' }
    return { label: 'Not submitted', color: 'text-gray-400' }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>
  if (!game) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-red-600">Game not found</p></main>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold text-amber-800">{game.name}</h1>
        <button onClick={fetchData} className="text-amber-600 text-sm">↻ Refresh</button>
      </div>
      {teamName && <p className="text-amber-600 text-sm mb-4">Team: {teamName}</p>}

      <div className="flex gap-3 mb-4">
        <Link href={`/play/${gameId}/scoreboard`} className="text-amber-600 text-sm font-medium">Scoreboard →</Link>
      </div>

      <div className="flex flex-col gap-2">
        {challenges.map(c => {
          const status = challengeStatus(c)
          return (
            <Link
              key={c.id}
              href={`/play/${gameId}/challenges/${c.id}`}
              className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex justify-between items-center hover:border-amber-400 transition-colors"
            >
              <span className="font-medium text-sm">{c.title}</span>
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </Link>
          )
        })}
      </div>

      <Link href="/" className="block mt-8 text-center text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
