import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// キャッシュを無効化して常に最新データを取得
export const dynamic = 'force-dynamic'

// 白黒アイコンコンポーネント
function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  )
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  )
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // ユーザープロフィールから生成数を取得
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan_type, total_generated, last_generated_at')
    .eq('user_id', user.id)
    .single()

  // サブスクリプション情報取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name, dynamic_qr_count')
    .eq('user_id', user.id)
    .single()

  // プラン情報
  const planName = profile?.plan_type || subscription?.plan_name || 'free'
  const qrLimit = planName === 'free' ? -1 : 100
  const qrUsed = profile?.total_generated || 0

  // プラン表示名
  const planDisplayNames: Record<string, string> = {
    free: 'Free',
    personal: 'Personal',
    pro: 'Pro',
    business: 'Business'
  }
  const displayPlanName = planDisplayNames[planName] || 'Free'

  // お気に入りQRコード取得
  const { data: favoriteQRs } = await supabase
    .from('qr_history')
    .select('id, url, page_title, design_name, qr_image_url, created_at, is_favorite')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <div className="space-y-6">
      {/* ヘッダー - 横並びでコンパクト */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">ダッシュボード</h1>
          <p className="text-sm text-[#1B1723]/50">QRコードの作成・管理</p>
        </div>

        {/* 統計バッジ - 横並び */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 今月の生成数 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#171158]/5">
            <div className="w-7 h-7 bg-[#171158]/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-[#1B1723]/50 leading-none">生成数</p>
              <p className="text-sm font-bold text-[#1B1723]">
                {qrUsed}<span className="text-xs font-normal text-[#1B1723]/40">/{qrLimit === -1 ? '∞' : qrLimit}</span>
              </p>
            </div>
          </div>

          {/* 現在のプラン */}
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#171158]/5 hover:border-[#E6A24C]/30 transition-colors"
          >
            <div className="w-7 h-7 bg-[#E6A24C]/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-[#1B1723]/50 leading-none">プラン</p>
              <p className="text-sm font-bold text-[#1B1723]">{displayPlanName}</p>
            </div>
          </Link>

          {/* AI生成ボタン */}
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#171158] to-[#1B1723] text-white rounded-xl hover:shadow-lg hover:shadow-[#171158]/20 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-sm font-bold">AIで生成</span>
          </Link>
        </div>
      </div>

      {/* お気に入りQRコード */}
      {favoriteQRs && favoriteQRs.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <StarIcon className="w-4 h-4 text-[#E6A24C]" filled />
            <h2 className="text-sm font-semibold text-[#1B1723]">お気に入り</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {favoriteQRs.map((qr) => (
              <div key={qr.id} className="group relative">
                <div className="aspect-square bg-[#FAFBFC] rounded-xl p-2 border border-[#171158]/5 group-hover:border-[#E6A24C]/30 transition-all">
                  {qr.qr_image_url && (
                    <img
                      src={qr.qr_image_url}
                      alt={qr.page_title || 'QR Code'}
                      className="w-full h-full object-contain"
                    />
                  )}
                  <a
                    href={qr.qr_image_url || '#'}
                    download={`qr-${qr.id}.png`}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </a>
                </div>
                <p className="mt-1 text-xs font-medium text-[#1B1723] truncate text-center">
                  {qr.page_title || qr.design_name || 'QRコード'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* クイックアクセス */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* プライベートQR */}
        <Link
          href="/dashboard/private-qr"
          className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-[#171158]/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#171158]/10 transition-colors">
            <UserIcon className="w-6 h-6 text-[#171158]" />
          </div>
          <h3 className="font-bold text-[#1B1723] mb-1">プライベートQR</h3>
          <p className="text-xs text-[#1B1723]/50">Wi-Fi・SNS・名刺ページ</p>
        </Link>

        {/* コミュニティQR */}
        <Link
          href="/dashboard/community-qr"
          className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-[#171158]/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#171158]/10 transition-colors">
            <LineIcon className="w-6 h-6 text-[#171158]" />
          </div>
          <h3 className="font-bold text-[#1B1723] mb-1">コミュニティQR</h3>
          <p className="text-xs text-[#1B1723]/50">LINE・Discord・Slack招待</p>
        </Link>

        {/* 生成したQRコード */}
        <Link
          href="/dashboard/qr-codes"
          className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-[#171158]/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#171158]/10 transition-colors">
            <svg className="w-6 h-6 text-[#171158]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
            </svg>
          </div>
          <h3 className="font-bold text-[#1B1723] mb-1">生成したQRコード</h3>
          <p className="text-xs text-[#1B1723]/50">履歴・ダウンロード・管理</p>
        </Link>

        {/* アンケート */}
        <Link
          href="/dashboard/forms"
          className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-[#171158]/5 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#171158]/10 transition-colors">
            <svg className="w-6 h-6 text-[#171158]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <h3 className="font-bold text-[#1B1723] mb-1">アンケート</h3>
          <p className="text-xs text-[#1B1723]/50">QRコード付きフォーム作成</p>
        </Link>
      </div>

      {/* アップグレード誘導（無料プランの場合） */}
      {planName === 'free' && (
        <div className="bg-[#FAFBFC] rounded-2xl p-4 flex items-center gap-4 border border-[#171158]/5">
          <div className="w-10 h-10 bg-[#E6A24C]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1B1723]">
              PersonalプランでAIプロフィール作成をアンロック
            </p>
            <p className="text-xs text-[#1B1723]/50">¥499/月から</p>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="px-4 py-2 text-sm font-bold text-white bg-[#E6A24C] rounded-xl hover:bg-[#D4923D] transition-colors"
          >
            詳細を見る
          </Link>
        </div>
      )}
    </div>
  )
}
