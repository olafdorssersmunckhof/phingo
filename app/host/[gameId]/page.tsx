'use client'

import { use, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Game, Team, Challenge } from '@/lib/types'

export default function HostGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<'teams' | 'challenges'>('teams')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [gameRes, teamsRes, challengesRes, countsRes] = await Promise.all([
      fetch(`/api/games/${gameId}`),
      fetch(`/api/games/${gameId}/teams`),
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/submissions/counts`),
    ])
    if (gameRes.ok) setGame(await gameRes.json())
    if (teamsRes.ok) setTeams(await teamsRes.json())
    if (challengesRes.ok) setChallenges(await challengesRes.json())
    if (countsRes.ok) setSubmissionCounts(await countsRes.json())
    setLoading(false)
  }, [gameId])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateStatus(status: string) {
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchData()
  }

  async function deleteGame() {
    if (!confirm(`Delete "${game?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/games/${gameId}`, { method: 'DELETE' })
    router.push('/host/dashboard')
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>
  if (!game) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-red-600">Game not found</p></main>

  const judgedCount = challenges.filter(c => c.winner_team_id).length

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1">
        <Link href="/host/dashboard" className="text-amber-600 text-sm">← Dashboard</Link>
        <button onClick={fetchData} className="text-amber-600 text-sm">↻ Refresh</button>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-amber-800">{game.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-mono text-amber-600 text-lg tracking-widest">{game.code}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">{game.status}</span>
        </div>
        <p className="text-sm text-amber-600 mt-1">{judgedCount}/{challenges.length} challenges judged</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {game.status === 'lobby' && (
          <button onClick={() => updateStatus('active')} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">Start Game</button>
        )}
        {game.status === 'active' && (
          <button onClick={() => updateStatus('closed')} className="bg-gray-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-600 transition-colors">Close Game</button>
        )}
        <Link href={`/host/${gameId}/edit`} className="border-2 border-amber-300 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">Edit</Link>
        <Link href={`/host/${gameId}/scoreboard`} className="border-2 border-amber-300 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">Scores</Link>
        <button onClick={deleteGame} disabled={deleting} className="ml-auto text-red-400 hover:text-red-600 text-sm px-2 disabled:opacity-50">
          {deleting ? '…' : 'Delete'}
        </button>
      </div>

      <div className="flex gap-0 mb-4 border-b border-amber-200">
        {(['teams', 'challenges'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-amber-500 text-amber-800' : 'border-transparent text-amber-500 hover:text-amber-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <div className="flex flex-col gap-3">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-amber-900">{team.name}</div>
                <div className="font-mono text-amber-600 text-sm tracking-widest mt-0.5">{team.join_code}</div>
              </div>
              <button
                onClick={() => copyCode(team.join_code)}
                className="text-xs text-amber-600 border border-amber-300 rounded-lg px-3 py-1 hover:bg-amber-50 transition-colors"
              >
                {copiedCode === team.join_code ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'challenges' && (
        <div className="flex flex-col gap-3">
          {challenges.map(c => (
            <button
              key={c.id}
              onClick={() => router.push(`/host/${gameId}/challenges/${c.id}`)}
              className="bg-white rounded-xl border border-amber-200 p-4 text-left hover:border-amber-400 transition-colors"
            >
              <div className="font-semibold text-amber-900">{c.title}</div>
              <div className="flex items-center gap-3 mt-1 text-sm text-amber-600">
                <span>{submissionCounts[c.id] ?? 0}/{teams.length} submitted</span>
                {c.winner_team_id && (
                  <span className="text-green-600 font-medium">
                    Winner: {teams.find(t => t.id === c.winner_team_id)?.name ?? '—'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Link href="/" className="block mt-8 text-center text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
