'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Team, Challenge } from '@/lib/types'

interface ChallengeInput { title: string; description: string }

export default function EditGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const router = useRouter()
  const [gameName, setGameName] = useState('')
  const [challenges, setChallenges] = useState<ChallengeInput[]>([])
  const [teamNames, setTeamNames] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [gameRes, challengesRes, teamsRes] = await Promise.all([
        fetch(`/api/games/${gameId}`),
        fetch(`/api/games/${gameId}/challenges`),
        fetch(`/api/games/${gameId}/teams`),
      ])
      if (gameRes.ok) { const g = await gameRes.json(); setGameName(g.name) }
      if (challengesRes.ok) {
        const cs: Challenge[] = await challengesRes.json()
        setChallenges(cs.map(c => ({ title: c.title, description: c.description ?? '' })))
      }
      if (teamsRes.ok) {
        const ts: Team[] = await teamsRes.json()
        setTeamNames(ts.map(t => ({ id: t.id, name: t.name })))
      }
      setLoading(false)
    }
    load()
  }, [gameId])

  function addChallenge() { setChallenges(prev => [...prev, { title: '', description: '' }]) }
  function removeChallenge(i: number) { setChallenges(prev => prev.filter((_, j) => j !== i)) }
  function updateChallenge(i: number, field: keyof ChallengeInput, value: string) {
    setChallenges(prev => prev.map((c, j) => j === i ? { ...c, [field]: value } : c))
  }
  function updateTeamName(i: number, value: string) {
    setTeamNames(prev => prev.map((t, j) => j === i ? { ...t, name: value } : t))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validChallenges = challenges.filter(c => c.title.trim())
    if (validChallenges.length === 0) { setError('At least one challenge required'); return }
    setSaving(true)
    const res = await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: gameName, challenges: validChallenges, teamNames }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to save'); return }
    router.push(`/host/${gameId}`)
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-amber-50"><p className="text-amber-700">Loading…</p></main>

  return (
    <main className="min-h-screen p-6 bg-amber-50 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/host/${gameId}`} className="text-amber-600 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-amber-800">Edit Game</h1>
      </div>
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Game name</label>
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Team names <span className="font-normal text-amber-500">(join codes stay the same)</span></label>
          <div className="flex flex-col gap-2">
            {teamNames.map((t, i) => (
              <div key={t.id} className="flex gap-2 items-center">
                <span className="text-amber-500 font-bold text-sm w-5">{i + 1}</span>
                <input
                  type="text"
                  value={t.name}
                  onChange={e => updateTeamName(i, e.target.value)}
                  className="flex-1 border-2 border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Challenges <span className="font-normal text-amber-500">(replaces existing list)</span></label>
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
          <button type="button" onClick={addChallenge} className="mt-3 text-amber-600 text-sm font-medium hover:text-amber-800">+ Add challenge</button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}
