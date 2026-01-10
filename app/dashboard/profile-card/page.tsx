'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
}

const socialPlatforms = [
  { name: 'X (Twitter)', icon: '🐦', placeholder: 'https://x.com/username' },
  { name: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/username' },
  { name: 'LINE', icon: '💚', placeholder: 'https://lin.ee/xxxxx' },
  { name: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/@channel' },
  { name: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
  { name: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/username' },
  { name: 'GitHub', icon: '🐙', placeholder: 'https://github.com/username' },
  { name: 'ウェブサイト', icon: '🌐', placeholder: 'https://example.com' },
]

export default function ProfileCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [themeColor, setThemeColor] = useState('#171158')
  const [links, setLinks] = useState<SocialLink[]>([])
  const [cardId, setCardId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    fetchProfileCard()
  }, [])

  const fetchProfileCard = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/dashboard')
      return
    }

    const { data } = await supabase
      .from('profile_cards')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setCardId(data.id)
      setDisplayName(data.display_name)
      setUsername(data.username || '')
      setBio(data.bio || '')
      setThemeColor(data.theme_color || '#171158')
      setLinks(data.links || [])
      setSlug(data.slug || '')
      setQrImageUrl(data.qr_image_url)
      setIsPublished(data.is_published)
    } else {
      // デフォルト値をユーザー情報から設定
      setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
    }
    setLoading(false)
  }

  const handleAddLink = (platform: typeof socialPlatforms[0]) => {
    setLinks([
      ...links,
      {
        id: crypto.randomUUID(),
        platform: platform.name,
        url: '',
        icon: platform.icon
      }
    ])
  }

  const handleUpdateLink = (id: string, url: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, url } : link))
  }

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id))
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert('表示名を入力してください')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const generatedSlug = slug || username || displayName.toLowerCase().replace(/\s+/g, '-')

      const cardData = {
        user_id: user.id,
        display_name: displayName,
        username,
        bio,
        theme_color: themeColor,
        links,
        slug: generatedSlug,
        is_published: isPublished,
        updated_at: new Date().toISOString()
      }

      if (cardId) {
        const { error } = await supabase
          .from('profile_cards')
          .update(cardData)
          .eq('id', cardId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('profile_cards')
          .insert(cardData)
          .select()
          .single()
        if (error) throw error
        setCardId(data.id)
        setSlug(data.slug)
      }

      alert('保存しました')
    } catch (error) {
      console.error('Error saving:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateQR = async () => {
    if (!cardId || !slug) {
      alert('先にプロフィールを保存してください')
      return
    }

    setGenerating(true)
    try {
      const profileUrl = `${window.location.origin}/p/${slug}`

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: profileUrl,
          design: {
            id: 'profile-card',
            name: displayName,
            fgColor: themeColor,
            bgColor: '#FFFFFF',
            style: 'elegant',
            cornerStyle: 'rounded',
          },
          customization: {
            size: 512,
            cornerRadius: 12,
            errorCorrectionLevel: 'M',
            dotStyle: 'rounded'
          },
          saveToHistory: true
        })
      })

      const data = await response.json()
      if (data.success) {
        setQrImageUrl(data.qrCode)

        const supabase = createClient()
        await supabase
          .from('profile_cards')
          .update({ qr_image_url: data.qrCode })
          .eq('id', cardId)
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('QRコード生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const profileUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}` : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-[#1B1723]/40 hover:text-[#1B1723] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1B1723]">デジタル名刺</h1>
            <p className="text-sm text-[#1B1723]/50">SNSリンクをまとめたプロフィールページ</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 編集フォーム */}
        <div className="space-y-4">
          {/* 基本情報 */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
            <h2 className="font-semibold text-[#1B1723]">基本情報</h2>

            <div>
              <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                表示名 *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                ユーザー名
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[#1B1723]/50">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="username"
                  className="flex-1 px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                自己紹介
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="簡単な自己紹介..."
                rows={3}
                className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">
                テーマカラー
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-[#171158]/10 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* SNSリンク */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
            <h2 className="font-semibold text-[#1B1723]">SNSリンク</h2>

            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <span className="text-xl w-8 text-center">{link.icon}</span>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => handleUpdateLink(link.id, e.target.value)}
                      placeholder={socialPlatforms.find(p => p.name === link.platform)?.placeholder}
                      className="flex-1 px-3 py-2 text-sm border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="p-2 text-[#1B1723]/40 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs text-[#1B1723]/50 mb-2">リンクを追加</p>
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleAddLink(platform)}
                    className="px-3 py-1.5 text-xs bg-[#FAFBFC] text-[#1B1723]/70 rounded-lg hover:bg-[#171158]/5"
                  >
                    {platform.icon} {platform.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <h2 className="font-semibold text-[#1B1723] mb-4">プレビュー</h2>

            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {displayName.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-xl font-bold">{displayName || '表示名'}</p>
                  {username && <p className="text-white/70">@{username}</p>}
                </div>
              </div>
              {bio && <p className="text-white/80 text-sm mb-4">{bio}</p>}
              <div className="space-y-2">
                {links.filter(l => l.url).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur rounded-xl"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-sm font-medium">{link.platform}</span>
                  </div>
                ))}
                {links.filter(l => l.url).length === 0 && (
                  <p className="text-white/50 text-sm text-center py-4">
                    リンクを追加してください
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QRコード */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <h2 className="font-semibold text-[#1B1723] mb-4">QRコード</h2>

            {qrImageUrl ? (
              <div className="space-y-4">
                <div className="bg-[#FAFBFC] rounded-xl p-4">
                  <img
                    src={qrImageUrl}
                    alt="Profile QR"
                    className="w-40 h-40 mx-auto object-contain"
                  />
                </div>
                {profileUrl && (
                  <div>
                    <p className="text-xs text-[#1B1723]/50 mb-1">プロフィールURL</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={profileUrl}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-[#FAFBFC] border border-[#171158]/10 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 disabled:opacity-50"
                  >
                    {generating ? '生成中...' : '再生成'}
                  </button>
                  <a
                    href={qrImageUrl}
                    download={`${displayName}-qr.png`}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#171158] rounded-xl text-center"
                  >
                    ダウンロード
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#1B1723]/50 mb-4">プロフィールを保存後、QRコードを生成できます</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={!cardId || generating}
                  className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl disabled:opacity-50"
                >
                  {generating ? '生成中...' : 'QRコードを生成'}
                </button>
              </div>
            )}
          </div>

          {/* 公開設定 */}
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#1B1723]">公開設定</h3>
                <p className="text-xs text-[#1B1723]/50">ONにするとURLでアクセス可能になります</p>
              </div>
              <button
                onClick={() => setIsPublished(!isPublished)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublished ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPublished ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
