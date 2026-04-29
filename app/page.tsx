'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Smart resume: host session check
    fetch('/api/auth/me').then(res => {
      if (res.ok) router.push('/host/dashboard')
    })

    // Smart resume: team member
    const teamGameId = localStorage.getItem('team_game_id')
    if (teamGameId) router.push(`/play/${teamGameId}`)
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-amber-50">
      <h1 className="text-4xl font-bold text-amber-800">Phingo</h1>
      <p className="text-amber-700 text-center">Photo Bingo — snap photos, win challenges</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
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
