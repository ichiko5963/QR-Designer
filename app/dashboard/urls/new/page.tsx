'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { name: 'ウェブサイト', icon: '🌐' },
  { name: 'SNS', icon: '💬' },
  { name: 'ネットワーク', icon: '📶' },
  { name: 'ビジネス', icon: '💼' },
  { name: 'その他', icon: '📎' },
]

const presets = [
  { name: '自社サイト', icon: '🌐', category: 'ウェブサイト', placeholder: 'https://example.com' },
  { name: 'LINE公式', icon: '💚', category: 'SNS', placeholder: 'https://lin.ee/xxxxx' },
  { name: 'Instagram', icon: '📷', category: 'SNS', placeholder: 'https://instagram.com/username' },
  { name: 'X (Twitter)', icon: '🐦', category: 'SNS', placeholder: 'https://x.com/username' },
  { name: 'YouTube', icon: '📺', category: 'SNS', placeholder: 'https://youtube.com/@channel' },
  { name: 'TikTok', icon: '🎵', category: 'SNS', placeholder: 'https://tiktok.com/@username' },
  { name: 'Wi-Fi', icon: '📶', category: 'ネットワーク', placeholder: 'WIFI:T:WPA;S:ネットワーク名;P:パスワード;;' },
  { name: 'Google マップ', icon: '📍', category: 'ビジネス', placeholder: 'https://maps.google.com/...' },
  { name: '予約ページ', icon: '📅', category: 'ビジネス', placeholder: 'https://...' },
]

export default function NewUrlPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState(searchParams.get('name') || '')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'その他')
  const [icon, setIcon] = useState('🔗')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const presetName = searchParams.get('name')
    if (presetName) {
      const preset = presets.find(p => p.name === presetName)
      if (preset) {
        setIcon(preset.icon)
        setCategory(preset.category)
      }
    }
  }, [searchParams])

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setName(preset.name)
    setIcon(preset.icon)
    setCategory(preset.category)
  }

  const handleSave = async (generateQR: boolean = false) => {
    if (!name.trim() || !url.trim()) {
      alert('名前とURLを入力してください')
      return
    }

    setSaving(true)
    if (generateQR) setGenerating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('ログインが必要です')
        return
      }

      let qrImageUrl = null
      if (generateQR) {
        const qrResponse = await fetch('/api/generate-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            design: {
              id: 'saved-url',
              name: name,
              fgColor: '#171158',
              bgColor: '#FFFFFF',
              style: 'minimal',
              cornerStyle: 'rounded',
            },
            customization: {
              size: 512,
              cornerRadius: 10,
              errorCorrectionLevel: 'M',
              dotStyle: 'square'
            },
            saveToHistory: false
          })
        })
        const qrData = await qrResponse.json()
        if (qrData.success) {
          qrImageUrl = qrData.qrCode
        }
      }

      const { error } = await supabase
        .from('saved_urls')
        .insert({
          user_id: user.id,
          name,
          url,
          category,
          icon,
          qr_image_url: qrImageUrl
        })

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving URL:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-[#1B1723]">URLを追加</h1>
      </div>

      {/* プリセット */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
        <h2 className="text-sm font-semibold text-[#1B1723]/70 mb-3">クイック選択</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                name === preset.name
                  ? 'bg-[#171158] text-white'
                  : 'bg-[#FAFBFC] text-[#1B1723]/70 hover:bg-[#171158]/5'
              }`}
            >
              <span className="text-xl">{preset.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
            名前
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-12 px-3 py-2 text-center text-xl border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
              maxLength={2}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 自社ウェブサイト"
              className="flex-1 px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
            URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  category === cat.name
                    ? 'bg-[#171158] text-white'
                    : 'bg-[#FAFBFC] text-[#1B1723]/70 hover:bg-[#171158]/5'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex-1 px-4 py-3 text-sm font-semibold text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors disabled:opacity-50"
        >
          {saving && !generating ? '保存中...' : 'URLのみ保存'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all disabled:opacity-50"
        >
          {generating ? 'QRコード生成中...' : 'QRコード付きで保存'}
        </button>
      </div>
    </div>
  )
}
