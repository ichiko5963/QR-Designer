'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Logo {
  id: string
  name: string
  public_url: string
  file_size: number
  mime_type: string
  created_at: string
}

interface LogoUsage {
  count: number
  totalSizeMB: number
}

export default function LogosPage() {
  const [logos, setLogos] = useState<Logo[]>([])
  const [usage, setUsage] = useState<LogoUsage>({ count: 0, totalSizeMB: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [planName, setPlanName] = useState('free')
  const [storageLimitMB, setStorageLimitMB] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchLogos = useCallback(async () => {
    try {
      const res = await fetch('/api/logos/list')
      if (res.ok) {
        const data = await res.json()
        setLogos(data.logos)
        setUsage(data.usage)
      }
    } catch (error) {
      console.error('Failed to fetch logos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', user.id)
        .single()

      const plan = subscription?.plan_name || 'free'
      setPlanName(plan)

      // Personalプラン以上でロゴ管理機能を利用可能
      const planHasAccess = ['personal', 'pro', 'business', 'agency', 'enterprise'].includes(plan)
      setHasAccess(planHasAccess)

      // プランごとのストレージ上限
      const storageLimits: Record<string, number> = {
        personal: 10,
        pro: 50,
        business: 100,
        agency: 500,
        enterprise: 1000
      }
      setStorageLimitMB(storageLimits[plan] || 0)

      if (planHasAccess) {
        fetchLogos()
      } else {
        setLoading(false)
      }
    }

    checkAccess()
  }, [fetchLogos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)

      const res = await fetch('/api/logos/upload', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        fetchLogos()
      } else {
        const data = await res.json()
        alert(data.error || 'アップロードに失敗しました')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('アップロードに失敗しました')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (logoId: string) => {
    try {
      const res = await fetch('/api/logos/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoId })
      })

      if (res.ok) {
        setLogos(logos.filter(l => l.id !== logoId))
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-[#E6A24C]/20 to-[#E6A24C]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B1723] mb-2">ロゴ管理</h1>
          <p className="text-[#1B1723]/60 mb-6">
            よく使うロゴを保存して、QRコード作成時にすぐに使えるようにできます。
            この機能はPersonalプラン（¥499/月）以上でご利用いただけます。
          </p>
          <a
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
          >
            Personalプランにアップグレード
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">ロゴ管理</h1>
          <p className="text-sm text-[#1B1723]/50 mt-1">
            保存したロゴの管理 ({usage.totalSizeMB.toFixed(1)} / {storageLimitMB} MB使用中)
          </p>
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              アップロード中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              ロゴを追加
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* ストレージ使用量バー */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#1B1723]/60">ストレージ使用量</span>
          <span className="font-medium text-[#1B1723]">
            {usage.totalSizeMB.toFixed(1)} MB / {storageLimitMB} MB
          </span>
        </div>
        <div className="w-full h-2 bg-[#171158]/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-full transition-all"
            style={{ width: `${Math.min((usage.totalSizeMB / storageLimitMB) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* ロゴ一覧 */}
      {logos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="group bg-white rounded-2xl border border-[#171158]/5 p-4 hover:border-[#E6A24C]/30 hover:shadow-lg transition-all relative"
            >
              {/* 削除ボタン */}
              <button
                onClick={() => setDeleteConfirm(logo.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="aspect-square bg-[#FAFBFC] rounded-xl p-3 mb-3 flex items-center justify-center">
                <img
                  src={logo.public_url}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div>
                <p className="font-semibold text-[#1B1723] truncate text-sm">{logo.name}</p>
                <p className="text-xs text-[#1B1723]/40 mt-1">
                  {(logo.file_size / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* 削除確認モーダル */}
              {deleteConfirm === logo.id && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                  <p className="text-sm text-[#1B1723] text-center mb-4">
                    このロゴを削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-xs font-medium text-[#1B1723] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(logo.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#171158]/5 p-12 text-center">
          <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#171158]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1B1723] mb-2">ロゴがありません</h3>
          <p className="text-[#1B1723]/50 mb-6">
            よく使うロゴを保存しておくと、QRコード作成時にすぐに使えます
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            最初のロゴを追加
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  )
}
