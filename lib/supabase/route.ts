import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const defaultCookieOptions: Omit<ResponseCookie, 'name' | 'value'> = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
}

type PendingCookie = ResponseCookie

export async function createRouteClient() {
  const cookieStore = await cookies()
  const cookieJar = new Map<string, string>()
  cookieStore.getAll().forEach(cookie => {
    cookieJar.set(cookie.name, cookie.value)
  })

  const pendingCookies: PendingCookie[] = []

  const queueSetCookie = (name: string, value: string, options?: Partial<ResponseCookie>) => {
    const cookie: ResponseCookie = {
      ...defaultCookieOptions,
      ...options,
      name,
      value
    }
    cookieJar.set(name, value)
    pendingCookies.push(cookie)
  }

  const queueDeleteCookie = (name: string, options?: Partial<ResponseCookie>) => {
    cookieJar.delete(name)
    pendingCookies.push({
      ...defaultCookieOptions,
      ...options,
      name,
      value: '',
      maxAge: 0
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieJar.get(name)
        },
        async set(name: string, value: string, options?: Partial<ResponseCookie>) {
          queueSetCookie(name, value, options)
        },
        async remove(name: string, options?: Partial<ResponseCookie>) {
          queueDeleteCookie(name, options)
        }
      }
    }
  )

  const applyCookies = (response: NextResponse) => {
    pendingCookies.forEach(cookie => response.cookies.set(cookie))
    return response
  }

  return { supabase, applyCookies }
}
