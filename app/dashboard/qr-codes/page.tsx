'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ShortUrl {
  id: string
  code: string
  destination_url: string
  short_url: string
  name: string | null
  is_active: boolean
  scan_count: number
  created_at: string
}

interface QRHistory {
  id: string
  url: string
  design_name: string | null
  qr_image_url: string | null
  page_title: string | null
  created_at: string
  short_url?: {
    code: string
    short_url: string
  } | null
}

type TabType = 'history' | 'dynamic'

export default function QRCodesPage() {
  const [tab, setTab] = useState<TabType>('history')
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([])
  const [qrHistory, setQrHistory] = useState<QRHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [hasDynamicAccess, setHasDynamicAccess] = useState(false)
  const [planName, setPlanName] = useState('free')
  const [creating, setCreating] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedQR, setSelectedQR] = useState<QRHistory | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // サブスクリプション確認
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .single()

    const plan = subscription?.plan_name || 'free'
    setPlanName(plan)
    // Proプラン以上で動的QRコード機能を利用可能
    setHasDynamicAccess(['pro', 'business', 'agency', 'enterprise'].includes(plan))

    // QR履歴取得
    const { data: history } = await supabase
      .from('qr_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // 短縮URL情報を取得してマージ
    if (history && history.length > 0) {
      const historyIds = history.map(h => h.id)
      const { data: shortUrls } = await supabase
        .from('short_urls')
        .select('qr_history_id, code')
        .in('qr_history_id', historyIds)

      const shortUrlMap = new Map(
        shortUrls?.map(s => [s.qr_history_id, {
          code: s.code,
          short_url: `${window.location.origin}/r/${s.code}`
        }]) || []
      )

      const historyWithShortUrls = history.map(h => ({
        ...h,
        short_url: shortUrlMap.get(h.id) || null
      }))
      setQrHistory(historyWithShortUrls)
    } else {
      setQrHistory([])
    }

    // 動的QRコード取得
    if (['pro', 'business', 'agency', 'enterprise'].includes(plan)) {
      try {
        const res = await fetch('/api/short-url/list')
        if (res.ok) {
          const data = await res.json()
          setShortUrls(data.shortUrls)
        }
      } catch (error) {
        console.error('Failed to fetch short URLs:', error)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // 画面にフォーカスが戻ったときにもデータを再取得
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchData])

  const handleCreate = async () => {
    if (!newUrl) return

    setCreating(true)
    try {
      const res = await fetch('/api/short-url/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: newUrl,
          name: newName || undefined
        })
      })

      if (res.ok) {
        setNewUrl('')
        setNewName('')
        setShowCreateModal(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || '作成に失敗しました')
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editUrl) return

    try {
      const res = await fetch('/api/short-url/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          destinationUrl: editUrl
        })
      })

      if (res.ok) {
        setEditingId(null)
        setEditUrl('')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('更新に失敗しました')
    }
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/short-url/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isActive: !currentState
        })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // 画像をクリップボードにコピー
  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      setCopied('image')
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy image:', error)
      // フォールバック: 画像URLをコピー
      navigator.clipboard.writeText(imageUrl)
      setCopied('image')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  // ページタイトルを更新
  const handleUpdateTitle = async () => {
    if (!selectedQR || !editTitleValue.trim()) return

    setSavingTitle(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('qr_history')
        .update({ page_title: editTitleValue.trim() })
        .eq('id', selectedQR.id)

      if (!error) {
        // ローカル状態も更新
        setSelectedQR({ ...selectedQR, page_title: editTitleValue.trim() })
        setQrHistory(prev => prev.map(qr =>
          qr.id === selectedQR.id ? { ...qr, page_title: editTitleValue.trim() } : qr
        ))
        setEditingTitle(false)
      }
    } catch (error) {
      console.error('Failed to update title:', error)
    } finally {
      setSavingTitle(false)
    }
  }

  // ファイル名用にタイトルをサニタイズ
  const sanitizeFilename = (title: string): string => {
    return title
      .replace(/[<>:"/\\|?*]/g, '') // 無効な文字を削除
      .replace(/\s+/g, '_') // スペースをアンダースコアに
      .substring(0, 100) // 長すぎる場合は切り詰め
      || 'qr-code'
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
          <h1 className="text-2xl font-bold text-[#1B1723]">QRコード</h1>
          <p className="text-sm text-[#1B1723]/50 mt-1">
            生成したQRコードの管理
          </p>
        </div>
        {tab === 'history' ? (
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        ) : hasDynamicAccess ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        ) : null}
      </div>

      {/* タブ */}
      <div className="flex gap-2 border-b border-[#171158]/5">
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'history'
              ? 'border-[#E6A24C] text-[#E6A24C]'
              : 'border-transparent text-[#1B1723]/50 hover:text-[#1B1723]'
          }`}
        >
          履歴
        </button>
        <button
          onClick={() => setTab('dynamic')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'dynamic'
              ? 'border-[#E6A24C] text-[#E6A24C]'
              : 'border-transparent text-[#1B1723]/50 hover:text-[#1B1723]'
          }`}
        >
          動的QR
          {!hasDynamicAccess && (
            <span className="px-1.5 py-0.5 text-[10px] bg-[#171158] text-white rounded">Pro</span>
          )}
        </button>
      </div>

      {/* 履歴タブ */}
      {tab === 'history' && (
        <>
          {qrHistory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {qrHistory.map((qr) => (
                <div
                  key={qr.id}
                  className="group relative bg-white rounded-2xl border border-[#171158]/5 overflow-hidden"
                >
                  {/* QRコード画像 */}
                  <div className="relative aspect-square bg-[#FAFBFC] p-4">
                    {qr.qr_image_url && (
                      <img
                        src={qr.qr_image_url}
                        alt={qr.design_name || 'QR Code'}
                        className="w-full h-full object-contain"
                      />
                    )}

                    {/* ホバー時のオーバーレイ（画像部分のみ） */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {/* メインアクション: ダウンロード */}
                      <a
                        href={qr.qr_image_url || '#'}
                        download={`${sanitizeFilename(qr.page_title || qr.design_name || 'qr-code')}.png`}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4 text-[#171158]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </a>

                      {/* サブアクション: 右下に小さく */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {/* リンクをコピー */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(qr.url, `link-${qr.id}`)
                          }}
                          className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          title="リンクをコピー"
                        >
                          {copied === `link-${qr.id}` ? (
                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-[#1B1723]/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
                            </svg>
                          )}
                        </button>
                        {/* 編集・詳細 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedQR(qr)
                          }}
                          className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          title="編集・詳細"
                        >
                          <svg className="w-3 h-3 text-[#1B1723]/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        {/* 削除 */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm('このQRコードを削除しますか？')) return
                            const supabase = createClient()
                            const { error } = await supabase
                              .from('qr_history')
                              .delete()
                              .eq('id', qr.id)
                            if (!error) {
                              setQrHistory(prev => prev.filter(item => item.id !== qr.id))
                            }
                          }}
                          className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                          title="削除"
                        >
                          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* タイトル */}
                  <div className="p-3 border-t border-[#171158]/5">
                    <p className="font-semibold text-[#1B1723] truncate text-sm">
                      {qr.page_title || qr.design_name || 'QRコード'}
                    </p>
                    <p className="text-xs text-[#1B1723]/50 truncate mt-0.5">{qr.url}</p>
                    <p className="text-xs text-[#1B1723]/40 mt-1">
                      {new Date(qr.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
              <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1B1723] mb-2">QRコードがありません</h3>
              <p className="text-[#1B1723]/50 mb-6">
                最初のQRコードを作成してみましょう
              </p>
              <Link
                href="/dashboard/generate"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                QRコードを作成
              </Link>
            </div>
          )}
        </>
      )}

      {/* 動的QRタブ */}
      {tab === 'dynamic' && (
        <>
          {!hasDynamicAccess ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1B1723] mb-2">動的QRコード</h2>
                <p className="text-[#1B1723]/60 mb-6">
                  遷移先URLを後から変更できる動的QRコードを作成できます。
                  この機能はProプラン（¥980/月）以上でご利用いただけます。
                </p>
                <Link
                  href="/dashboard/settings/billing"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
                >
                  Proプランにアップグレード
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : shortUrls.length > 0 ? (
            <div className="space-y-4">
              {shortUrls.map((url) => (
                <div
                  key={url.id}
                  className="bg-white rounded-2xl border border-[#171158]/5 p-6 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#1B1723] truncate">
                          {url.name || url.code}
                        </h3>
                        <button
                          onClick={() => handleToggleActive(url.id, url.is_active)}
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            url.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {url.is_active ? '有効' : '無効'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-[#E6A24C] font-mono">{url.short_url}</span>
                        <button
                          onClick={() => copyToClipboard(url.short_url, url.id)}
                          className="p-1 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
                        >
                          {copied === url.id ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {editingId === url.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                          />
                          <button
                            onClick={() => handleUpdate(url.id)}
                            className="px-3 py-2 text-sm font-medium text-white bg-[#E6A24C] rounded-lg hover:bg-[#D4923D]"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setEditUrl('')
                            }}
                            className="px-3 py-2 text-sm font-medium text-[#1B1723]/60"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#1B1723]/60 truncate">{url.destination_url}</span>
                          <button
                            onClick={() => {
                              setEditingId(url.id)
                              setEditUrl(url.destination_url)
                            }}
                            className="p-1 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1B1723]">{url.scan_count}</p>
                      <p className="text-xs text-[#1B1723]/40">スキャン</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#1B1723]/40 mt-4">
                    作成: {new Date(url.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
              <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1B1723] mb-2">動的QRコードがありません</h3>
              <p className="text-[#1B1723]/50 mb-6">
                遷移先URLを後から変更できる動的QRコードを作成しましょう
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                最初のQRコードを作成
              </button>
            </div>
          )}
        </>
      )}

      {/* 作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#1B1723] mb-4">新規動的QRコード</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1B1723] mb-1">
                  遷移先URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:border-[#E6A24C]"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B1723] mb-1">
                  名前（任意）
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#171158]/10 rounded-xl focus:outline-none focus:border-[#E6A24C]"
                  placeholder="キャンペーンQR"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewUrl('')
                  setNewName('')
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-[#1B1723] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={!newUrl || creating}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR詳細モーダル */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B1723]">QRコード詳細</h2>
              <button
                onClick={() => {
                  setSelectedQR(null)
                  setEditingTitle(false)
                }}
                className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QRコード画像 */}
            <div className="bg-[#FAFBFC] rounded-xl p-6 mb-6">
              {selectedQR.qr_image_url && (
                <img
                  src={selectedQR.qr_image_url}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto object-contain"
                />
              )}
            </div>

            {/* 情報 */}
            <div className="space-y-4">
              {/* ページタイトル（編集可能） */}
              <div>
                <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">ページタイトル</label>
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateTitle}
                      disabled={savingTitle}
                      className="px-3 py-2 text-sm font-medium text-white bg-[#E6A24C] rounded-lg hover:bg-[#D4923D] disabled:opacity-50"
                    >
                      {savingTitle ? '...' : '保存'}
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="px-3 py-2 text-sm font-medium text-[#1B1723]/60 hover:text-[#1B1723]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-[#1B1723] font-semibold flex-1">
                      {selectedQR.page_title || '（タイトルなし）'}
                    </p>
                    <button
                      onClick={() => {
                        setEditTitleValue(selectedQR.page_title || '')
                        setEditingTitle(true)
                      }}
                      className="p-1.5 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
                      title="タイトルを編集"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* 画像コピー */}
              <div>
                <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">QRコード画像</label>
                <button
                  onClick={() => selectedQR.qr_image_url && copyImageToClipboard(selectedQR.qr_image_url)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#171158] bg-[#171158]/5 rounded-lg hover:bg-[#171158]/10 transition-colors"
                >
                  {copied === 'image' ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600">コピーしました</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>画像をコピー</span>
                    </>
                  )}
                </button>
              </div>

              {/* 元のURL */}
              <div>
                <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">元のURL</label>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedQR.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#171158] hover:underline truncate flex-1 text-sm"
                  >
                    {selectedQR.url}
                  </a>
                  <button
                    onClick={() => copyToClipboard(selectedQR.url, 'original-url')}
                    className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors shrink-0"
                    title="URLをコピー"
                  >
                    {copied === 'original-url' ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 短縮URL */}
              {selectedQR.short_url && (
                <div>
                  <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">短縮URL</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E6A24C] font-mono flex-1 truncate text-sm">
                      {selectedQR.short_url.short_url}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedQR.short_url!.short_url, 'short-url')}
                      className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors shrink-0"
                      title="短縮URLをコピー"
                    >
                      {copied === 'short-url' ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 作成日 */}
              <div>
                <label className="block text-xs font-medium text-[#1B1723]/50 mb-1">作成日</label>
                <p className="text-[#1B1723] text-sm">
                  {new Date(selectedQR.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>

            {/* ダウンロードボタン */}
            <div className="mt-6 pt-6 border-t border-[#171158]/5">
              <a
                href={selectedQR.qr_image_url || '#'}
                download={`${sanitizeFilename(selectedQR.page_title || selectedQR.design_name || 'qr-code')}.png`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ダウンロード
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
