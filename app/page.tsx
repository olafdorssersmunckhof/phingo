'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [hostGameId, setHostGameId] = useState<string | null>(null)
  const [playerGameId, setPlayerGameId] = useState<string | null>(null)

  useEffect(() => {
    setHostGameId(localStorage.getItem('host_game_id'))
    setPlayerGameId(localStorage.getItem('player_game_id'))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-amber-50">
      <h1 className="text-4xl font-bold text-amber-800">Phingo</h1>
      <p className="text-amber-700 text-center">Photo Bingo — snap photos, win challenges</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hostGameId && (
          <button
            onClick={() => router.push(`/host/${hostGameId}`)}
            className="bg-amber-600 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors"
          >
            Resume your game
          </button>
        )}
        {playerGameId && (
          <button
            onClick={() => router.push(`/play/${playerGameId}`)}
            className="bg-amber-600 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors"
          >
            Back to my game
          </button>
        )}
        <Link
          href="/join"
          className="bg-amber-500 text-white text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-600 transition-colors"
        >
          Join a Game
        </Link>
        <Link
          href="/host/new"
          className="bg-white border-2 border-amber-500 text-amber-700 text-center py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-50 transition-colors"
        >
          Create a Game
        </Link>
      </div>
    </main>
  )
}
