'use client'

import { useState, use, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Challenge } from '@/lib/types'

interface SubmissionRow {
  id: string
  challenge_id: string
  team_id: string
  photo_url: string
  team_name: string
}

export default function HostChallengePage({ params }: { params: Promise<{ gameId: string; challengeId: string }> }) {
  const { gameId, challengeId } = use(params)
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [judging, setJudging] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/challenges/${challengeId}/submissions`),
    ])
    if (cRes.ok) {
      const all: Challenge[] = await cRes.json()
      setChallenge(all.find(c => c.id === challengeId) ?? null)
    }
    if (sRes.ok) setSubmissions(await sRes.json())
    setLoading(false)
  }, [gameId, challengeId])

  useEffect(() => { fetchData() }, [fetchData])

  async function pickWinner(teamId: string) {
    if (judging || challenge?.winner_team_id) return
    setJudging(true)
    await fetch(`/api/games/${gameId}/challenges/${challengeId}/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_team_id: teamId }),
    })
    router.push(`/host/${gameId}`)
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>
  if (!challenge) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-red-600">Not found</p></main>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="text-amber-600 text-sm">← Back</button>
        <button onClick={fetchData} className="text-amber-600 text-sm">↻ Refresh</button>
      </div>
      <h1 className="text-xl font-bold text-amber-800 mb-1">{challenge.title}</h1>
      {challenge.description && <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>}

      {challenge.winner_team_id
        ? <p className="text-green-600 font-medium mb-4">Winner already selected ✓</p>
        : <p className="text-sm text-amber-600 mb-4">Tap a photo to pick the winner</p>
      }

      {submissions.length === 0
        ? <p className="text-gray-400 text-sm">No submissions yet</p>
        : (
          <div className="grid grid-cols-2 gap-3">
            {submissions.map(s => (
              <button
                key={s.id}
                onClick={() => pickWinner(s.team_id)}
                disabled={!!challenge.winner_team_id || judging}
                className={`rounded-xl overflow-hidden border-2 transition-all text-left ${challenge.winner_team_id === s.team_id ? 'border-green-500' : 'border-amber-200 hover:border-amber-400'} disabled:cursor-default`}
              >
                <div className="relative aspect-square w-full bg-amber-100">
                  <Image src={s.photo_url} alt={s.team_name} fill className="object-cover" unoptimized />
                </div>
                <div className="p-2 text-xs font-medium text-center bg-white">
                  {s.team_name}{challenge.winner_team_id === s.team_id && ' 🏆'}
                </div>
              </button>
            ))}
          </div>
        )
      }
    </main>
  )
}
