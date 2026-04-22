'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PhotoUpload } from '@/components/PhotoUpload'
import type { Challenge, Player } from '@/lib/types'

interface SubmissionRow {
  challenge_id: string
  photo_url: string
  player_name?: string
}

export default function PlayerChallengePage({ params }: { params: Promise<{ gameId: string; challengeId: string }> }) {
  const { gameId, challengeId } = use(params)
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [mySubmission, setMySubmission] = useState<SubmissionRow | null>(null)
  const [winnerSubmission, setWinnerSubmission] = useState<SubmissionRow | null>(null)

  const playerId = typeof window !== 'undefined' ? localStorage.getItem('player_id') : null

  const loadData = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([
      fetch(`/api/games/${gameId}/challenges`),
      fetch(`/api/games/${gameId}/players`),
    ])
    if (cRes.ok) {
      const all: Challenge[] = await cRes.json()
      const c = all.find(x => x.id === challengeId) ?? null
      setChallenge(c)

      if (c?.winner_player_id) {
        const wRes = await fetch(`/api/games/${gameId}/challenges/${challengeId}/submissions`)
        if (wRes.ok) {
          const subs: SubmissionRow[] = await wRes.json()
          setWinnerSubmission(subs.find(s => s.challenge_id === challengeId) ?? null)
        }
      }
    }
    if (pRes.ok) setPlayers(await pRes.json())

    if (playerId) {
      const sRes = await fetch(`/api/players/${playerId}/submissions?gameId=${gameId}`)
      if (sRes.ok) {
        const subs: SubmissionRow[] = await sRes.json()
        setMySubmission(subs.find(s => s.challenge_id === challengeId) ?? null)
      }
    }
  }, [gameId, challengeId, playerId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [loadData])

  async function handleUploaded(url: string) {
    if (!playerId) return
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, player_id: playerId, photo_url: url }),
    })
    setMySubmission({ challenge_id: challengeId, photo_url: url })
  }

  if (!challenge) return <div className="min-h-screen flex items-center justify-center bg-amber-50">Loading...</div>

  const isJudged = !!challenge.winner_player_id
  const winnerPlayer = players.find(p => p.id === challenge.winner_player_id)

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-amber-600 text-sm mb-4">← Back</button>
      <h1 className="text-xl font-bold text-amber-800 mb-1">{challenge.title}</h1>
      {challenge.description && <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>}

      {isJudged ? (
        <div className="mb-6">
          <p className="text-green-600 font-semibold mb-3">Winner: {winnerPlayer?.name}</p>
          {winnerSubmission && (
            <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden">
              <Image src={winnerSubmission.photo_url} alt="Winning photo" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-amber-600 mb-4">Upload your photo for this challenge</p>
          {playerId && (
            <PhotoUpload
              challengeId={challengeId}
              playerId={playerId}
              existingUrl={mySubmission?.photo_url}
              disabled={isJudged}
              onUploaded={handleUploaded}
            />
          )}
        </div>
      )}
    </main>
  )
}
