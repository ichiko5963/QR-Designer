import { SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export interface ScanInfo {
  shortUrlId: string
  userAgent: string
  ip: string
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  referer?: string
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = 'desktop'
  let browser = 'unknown'
  let os = 'unknown'

  // デバイス判定
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    if (/iPad|Tablet/.test(ua)) {
      device = 'tablet'
    } else {
      device = 'mobile'
    }
  }

  // ブラウザ判定
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) {
    browser = 'Chrome'
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari'
  } else if (/Firefox/.test(ua)) {
    browser = 'Firefox'
  } else if (/Edg/.test(ua)) {
    browser = 'Edge'
  } else if (/MSIE|Trident/.test(ua)) {
    browser = 'IE'
  }

  // OS判定
  if (/Windows/.test(ua)) {
    os = 'Windows'
  } else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) {
    os = 'macOS'
  } else if (/iPhone|iPad/.test(ua)) {
    os = 'iOS'
  } else if (/Android/.test(ua)) {
    os = 'Android'
  } else if (/Linux/.test(ua)) {
    os = 'Linux'
  }

  return { device, browser, os }
}

export async function getScanInfo(shortUrlId: string): Promise<ScanInfo> {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
             headersList.get('x-real-ip') ||
             'unknown'
  const referer = headersList.get('referer') || undefined

  // Vercel Edge地域情報
  const country = headersList.get('x-vercel-ip-country') || undefined
  const city = headersList.get('x-vercel-ip-city') || undefined

  const { device, browser, os } = parseUserAgent(userAgent)

  return {
    shortUrlId,
    userAgent,
    ip,
    country,
    city,
    device,
    browser,
    os,
    referer
  }
}

export async function logScan(supabase: SupabaseClient, scanInfo: ScanInfo): Promise<void> {
  try {
    await supabase.from('scan_logs').insert({
      short_url_id: scanInfo.shortUrlId,
      user_agent: scanInfo.userAgent,
      ip_address: scanInfo.ip,
      country: scanInfo.country,
      city: scanInfo.city,
      device: scanInfo.device,
      browser: scanInfo.browser,
      os: scanInfo.os,
      referer: scanInfo.referer
    })
  } catch (error) {
    console.error('Failed to log scan:', error)
  }
}
