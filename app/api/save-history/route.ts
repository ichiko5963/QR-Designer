import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const saveHistorySchema = z.object({
  url: z.string().url(),
  designName: z.string(),
  designSettings: z.object({}).passthrough(),
  qrImageUrl: z.string()
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      )
    }

    // リクエストボディの検証
    const body = await request.json()
    const validatedData = saveHistorySchema.parse(body)

    // 履歴に保存
    const { data, error } = await supabase
      .from('qr_history')
      .insert({
        user_id: user.id,
        url: validatedData.url,
        design_name: validatedData.designName,
        design_settings: validatedData.designSettings,
        qr_image_url: validatedData.qrImageUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving history:', error)
      return NextResponse.json(
        { error: 'Database error', message: '履歴の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in save-history API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
