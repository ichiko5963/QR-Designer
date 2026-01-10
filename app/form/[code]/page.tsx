'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import type { Form, FormQuestion, QuestionType } from '@/types/form'

export default function PublicFormPage() {
  const params = useParams()
  const code = params.code as string

  const [form, setForm] = useState<Form | null>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForm = useCallback(async () => {
    const supabase = createClient()

    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('code', code)
      .eq('is_published', true)
      .single()

    if (formError || !formData) {
      setError('このフォームは存在しないか、非公開です')
      setLoading(false)
      return
    }

    if (!formData.is_accepting_responses) {
      setError('このフォームは現在回答を受け付けていません')
      setLoading(false)
      return
    }

    const { data: questionsData } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formData.id)
      .order('order_index', { ascending: true })

    setForm(formData)
    setQuestions(questionsData || [])

    // 初期値を設定
    const initialAnswers: Record<string, string | string[]> = {}
    questionsData?.forEach(q => {
      if (q.question_type === 'checkbox') {
        initialAnswers[q.id] = []
      } else {
        initialAnswers[q.id] = ''
      }
    })
    setAnswers(initialAnswers)

    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchForm()
  }, [fetchForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form) return

    // 必須チェック
    for (const question of questions) {
      if (question.is_required) {
        const answer = answers[question.id]
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          setError(`「${question.title}」は必須です`)
          return
        }
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          answers
        })
      })

      if (!response.ok) {
        throw new Error('送信に失敗しました')
      }

      setSubmitted(true)
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers({ ...answers, [questionId]: value })
    setError(null)
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || []
    const updated = checked
      ? [...current, option]
      : current.filter(o => o !== option)
    handleAnswerChange(questionId, updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1B1723] mb-2">フォームが見つかりません</h1>
          <p className="text-[#1B1723]/60">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${form?.theme_color}20` }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: form?.theme_color }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1B1723] mb-2">回答を送信しました</h1>
          <p className="text-[#1B1723]/60">ご協力ありがとうございました。</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="min-h-screen bg-[#FAFBFC] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div
          className="rounded-t-2xl p-6"
          style={{ backgroundColor: form.theme_color }}
        >
          <h1 className="text-2xl font-bold text-white">{form.title}</h1>
          {form.description && (
            <p className="text-white/80 mt-2">{form.description}</p>
          )}
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-lg">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="p-6 space-y-6">
            {questions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => handleAnswerChange(question.id, value)}
                onCheckboxChange={(option, checked) => handleCheckboxChange(question.id, option, checked)}
                themeColor={form.theme_color}
              />
            ))}
          </div>

          <div className="p-6 border-t border-[#171158]/5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: form.theme_color }}
            >
              {submitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>

        {/* フッター */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#1B1723]/40">
            Powered by QR Designer
          </p>
        </div>
      </div>
    </div>
  )
}

interface QuestionFieldProps {
  question: FormQuestion
  value: string | string[]
  onChange: (value: string | string[]) => void
  onCheckboxChange: (option: string, checked: boolean) => void
  themeColor: string
}

function QuestionField({ question, value, onChange, onCheckboxChange, themeColor }: QuestionFieldProps) {
  const renderInput = () => {
    switch (question.question_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            placeholder="回答を入力"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2 resize-none"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            rows={4}
            placeholder="回答を入力"
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            placeholder="example@email.com"
          />
        )

      case 'phone':
        return (
          <input
            type="tel"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            placeholder="090-1234-5678"
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
          />
        )

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2 bg-white"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
          >
            <option value="">選択してください</option>
            {question.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-3 p-3 border border-[#171158]/10 rounded-xl cursor-pointer hover:bg-[#FAFBFC] transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-[#1B1723]">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-3 p-3 border border-[#171158]/10 rounded-xl cursor-pointer hover:bg-[#FAFBFC] transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value as string[]).includes(option)}
                  onChange={(e) => onCheckboxChange(option, e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-[#1B1723]">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star.toString())}
                className="w-12 h-12 text-2xl transition-transform hover:scale-110"
              >
                {parseInt(value as string) >= star ? '★' : '☆'}
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <label className="block mb-2">
        <span className="font-medium text-[#1B1723]">{question.title}</span>
        {question.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-[#1B1723]/60 mb-2">{question.description}</p>
      )}
      {renderInput()}
    </div>
  )
}
