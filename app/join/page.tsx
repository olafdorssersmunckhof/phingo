'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_code: code.toUpperCase(), name }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    localStorage.setItem('player_id', data.player_id)
    localStorage.setItem('player_name', name)
    router.push(`/play/${data.game_id}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-amber-50">
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Join a Game</h1>
      <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          placeholder="Room code (e.g. ABCD)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={4}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:border-amber-500"
          required
        />
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
          required
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </form>
    </main>
  )
}
