'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AnalyticsData {
  overview: {
    totalScans: number
    todayScans: number
    weekScans: number
  }
  timeSeries: { date: string; count: number }[]
  devices: { name: string; count: number }[]
  browsers: { name: string; count: number }[]
  countries: { name: string; count: number }[]
  topUrls: {
    id: string
    code: string
    name: string
    destinationUrl: string
    count: number
  }[]
}

type Period = '7' | '30' | '90'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [period, setPeriod] = useState<Period>('30')

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/analytics?days=${period}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      } else if (res.status === 403) {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', user.id)
        .single()

      const plan = subscription?.plan_name || 'free'
      // Proプラン以上でスキャン分析機能を利用可能
      const planHasAccess = ['pro', 'business', 'agency', 'enterprise'].includes(plan)
      setHasAccess(planHasAccess)

      if (planHasAccess) {
        fetchAnalytics()
      } else {
        setLoading(false)
      }
    }

    checkAccess()
  }, [fetchAnalytics])

  useEffect(() => {
    if (hasAccess) {
      setLoading(true)
      fetchAnalytics()
    }
  }, [period, hasAccess, fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B1723] mb-2">スキャン分析</h1>
          <p className="text-[#1B1723]/60 mb-6">
            QRコードのスキャン数、地域、デバイスなどの詳細な分析を確認できます。
            この機能はProプラン（¥980/月）以上でご利用いただけます。
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
          >
            Proプランにアップグレード
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...(analytics?.timeSeries.map(d => d.count) || [1]), 1)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">スキャン分析</h1>
          <p className="text-sm text-[#1B1723]/50 mt-1">
            QRコードの読み取り状況を分析
          </p>
        </div>
        {/* 期間フィルター */}
        <div className="flex gap-1 bg-[#171158]/5 rounded-xl p-1">
          {(['7', '30', '90'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                period === p
                  ? 'bg-white text-[#1B1723] shadow-sm'
                  : 'text-[#1B1723]/60 hover:text-[#1B1723]'
              }`}
            >
              {p}日
            </button>
          ))}
        </div>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <p className="text-sm text-[#1B1723]/50 mb-1">期間合計</p>
          <p className="text-3xl font-bold text-[#1B1723]">
            {analytics?.overview.totalScans.toLocaleString() || 0}
          </p>
          <p className="text-xs text-[#1B1723]/40 mt-1">スキャン</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <p className="text-sm text-[#1B1723]/50 mb-1">今日</p>
          <p className="text-3xl font-bold text-[#E6A24C]">
            {analytics?.overview.todayScans.toLocaleString() || 0}
          </p>
          <p className="text-xs text-[#1B1723]/40 mt-1">スキャン</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <p className="text-sm text-[#1B1723]/50 mb-1">過去7日間</p>
          <p className="text-3xl font-bold text-[#171158]">
            {analytics?.overview.weekScans.toLocaleString() || 0}
          </p>
          <p className="text-xs text-[#1B1723]/40 mt-1">スキャン</p>
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
        <h2 className="font-semibold text-[#1B1723] mb-4">日別スキャン数</h2>
        {analytics?.timeSeries && analytics.timeSeries.length > 0 ? (
          <div className="h-48">
            <div className="flex items-end justify-between h-full gap-1">
              {analytics.timeSeries.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-[#E6A24C] to-[#F0B86E] rounded-t transition-all hover:from-[#D4923D] hover:to-[#E6A24C]"
                    style={{ height: `${Math.max((d.count / maxCount) * 100, 2)}%` }}
                    title={`${d.date}: ${d.count}スキャン`}
                  />
                  {i % Math.ceil(analytics.timeSeries.length / 7) === 0 && (
                    <span className="text-[10px] text-[#1B1723]/40 mt-2 truncate max-w-full">
                      {new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-[#1B1723]/40">
            データがありません
          </div>
        )}
      </div>

      {/* 詳細グリッド */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* デバイス別 */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <h2 className="font-semibold text-[#1B1723] mb-4">デバイス別</h2>
          {analytics?.devices && analytics.devices.length > 0 ? (
            <div className="space-y-3">
              {analytics.devices.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#171158]/5 rounded-lg flex items-center justify-center">
                    {d.name === 'mobile' && (
                      <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    {d.name === 'desktop' && (
                      <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {d.name === 'tablet' && (
                      <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-[#1B1723]">{d.name}</span>
                      <span className="text-[#1B1723]/60">{d.count}</span>
                    </div>
                    <div className="w-full h-2 bg-[#171158]/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E6A24C] rounded-full"
                        style={{ width: `${(d.count / analytics.overview.totalScans) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1B1723]/40 text-center py-4">データがありません</p>
          )}
        </div>

        {/* ブラウザ別 */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <h2 className="font-semibold text-[#1B1723] mb-4">ブラウザ別</h2>
          {analytics?.browsers && analytics.browsers.length > 0 ? (
            <div className="space-y-3">
              {analytics.browsers.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#171158]/5 rounded-lg flex items-center justify-center text-xs font-bold text-[#171158]">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#1B1723]">{b.name}</span>
                      <span className="text-[#1B1723]/60">{b.count}</span>
                    </div>
                    <div className="w-full h-2 bg-[#171158]/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#171158] rounded-full"
                        style={{ width: `${(b.count / analytics.overview.totalScans) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1B1723]/40 text-center py-4">データがありません</p>
          )}
        </div>
      </div>

      {/* 国別 & トップURL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 国別 */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <h2 className="font-semibold text-[#1B1723] mb-4">地域別</h2>
          {analytics?.countries && analytics.countries.length > 0 ? (
            <div className="space-y-2">
              {analytics.countries.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#171158]/5 last:border-0">
                  <span className="text-sm text-[#1B1723]">{c.name}</span>
                  <span className="text-sm font-medium text-[#1B1723]">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1B1723]/40 text-center py-4">データがありません</p>
          )}
        </div>

        {/* トップURL */}
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-6">
          <h2 className="font-semibold text-[#1B1723] mb-4">人気のQRコード</h2>
          {analytics?.topUrls && analytics.topUrls.length > 0 ? (
            <div className="space-y-3">
              {analytics.topUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#171158]/5 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1B1723] truncate text-sm">{url.name}</p>
                    <p className="text-xs text-[#1B1723]/40 truncate">{url.destinationUrl}</p>
                  </div>
                  <span className="text-lg font-bold text-[#E6A24C] ml-4">{url.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1B1723]/40 text-center py-4">データがありません</p>
          )}
        </div>
      </div>
    </div>
  )
}
