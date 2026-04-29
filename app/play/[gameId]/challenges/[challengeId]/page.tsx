'use client'

import { useState, use, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PhotoUpload } from '@/components/PhotoUpload'
import type { Challenge, Team } from '@/lib/types'

interface SubmissionRow {
  challenge_id: string
  team_id: string
  photo_url: string
  team_name?: string
}

export default function PlayerChallengePage({ params }: { params: Promise<{ gameId: string; challengeId: string }> }) {
  const { gameId, challengeId } = use(params)
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [mySubmission, setMySubmission] = useState<SubmissionRow | null>(null)
  const [winnerSubmission, setWinnerSubmission] = useState<SubmissionRow | null>(null)
  const [loading, setLoading] = useState(true)

  const teamId = typeof window !== 'undefined' ? localStorage.getItem('team_id') : null

  const fetchData = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/teams`),
    ])
    if (cRes.ok) {
      const all: Challenge[] = await cRes.json()
      const c = all.find(x => x.id === challengeId) ?? null
      setChallenge(c)
      if (c?.winner_team_id) {
        const wRes = await fetch(`/api/games/${gameId}/challenges/${challengeId}/submissions`)
        if (wRes.ok) {
          const subs: SubmissionRow[] = await wRes.json()
          setWinnerSubmission(subs.find(s => s.team_id === c.winner_team_id) ?? null)
        }
      }
    }
    if (tRes.ok) setTeams(await tRes.json())

    if (teamId) {
      const sRes = await fetch(`/api/teams/${teamId}/submissions?gameId=${gameId}`)
      if (sRes.ok) {
        const subs: SubmissionRow[] = await sRes.json()
        setMySubmission(subs.find(s => s.challenge_id === challengeId) ?? null)
      }
    }
    setLoading(false)
  }, [gameId, challengeId, teamId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUploaded(url: string) {
    if (!teamId) return
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, team_id: teamId, photo_url: url }),
    })
    setMySubmission({ challenge_id: challengeId, team_id: teamId, photo_url: url })
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>
  if (!challenge) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-red-600">Not found</p></main>

  const isJudged = !!challenge.winner_team_id
  const winnerTeam = teams.find(t => t.id === challenge.winner_team_id)

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="text-amber-600 text-sm">← Back</button>
        <button onClick={fetchData} className="text-amber-600 text-sm">↻ Refresh</button>
      </div>
      <h1 className="text-xl font-bold text-amber-800 mb-1">{challenge.title}</h1>
      {challenge.description && <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>}

      {isJudged ? (
        <div className="mb-6">
          <p className="text-green-600 font-semibold mb-3">Winner: {winnerTeam?.name ?? '—'}</p>
          {winnerSubmission && (
            <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden">
              <Image src={winnerSubmission.photo_url} alt="Winning photo" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-amber-600 mb-4">Upload your team's photo for this challenge</p>
          {teamId ? (
            <PhotoUpload
              challengeId={challengeId}
              teamId={teamId}
              existingUrl={mySubmission?.photo_url}
              disabled={isJudged}
              onUploaded={handleUploaded}
            />
          ) : (
            <p className="text-red-500 text-sm">Not joined as a team — go back to the home screen and enter your team code.</p>
          )}
        </div>
      )}

      <Link href="/" className="block mt-8 text-center text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
