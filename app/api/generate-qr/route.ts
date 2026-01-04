import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateQRCodeAsDataURL } from '@/lib/qr/generator'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
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
    errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']),
    dotStyle: z.string()
  }),
  logo: z.string().optional(), // base64 encoded image
  logoUrl: z.string().url().optional(),
  saveToHistory: z.boolean().optional().default(false)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, design, customization, logo, logoUrl, saveToHistory } = GenerateQRSchema.parse(body)
    
    // ロゴをBufferに変換
    let logoBuffer: Buffer | undefined
    if (logo) {
      logoBuffer = Buffer.from(logo.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    } else if (logoUrl) {
      try {
        const fetched = await fetch(logoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        if (fetched.ok) {
          const contentType = fetched.headers.get('content-type') || ''
          if (contentType.startsWith('image/')) {
            const arrayBuffer = await fetched.arrayBuffer()
            const rawBuffer = Buffer.from(arrayBuffer)
            // ICOなど互換性のない形式をPNGに正規化
            logoBuffer = await sharp(rawBuffer).png().toBuffer()
          }
        }
      } catch (err) {
        console.warn('Failed to fetch remote logo:', err)
      }
    }
    
    // QRコード生成
    const qrDataURL = await generateQRCodeAsDataURL({
      url,
      design: design as Design,
      customization: customization as Customization,
      logo: logoBuffer
    })
    
    // 履歴保存がリクエストされた場合のみ認証チェック
    if (saveToHistory) {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({
          success: true,
          qrCode: qrDataURL,
          requiresAuth: true,
          message: '履歴を保存するにはGoogleアカウントでログインしてください'
        })
      }
      
      // レート制限チェック（無料プランの場合）
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan_type, last_generated_at, total_generated')
        .eq('user_id', user.id)
        .single()
      
      const planType = profile?.plan_type || 'free'
      
      if (planType === 'free') {
        const lastGenerated = profile?.last_generated_at
          ? new Date(profile.last_generated_at)
          : null
        const now = new Date()
        const hoursSinceLastGeneration = lastGenerated
          ? (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60)
          : 168 // 初回は168時間（1週間）経過とみなす
        
        if (hoursSinceLastGeneration < 168) {
          const remainingHours = Math.ceil(168 - hoursSinceLastGeneration)
          const remainingDays = Math.ceil(remainingHours / 24)
          return NextResponse.json({
            success: true,
            qrCode: qrDataURL,
            rateLimitExceeded: true,
            message: `無料プランは1週間に1回までです。次回生成可能まであと${remainingDays}日です。有料プラン（$4/月）で無制限利用できます。`
          })
        }
      }
      
      // 履歴に保存
      await supabase
        .from('qr_history')
        .insert({
          user_id: user.id,
          url,
          design_name: design.name,
          design_config: { design, customization },
          qr_image_url: qrDataURL,
          format: 'png'
        })
      
      // ユーザープロフィール更新
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          last_generated_at: new Date().toISOString(),
          total_generated: (profile?.total_generated || 0) + 1
        }, {
          onConflict: 'user_id'
        })
    }
    
    return NextResponse.json({
      success: true,
      qrCode: qrDataURL
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
