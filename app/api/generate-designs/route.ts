import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateDesigns } from '@/lib/ai/generate-designs'
import type { URLAnalysis } from '@/types/analysis'

const AnalysisSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  theme: z.string(),
  mood: z.string(),
  colors: z.array(z.string()),
  motif: z.string(),
  mainColor: z.string().optional(),
  designSuggestion: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    style: z.string()
  })
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const analysis = AnalysisSchema.parse(body.analysis)
    
    const designs = await generateDesigns(analysis as URLAnalysis)
    
    return NextResponse.json({
      success: true,
      designs
    })
  } catch (error) {
    console.error('Error generating designs:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '無効な分析データです' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'デザイン生成に失敗しました' },
      { status: 500 }
    )
  }
}

