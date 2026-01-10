'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Form, FormQuestion, QuestionType } from '@/types/form'
import { questionTypeLabels } from '@/types/form'

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string

  const [form, setForm] = useState<Form | null>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fetchForm = useCallback(async () => {
    const supabase = createClient()

    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError || !formData) {
      router.push('/dashboard/forms')
      return
    }

    const { data: questionsData } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId)
      .order('order_index', { ascending: true })

    setForm(formData)
    setQuestions(questionsData || [])
    setQrCodeUrl(formData.qr_code_url)
    setLoading(false)
  }, [formId, router])

  useEffect(() => {
    fetchForm()
  }, [fetchForm])

  const handleUpdateForm = async (updates: Partial<Form>) => {
    if (!form) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('forms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', form.id)

    if (!error) {
      setForm({ ...form, ...updates })
    }
    setSaving(false)
  }

  const handleAddQuestion = async (type: QuestionType) => {
    const supabase = createClient()

    const newQuestion = {
      form_id: formId,
      question_type: type,
      title: '質問を入力してください',
      is_required: false,
      order_index: questions.length,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['選択肢1', '選択肢2'] : null
    }

    const { data, error } = await supabase
      .from('form_questions')
      .insert(newQuestion)
      .select()
      .single()

    if (!error && data) {
      setQuestions([...questions, data])
      setEditingQuestionId(data.id)
    }
  }

  const handleUpdateQuestion = async (questionId: string, updates: Partial<FormQuestion>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('form_questions')
      .update(updates)
      .eq('id', questionId)

    if (!error) {
      setQuestions(questions.map(q => q.id === questionId ? { ...q, ...updates } : q))
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('この質問を削除しますか？')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('form_questions')
      .delete()
      .eq('id', questionId)

    if (!error) {
      setQuestions(questions.filter(q => q.id !== questionId))
    }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === questionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    await reorderQuestions(index, newIndex)
  }

  const reorderQuestions = async (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions]
    const [removed] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, removed)

    // ローカル状態を即座に更新
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })))

    // DBに保存
    const supabase = createClient()
    for (let i = 0; i < newQuestions.length; i++) {
      await supabase
        .from('form_questions')
        .update({ order_index: i })
        .eq('id', newQuestions[i].id)
    }
  }

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      await reorderQuestions(draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // AI生成機能
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('質問の内容を入力してください')
      return
    }

    setGeneratingAI(true)
    try {
      console.log('AI生成リクエスト送信:', { prompt: aiPrompt, formId })

      const response = await fetch('/api/forms/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, formId })
      })

      const data = await response.json()
      console.log('AI生成レスポンス:', data)

      if (!response.ok) {
        throw new Error(data.error || 'AI生成に失敗しました')
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions([...questions, ...data.questions])
        setShowAIModal(false)
        setAiPrompt('')
        alert(`${data.questions.length}件の質問を生成しました！`)
      } else {
        throw new Error('質問を生成できませんでした')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'AI生成に失敗しました'
      alert(`エラー: ${errorMessage}`)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleGenerateQR = async () => {
    if (!form) return

    setGeneratingQR(true)
    try {
      const formUrl = `${window.location.origin}/form/${form.code}`

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl,
          design: {
            id: 'form-qr',
            name: 'フォームQR',
            fgColor: form.theme_color || '#171158',
            bgColor: '#FFFFFF',
            style: 'minimal',
            cornerStyle: 'rounded',
            motifKeyword: 'form'
          },
          customization: {
            size: 512,
            cornerRadius: 10,
            logoSize: 20,
            logoBackground: true,
            errorCorrectionLevel: 'M',
            dotStyle: 'square'
          },
          saveToHistory: false
        })
      })

      const data = await response.json()
      if (data.success && data.qrCode) {
        setQrCodeUrl(data.qrCode)

        const supabase = createClient()
        await supabase
          .from('forms')
          .update({ qr_code_url: data.qrCode })
          .eq('id', form.id)
      }
    } catch (error) {
      console.error('Failed to generate QR:', error)
    } finally {
      setGeneratingQR(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!form) return null

  const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${form.code}`

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/forms"
            className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <FormTitleInput
              value={form.title}
              onSave={(title) => handleUpdateForm({ title })}
            />
            <p className="text-sm text-[#1B1723]/50">
              {saving ? '保存中...' : '自動保存'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI生成
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QRコード
          </button>

          <Link
            href={`/dashboard/forms/${form.id}/responses`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            回答 ({form.response_count})
          </Link>

          <button
            onClick={() => handleUpdateForm({ is_published: !form.is_published })}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              form.is_published
                ? 'text-white bg-green-500 hover:bg-green-600'
                : 'text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] hover:from-[#F0B86E] hover:to-[#E6A24C]'
            }`}
          >
            {form.is_published ? '公開中' : '公開する'}
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: フォーム設定 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <h3 className="font-semibold text-[#1B1723] mb-4">フォーム設定</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                  説明
                </label>
                <FormDescriptionInput
                  value={form.description || ''}
                  onSave={(description) => handleUpdateForm({ description })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                  テーマカラー
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.theme_color}
                    onChange={(e) => handleUpdateForm({ theme_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.theme_color}
                    onChange={(e) => handleUpdateForm({ theme_color: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1B1723]/70">回答を受付中</span>
                <button
                  onClick={() => handleUpdateForm({ is_accepting_responses: !form.is_accepting_responses })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    form.is_accepting_responses ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.is_accepting_responses ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* 質問タイプ追加 */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <h3 className="font-semibold text-[#1B1723] mb-4">質問を追加</h3>
            <p className="text-xs text-[#1B1723]/50 mb-3">
              ドラッグ&ドロップで並び替え可能
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(questionTypeLabels) as QuestionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddQuestion(type)}
                  className="px-3 py-2 text-xs font-medium text-[#1B1723]/70 bg-[#FAFBFC] rounded-lg hover:bg-[#171158]/5 transition-colors text-left"
                >
                  {questionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側: 質問一覧 */}
        <div className="lg:col-span-2 space-y-4">
          {questions.length > 0 ? (
            questions.map((question, index) => (
              <div
                key={question.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all ${
                  dragOverIndex === index ? 'border-t-4 border-[#E6A24C]' : ''
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <QuestionCard
                  question={question}
                  index={index}
                  isEditing={editingQuestionId === question.id}
                  onEdit={() => setEditingQuestionId(question.id)}
                  onSave={() => setEditingQuestionId(null)}
                  onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                  onDelete={() => handleDeleteQuestion(question.id)}
                  onMoveUp={() => handleMoveQuestion(question.id, 'up')}
                  onMoveDown={() => handleMoveQuestion(question.id, 'down')}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  themeColor={form.theme_color}
                />
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
              <div className="w-16 h-16 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1B1723] mb-2">質問がありません</h3>
              <p className="text-[#1B1723]/50 mb-4">
                左側のパネルから質問を追加するか、AI生成を使ってください
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AIで質問を生成
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI生成モーダル */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B1723]">AIで質問を生成</h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-2">
                  どんなアンケートを作りたいですか？
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:border-[#E6A24C] resize-none"
                  rows={4}
                  placeholder="例: セミナー参加者の満足度調査を作りたい。参加理由、満足度、改善点、次回参加意欲を聞きたい。"
                />
              </div>

              <div className="bg-[#FAFBFC] rounded-xl p-4">
                <p className="text-xs text-[#1B1723]/50">
                  AIがあなたの説明に基づいて、適切な質問を自動生成します。
                  生成後に自由に編集できます。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-[#1B1723] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={!aiPrompt.trim() || generatingAI}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                >
                  {generatingAI ? '生成中...' : '生成する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QRコードモーダル */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B1723]">QRコード</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="bg-[#FAFBFC] rounded-xl p-6">
                  <img
                    src={qrCodeUrl}
                    alt="Form QR Code"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">フォームURL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-[#FAFBFC] border border-[#171158]/10 rounded-lg"
                    />
                    <button
                      onClick={() => copyToClipboard(formUrl, 'url')}
                      className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
                    >
                      {copied === 'url' ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateQR}
                    disabled={generatingQR}
                    className="flex-1 px-4 py-3 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors disabled:opacity-50"
                  >
                    {generatingQR ? '生成中...' : '再生成'}
                  </button>
                  <a
                    href={qrCodeUrl}
                    download={`${form.title}-qr.png`}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl text-center"
                  >
                    ダウンロード
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#1B1723]/50 mb-4">QRコードを生成してください</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl disabled:opacity-50"
                >
                  {generatingQR ? '生成中...' : 'QRコードを生成'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// フォームタイトル入力（IME対応）
function FormTitleInput({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(value)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue)
    }
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isComposing) {
          e.currentTarget.blur()
        }
      }}
      className="text-2xl font-bold text-[#1B1723] bg-transparent border-none focus:outline-none focus:ring-0 w-full"
      placeholder="フォームタイトル"
    />
  )
}

// フォーム説明入力（IME対応）
function FormDescriptionInput({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue)
    }
  }

  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className="w-full px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C] resize-none"
      rows={3}
      placeholder="フォームの説明を入力..."
    />
  )
}

// 質問カードコンポーネント
interface QuestionCardProps {
  question: FormQuestion
  index: number
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onUpdate: (updates: Partial<FormQuestion>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  themeColor: string
}

function QuestionCard({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  themeColor
}: QuestionCardProps) {
  const [localTitle, setLocalTitle] = useState(question.title)
  const [localDescription, setLocalDescription] = useState(question.description || '')
  const [options, setOptions] = useState<string[]>(question.options || [])

  useEffect(() => {
    setLocalTitle(question.title)
    setLocalDescription(question.description || '')
    setOptions(question.options || [])
  }, [question])

  const handleSave = () => {
    onUpdate({
      title: localTitle,
      description: localDescription || null,
      options: options.length > 0 ? options : null
    })
    onSave()
  }

  const handleAddOption = () => {
    setOptions([...options, `選択肢${options.length + 1}`])
  }

  const handleUpdateOption = (optionIndex: number, value: string) => {
    const newOptions = [...options]
    newOptions[optionIndex] = value
    setOptions(newOptions)
  }

  const handleRemoveOption = (optionIndex: number) => {
    setOptions(options.filter((_, i) => i !== optionIndex))
  }

  const hasOptions = ['radio', 'checkbox', 'select'].includes(question.question_type)

  return (
    <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 transition-all cursor-grab active:cursor-grabbing">
      <div className="flex items-start gap-4">
        {/* 順序変更ボタン */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 text-[#1B1723]/30 hover:text-[#1B1723] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-xs text-[#1B1723]/40 text-center">{index + 1}</span>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 text-[#1B1723]/30 hover:text-[#1B1723] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full px-3 py-2 text-lg font-medium border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                placeholder="質問を入力"
                autoFocus
              />

              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                placeholder="説明（任意）"
              />

              {hasOptions && (
                <div className="space-y-2">
                  {options.map((option, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center text-[#1B1723]/30">
                        {question.question_type === 'checkbox' ? '☐' : '○'}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(i, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                      />
                      <button
                        onClick={() => handleRemoveOption(i)}
                        className="p-2 text-[#1B1723]/30 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddOption}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#E6A24C] hover:bg-[#E6A24C]/5 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    選択肢を追加
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-[#1B1723]/70">
                  <input
                    type="checkbox"
                    checked={question.is_required}
                    onChange={(e) => onUpdate({ is_required: e.target.checked })}
                    className="rounded"
                  />
                  必須
                </label>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  完了
                </button>
              </div>
            </div>
          ) : (
            <div onClick={onEdit} className="cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-medium text-[#1B1723]">{question.title}</span>
                {question.is_required && (
                  <span className="text-red-500">*</span>
                )}
              </div>
              {question.description && (
                <p className="text-sm text-[#1B1723]/50 mb-2">{question.description}</p>
              )}
              <span className="text-xs text-[#1B1723]/40 bg-[#FAFBFC] px-2 py-1 rounded">
                {questionTypeLabels[question.question_type]}
              </span>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-[#1B1723]/40 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
