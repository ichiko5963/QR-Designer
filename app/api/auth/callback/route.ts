import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('[Auth Callback] === START ===')
  console.log('[Auth Callback] Code:', code ? code.substring(0, 10) + '...' : 'none')

  if (code) {
    const { supabase, applyCookies } = await createRouteClient()

    try {
      const redirectUrl = new URL(next || '/dashboard', requestUrl.origin)
      console.log('[Auth Callback] Supabase client created')

      console.log('[Auth Callback] Calling exchangeCodeForSession...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Auth Callback] ERROR:', error.message)
        const errorUrl = new URL('/', requestUrl.origin)
        errorUrl.searchParams.set('error', 'auth_failed')
        errorUrl.searchParams.set('message', encodeURIComponent(error.message))
        return applyCookies(NextResponse.redirect(errorUrl))
      } else {
        console.log('[Auth Callback] SUCCESS! User:', data.user?.email)
        console.log('[Auth Callback] Redirecting to:', redirectUrl.toString())
        return applyCookies(NextResponse.redirect(redirectUrl))
      }
    } catch (e) {
      console.error('[Auth Callback] EXCEPTION:', e)
      const errorUrl = new URL('/', requestUrl.origin)
      errorUrl.searchParams.set('error', 'auth_exception')
      return applyCookies(NextResponse.redirect(errorUrl))
    }
  }

  // コードがない場合（エラーなど）はホームページへ
  const redirectUrl = new URL(next || '/', requestUrl.origin)
  console.log('[Auth Callback] No code, redirecting to:', redirectUrl.toString())
  return NextResponse.redirect(redirectUrl)
}
