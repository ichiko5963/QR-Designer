import { customAlphabet } from 'nanoid'

// URL-safeな文字セット（紛らわしい文字を除外）
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

// 8文字のコードを生成
const nanoid = customAlphabet(alphabet, 8)

export function generateShortCode(): string {
  return nanoid()
}

export function getShortUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/r/${code}`
}
