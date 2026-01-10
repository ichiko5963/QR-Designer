import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanInfo, checkDynamicQRLimit } from '@/lib/plan-limits'
import { generateShortCode, getShortUrl } from '@/lib/short-url/generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { destinationUrl, name } = await request.json()

    if (!destinationUrl) {
      return NextResponse.json({ error: 'destinationUrl is required' }, { status: 400 })
    }

    // URL形式確認
    try {
      new URL(destinationUrl)
    } catch {
      return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 })
    }

    // プラン確認
    const planInfo = await getPlanInfo(supabase, user.id)
    const limitCheck = checkDynamicQRLimit(planInfo.usage.dynamic_qr, planInfo.features.dynamic_qr_limit)

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message },
        { status: 403 }
      )
    }

    // ユニークなコードを生成（衝突チェック付き）
    let code: string
    let attempts = 0
    const maxAttempts = 5

    do {
      code = generateShortCode()
      const { data: existing } = await supabase
        .from('short_urls')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'コードの生成に失敗しました。もう一度お試しください。' },
        { status: 500 }
      )
    }

    // 短縮URL作成
    const { data: shortUrl, error } = await supabase
      .from('short_urls')
      .insert({
        user_id: user.id,
        code,
        destination_url: destinationUrl,
        name: name || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Short URL creation error:', error)
      return NextResponse.json(
        { error: '短縮URLの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 動的QRカウント更新
    await supabase
      .from('subscriptions')
      .update({
        dynamic_qr_count: planInfo.usage.dynamic_qr + 1
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      shortUrl: {
        ...shortUrl,
        short_url: getShortUrl(code)
      }
    })
  } catch (error) {
    console.error('Short URL creation error:', error)
    return NextResponse.json(
      { error: '短縮URLの作成に失敗しました' },
      { status: 500 }
    )
  }
}
