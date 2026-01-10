import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Edge Runtimeで高速なリダイレクトを実現
export const runtime = 'edge'

// Supabase クライアント（Edge Runtime用）
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = getSupabase()

  // 短縮URL取得
  const { data: shortUrl, error } = await supabase
    .from('short_urls')
    .select('id, destination_url, is_active')
    .eq('code', code)
    .single()

  if (error || !shortUrl) {
    // 404ページにリダイレクト
    return NextResponse.redirect(new URL('/?error=not_found', request.url))
  }

  if (!shortUrl.is_active) {
    // 無効なリンク
    return NextResponse.redirect(new URL('/?error=link_disabled', request.url))
  }

  // スキャン情報を取得してログに記録（非同期、エラーは無視）
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const referer = request.headers.get('referer') || null
  const country = request.headers.get('x-vercel-ip-country') || null
  const city = request.headers.get('x-vercel-ip-city') || null

  // デバイス・ブラウザ・OS判定
  let device = 'desktop'
  let browser = 'unknown'
  let os = 'unknown'

  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    device = /iPad|Tablet/.test(userAgent) ? 'tablet' : 'mobile'
  }

  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
    browser = 'Chrome'
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari'
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox'
  } else if (/Edg/.test(userAgent)) {
    browser = 'Edge'
  }

  if (/Windows/.test(userAgent)) {
    os = 'Windows'
  } else if (/Mac OS X/.test(userAgent) && !/iPhone|iPad/.test(userAgent)) {
    os = 'macOS'
  } else if (/iPhone|iPad/.test(userAgent)) {
    os = 'iOS'
  } else if (/Android/.test(userAgent)) {
    os = 'Android'
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux'
  }

  // スキャンログを非同期で記録（レスポンスをブロックしない）
  // Edge Runtimeではwaituntil的な機能を使えないため、発火するだけ
  ;(async () => {
    try {
      await supabase.from('scan_logs').insert({
        short_url_id: shortUrl.id,
        user_agent: userAgent,
        ip_address: ip,
        country,
        city,
        device,
        browser,
        os,
        referer
      })
      // スキャンカウントを増加
      await supabase.rpc('increment_scan_count', { url_id: shortUrl.id })
    } catch (err) {
      console.error('Scan log error:', err)
    }
  })()

  // 遷移先にリダイレクト
  return NextResponse.redirect(shortUrl.destination_url, { status: 302 })
}
