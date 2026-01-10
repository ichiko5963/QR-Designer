'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Plan {
  name: string
  display_name: string
  price_monthly: number
  features: {
    qr_limit_per_month: number
    max_resolution: number
    svg_pdf_export: boolean
    template_limit: number
    csv_batch_limit: number
    dynamic_qr_limit: number
    scan_analytics: boolean
    logo_storage_mb: number
    watermark_removable: boolean
    priority_support: boolean
  }
  stripe_price_id_monthly?: string
}

interface Subscription {
  plan_name: string
  status: string
  current_period_end?: string
  cancel_at_period_end?: boolean
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // プラン一覧取得
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (plansData) {
        setPlans(plansData)
      }

      // 現在のサブスクリプション取得
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan_name, status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .single()

      setSubscription(subData || { plan_name: 'free', status: 'active' })
      setLoading(false)
    }

    loadData()
  }, [supabase, router])

  const handleCheckout = async (planName: string, priceId?: string) => {
    if (!priceId) {
      alert('このプランは現在利用できません')
      return
    }

    setCheckoutLoading(planName)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      })

      const data = await response.json()
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('エラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#171158]" />
      </div>
    )
  }

  const currentPlan = subscription?.plan_name || 'free'

  return (
    <div className="max-w-4xl space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">課金プラン</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          プランをアップグレードして、より多くの機能をアンロック
        </p>
      </div>

      {/* 現在のプラン */}
      <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">現在のプラン</p>
            <p className="text-2xl font-bold mt-1">
              {plans.find(p => p.name === currentPlan)?.display_name || 'Free'}
            </p>
            {subscription?.current_period_end && currentPlan !== 'free' && (
              <p className="text-white/60 text-sm mt-2">
                {subscription.cancel_at_period_end
                  ? `${new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}に終了予定`
                  : `次回更新: ${new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}`
                }
              </p>
            )}
          </div>
          {currentPlan !== 'free' && (
            <button
              onClick={handleManageSubscription}
              className="px-4 py-2 text-sm font-semibold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-colors"
            >
              サブスクリプション管理
            </button>
          )}
        </div>
      </div>

      {/* プラン比較 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan
          const isPopular = plan.name === 'pro'
          const features = plan.features

          return (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border-2 p-5 transition-all ${
                isCurrentPlan
                  ? 'border-[#E6A24C] shadow-lg shadow-[#E6A24C]/20'
                  : isPopular
                    ? 'border-[#171158] shadow-lg shadow-[#171158]/10'
                    : 'border-[#171158]/10 hover:border-[#171158]/30'
              }`}
            >
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#171158] to-[#1B1723] text-white text-xs font-bold rounded-full">
                  人気
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#E6A24C] to-[#D4923D] text-white text-xs font-bold rounded-full">
                  現在のプラン
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#1B1723]">{plan.display_name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#1B1723]">
                    ¥{plan.price_monthly.toLocaleString()}
                  </span>
                  <span className="text-[#1B1723]/50 text-sm">/月</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-[#1B1723]/70">
                  <CheckIcon />
                  {features.qr_limit_per_month === -1
                    ? '無制限QR生成'
                    : `月${features.qr_limit_per_month}回生成`
                  }
                </li>
                <li className="flex items-center gap-2 text-[#1B1723]/70">
                  <CheckIcon />
                  最大{features.max_resolution}px
                </li>
                {features.watermark_removable && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    透かしなし
                  </li>
                )}
                {features.logo_storage_mb > 0 && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    ロゴ保存 {features.logo_storage_mb}MB
                  </li>
                )}
                {features.svg_pdf_export && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    SVG/PDF出力
                  </li>
                )}
                {features.dynamic_qr_limit > 0 && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    動的QR {features.dynamic_qr_limit}件
                  </li>
                )}
                {features.scan_analytics && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    スキャン分析
                  </li>
                )}
                {features.priority_support && (
                  <li className="flex items-center gap-2 text-[#1B1723]/70">
                    <CheckIcon />
                    優先サポート
                  </li>
                )}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-2.5 text-sm font-semibold text-[#1B1723]/50 bg-[#171158]/5 rounded-xl cursor-not-allowed"
                >
                  現在のプラン
                </button>
              ) : plan.name === 'free' ? (
                <button
                  disabled
                  className="w-full py-2.5 text-sm font-semibold text-[#1B1723]/50 bg-[#171158]/5 rounded-xl cursor-not-allowed"
                >
                  無料
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.name, plan.stripe_price_id_monthly)}
                  disabled={!!checkoutLoading || !plan.stripe_price_id_monthly}
                  className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all ${
                    isPopular
                      ? 'text-white bg-gradient-to-r from-[#171158] to-[#1B1723] hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20'
                      : 'text-[#171158] bg-[#171158]/10 hover:bg-[#171158]/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {checkoutLoading === plan.name ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      処理中...
                    </span>
                  ) : plan.stripe_price_id_monthly ? (
                    'アップグレード'
                  ) : (
                    '準備中'
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 法人向けプラン */}
      <div className="bg-gradient-to-br from-[#171158]/5 to-[#E6A24C]/5 rounded-2xl border border-[#171158]/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-xl flex items-center justify-center text-white shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1B1723]">法人向けプラン</h3>
            <p className="text-sm text-[#1B1723]/60 mt-1 mb-4">
              チーム機能、カスタムドメイン、API連携、SSO、専任サポートなど、企業向けの高度な機能を提供します。
            </p>
            <ul className="grid grid-cols-2 gap-2 mb-4 text-sm text-[#1B1723]/70">
              <li className="flex items-center gap-2">
                <CheckIcon />
                チーム・ワークスペース
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                カスタムドメイン
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                API連携
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                SSO・監査ログ
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                ホワイトラベル
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                専任サポート
              </li>
            </ul>
            <a
              href="mailto:jiuhot10@gmail.com?subject=QR Designer 法人向けプランのお問い合わせ"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              お問い合わせ
            </a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#1B1723] mb-4">よくある質問</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-[#1B1723]">プランはいつでも変更できますか？</h3>
            <p className="text-sm text-[#1B1723]/60 mt-1">
              はい、いつでもアップグレードまたはダウングレードできます。変更は即座に反映されます。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1B1723]">キャンセルした場合どうなりますか？</h3>
            <p className="text-sm text-[#1B1723]/60 mt-1">
              現在の請求期間の終了まで有料機能を利用できます。その後、自動的に無料プランに移行します。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1B1723]">支払い方法は？</h3>
            <p className="text-sm text-[#1B1723]/60 mt-1">
              クレジットカード（Visa、Mastercard、AMEX）に対応しています。Stripeによる安全な決済処理を行います。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-[#E6A24C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
