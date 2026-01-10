'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const planLookup = useMemo(() => {
    return plans.reduce<Record<string, Plan>>((acc, plan) => {
      acc[plan.name] = plan
      return acc
    }, {})
  }, [plans])

  const docPlans = [
    {
      key: 'free-guest',
      title: 'Free（ログインなし）',
      price: '無料 / 月2回',
      description: 'ログイン不要で気軽に試せる体験プラン',
      features: [
        '月2回までQR生成（IPアドレス制限）',
        '1024px PNGダウンロード（透かしなし）',
        'AIデザイン / カスタマイズ機能は全て利用可能',
        '履歴やWiFi・短縮URLなどの追加機能は非対応'
      ] as const,
      cta: {
        label: 'ログインで拡張',
        action: () => router.push('/api/auth/signin?redirectTo=%2Fdashboard')
      }
    },
    {
      key: 'free',
      title: 'Free（Googleログイン）',
      price: '無料 / 無制限',
      description: 'Googleログインで日常利用できる管理プラン',
      features: [
        '無制限でQR生成・再ダウンロード',
        '1024px PNG / 透かしなし',
        '履歴保存・ダッシュボード管理',
        'WiFi・短縮URL・メール/SMS/電話QR対応'
      ] as const,
      planName: 'free'
    },
    {
      key: 'personal',
      title: 'Personal',
      price: '¥499 / 月',
      description: 'テンプレ保存と日常運用を効率化',
      features: [
        '無制限生成 / 2048px PNG',
        'テンプレート保存10件＆スマート分類',
        '短縮URL（カスタムスラッグ）・WiFi・vCard',
        'リンク切れ検知・日常タスクの一元管理'
      ] as const,
      planName: 'personal',
      popular: true
    },
    {
      key: 'pro',
      title: 'Pro',
      price: '¥980 / 月',
      description: '動的QR・高度解析・CSV一括などフル機能',
      features: [
        '4096px / SVG・PDF出力',
        'テンプレ・再編集無制限',
        '動的QR＋スキャン分析・リダイレクト管理',
        'CSV一括生成（月500件）・パスワード/有効期限'
      ] as const,
      planName: 'pro'
    }
  ] as const

  const scrollToPlans = () => {
    const el = document.getElementById('plan-options')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

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
          {currentPlan === 'free' ? (
            <button
              onClick={scrollToPlans}
              className="px-4 py-2 text-sm font-semibold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-colors"
            >
              プランをアップグレード
            </button>
          ) : (
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
      <div id="plan-options" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docPlans.map((planDef) => {
          const supabasePlan = planDef.planName ? planLookup[planDef.planName] : undefined
          const isCurrent = planDef.planName ? planDef.planName === currentPlan : false
          const isPopular = planDef.popular

          const renderButton = () => {
            if (planDef.cta) {
              return (
                <button
                  onClick={planDef.cta.action}
                  className="w-full py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-[#171158] to-[#1B1723] hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20"
                >
                  {planDef.cta.label}
                </button>
              )
            }

            if (isCurrent) {
              return (
                <button
                  disabled
                  className="w-full py-2.5 text-sm font-semibold text-[#1B1723]/50 bg-[#171158]/5 rounded-xl cursor-not-allowed"
                >
                  現在のプラン
                </button>
              )
            }

            if (!supabasePlan || !supabasePlan.stripe_price_id_monthly) {
              return (
                <button
                  disabled
                  className="w-full py-2.5 text-sm font-semibold text-[#1B1723]/50 bg-[#171158]/5 rounded-xl cursor-not-allowed"
                >
                  準備中
                </button>
              )
            }

            return (
              <button
                onClick={() => handleCheckout(planDef.planName!, supabasePlan.stripe_price_id_monthly)}
                disabled={!!checkoutLoading}
                className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all ${
                  isPopular
                    ? 'text-white bg-gradient-to-r from-[#171158] to-[#1B1723] hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20'
                    : 'text-[#171158] bg-[#171158]/10 hover:bg-[#171158]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {checkoutLoading === planDef.planName ? '処理中...' : planDef.planName === 'free' ? '無料' : 'アップグレード'}
              </button>
            )
          }

          return (
            <div
              key={planDef.key}
              className={`relative bg-white rounded-2xl border-2 p-5 transition-all ${
                isCurrent
                  ? 'border-[#E6A24C] shadow-lg shadow-[#E6A24C]/20'
                  : isPopular
                    ? 'border-[#171158] shadow-lg shadow-[#171158]/10'
                    : 'border-[#171158]/10 hover:border-[#171158]/30'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#171158] to-[#1B1723] text-white text-xs font-bold rounded-full">
                  人気
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#E6A24C] to-[#D4923D] text-white text-xs font-bold rounded-full">
                  現在のプラン
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#1B1723]">{planDef.title}</h3>
                <p className="text-sm text-[#1B1723]/60 mt-1">{planDef.description}</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-[#1B1723]">{planDef.price}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-[#1B1723]/70">
                {planDef.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {renderButton()}
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
