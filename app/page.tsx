'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const left = searchParams.get('left') === '1'
  const [hostSession, setHostSession] = useState(false)
  const [teamGameId, setTeamGameId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    if (left) return // user intentionally left — don't redirect

    fetch('/api/auth/me').then(res => {
      if (res.ok) router.push('/host/dashboard')
    })

    const gid = localStorage.getItem('team_game_id')
    if (gid) router.push(`/play/${gid}`)
  }, [router, left])

  useEffect(() => {
    fetch('/api/auth/me').then(res => { if (res.ok) setHostSession(true) })
    setTeamGameId(localStorage.getItem('team_game_id'))
    setTeamName(localStorage.getItem('team_name'))
  }, [])

  function leaveGame() {
    localStorage.removeItem('team_id')
    localStorage.removeItem('team_game_id')
    localStorage.removeItem('team_name')
    setTeamGameId(null)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-amber-50">
      <h1 className="text-4xl font-bold text-amber-800">Phingo</h1>
      <p className="text-amber-700 text-center">Photo Bingo — snap photos, win challenges</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hostSession && (
          <button
            onClick={() => router.push('/host/dashboard')}
            className="bg-amber-600 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors"
          >
            Continue as host
          </button>
        )}
        {teamGameId && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push(`/play/${teamGameId}`)}
              className="bg-amber-600 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors"
            >
              Back to game {teamName ? `(${teamName})` : ''}
            </button>
            <button onClick={leaveGame} className="text-amber-500 text-sm text-center hover:text-amber-700">
              Leave game
            </button>
          </div>
        )}

        <Link
          href="/host/login"
          className="bg-amber-500 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-600 transition-colors"
        >
          Host
        </Link>
        <Link
          href="/join"
          className="bg-white border-2 border-amber-500 text-amber-700 text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-50 transition-colors"
        >
          Join
        </Link>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
