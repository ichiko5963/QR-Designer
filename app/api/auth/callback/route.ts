import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('[Auth Callback] === START ===')
  console.log('[Auth Callback] Code:', code ? code.substring(0, 10) + '...' : 'none')
  console.log('[Auth Callback] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'NOT SET')
  console.log('[Auth Callback] SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'NOT SET')

  if (code) {
    try {
      const cookieStore = await cookies()
      console.log('[Auth Callback] Cookie store obtained')

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              const all = cookieStore.getAll()
              console.log('[Auth Callback] getAll cookies:', all.map(c => c.name))
              return all
            },
            setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
              console.log('[Auth Callback] setAll cookies:', cookiesToSet.map(c => c.name))
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            },
          },
        }
      )
      console.log('[Auth Callback] Supabase client created')

      console.log('[Auth Callback] Calling exchangeCodeForSession...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Auth Callback] ERROR:', error.message)
        console.error('[Auth Callback] Error details:', JSON.stringify(error, null, 2))
      } else {
        console.log('[Auth Callback] SUCCESS! User:', data.user?.email)
        console.log('[Auth Callback] Session expires:', data.session?.expires_at)
      }
    } catch (e) {
      console.error('[Auth Callback] EXCEPTION:', e)
    }
  }

  const redirectUrl = new URL(next, requestUrl.origin)
  console.log('[Auth Callback] Redirecting to:', redirectUrl.toString())
  console.log('[Auth Callback] === END ===')
  return NextResponse.redirect(redirectUrl)
}

