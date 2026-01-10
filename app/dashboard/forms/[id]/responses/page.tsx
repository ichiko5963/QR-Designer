'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Form, FormQuestion, FormResponse } from '@/types/form'

export default function FormResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string

  const [form, setForm] = useState<Form | null>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)

  const fetchData = useCallback(async () => {
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

    const { data: responsesData } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    setForm(formData)
    setQuestions(questionsData || [])
    setResponses(responsesData || [])
    setLoading(false)
  }, [formId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportCSV = () => {
    if (!form || questions.length === 0 || responses.length === 0) return

    // CSVヘッダー
    const headers = ['提出日時', ...questions.map(q => q.title)]

    // CSVデータ
    const rows = responses.map(response => {
      const date = new Date(response.submitted_at).toLocaleString('ja-JP')
      const answers = questions.map(q => {
        const answer = response.answers[q.id]
        if (Array.isArray(answer)) {
          return answer.join(', ')
        }
        return answer || ''
      })
      return [date, ...answers]
    })

    // CSV生成
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // ダウンロード
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form.title}_回答_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/forms/${form.id}`}
            className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1B1723]">{form.title}</h1>
            <p className="text-sm text-[#1B1723]/50">
              {responses.length}件の回答
            </p>
          </div>
        </div>

        {responses.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSVエクスポート
          </button>
        )}
      </div>

      {/* 回答一覧 */}
      {responses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#171158]/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFBFC]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1B1723]/50 uppercase tracking-wider">
                    提出日時
                  </th>
                  {questions.slice(0, 3).map((question) => (
                    <th
                      key={question.id}
                      className="px-4 py-3 text-left text-xs font-medium text-[#1B1723]/50 uppercase tracking-wider"
                    >
                      {question.title}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#1B1723]/50 uppercase tracking-wider">
                    詳細
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171158]/5">
                {responses.map((response) => (
                  <tr
                    key={response.id}
                    className="hover:bg-[#FAFBFC] transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-[#1B1723]/70 whitespace-nowrap">
                      {new Date(response.submitted_at).toLocaleString('ja-JP')}
                    </td>
                    {questions.slice(0, 3).map((question) => (
                      <td
                        key={question.id}
                        className="px-4 py-4 text-sm text-[#1B1723] max-w-[200px] truncate"
                      >
                        {(() => {
                          const answer = response.answers[question.id]
                          if (Array.isArray(answer)) {
                            return answer.join(', ')
                          }
                          return answer || '-'
                        })()}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedResponse(response)}
                        className="text-sm font-medium text-[#E6A24C] hover:text-[#D4923D]"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
          <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1B1723] mb-2">回答がありません</h3>
          <p className="text-[#1B1723]/50 mb-6">
            フォームを公開してQRコードを共有しましょう
          </p>
          <Link
            href={`/dashboard/forms/${form.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl"
          >
            フォームを編集
          </Link>
        </div>
      )}

      {/* 回答詳細モーダル */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B1723]">回答詳細</h2>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="pb-4 border-b border-[#171158]/5">
                <span className="text-xs text-[#1B1723]/50">提出日時</span>
                <p className="text-[#1B1723] font-medium">
                  {new Date(selectedResponse.submitted_at).toLocaleString('ja-JP')}
                </p>
              </div>

              {questions.map((question) => {
                const answer = selectedResponse.answers[question.id]
                const displayAnswer = Array.isArray(answer) ? answer.join(', ') : answer

                return (
                  <div key={question.id} className="pb-4 border-b border-[#171158]/5 last:border-0">
                    <span className="text-xs text-[#1B1723]/50">{question.title}</span>
                    <p className="text-[#1B1723] whitespace-pre-wrap">
                      {displayAnswer || '-'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
