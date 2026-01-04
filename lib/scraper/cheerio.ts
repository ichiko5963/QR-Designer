import * as cheerio from 'cheerio'

export interface Metadata {
  title: string
  description: string
  ogImage?: string
  favicon?: string
  mainColor?: string
}

export async function extractMetadata(url: string): Promise<Metadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const html = await response.text()
    
    // 最初の20行程度を取得
    const htmlSnippet = html.split('\n').slice(0, 20).join('\n')
    const $ = cheerio.load(htmlSnippet)
    
    const mainColor = extractMainColor(html)

    return {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') || 
               $('link[rel="shortcut icon"]').attr('href') ||
               new URL('/favicon.ico', url).toString(),
      mainColor
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    throw new Error('Failed to extract metadata from URL')
  }
}

function extractMainColor(html: string): string | undefined {
  // 1. メタタグのtheme-colorを最優先
  const themeColorMatch = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i
  )
  if (themeColorMatch?.[1]) {
    const normalized = normalizeHex(themeColorMatch[1])
    if (normalized) return normalized
  }

  // 2. CSS変数やスタイルから拾えるHEXカラー
  const variableMatch = html.match(/--(?:primary|brand)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8})/i)
  if (variableMatch?.[1]) {
    const normalized = normalizeHex(variableMatch[1])
    if (normalized) return normalized
  }

  // 3. HTML全体から出現頻度の高いHEXカラーを抽出
  const hexMatches = html.match(/#[0-9a-fA-F]{3,8}\b/g) || []
  const frequency: Record<string, number> = {}

  for (const hex of hexMatches) {
    const normalized = normalizeHex(hex)
    if (!normalized || isNeutralColor(normalized)) continue
    frequency[normalized] = (frequency[normalized] || 0) + 1
  }

  if (Object.keys(frequency).length === 0) return undefined

  return Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0]
}

function normalizeHex(color: string): string {
  const match = color.match(/#[0-9a-f]{3,8}/i)
  if (!match) return ''
  let hex = match[0].replace('#', '')

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }

  if (hex.length < 6) {
    hex = hex.padEnd(6, '0')
  }

  return `#${hex.slice(0, 6).toUpperCase()}`
}

function isNeutralColor(hex: string): boolean {
  // 真っ白・真っ黒・中間灰色に近い色はメインカラーとして扱わない
  const normalized = hex.replace('#', '')
  const num = parseInt(normalized, 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  const lowSaturation = max - min < 10
  const isTooDark = brightness < 40
  const isTooLight = brightness > 235

  return lowSaturation || isTooDark || isTooLight
}

