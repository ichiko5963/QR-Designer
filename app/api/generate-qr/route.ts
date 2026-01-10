import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateQRCodeAsDataURL } from '@/lib/qr/generator'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { parseICO } from 'icojs'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

const GenerateQRSchema = z.object({
  url: z.string().url(),
  design: z.object({
    id: z.string(),
    name: z.string(),
    fgColor: z.string(),
    bgColor: z.string(),
    style: z.string(),
    cornerStyle: z.string(),
    motifKeyword: z.string()
  }),
  customization: z.object({
    size: z.number().min(256).max(4096),
    cornerRadius: z.number().min(0).max(50),
    logoSize: z.number().min(10).max(35),
    logoBackground: z.boolean(),
    logoFrameShape: z.enum(['square', 'rounded', 'circle', 'none']).optional(),
    logoFrameColor: z.string().optional(),
    errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']),
    dotStyle: z.string(),
    outerShape: z.string().optional(),
    frameEnabled: z.boolean().optional(),
    frameText: z.string().optional(),
    frameColor: z.string().optional(),
    frameBackground: z.string().optional(),
    frameTemplate: z.string().optional(),
    frameGradientEnabled: z.boolean().optional(),
    frameGradientStyle: z.string().optional(),
    frameColor1: z.string().optional(),
    frameColor2: z.string().optional(),
    frameBackgroundTransparent: z.boolean().optional(),
    frameBackgroundGradientEnabled: z.boolean().optional(),
    frameBackgroundGradientStyle: z.string().optional(),
    frameBackground1: z.string().optional(),
    frameBackground2: z.string().optional(),
    patternStyle: z.string().optional(),
    patternGradientEnabled: z.boolean().optional(),
    patternGradientStyle: z.string().optional(),
    patternColor1: z.string().optional(),
    patternColor2: z.string().optional(),
    patternColor3: z.string().optional(),
    colorStyle: z.string().optional(),
    gradientDirection: z.string().optional(),
    patternBackgroundTransparent: z.boolean().optional(),
    patternBackgroundGradientEnabled: z.boolean().optional(),
    patternBackgroundGradientStyle: z.string().optional(),
    patternBackground1: z.string().optional(),
    patternBackground2: z.string().optional(),
    cornerFrameStyle: z.string().optional(),
    cornerDotStyle: z.string().optional()
  }),
  logo: z.string().optional(), // base64 encoded image
  logoUrl: z.string().url().optional(),
  saveToHistory: z.boolean().optional().default(false)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, design, customization, logo, logoUrl, saveToHistory } = GenerateQRSchema.parse(body)
    const siteOrigin = new URL(url).origin
    
    // ロゴをBufferに変換
    let logoBuffer: Buffer | undefined
    if (logo) {
      logoBuffer = Buffer.from(logo.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    } else {
      const candidates: string[] = []
      if (logoUrl) candidates.push(logoUrl)

      // SNSプロフィール画像を優先的に取得（YouTube, X, Instagram, Facebook, LINE, TikTok）
      const snsProfileCandidates = await getSNSProfileImageCandidates(url)
      candidates.push(...snsProfileCandidates)

      // 明示ロゴがない場合でも /favicon.ico を試す
      candidates.push(new URL('/favicon.ico', url).toString())
      // 最終手段として Google の favicon 取得API
      candidates.push(`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(siteOrigin)}`)
      logoBuffer = await fetchFirstAvailableLogo(candidates)
    }
    
    // QRコード生成
    const qrResult = await generateQRCodeAsDataURL({
      url,
      design: design as Design,
      customization: customization as Customization,
      logo: logoBuffer
    })
    const qrDataURL = qrResult.dataUrl
    const extractedLogoColors = qrResult.extractedLogoColors

    // 履歴保存がリクエストされた場合のみ認証チェック
    if (saveToHistory) {
      console.log('[generate-qr] saveToHistory=true, checking auth...')
      const supabase = await createClient()
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      console.log('[generate-qr] Auth check:', { hasUser: !!user, authError: authError?.message })

      if (authError || !user) {
        console.log('[generate-qr] No user, returning requiresAuth')
        return NextResponse.json({
          success: true,
          qrCode: qrDataURL,
          extractedLogoColors,
          requiresAuth: true,
          message: '履歴を保存するにはGoogleアカウントでログインしてください'
        })
      }

      console.log('[generate-qr] User authenticated:', user.id, user.email)

      // レート制限チェック（無料プランの場合）
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('plan_type, last_generated_at, total_generated')
        .eq('user_id', user.id)
        .single()

      console.log('[generate-qr] Profile check:', { profile, profileError: profileError?.message })

      const planType = profile?.plan_type || 'free'

      // レート制限は一時的に無効化（デバッグ用）
      // if (planType === 'free') { ... }

      // ページタイトルを取得
      console.log('[generate-qr] Fetching page title...')
      const pageTitle = await fetchPageTitle(url)
      console.log('[generate-qr] Page title:', pageTitle)

      // 履歴に保存
      console.log('[generate-qr] Inserting to qr_history...')
      const { data: historyData, error: historyError } = await supabase
        .from('qr_history')
        .insert({
          user_id: user.id,
          url,
          design_name: design.name,
          design_settings: { design, customization },
          qr_image_url: qrDataURL,
          page_title: pageTitle
        })
        .select('id')
        .single()

      console.log('[generate-qr] History insert result:', { historyData, historyError: historyError?.message, historyErrorDetails: historyError })

      // 短縮URL自動生成（ログインユーザー全員に無料提供）
      let shortUrlData: { code: string; shortUrl: string } | null = null
      try {
        const { generateShortCode, getShortUrl } = await import('@/lib/short-url/generator')

        // ユニークなコードを生成
        let code: string = ''
        let attempts = 0
        const maxAttempts = 5

        do {
          code = generateShortCode()
          const { data: existing } = await supabase
            .from('short_urls')
            .select('id')
            .eq('code', code)
            .single()

          if (!existing) break
          attempts++
        } while (attempts < maxAttempts)

        if (attempts < maxAttempts && code) {
          const { data: shortUrl } = await supabase
            .from('short_urls')
            .insert({
              user_id: user.id,
              code,
              destination_url: url,
              original_url: url,
              qr_history_id: historyData?.id || null,
              is_active: true
            })
            .select('code')
            .single()

          if (shortUrl) {
            shortUrlData = {
              code: shortUrl.code,
              shortUrl: getShortUrl(shortUrl.code)
            }
          }
        }
      } catch (shortUrlError) {
        console.warn('Short URL auto-generation failed:', shortUrlError)
        // 短縮URL生成失敗してもQR保存は成功とする
      }

      // ユーザープロフィール更新
      console.log('[generate-qr] Updating user profile...')
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          last_generated_at: new Date().toISOString(),
          total_generated: (profile?.total_generated || 0) + 1
        }, {
          onConflict: 'user_id'
        })
      console.log('[generate-qr] Profile update result:', { error: profileUpdateError?.message })

      // ダッシュボードとQRコードページのキャッシュを更新
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/qr-codes')

      return NextResponse.json({
        success: true,
        qrCode: qrDataURL,
        extractedLogoColors,
        saved: true,
        historyId: historyData?.id,
        shortUrl: shortUrlData
      })
    }

    return NextResponse.json({
      success: true,
      qrCode: qrDataURL,
      extractedLogoColors
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'QRコード生成に失敗しました' },
      { status: 500 }
    )
  }
}

// SNS URLからプロフィール画像候補を取得
async function getSNSProfileImageCandidates(url: string): Promise<string[]> {
  const candidates: string[] = []
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.toLowerCase()

  // YouTube
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    // YouTubeチャンネル/ユーザーページの場合、oEmbedでサムネイルを取得試行
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const oembedRes = await fetch(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json()
        if (oembedData.thumbnail_url) {
          candidates.push(oembedData.thumbnail_url)
        }
      }
    } catch (e) {
      console.warn('YouTube oEmbed failed:', e)
    }
  }

  // X (Twitter)
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    // プロフィールページの場合、OGP画像を取得
    const profileImageUrl = await fetchOGImage(url)
    if (profileImageUrl) candidates.push(profileImageUrl)
  }

  // Instagram
  if (hostname.includes('instagram.com')) {
    const profileImageUrl = await fetchOGImage(url)
    if (profileImageUrl) candidates.push(profileImageUrl)
  }

  // Facebook
  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
    const profileImageUrl = await fetchOGImage(url)
    if (profileImageUrl) candidates.push(profileImageUrl)
  }

  // LINE
  if (hostname.includes('line.me')) {
    const profileImageUrl = await fetchOGImage(url)
    if (profileImageUrl) candidates.push(profileImageUrl)
  }

  // TikTok
  if (hostname.includes('tiktok.com')) {
    const profileImageUrl = await fetchOGImage(url)
    if (profileImageUrl) candidates.push(profileImageUrl)
  }

  return candidates
}

// ページからOGP画像を取得
async function fetchOGImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    if (!res.ok) return null

    const html = await res.text()

    // og:image を探す
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    if (ogImageMatch) return ogImageMatch[1]

    // twitter:image を探す
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (twitterImageMatch) return twitterImageMatch[1]

    return null
  } catch (e) {
    console.warn('Failed to fetch OG image:', e)
    return null
  }
}

async function fetchFirstAvailableLogo(candidates: string[]): Promise<Buffer | undefined> {
  for (const candidate of candidates) {
    try {
      const fetched = await fetch(candidate, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (!fetched.ok) continue

      const contentType = fetched.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) continue

      const arrayBuffer = await fetched.arrayBuffer()
      const rawBuffer = Buffer.from(arrayBuffer)
      const normalized = await normalizeLogoBuffer(rawBuffer, contentType, candidate)
      return normalized
    } catch (err) {
      console.warn('Failed to fetch logo candidate:', candidate, err)
    }
  }
  return undefined
}

async function normalizeLogoBuffer(rawBuffer: Buffer, contentType: string, candidate: string) {
  const lowerContentType = contentType.toLowerCase()
  const isIco =
    lowerContentType.includes('image/x-icon') ||
    lowerContentType.includes('image/vnd.microsoft.icon') ||
    candidate.toLowerCase().endsWith('.ico')

  if (isIco) {
    try {
      const icoImages = await parseICO(rawBuffer, 'image/png')
      if (icoImages.length > 0) {
        const largest = icoImages.sort((a, b) => b.width * b.height - a.width * a.height)[0]
        return Buffer.from(largest.buffer)
      }
    } catch (icoError) {
      console.warn('Failed to normalize ICO logo candidate:', candidate, icoError)
    }
  }

  return sharp(rawBuffer).png().toBuffer()
}

// URLからページタイトルを取得
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
    })
    if (!res.ok) return null

    const html = await res.text()

    // <title>タグを探す
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      return titleMatch[1].trim()
    }

    // og:title を探す
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
    if (ogTitleMatch) {
      return ogTitleMatch[1].trim()
    }

    return null
  } catch (e) {
    console.warn('Failed to fetch page title:', e)
    return null
  }
}
