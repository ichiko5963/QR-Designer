import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// キャッシュを無効化して常に最新データを取得
export const dynamic = 'force-dynamic'

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

  // 保存されたURL（QRコードリンク）を取得
  const { data: savedUrls } = await supabase
    .from('saved_urls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // カテゴリ別にグループ化
  const urlsByCategory = (savedUrls || []).reduce((acc, url) => {
    const category = url.category || 'その他'
    if (!acc[category]) acc[category] = []
    acc[category].push(url)
    return acc
  }, {} as Record<string, typeof savedUrls>)

  const isPaidPlan = planName !== 'free'

  return (
    <div className="space-y-6">
      {/* ヘッダー - 横並びでコンパクト */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">ダッシュボード</h1>
          <p className="text-sm text-[#1B1723]/50">URLの管理と分析</p>
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

      {/* URL管理セクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 保存済みURL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1B1723]">保存済みURL</h2>
            <Link
              href="/dashboard/urls/new"
              className="text-sm font-semibold text-[#E6A24C] hover:text-[#D4923D] flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              追加
            </Link>
          </div>

          {Object.keys(urlsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(urlsByCategory).map(([category, urls]) => (
                <div key={category} className="bg-white rounded-2xl border border-[#171158]/5 overflow-hidden">
                  <div className="px-4 py-3 bg-[#FAFBFC] border-b border-[#171158]/5">
                    <h3 className="text-sm font-semibold text-[#1B1723]">{category}</h3>
                  </div>
                  <div className="divide-y divide-[#171158]/5">
                    {urls?.map((url) => (
                      <div key={url.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#FAFBFC] transition-colors">
                        {url.icon && (
                          <span className="text-xl">{url.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1B1723] truncate">{url.name}</p>
                          <p className="text-xs text-[#1B1723]/50 truncate">{url.url}</p>
                        </div>
                        {url.qr_image_url && (
                          <img src={url.qr_image_url} alt="" className="w-10 h-10 rounded" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-8 text-center">
              <div className="w-16 h-16 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <p className="text-[#1B1723]/50 mb-4">URLを保存してQRコードを管理しましょう</p>
              <Link
                href="/dashboard/urls/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                URLを追加
              </Link>
            </div>
          )}

          {/* クイック追加 */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-4">
            <h3 className="text-sm font-semibold text-[#1B1723] mb-3">クイック追加</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: '自社サイト', icon: '🌐', category: 'ウェブサイト' },
                { name: 'Wi-Fi', icon: '📶', category: 'ネットワーク' },
                { name: 'LINE', icon: '💬', category: 'SNS' },
                { name: 'Instagram', icon: '📷', category: 'SNS' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={`/dashboard/urls/new?category=${item.category}&name=${item.name}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#1B1723]/70 bg-[#FAFBFC] rounded-lg hover:bg-[#171158]/5 transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 右側: 名刺ページ作成 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1B1723]">デジタル名刺</h2>
            {!isPaidPlan && (
              <span className="text-xs font-semibold text-[#E6A24C] bg-[#E6A24C]/10 px-2 py-1 rounded-full">
                Personal+
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">AIでプロフィールページを作成</h3>
                <p className="text-white/70 text-sm mb-4">
                  X、Instagram、LINE、YouTubeなど複数のSNSリンクを1つのページにまとめて、QRコードで共有できます。
                </p>
                {isPaidPlan ? (
                  <Link
                    href="/dashboard/profile-card"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-colors"
                  >
                    作成する
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/settings/billing"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-colors"
                  >
                    プランをアップグレード
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* サンプルプロフィールカード */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-4">
            <p className="text-xs text-[#1B1723]/50 mb-3">プレビュー例</p>
            <div className="bg-gradient-to-br from-[#FAFBFC] to-white rounded-xl p-4 border border-[#171158]/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-full flex items-center justify-center text-white font-bold">
                  U
                </div>
                <div>
                  <p className="font-semibold text-[#1B1723]">ユーザー名</p>
                  <p className="text-xs text-[#1B1723]/50">@username</p>
                </div>
              </div>
              <div className="space-y-2">
                {['X (Twitter)', 'Instagram', 'LINE', 'YouTube'].map((sns) => (
                  <div key={sns} className="flex items-center gap-2 px-3 py-2 bg-[#FAFBFC] rounded-lg text-sm text-[#1B1723]/70">
                    <span className="w-5 h-5 bg-[#171158]/10 rounded flex items-center justify-center text-xs">
                      {sns[0]}
                    </span>
                    {sns}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アップグレード誘導（無料プランの場合） */}
      {planName === 'free' && (
        <div className="bg-[#E6A24C]/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E6A24C]/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1B1723]">
              Personalプラン（¥499/月）でデジタル名刺機能をアンロック
            </p>
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
