'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Form } from '@/types/form'

function generateCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const router = useRouter()

  const fetchForms = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setForms(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  const handleCreateForm = async () => {
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('ログインが必要です')
      setCreating(false)
      return
    }

    // ユニークなコードを生成
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('forms')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) break
      code = generateCode()
      attempts++
    }

    const { data, error } = await supabase
      .from('forms')
      .insert({
        user_id: user.id,
        code,
        title: '無題のフォーム'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create form:', error.message, error.code, error.details, error.hint)
      alert(`フォームの作成に失敗しました: ${error.message}`)
      setCreating(false)
      return
    }

    router.push(`/dashboard/forms/${data.id}`)
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('このフォームを削除しますか？回答データもすべて削除されます。')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId)

    if (error) {
      alert('削除に失敗しました')
      return
    }

    fetchForms()
  }

  const handleTogglePublish = async (form: Form) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('forms')
      .update({ is_published: !form.is_published })
      .eq('id', form.id)

    if (error) {
      alert('更新に失敗しました')
      return
    }

    fetchForms()
  }

  const handleCopyQR = async (form: Form) => {
    if (!form.qr_code_url) {
      alert('QRコードがまだ生成されていません。編集画面でQRコードを生成してください。')
      return
    }

    try {
      // QRコード画像をfetchしてclipboardにコピー
      const response = await fetch(form.qr_code_url)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopiedId(form.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      // フォールバック: URLをコピー
      const formUrl = `${window.location.origin}/form/${form.code}`
      navigator.clipboard.writeText(formUrl)
      setCopiedId(form.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleStartEditTitle = (form: Form) => {
    setEditingTitleId(form.id)
    setEditingTitle(form.title)
  }

  const handleSaveTitle = async (formId: string) => {
    if (!editingTitle.trim()) {
      setEditingTitleId(null)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('forms')
      .update({ title: editingTitle.trim() })
      .eq('id', formId)

    if (error) {
      alert('タイトルの更新に失敗しました')
      return
    }

    setEditingTitleId(null)
    fetchForms()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">アンケートフォーム</h1>
          <p className="text-sm text-[#1B1723]/50 mt-1">
            フォームを作成してQRコードで共有
          </p>
        </div>
        <button
          onClick={handleCreateForm}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all disabled:opacity-50"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
          新規作成
        </button>
      </div>

      {/* フォーム一覧 */}
      {forms.length > 0 ? (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-2xl border border-[#171158]/5 p-5 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* QRコード */}
                <div className="relative shrink-0">
                  {form.qr_code_url ? (
                    <div className="relative group">
                      <img
                        src={form.qr_code_url}
                        alt={`${form.title} QRコード`}
                        className="w-20 h-20 rounded-lg object-contain bg-white border border-[#171158]/10"
                      />
                      <button
                        onClick={() => handleCopyQR(form)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                        title="QRコードをコピー"
                      >
                        {copiedId === form.id ? (
                          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-[#171158]/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#171158]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}
                  {copiedId === form.id && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-green-600 font-medium">
                      コピーしました！
                    </div>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {editingTitleId === form.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(form.id)
                            if (e.key === 'Escape') setEditingTitleId(null)
                          }}
                          className="flex-1 px-2 py-1 text-lg font-semibold border border-[#E6A24C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E6A24C]/30"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(form.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/forms/${form.id}`}
                          className="font-semibold text-[#1B1723] hover:text-[#E6A24C] transition-colors truncate"
                        >
                          {form.title}
                        </Link>
                        <button
                          onClick={() => handleStartEditTitle(form)}
                          className="p-1 text-[#1B1723]/30 hover:text-[#E6A24C] transition-colors"
                          title="タイトルを編集"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleTogglePublish(form)}
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            form.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {form.is_published ? '公開中' : '非公開'}
                        </button>
                      </>
                    )}
                  </div>

                  {form.description && (
                    <p className="text-sm text-[#1B1723]/60 mb-2 line-clamp-1">
                      {form.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[#1B1723]/40">
                    <span>回答: {form.response_count}件</span>
                    <span>作成: {new Date(form.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center gap-1 shrink-0">
                  {form.qr_code_url && (
                    <button
                      onClick={() => handleCopyQR(form)}
                      className={`p-2 transition-colors rounded-lg ${
                        copiedId === form.id
                          ? 'text-green-600 bg-green-50'
                          : 'text-[#1B1723]/40 hover:text-[#171158] hover:bg-[#171158]/5'
                      }`}
                      title="QRコードをコピー"
                    >
                      {copiedId === form.id ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      )}
                    </button>
                  )}
                  {form.is_published && (
                    <Link
                      href={`/form/${form.code}`}
                      target="_blank"
                      className="p-2 text-[#1B1723]/40 hover:text-[#171158] hover:bg-[#171158]/5 transition-colors rounded-lg"
                      title="フォームを開く"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/forms/${form.id}`}
                    className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] hover:bg-[#E6A24C]/5 transition-colors rounded-lg"
                    title="編集"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/dashboard/forms/${form.id}/responses`}
                    className="p-2 text-[#1B1723]/40 hover:text-[#171158] hover:bg-[#171158]/5 transition-colors rounded-lg"
                    title="回答を見る"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="p-2 text-[#1B1723]/40 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
          <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1B1723] mb-2">フォームがありません</h3>
          <p className="text-[#1B1723]/50 mb-6">
            アンケートフォームを作成してQRコードで共有しましょう
          </p>
          <button
            onClick={handleCreateForm}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            最初のフォームを作成
          </button>
        </div>
      )}
    </div>
  )
}
