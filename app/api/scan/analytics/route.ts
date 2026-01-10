import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanInfo, canAccessFeature } from '@/lib/plan-limits'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プラン確認
    const planInfo = await getPlanInfo(supabase, user.id)
    if (!canAccessFeature('scan_analytics', planInfo.features)) {
      return NextResponse.json(
        { error: 'スキャン分析は Business プラン以上で利用できます' },
        { status: 403 }
      )
    }

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const shortUrlId = searchParams.get('shortUrlId')

    // 日付範囲
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // ユーザーの短縮URL一覧取得
    const { data: userShortUrls } = await supabase
      .from('short_urls')
      .select('id')
      .eq('user_id', user.id)

    const userUrlIds = userShortUrls?.map(u => u.id) || []

    if (userUrlIds.length === 0) {
      return NextResponse.json({
        overview: { totalScans: 0, todayScans: 0, weekScans: 0 },
        timeSeries: [],
        devices: [],
        browsers: [],
        countries: [],
        topUrls: []
      })
    }

    // スキャンログ取得
    let query = supabase
      .from('scan_logs')
      .select('*')
      .in('short_url_id', shortUrlId ? [shortUrlId] : userUrlIds)
      .gte('scanned_at', startDate.toISOString())
      .order('scanned_at', { ascending: false })

    const { data: scanLogs } = await query

    const logs = scanLogs || []

    // 概要統計
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const todayScans = logs.filter(l => new Date(l.scanned_at) >= todayStart).length
    const weekScans = logs.filter(l => new Date(l.scanned_at) >= weekStart).length
    const totalScans = logs.length

    // 日別時系列データ
    const dailyCounts: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyCounts[dateStr] = 0
    }

    logs.forEach(log => {
      const dateStr = new Date(log.scanned_at).toISOString().split('T')[0]
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++
      }
    })

    const timeSeries = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // デバイス別集計
    const deviceCounts: Record<string, number> = {}
    logs.forEach(log => {
      const device = log.device || 'unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })

    const devices = Object.entries(deviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // ブラウザ別集計
    const browserCounts: Record<string, number> = {}
    logs.forEach(log => {
      const browser = log.browser || 'unknown'
      browserCounts[browser] = (browserCounts[browser] || 0) + 1
    })

    const browsers = Object.entries(browserCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 国別集計
    const countryCounts: Record<string, number> = {}
    logs.forEach(log => {
      const country = log.country || 'Unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    })

    const countries = Object.entries(countryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // トップURL
    const urlCounts: Record<string, number> = {}
    logs.forEach(log => {
      urlCounts[log.short_url_id] = (urlCounts[log.short_url_id] || 0) + 1
    })

    // URL情報を取得
    const { data: urls } = await supabase
      .from('short_urls')
      .select('id, code, name, destination_url')
      .in('id', Object.keys(urlCounts))

    const urlMap = new Map(urls?.map(u => [u.id, u]) || [])

    const topUrls = Object.entries(urlCounts)
      .map(([id, count]) => {
        const url = urlMap.get(id)
        return {
          id,
          code: url?.code || '',
          name: url?.name || url?.code || '',
          destinationUrl: url?.destination_url || '',
          count
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      overview: { totalScans, todayScans, weekScans },
      timeSeries,
      devices,
      browsers,
      countries,
      topUrls
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: '分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
