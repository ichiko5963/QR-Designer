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
  created_at: string
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

    setQrHistory(history || [])

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
                  className="bg-white rounded-2xl border border-[#171158]/5 p-4 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-[#FAFBFC] rounded-xl p-3 mb-3">
                    {qr.qr_image_url && (
                      <img
                        src={qr.qr_image_url}
                        alt={qr.design_name || 'QR Code'}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1B1723] truncate text-sm">
                      {qr.design_name || 'QRコード'}
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
    </div>
  )
}
