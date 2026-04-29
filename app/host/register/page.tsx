'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, inviteCode }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      return
    }
    router.push('/host/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-amber-50">
      <h1 className="text-2xl font-bold text-amber-800 mb-2">Create Host Account</h1>
      <p className="text-amber-600 text-sm mb-6">Invite only — you need a code to register</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
          required
        />
        <input
          type="text"
          placeholder="Invite code"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value.toUpperCase())}
          className="border-2 border-amber-300 rounded-xl px-4 py-3 font-mono tracking-widest uppercase focus:outline-none focus:border-amber-500"
          required
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-amber-700">
          Already have an account?{' '}
          <Link href="/host/login" className="underline">Log in</Link>
        </p>
      </form>
      <Link href="/" className="mt-6 text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
