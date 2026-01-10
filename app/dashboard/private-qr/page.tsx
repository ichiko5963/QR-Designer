'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// タブ定義
type TabType = 'personal' | 'business' | 'profile' | 'business-profile'

// アイコンコンポーネント
function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  )
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  )
}

export default function PrivateQRPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'personal'
  const initialType = searchParams.get('type') || ''

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)

  // プライベート用フォーム
  const [personalForm, setPersonalForm] = useState({
    type: initialType,
    name: '',
    url: '',
    wifiName: '',
    wifiPassword: '',
    wifiType: 'WPA'
  })

  // 法人用フォーム
  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    personName: '',
    position: '',
    phone: '',
    email: '',
    website: '',
    address: ''
  })

  useEffect(() => {
    if (initialType) {
      setPersonalForm(prev => ({ ...prev, type: initialType, name: initialType }))
    }
  }, [initialType])

  const handleGenerateQR = async () => {
    setGenerating(true)
    try {
      let qrUrl = ''
      let qrName = ''

      if (activeTab === 'personal') {
        if (personalForm.type === '自宅Wi-Fi') {
          qrUrl = `WIFI:T:${personalForm.wifiType};S:${personalForm.wifiName};P:${personalForm.wifiPassword};;`
          qrName = `Wi-Fi: ${personalForm.wifiName}`
        } else {
          qrUrl = personalForm.url
          qrName = personalForm.name || personalForm.type
        }
      } else if (activeTab === 'business') {
        // vCard形式
        const vcard = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${businessForm.personName}`,
          `ORG:${businessForm.companyName}`,
          `TITLE:${businessForm.position}`,
          `TEL:${businessForm.phone}`,
          `EMAIL:${businessForm.email}`,
          `URL:${businessForm.website}`,
          `ADR:;;${businessForm.address};;;;`,
          'END:VCARD'
        ].join('\n')
        qrUrl = vcard
        qrName = `${businessForm.companyName} - ${businessForm.personName}`
      }

      if (!qrUrl) {
        alert('入力内容を確認してください')
        return
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: qrUrl,
          design: {
            id: 'private-qr',
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
          pageTitle: qrName
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

  const tabs = [
    { id: 'personal' as const, label: 'プライベート', icon: UserIcon },
    { id: 'business' as const, label: '法人・ビジネス', icon: BuildingIcon },
    { id: 'profile' as const, label: 'プロフィールページ', icon: UserIcon },
    { id: 'business-profile' as const, label: '会社ページ', icon: BuildingIcon },
  ]

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
          <h1 className="text-2xl font-bold text-[#1B1723]">プライベートQR</h1>
          <p className="text-sm text-[#1B1723]/50">個人・法人用QRコードの作成</p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 p-1 bg-[#FAFBFC] rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#171158] shadow'
                : 'text-[#1B1723]/50 hover:text-[#1B1723]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: フォーム */}
        <div className="space-y-4">
          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
              <h2 className="font-semibold text-[#1B1723]">プライベートQRコード</h2>

              {/* タイプ選択 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: '自宅Wi-Fi', icon: WifiIcon },
                  { name: 'LINE', icon: LineIcon },
                  { name: 'Instagram', icon: CameraIcon },
                  { name: 'X (Twitter)', icon: GlobeIcon },
                  { name: '自社サイト', icon: GlobeIcon },
                  { name: 'その他', icon: GlobeIcon },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setPersonalForm({ ...personalForm, type: item.name, name: item.name })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      personalForm.type === item.name
                        ? 'bg-[#171158] text-white'
                        : 'bg-[#FAFBFC] text-[#1B1723]/70 hover:bg-[#171158]/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </button>
                ))}
              </div>

              {/* Wi-Fi専用フォーム */}
              {personalForm.type === '自宅Wi-Fi' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">ネットワーク名 (SSID)</label>
                    <input
                      type="text"
                      value={personalForm.wifiName}
                      onChange={(e) => setPersonalForm({ ...personalForm, wifiName: e.target.value })}
                      placeholder="MyHomeWiFi"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">パスワード</label>
                    <input
                      type="text"
                      value={personalForm.wifiPassword}
                      onChange={(e) => setPersonalForm({ ...personalForm, wifiPassword: e.target.value })}
                      placeholder="********"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">暗号化タイプ</label>
                    <select
                      value={personalForm.wifiType}
                      onChange={(e) => setPersonalForm({ ...personalForm, wifiType: e.target.value })}
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">なし</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">名前</label>
                    <input
                      type="text"
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                      placeholder="マイInstagram"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">URL</label>
                    <input
                      type="text"
                      value={personalForm.url}
                      onChange={(e) => setPersonalForm({ ...personalForm, url: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'business' && (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-5 space-y-4">
              <h2 className="font-semibold text-[#1B1723]">法人・ビジネスQRコード</h2>
              <p className="text-xs text-[#1B1723]/50">名刺に使えるvCard形式のQRコードを生成します</p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">会社名</label>
                    <input
                      type="text"
                      value={businessForm.companyName}
                      onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                      placeholder="株式会社〇〇"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">氏名</label>
                    <input
                      type="text"
                      value={businessForm.personName}
                      onChange={(e) => setBusinessForm({ ...businessForm, personName: e.target.value })}
                      placeholder="山田 太郎"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">役職</label>
                  <input
                    type="text"
                    value={businessForm.position}
                    onChange={(e) => setBusinessForm({ ...businessForm, position: e.target.value })}
                    placeholder="代表取締役"
                    className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">電話番号</label>
                    <input
                      type="tel"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                      placeholder="03-1234-5678"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">メール</label>
                    <input
                      type="email"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                      placeholder="contact@example.com"
                      className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">Webサイト</label>
                  <input
                    type="url"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1723]/70 mb-1">住所</label>
                  <input
                    type="text"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder="東京都渋谷区..."
                    className="w-full px-4 py-2 border border-[#171158]/10 rounded-lg focus:outline-none focus:border-[#E6A24C]"
                  />
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'profile' || activeTab === 'business-profile') && (
            <div className="bg-white rounded-2xl border border-[#171158]/5 p-5">
              <h2 className="font-semibold text-[#1B1723] mb-2">
                {activeTab === 'profile' ? 'プロフィールページ' : '会社プロフィールページ'}
              </h2>
              <p className="text-sm text-[#1B1723]/60 mb-4">
                {activeTab === 'profile'
                  ? 'SNSリンクをまとめた個人プロフィールページを作成します'
                  : '会社情報をまとめたプロフィールページをAIで作成します'}
              </p>
              <Link
                href={activeTab === 'profile' ? '/dashboard/profile-card' : '/dashboard/profile-card?type=business'}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl"
              >
                {activeTab === 'profile' ? '作成ページへ' : 'AIで作成する'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* 生成ボタン */}
          {(activeTab === 'personal' || activeTab === 'business') && (
            <button
              onClick={handleGenerateQR}
              disabled={generating}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] disabled:opacity-50 transition-all"
            >
              {generating ? 'QRコード生成中...' : 'QRコードを生成'}
            </button>
          )}
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
                    download="qr-code.png"
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#171158] rounded-xl text-center"
                  >
                    ダウンロード
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-[#FAFBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-[#171158]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                  </svg>
                </div>
                <p className="text-[#1B1723]/50">情報を入力してQRコードを生成</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
