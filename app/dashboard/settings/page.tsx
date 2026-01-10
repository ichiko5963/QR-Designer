import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]

  return (
    <div className="max-w-2xl space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">設定</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          アカウントとプランの管理
        </p>
      </div>

      {/* プロフィール */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#171158]/5">
          <h2 className="text-lg font-bold text-[#1B1723]">プロフィール</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || 'User'}
                className="w-16 h-16 rounded-full shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-full flex items-center justify-center shadow-lg shadow-[#E6A24C]/30">
                <span className="text-2xl font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-[#1B1723]">{displayName}</p>
              <p className="text-sm text-[#1B1723]/50">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 設定メニュー */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
        <div className="divide-y divide-[#171158]/5">
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center justify-between p-5 hover:bg-[#171158]/[0.02] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1B1723]">課金プラン</p>
                <p className="text-sm text-[#1B1723]/50">プランの変更・支払い管理</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#1B1723]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <div className="flex items-center justify-between p-5 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#171158]/5 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#171158]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1B1723]">通知設定</p>
                <p className="text-sm text-[#1B1723]/50">メール通知の管理（近日公開）</p>
              </div>
            </div>
            <span className="text-xs bg-[#171158]/10 text-[#171158]/50 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-between p-5 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#171158]/5 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#171158]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1B1723]">API キー</p>
                <p className="text-sm text-[#1B1723]/50">APIアクセスの管理（Enterprise）</p>
              </div>
            </div>
            <span className="text-xs bg-[#171158]/10 text-[#171158]/50 px-2 py-1 rounded-full">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* ログアウト */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm p-5">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
