'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // クライアントを一度だけ生成
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('[AuthButton] getUser result:', { user: user?.email, error })
        setUser(user)
        
        // ログイン済みでホームページ（/）にいる場合、ダッシュボードにリダイレクト
        if (user && pathname === '/') {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('[AuthButton] getUser error:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthButton] Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        
        // ログイン成功時（SIGNED_IN）でホームページにいる場合、ダッシュボードにリダイレクト
        if (event === 'SIGNED_IN' && session?.user && pathname === '/') {
          router.push('/dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname])

  const handleSignIn = async () => {
    // サーバー側でOAuthを開始するAPIルートを使用
    // これにより、PKCE code verifierがクッキーに保存される
    window.location.href = `/api/auth/signin?redirectTo=${encodeURIComponent('/dashboard')}`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="w-32 h-10 bg-[#171158]/5 rounded-xl shimmer" />
    )
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#171158]/5 to-[#E6A24C]/5 rounded-xl">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-full flex items-center justify-center shadow-md shadow-[#E6A24C]/20">
              <span className="text-xs font-bold text-white">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <span className="text-sm text-[#1B1723]/70 font-semibold max-w-[120px] truncate">
            {displayName}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-semibold text-[#1B1723]/70 bg-white border-2 border-[#171158]/10 rounded-xl hover:bg-[#171158]/[0.02] hover:border-[#171158]/20 transition-all"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1B1723]/80 bg-white border-2 border-[#171158]/10 rounded-xl hover:bg-[#171158]/[0.02] hover:border-[#171158]/20 shadow-sm transition-all"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>ログイン</span>
    </button>
  )
}
