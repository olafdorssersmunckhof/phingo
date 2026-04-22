'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Scoreboard } from '@/components/Scoreboard'

export default function PlayerScoreboardPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const router = useRouter()
  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-amber-600 text-sm mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Scoreboard</h1>
      <Scoreboard gameId={gameId} />
    </main>
  )
}
