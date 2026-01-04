import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractMetadata } from '@/lib/scraper/cheerio'
import { analyzeURL } from '@/lib/ai/analyze'

const URLSchema = z.object({
  url: z.string().url('有効なURLを入力してください')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = URLSchema.parse(body)
    
    // Step 1: メタデータ取得
    const metadata = await extractMetadata(url)
    
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
    
    return NextResponse.json({
      success: true,
      data: analysis
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

