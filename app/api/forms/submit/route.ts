import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { formId, answers } = body

    if (!formId || !answers) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // フォームの存在確認と受付状態チェック
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, is_published, is_accepting_responses')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'フォームが見つかりません' },
        { status: 404 }
      )
    }

    if (!form.is_published) {
      return NextResponse.json(
        { error: 'このフォームは非公開です' },
        { status: 403 }
      )
    }

    if (!form.is_accepting_responses) {
      return NextResponse.json(
        { error: 'このフォームは現在回答を受け付けていません' },
        { status: 403 }
      )
    }

    // 回答を保存
    const { error: insertError } = await supabase
      .from('form_responses')
      .insert({
        form_id: formId,
        answers,
        respondent_info: {
          userAgent: req.headers.get('user-agent') || null
        }
      })

    if (insertError) {
      console.error('Failed to save response:', insertError)
      return NextResponse.json(
        { error: '回答の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form submit error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
