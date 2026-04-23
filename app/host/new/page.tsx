'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChallengeInput {
  title: string
  description: string
}

export default function NewGamePage() {
  const router = useRouter()
  const [gameName, setGameName] = useState('')
  const [challenges, setChallenges] = useState<ChallengeInput[]>([{ title: '', description: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addChallenge() {
    setChallenges(prev => [...prev, { title: '', description: '' }])
  }

  function removeChallenge(index: number) {
    setChallenges(prev => prev.filter((_, i) => i !== index))
  }

  function updateChallenge(index: number, field: keyof ChallengeInput, value: string) {
    setChallenges(prev => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validChallenges = challenges.filter(c => c.title.trim())
    if (validChallenges.length === 0) {
      setError('Add at least one challenge with a title')
      return
    }

    setLoading(true)

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: gameName, challenges: validChallenges }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    localStorage.setItem(`host_token_${data.id}`, data.host_token)
    localStorage.setItem('host_game_id', data.id)
    router.push(`/host/${data.id}`)
  }

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Create a Game</h1>
      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Game name</label>
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
            placeholder="e.g. Team Outing 2026"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Challenges</label>
          <div className="flex flex-col gap-3">
            {challenges.map((c, i) => (
              <div key={i} className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-amber-200">
                <div className="flex gap-2 items-center">
                  <span className="text-amber-500 font-bold text-sm w-5">{i + 1}</span>
                  <input
                    type="text"
                    value={c.title}
                    onChange={e => updateChallenge(i, 'title', e.target.value)}
                    placeholder="Challenge title"
                    className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  />
                  {challenges.length > 1 && (
                    <button type="button" onClick={() => removeChallenge(i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                  )}
                </div>
                <input
                  type="text"
                  value={c.description}
                  onChange={e => updateChallenge(i, 'description', e.target.value)}
                  placeholder="Description (optional)"
                  className="ml-7 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addChallenge} className="mt-3 text-amber-600 text-sm font-medium hover:text-amber-800">
            + Add challenge
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
      </form>
    </main>
  )
}
