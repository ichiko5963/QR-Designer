import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractMetadata } from '@/lib/scraper/cheerio'
import { analyzeURL } from '@/lib/ai/analyze'

const URLSchema = z.object({
  url: z.string().url('有効なURLを入力してください')
})

interface SNSInfo {
  platform: 'twitter' | 'instagram' | 'youtube' | null
  username: string | null
  profileImageUrl: string | null
}

function detectSNS(url: string): SNSInfo {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.toLowerCase()
  const pathname = urlObj.pathname

  // X/Twitter detection
  if (hostname === 'twitter.com' || hostname === 'x.com' || hostname === 'www.twitter.com' || hostname === 'www.x.com') {
    // Extract username from path like /username or /username/status/123
    const match = pathname.match(/^\/([^\/]+)/)
    if (match && match[1] && !['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i'].includes(match[1])) {
      const username = match[1]
      return {
        platform: 'twitter',
        username,
        profileImageUrl: `https://unavatar.io/twitter/${username}`
      }
    }
  }

  // Instagram detection
  if (hostname === 'instagram.com' || hostname === 'www.instagram.com') {
    // Extract username from path like /username or /username/
    const match = pathname.match(/^\/([^\/]+)/)
    if (match && match[1] && !['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'].includes(match[1])) {
      const username = match[1]
      return {
        platform: 'instagram',
        username,
        profileImageUrl: `https://unavatar.io/instagram/${username}`
      }
    }
  }

  // YouTube detection
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com') {
    // Channel URL patterns: /@handle, /channel/ID, /c/customname, /user/username
    let channelId: string | null = null

    if (pathname.startsWith('/@')) {
      // Handle format: /@username
      channelId = pathname.slice(2).split('/')[0]
    } else if (pathname.startsWith('/channel/')) {
      channelId = pathname.slice(9).split('/')[0]
    } else if (pathname.startsWith('/c/')) {
      channelId = pathname.slice(3).split('/')[0]
    } else if (pathname.startsWith('/user/')) {
      channelId = pathname.slice(6).split('/')[0]
    }

    if (channelId) {
      return {
        platform: 'youtube',
        username: channelId,
        // YouTubeはog:imageから取得するためnullを返す
        profileImageUrl: null
      }
    }
  }

  return { platform: null, username: null, profileImageUrl: null }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = URLSchema.parse(body)

    // Step 0: SNS検出
    const snsInfo = detectSNS(url)

    // Step 1: メタデータ取得
    const metadata = await extractMetadata(url)

    // SNSの場合はプロフィール画像をfaviconとして使用
    if (snsInfo.profileImageUrl) {
      metadata.favicon = snsInfo.profileImageUrl
    } else if (snsInfo.platform === 'youtube' && metadata.ogImage) {
      // YouTubeチャンネルの場合、og:imageをロゴとして使用
      metadata.favicon = metadata.ogImage
    }

    // Step 2: HTMLスニペット取得（最初の20行）
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const html = await response.text()
    const htmlSnippet = html.split('\n').slice(0, 20).join('\n')

    // Step 3: AI分析
    const analysis = await analyzeURL(htmlSnippet, metadata)
    analysis.url = url

    // SNS情報を追加
    const result = {
      ...analysis,
      ...(snsInfo.platform && {
        snsPlatform: snsInfo.platform,
        snsUsername: snsInfo.username
      })
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error analyzing URL:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'URLの解析に失敗しました' },
      { status: 500 }
    )
  }
}

