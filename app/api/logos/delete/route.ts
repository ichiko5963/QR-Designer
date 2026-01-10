import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { logoId } = await request.json()

    if (!logoId) {
      return NextResponse.json({ error: 'logoId is required' }, { status: 400 })
    }

    // ロゴ情報を取得
    const { data: logo, error: fetchError } = await supabase
      .from('user_logos')
      .select('storage_path')
      .eq('id', logoId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !logo) {
      return NextResponse.json({ error: 'ロゴが見つかりません' }, { status: 404 })
    }

    // Storageから削除
    const { error: storageError } = await supabase.storage
      .from('logos')
      .remove([logo.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // DBから削除
    const { error: dbError } = await supabase
      .from('user_logos')
      .delete()
      .eq('id', logoId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('DB delete error:', dbError)
      return NextResponse.json(
        { error: 'ロゴの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json(
      { error: 'ロゴの削除に失敗しました' },
      { status: 500 }
    )
  }
}
