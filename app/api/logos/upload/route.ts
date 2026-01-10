import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanInfo, checkLogoStorageLimit } from '@/lib/plan-limits'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プラン確認
    const planInfo = await getPlanInfo(supabase, user.id)

    if (planInfo.features.logo_storage_mb === 0) {
      return NextResponse.json(
        { error: 'ロゴ保存は Starter プラン以上で利用できます' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string || file.name

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }

    // ファイルサイズ確認 (5MB制限)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      )
    }

    // ファイルタイプ確認
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'PNG、JPEG、SVG、WebP形式のみ対応しています' },
        { status: 400 }
      )
    }

    // 現在の使用量を取得
    const { data: currentLogos } = await supabase
      .from('user_logos')
      .select('file_size')
      .eq('user_id', user.id)

    const currentUsageMB = (currentLogos || []).reduce((sum, logo) => sum + (logo.file_size || 0), 0) / (1024 * 1024)
    const fileSizeMB = file.size / (1024 * 1024)

    // ストレージ制限確認
    const limitCheck = checkLogoStorageLimit(currentUsageMB + fileSizeMB, planInfo.features.logo_storage_mb)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message },
        { status: 403 }
      )
    }

    // ファイルをSupabase Storageにアップロード
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました' },
        { status: 500 }
      )
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // DBに保存
    const { data: logo, error: dbError } = await supabase
      .from('user_logos')
      .insert({
        user_id: user.id,
        name: name.replace(/\.[^/.]+$/, ''),
        storage_path: fileName,
        public_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single()

    if (dbError) {
      // ロールバック: アップロードしたファイルを削除
      await supabase.storage.from('logos').remove([fileName])
      console.error('DB insert error:', dbError)
      return NextResponse.json(
        { error: 'データベースへの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ logo })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'ロゴのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}
