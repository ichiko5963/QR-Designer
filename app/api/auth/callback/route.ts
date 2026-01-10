import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

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
      const redirectUrl = new URL(next || '/dashboard', requestUrl.origin)
      const { supabase, applyCookies } = await createRouteClient()
      console.log('[Auth Callback] Supabase client created')

      console.log('[Auth Callback] Calling exchangeCodeForSession...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Auth Callback] ERROR:', error.message)
        console.error('[Auth Callback] Error details:', JSON.stringify(error, null, 2))
        // エラーが発生した場合、ホームページにリダイレクトしてエラーメッセージを表示
        const errorUrl = new URL('/', requestUrl.origin)
        errorUrl.searchParams.set('error', 'auth_failed')
        errorUrl.searchParams.set('message', encodeURIComponent(error.message))
        return applyCookies(NextResponse.redirect(errorUrl))
      } else {
        console.log('[Auth Callback] SUCCESS! User:', data.user?.email)
        console.log('[Auth Callback] Session expires:', data.session?.expires_at)
        
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[Auth Callback] Session confirmed:', session ? 'exists' : 'missing')

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
  console.log('[Auth Callback] === END ===')
  const response = NextResponse.redirect(redirectUrl)
  return response
}
