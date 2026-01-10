'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// アイコンコンポーネント
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

function ChatworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.856 0A2.858 2.858 0 0 0 0 2.858v12.588a2.858 2.858 0 0 0 2.856 2.857h1.118V24l5.728-5.697h11.442A2.858 2.858 0 0 0 24 15.446V2.858A2.858 2.858 0 0 0 21.144 0zm9.142 4.476c3.599 0 6.52 2.428 6.52 5.424 0 1.39-.596 2.665-1.586 3.678l.12 2.746-2.476-1.621c-.81.27-1.695.42-2.621.42-3.6 0-6.478-2.428-6.478-5.424s2.921-5.223 6.52-5.223z" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

// コミュニティタイプ定義
const communityTypes = [
  { id: 'line-official', name: 'LINE公式アカウント', icon: LineIcon, placeholder: 'https://lin.ee/xxxxx または @xxx' },
  { id: 'line-openchat', name: 'LINEオープンチャット', icon: LineIcon, placeholder: 'https://line.me/ti/g2/xxxxx' },
  { id: 'discord', name: 'Discord', icon: DiscordIcon, placeholder: 'https://discord.gg/xxxxx' },
  { id: 'slack', name: 'Slack', icon: SlackIcon, placeholder: 'https://xxx.slack.com/join/xxxxx' },
  { id: 'chatwork', name: 'Chatwork', icon: ChatworkIcon, placeholder: 'https://www.chatwork.com/g/xxxxx' },
  { id: 'other', name: 'その他', icon: MessageIcon, placeholder: 'https://...' },
]

export default function CommunityQRPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>('line-official')
  const [generating, setGenerating] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    url: '',
    description: ''
  })

  const selectedCommunity = communityTypes.find(c => c.id === selectedType)

  const handleGenerateQR = async () => {
    if (!form.url) {
      alert('URLを入力してください')
      return
    }

    setGenerating(true)
    try {
      const qrName = form.name || `${selectedCommunity?.name} 招待`

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: form.url,
          design: {
            id: 'community-qr',
            name: qrName,
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
          saveToHistory: true,
          pageTitle: qrName,
          category: 'community',
          communityType: selectedType
        })
      })

      const data = await response.json()
      if (data.success) {
        setQrImageUrl(data.qrCode)
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('QRコード生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
        <div>
          <h1 className="text-2xl font-bold text-[#1B1723]">コミュニティQR</h1>
          <p className="text-sm text-[#1B1723]/50">LINE・Discord・Slack等の招待リンクQRコードを作成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: フォーム */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
            <h2 className="font-semibold text-[#1B1723]">コミュニティタイプを選択</h2>

            {/* タイプ選択 */}
            <div className="grid grid-cols-2 gap-2">
              {communityTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setForm({ ...form, name: '' })
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedType === type.id
                      ? 'bg-[#171158] text-white'
                      : 'bg-[#FAFBFC] text-[#1B1723]/70 hover:bg-[#171158]/5'
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              ))}
            </div>

            {/* 入力フォーム */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">名前（任意）</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={`${selectedCommunity?.name} コミュニティ`}
                  className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">招待URL *</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder={selectedCommunity?.placeholder}
                  className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">説明（任意）</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="このコミュニティについての説明..."
                  rows={2}
                  className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C] resize-none"
                />
              </div>
            </div>
          </div>

          {/* ヒント */}
          <div className="bg-[#FAFBFC] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#1B1723] mb-2">招待URLの取得方法</h3>
            {selectedType === 'line-official' && (
              <p className="text-xs text-[#1B1723]/60">
                LINE公式アカウントの管理画面 → 友だち追加 → URL から取得できます
              </p>
            )}
            {selectedType === 'line-openchat' && (
              <p className="text-xs text-[#1B1723]/60">
                LINEオープンチャットの設定 → 招待 → リンクをコピー から取得できます
              </p>
            )}
            {selectedType === 'discord' && (
              <p className="text-xs text-[#1B1723]/60">
                Discordサーバーの招待を作成 → リンクをコピー から取得できます
              </p>
            )}
            {selectedType === 'slack' && (
              <p className="text-xs text-[#1B1723]/60">
                Slackワークスペースの設定 → 招待 → 招待リンクを取得 から取得できます
              </p>
            )}
            {selectedType === 'chatwork' && (
              <p className="text-xs text-[#1B1723]/60">
                Chatworkグループの設定 → メンバーを招待 → 招待リンク から取得できます
              </p>
            )}
            {selectedType === 'other' && (
              <p className="text-xs text-[#1B1723]/60">
                その他のコミュニティプラットフォームの招待URLを入力してください
              </p>
            )}
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerateQR}
            disabled={generating || !form.url}
            className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] disabled:opacity-50 transition-all"
          >
            {generating ? 'QRコード生成中...' : 'QRコードを生成'}
          </button>
        </div>

        {/* 右側: プレビュー */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
            <h2 className="font-semibold text-[#1B1723] mb-4">QRコードプレビュー</h2>

            {qrImageUrl ? (
              <div className="space-y-4">
                <div className="bg-[#FAFBFC] rounded-xl p-6">
                  <img
                    src={qrImageUrl}
                    alt="Generated QR"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>
                <p className="text-center text-sm font-medium text-[#1B1723]">
                  {form.name || `${selectedCommunity?.name} 招待`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10"
                  >
                    再生成
                  </button>
                  <a
                    href={qrImageUrl}
                    download={`qr-${selectedType}.png`}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#171158] rounded-xl text-center"
                  >
                    ダウンロード
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-[#FAFBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {selectedCommunity && <selectedCommunity.icon className="w-12 h-12 text-[#171158]/20" />}
                </div>
                <p className="text-[#1B1723]/50">招待URLを入力してQRコードを生成</p>
              </div>
            )}
          </div>

          {/* 使い方ヒント */}
          <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-2">コミュニティQRの活用例</h3>
            <ul className="text-xs text-white/80 space-y-1">
              <li>- 店舗のLINE公式アカウント登録促進</li>
              <li>- イベントのDiscordサーバー招待</li>
              <li>- 社内Slackワークスペースへの招待</li>
              <li>- コミュニティのLINEオープンチャット参加</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
