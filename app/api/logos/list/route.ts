import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ロゴ一覧取得
    const { data: logos, error } = await supabase
      .from('user_logos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Logo list error:', error)
      return NextResponse.json(
        { error: 'ロゴの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 使用量を計算
    const totalSizeBytes = (logos || []).reduce((sum, logo) => sum + (logo.file_size || 0), 0)
    const totalSizeMB = totalSizeBytes / (1024 * 1024)

    return NextResponse.json({
      logos: logos || [],
      usage: {
        count: logos?.length || 0,
        totalSizeMB: Math.round(totalSizeMB * 100) / 100
      }
    })
  } catch (error) {
    console.error('Logo list error:', error)
    return NextResponse.json(
      { error: 'ロゴの取得に失敗しました' },
      { status: 500 }
    )
  }
}
