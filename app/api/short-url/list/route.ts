import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getShortUrl } from '@/lib/short-url/generator'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 短縮URL一覧を取得
    const { data: shortUrls, error } = await supabase
      .from('short_urls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Short URL list error:', error)
      return NextResponse.json(
        { error: '短縮URLの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 短縮URL情報を追加
    const shortUrlsWithFullUrl = (shortUrls || []).map(url => ({
      ...url,
      short_url: getShortUrl(url.code)
    }))

    return NextResponse.json({ shortUrls: shortUrlsWithFullUrl })
  } catch (error) {
    console.error('Short URL list error:', error)
    return NextResponse.json(
      { error: '短縮URLの取得に失敗しました' },
      { status: 500 }
    )
  }
}
