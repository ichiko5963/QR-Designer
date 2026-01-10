import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/ai/gemini'
import type { QuestionType } from '@/types/form'

interface GeneratedQuestion {
  title: string
  type: QuestionType
  description?: string
  options?: string[]
  is_required: boolean
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, formId } = body

    console.log('AI生成リクエスト受信:', { prompt, formId })

    if (!prompt || !formId) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json(
        { error: '認証が必要です。ログインしてください。' },
        { status: 401 }
      )
    }

    // フォームの所有者チェック
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, user_id')
      .eq('id', formId)
      .single()

    if (formError) {
      console.error('フォーム取得エラー:', formError)
      return NextResponse.json(
        { error: 'フォームの取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!form || form.user_id !== user.id) {
      return NextResponse.json(
        { error: 'フォームが見つからないか、アクセス権がありません' },
        { status: 403 }
      )
    }

    // Gemini API キーチェック
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI機能が設定されていません' },
        { status: 500 }
      )
    }

    // Gemini APIで質問を生成
    console.log('Gemini APIを呼び出し中...')
    const model = getGeminiModel()

    const systemPrompt = `あなたはアンケートフォームの質問を作成するエキスパートです。
ユーザーの要望に基づいて、適切なアンケートの質問を日本語で生成してください。

以下のJSON形式で質問を配列として返してください:
[
  {
    "title": "質問のタイトル",
    "type": "質問タイプ（text, textarea, radio, checkbox, select, rating, date, email, phone のいずれか）",
    "description": "質問の説明（任意）",
    "options": ["選択肢1", "選択肢2"]（radio, checkbox, select の場合のみ必要）,
    "is_required": true または false
  }
]

注意事項:
- 質問は3〜8個程度が適切です
- 質問タイプは内容に応じて適切なものを選んでください
- rating（星評価）は1〜5の評価に使います
- radio（単一選択）、checkbox（複数選択）、select（ドロップダウン）には必ずoptionsを含めてください
- 自由記述にはtextareaを使ってください
- 短い回答にはtextを使ってください
- JSON以外の文字を含めないでください`

    let result
    try {
      result = await model.generateContent([
        { text: systemPrompt },
        { text: `ユーザーの要望: ${prompt}` }
      ])
    } catch (geminiError) {
      console.error('Gemini API エラー:', geminiError)
      const errorMessage = geminiError instanceof Error ? geminiError.message : 'AI APIエラー'
      return NextResponse.json(
        { error: `AI生成に失敗しました: ${errorMessage}` },
        { status: 500 }
      )
    }

    const responseText = result.response.text()
    console.log('Gemini レスポンス:', responseText.substring(0, 200))

    // JSONを抽出
    let questions: GeneratedQuestion[] = []
    try {
      // JSONブロックを抽出（```json ... ``` または単純なJSON）
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        questions = JSON.parse(jsonStr)
      } else {
        questions = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'AI応答の解析に失敗しました。もう一度お試しください。' },
        { status: 500 }
      )
    }

    // 質問を検証
    const validTypes: QuestionType[] = ['text', 'textarea', 'radio', 'checkbox', 'select', 'rating', 'date', 'email', 'phone']
    const validatedQuestions = questions
      .filter(q => q.title && validTypes.includes(q.type))
      .map(q => ({
        title: q.title,
        type: q.type,
        description: q.description || null,
        options: ['radio', 'checkbox', 'select'].includes(q.type) && Array.isArray(q.options)
          ? q.options
          : null,
        is_required: q.is_required ?? false
      }))

    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        { error: '有効な質問を生成できませんでした' },
        { status: 500 }
      )
    }

    // 現在の最大order_indexを取得
    const { data: existingQuestions } = await supabase
      .from('form_questions')
      .select('order_index')
      .eq('form_id', formId)
      .order('order_index', { ascending: false })
      .limit(1)

    let nextOrderIndex = (existingQuestions?.[0]?.order_index ?? -1) + 1

    // 質問をDBに保存
    const questionsToInsert = validatedQuestions.map((q, index) => ({
      form_id: formId,
      title: q.title,
      question_type: q.type,
      description: q.description,
      options: q.options,
      is_required: q.is_required,
      order_index: nextOrderIndex + index
    }))

    console.log('質問をDBに保存中...', questionsToInsert.length, '件')

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('form_questions')
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error('Failed to insert questions:', insertError)
      return NextResponse.json(
        { error: `質問の保存に失敗しました: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('質問の生成・保存完了:', insertedQuestions?.length, '件')

    return NextResponse.json({
      success: true,
      questions: insertedQuestions
    })

  } catch (error) {
    console.error('AI generate questions error:', error)
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    return NextResponse.json(
      { error: `サーバーエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    )
  }
}
