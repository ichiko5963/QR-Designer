import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, destinationUrl, name, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {}

    if (destinationUrl !== undefined) {
      // URL形式確認
      try {
        new URL(destinationUrl)
        updateData.destination_url = destinationUrl
      } catch {
        return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 })
      }
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '更新するフィールドがありません' }, { status: 400 })
    }

    // 所有権確認と更新
    const { data: shortUrl, error } = await supabase
      .from('short_urls')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '短縮URLが見つかりません' }, { status: 404 })
      }
      console.error('Short URL update error:', error)
      return NextResponse.json(
        { error: '短縮URLの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ shortUrl })
  } catch (error) {
    console.error('Short URL update error:', error)
    return NextResponse.json(
      { error: '短縮URLの更新に失敗しました' },
      { status: 500 }
    )
  }
}
