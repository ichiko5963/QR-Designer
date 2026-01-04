import * as cheerio from 'cheerio'

export interface Metadata {
  title: string
  description: string
  ogImage?: string
  favicon?: string
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
    
    return {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') || 
               $('link[rel="shortcut icon"]').attr('href') ||
               new URL('/favicon.ico', url).toString()
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    throw new Error('Failed to extract metadata from URL')
  }
}

