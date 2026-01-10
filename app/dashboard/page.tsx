import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // サブスクリプション情報取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name, monthly_qr_generated, dynamic_qr_count')
    .eq('user_id', user.id)
    .single()

  // プラン機能取得
  const planName = subscription?.plan_name || 'free'
  const { data: planData } = await supabase
    .from('subscription_plans')
    .select('features, display_name')
    .eq('name', planName)
    .single()

  const features = planData?.features as Record<string, number | boolean> | null
  const qrLimit = features?.qr_limit_per_month as number || 4
  const qrUsed = subscription?.monthly_qr_generated || 0

  // プラン表示名のマッピング
  const planDisplayNames: Record<string, string> = {
    free: 'Free',
    personal: 'Personal（¥499/月）',
    pro: 'Pro（¥980/月）',
    business: 'Business',
    agency: 'Agency',
    enterprise: 'Enterprise'
  }
  
  const displayPlanName = planDisplayNames[planName] || planData?.display_name || 'Free'

  // 最近のQRコード取得
  const { data: recentQRs } = await supabase
    .from('qr_history')
    .select('id, url, design_name, qr_image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4)

  // 統計情報（動的QR機能がある場合）
  const dynamicQrCount = subscription?.dynamic_qr_count || 0
  const dynamicQrLimit = features?.dynamic_qr_limit as number || 0

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">ダッシュボード</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          QRコードの管理と分析
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今月の生成数 */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#171158]/10 to-[#171158]/5 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#1B1723]/50">今月の生成数</p>
              <p className="text-xl font-bold text-[#1B1723]">
                {qrUsed}
                {qrLimit !== -1 && (
                  <span className="text-sm font-normal text-[#1B1723]/40">/{qrLimit}</span>
                )}
              </p>
            </div>
          </div>
          {qrLimit !== -1 && (
            <div className="mt-3">
              <div className="h-1.5 bg-[#171158]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#171158] to-[#E6A24C] rounded-full transition-all"
                  style={{ width: `${Math.min((qrUsed / qrLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 動的QR数（Business以上） */}
        {dynamicQrLimit > 0 && (
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#1B1723]/50">動的QRコード</p>
                <p className="text-xl font-bold text-[#1B1723]">
                  {dynamicQrCount}
                  <span className="text-sm font-normal text-[#1B1723]/40">/{dynamicQrLimit}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* プラン */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#1B1723]/50">現在のプラン</p>
              <p className="text-xl font-bold text-[#1B1723]">{displayPlanName}</p>
            </div>
          </div>
          {planName === 'free' && (
            <Link
              href="/dashboard/settings/billing"
              className="mt-3 block text-center text-xs font-semibold text-[#E6A24C] hover:text-[#D4923D]"
            >
              プランをアップグレード
            </Link>
          )}
        </div>

        {/* AIでQRコード生成 */}
        <Link
          href="/dashboard/generate"
          className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-5 shadow-lg shadow-[#171158]/20 hover:shadow-xl hover:shadow-[#171158]/30 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/60">AIで生成</p>
              <p className="text-lg font-bold text-white">QRコード作成</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 最近のQRコード */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#171158]/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B1723]">最近のQRコード</h2>
          <Link
            href="/dashboard/qr-codes"
            className="text-sm font-semibold text-[#171158] hover:text-[#2A2478] transition-colors"
          >
            すべて見る
          </Link>
        </div>

        {recentQRs && recentQRs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
            {recentQRs.map((qr) => (
              <Link
                key={qr.id}
                href={`/dashboard/qr-codes/${qr.id}`}
                className="group"
              >
                <div className="aspect-square bg-[#FAFBFC] rounded-xl p-3 border border-[#171158]/5 group-hover:border-[#E6A24C]/30 group-hover:shadow-lg transition-all">
                  {qr.qr_image_url && (
                    <img
                      src={qr.qr_image_url}
                      alt={qr.design_name || 'QR Code'}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[#1B1723] truncate">
                    {qr.design_name || 'QRコード'}
                  </p>
                  <p className="text-xs text-[#1B1723]/50 truncate">{qr.url}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              </svg>
            </div>
            <p className="text-[#1B1723]/50 mb-4">まだQRコードがありません</p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AIでQRコード生成
            </Link>
          </div>
        )}
      </div>

      {/* アップグレード誘導（無料プランの場合） */}
      {planName === 'free' && (
        <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">プレミアム機能をアンロック</h3>
              <p className="text-white/70 text-sm mb-4">
                Personalプラン（¥499/月）またはProプラン（¥980/月）にアップグレードして、高解像度出力、テンプレート保存、高度な分析機能などを利用しましょう。
              </p>
              <Link
                href="/dashboard/settings/billing"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-colors"
              >
                プランを見る
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
