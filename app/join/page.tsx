'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode: code.toUpperCase() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    localStorage.setItem('team_id', data.teamId)
    localStorage.setItem('team_game_id', data.gameId)
    localStorage.setItem('team_name', data.teamName)
    router.push(`/play/${data.gameId}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-amber-50">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">Join a Game</h1>
      <p className="text-amber-600 text-sm mb-6">Enter your 6-character team code</p>
      <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          placeholder="XXXXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:border-amber-500"
          required
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Joining…' : 'Join'}
        </button>
      </form>
      <Link href="/" className="mt-6 text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
