import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.hostId) {
    return NextResponse.redirect(new URL('/host/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/host/((?!login|register).*)'],
}
