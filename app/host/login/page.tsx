'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Host Login</h1>
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
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-amber-700">
          No account?{' '}
          <Link href="/host/register" className="underline">Register with invite code</Link>
        </p>
      </form>
      <Link href="/" className="mt-6 text-amber-600 text-sm">← Home</Link>
    </main>
  )
}
