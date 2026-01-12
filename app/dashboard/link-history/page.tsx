'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LinkItem {
  id: string
  url: string
  title: string | null
  description: string | null
  category: 'generated' | 'scanned' | 'private' | 'community'
  categoryLabel: string
  created_at: string
  qr_image_url?: string | null
  copyCount?: number
}

type SortOption = 'newest' | 'most-copied'

// コピー回数をlocalStorageで管理
const COPY_COUNTS_KEY = 'qr-link-copy-counts'

const getCopyCounts = (): Record<string, number> => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(COPY_COUNTS_KEY) || '{}')
  } catch {
    return {}
  }
}

const incrementCopyCount = (url: string): number => {
  const counts = getCopyCounts()
  counts[url] = (counts[url] || 0) + 1
  localStorage.setItem(COPY_COUNTS_KEY, JSON.stringify(counts))
  return counts[url]
}

export default function LinkHistoryPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'generated' | 'scanned' | 'private' | 'community'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    loadAllLinks()
  }, [])

  const loadAllLinks = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const allLinks: LinkItem[] = []

    // 1. QR履歴から取得（生成したQRコード、プライベートQR、コミュニティQR）
    const { data: qrHistory } = await supabase
      .from('qr_history')
      .select('id, url, page_title, design_name, qr_image_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (qrHistory) {
      qrHistory.forEach((item) => {
        // カテゴリを判定（design_nameから推測）
        let category: LinkItem['category'] = 'generated'
        let categoryLabel = '生成したQR'

        const designName = item.design_name?.toLowerCase() || ''
        if (designName.includes('community') || designName.includes('line') ||
            designName.includes('discord') || designName.includes('slack') ||
            designName.includes('chatwork') || designName.includes('招待')) {
          category = 'community'
          categoryLabel = 'コミュニティQR'
        } else if (designName.includes('private') || designName.includes('wi-fi') ||
                   designName.includes('wifi') || designName.includes('vcard') ||
                   item.url?.startsWith('WIFI:') || item.url?.startsWith('BEGIN:VCARD')) {
          category = 'private'
          categoryLabel = 'プライベートQR'
        }

        allLinks.push({
          id: `qr-${item.id}`,
          url: item.url,
          title: item.page_title || item.design_name,
          description: getCategoryDescription(category, item.url),
          category,
          categoryLabel,
          created_at: item.created_at,
          qr_image_url: item.qr_image_url
        })
      })
    }

    // 2. スキャン履歴から取得
    const { data: scannedHistory } = await supabase
      .from('scanned_qr_history')
      .select('id, url, title, scanned_at')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })

    if (scannedHistory) {
      scannedHistory.forEach((item) => {
        allLinks.push({
          id: `scan-${item.id}`,
          url: item.url,
          title: item.title,
          description: 'QRコードをスキャンして取得',
          category: 'scanned',
          categoryLabel: 'スキャン',
          created_at: item.scanned_at
        })
      })
    }

    // コピー回数を設定
    const copyCounts = getCopyCounts()
    allLinks.forEach(link => {
      link.copyCount = copyCounts[link.url] || 0
    })

    // 日付順にソート（デフォルト）
    allLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setLinks(allLinks)
    setLoading(false)
  }

  const getCategoryDescription = (category: LinkItem['category'], url: string): string => {
    switch (category) {
      case 'community':
        if (url.includes('line.me') || url.includes('lin.ee')) return 'LINE招待リンク'
        if (url.includes('discord')) return 'Discord招待リンク'
        if (url.includes('slack')) return 'Slack招待リンク'
        if (url.includes('chatwork')) return 'Chatwork招待リンク'
        return 'コミュニティ招待リンク'
      case 'private':
        if (url.startsWith('WIFI:')) return '自宅Wi-Fi接続情報'
        if (url.startsWith('BEGIN:VCARD')) return '連絡先情報（vCard）'
        return 'プライベートリンク'
      case 'generated':
        return 'QRコードを生成'
      default:
        return ''
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)

    // コピー回数を増やす
    const newCount = incrementCopyCount(text)
    setLinks(prev => prev.map(link =>
      link.id === id ? { ...link, copyCount: newCount } : link
    ))

    setTimeout(() => setCopied(null), 2000)
  }

  // フィルターとソートを適用
  const filteredAndSortedLinks = (() => {
    let result = filter === 'all'
      ? [...links]
      : links.filter(link => link.category === filter)

    // ソート
    if (sortBy === 'most-copied') {
      result.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  })()

  const getCategoryColor = (category: LinkItem['category']) => {
    switch (category) {
      case 'generated':
        return 'bg-[#171158]/10 text-[#171158]'
      case 'scanned':
        return 'bg-green-100 text-green-700'
      case 'private':
        return 'bg-blue-100 text-blue-700'
      case 'community':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryIcon = (category: LinkItem['category']) => {
    switch (category) {
      case 'generated':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
          </svg>
        )
      case 'scanned':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M20.25 16.5V18A2.25 2.25 0 0118 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5" />
          </svg>
        )
      case 'private':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        )
      case 'community':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        )
    }
  }

  // URLを表示用にフォーマット
  const formatUrl = (url: string): string => {
    if (url.startsWith('WIFI:')) {
      const match = url.match(/S:([^;]+)/)
      return match ? `Wi-Fi: ${match[1]}` : 'Wi-Fi接続情報'
    }
    if (url.startsWith('BEGIN:VCARD')) {
      const match = url.match(/FN:([^\n]+)/)
      return match ? `連絡先: ${match[1]}` : '連絡先情報'
    }
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '')
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url
    }
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
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">過去のリンク一覧</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          生成したQRコード・スキャン・プライベートQR・コミュニティQRのリンク履歴
        </p>
      </div>

      {/* フィルター & ソート */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: 'すべて', count: links.length },
            { id: 'generated' as const, label: '生成したQR', count: links.filter(l => l.category === 'generated').length },
            { id: 'scanned' as const, label: 'スキャン', count: links.filter(l => l.category === 'scanned').length },
            { id: 'private' as const, label: 'プライベート', count: links.filter(l => l.category === 'private').length },
            { id: 'community' as const, label: 'コミュニティ', count: links.filter(l => l.category === 'community').length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === item.id
                  ? 'bg-[#171158] text-white'
                  : 'bg-white text-[#1B1723]/60 hover:bg-[#171158]/5 border border-[#171158]/10'
              }`}
            >
              {item.label}
              {item.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  filter === item.id ? 'bg-white/20' : 'bg-[#171158]/10'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ソートドロップダウン */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-white border border-[#171158]/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-[#1B1723]/70 cursor-pointer hover:border-[#171158]/30 focus:outline-none focus:ring-2 focus:ring-[#171158]/20"
          >
            <option value="newest">新しい順</option>
            <option value="most-copied">よくコピーする順</option>
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B1723]/40 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* リンク一覧 */}
      {filteredAndSortedLinks.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#171158]/5 divide-y divide-[#171158]/5">
          {filteredAndSortedLinks.map((link) => (
            <div key={link.id} className="p-4 hover:bg-[#FAFBFC] transition-colors">
              <div className="flex items-start gap-4">
                {/* QR画像（あれば） */}
                {link.qr_image_url && (
                  <div className="w-16 h-16 bg-[#FAFBFC] rounded-lg overflow-hidden shrink-0">
                    <img
                      src={link.qr_image_url}
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* アイコン（QR画像がない場合） */}
                {!link.qr_image_url && (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(link.category)}`}>
                    {getCategoryIcon(link.category)}
                  </div>
                )}

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(link.category)}`}>
                      {link.categoryLabel}
                    </span>
                    <span className="text-xs text-[#1B1723]/40">
                      {new Date(link.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    {(link.copyCount || 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[#E6A24C]/10 text-[#E6A24C]">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                        </svg>
                        {link.copyCount}回
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[#1B1723] truncate">
                    {link.title || formatUrl(link.url)}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-[#1B1723]/50 mt-0.5">{link.description}</p>
                  )}
                  <p className="text-xs text-[#1B1723]/40 mt-1 truncate font-mono">
                    {formatUrl(link.url)}
                  </p>
                </div>

                {/* アクション */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(link.url, link.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied === link.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#171158]/5 text-[#171158] hover:bg-[#171158]/10'
                    }`}
                  >
                    {copied === link.id ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        コピー済み
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        コピー
                      </>
                    )}
                  </button>
                  {!link.url.startsWith('WIFI:') && !link.url.startsWith('BEGIN:VCARD') && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[#1B1723]/40 hover:text-[#171158] transition-colors"
                      title="リンクを開く"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
          <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1B1723] mb-2">リンクがありません</h3>
          <p className="text-[#1B1723]/50 mb-6">
            QRコードを生成したり、スキャンするとここに表示されます
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all"
            >
              QRコードを作成
            </Link>
            <Link
              href="/dashboard/qr-scanner"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-all"
            >
              QRコードを読み取る
            </Link>
          </div>
        </div>
      )}

      {/* 統計 */}
      {links.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '生成したQR', count: links.filter(l => l.category === 'generated').length, color: 'from-[#171158] to-[#1B1723]' },
            { label: 'スキャン', count: links.filter(l => l.category === 'scanned').length, color: 'from-green-500 to-green-600' },
            { label: 'プライベート', count: links.filter(l => l.category === 'private').length, color: 'from-blue-500 to-blue-600' },
            { label: 'コミュニティ', count: links.filter(l => l.category === 'community').length, color: 'from-purple-500 to-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-[#171158]/5 p-4">
              <p className="text-xs text-[#1B1723]/50">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.count}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
