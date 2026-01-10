import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export async function GET(req: Request) {
  const requestUrl = new URL(req.url)
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  const { supabase, applyCookies } = await createRouteClient()

  console.log('[Auth SignIn] Starting OAuth flow...')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error) {
    console.error('[Auth SignIn] Error:', error)
    return applyCookies(NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin)))
  }

  if (data.url) {
    console.log('[Auth SignIn] Redirecting to OAuth provider:', data.url)
    return applyCookies(NextResponse.redirect(data.url))
  }

  return applyCookies(NextResponse.redirect(new URL('/?error=oauth_failed', requestUrl.origin)))
}
