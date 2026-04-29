'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Scoreboard } from '@/components/Scoreboard'

export default function HostScoreboardPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const router = useRouter()
  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="border-2 border-amber-300 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Scoreboard</h1>
      <Scoreboard gameId={gameId} />
    </main>
  )
}
