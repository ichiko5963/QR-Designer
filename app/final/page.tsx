'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface FinalData {
  qrCode: string
  design?: unknown
  customization?: unknown
  originalUrl?: string
  shortUrl?: { code: string; shortUrl: string } | null
}

export default function FinalPage() {
  const [data, setData] = useState<FinalData | null>(null)
  const [isAuthed, setIsAuthed] = useState(false)
  const [shortUrl, setShortUrl] = useState('')
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg'>('png')
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qr-final')
      if (stored) {
        const parsedData = JSON.parse(stored)
        setData(parsedData)
        // 短縮URLがある場合は表示用にセット
        if (parsedData.shortUrl?.shortUrl) {
          setShortUrl(parsedData.shortUrl.shortUrl)
        }
      }
    } catch (err) {
      console.error('Failed to load final QR', err)
    }

    // 認証状態を確認
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthed(!!user)
    })
  }, [])

  const handleDownload = () => {
    if (!data?.qrCode) return
    const link = document.createElement('a')
    link.href = data.qrCode
    link.download = `qr-code-${Date.now()}.${downloadFormat}`
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-[#171158]/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="QR Code Designer"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="text-lg font-bold text-[#1B1723] tracking-tight">
              QR Code Designer
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Preview */}
          <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
              <h2 className="text-xl font-bold text-[#1B1723]">完成したQRコード</h2>
              <p className="text-sm text-[#1B1723]/50 mt-1">ダウンロードしてご利用ください</p>
            </div>

            <div className="p-8">
              {!data?.qrCode ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#E6A24C]/10 to-[#E6A24C]/20 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-[#1B1723] font-semibold mb-2">QRコードが見つかりません</p>
                  <p className="text-sm text-[#1B1723]/50 mb-6">再生成してください</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                  >
                    トップに戻る
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative bg-gradient-to-br from-[#171158]/[0.02] to-[#E6A24C]/[0.03] rounded-2xl p-8 mb-6">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 left-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
                    </div>
                    <img
                      src={data.qrCode}
                      alt="QR Code"
                      className="relative z-10 rounded-xl shadow-2xl shadow-[#171158]/10"
                      style={{ width: '280px', height: '280px' }}
                    />
                  </div>

                  {/* Download Options */}
                  <div className="w-full space-y-4">
                    <div className="flex gap-3">
                      {(['png', 'svg'] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setDownloadFormat(format)}
                          className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                            downloadFormat === format
                              ? 'bg-[#171158] text-white border-[#171158] shadow-lg shadow-[#171158]/20'
                              : 'bg-white text-[#1B1723]/70 border-[#171158]/10 hover:border-[#171158]/30'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 hover:shadow-xl hover:shadow-[#E6A24C]/40 transition-all hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>ダウンロード</span>
                    </button>

                    <button
                      onClick={() => router.back()}
                      className="w-full px-6 py-3 text-sm font-semibold text-[#1B1723]/70 bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-colors"
                    >
                      デザインに戻る
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Short URL Card */}
            <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1B1723]">リンク情報</h3>
                    <p className="text-sm text-[#1B1723]/50 mt-1">QRコードのリンク先</p>
                  </div>
                  {shortUrl && (
                    <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-600 text-xs font-bold rounded-full">
                      短縮URL生成済み
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {shortUrl ? (
                  <div className="space-y-4">
                    {/* 短縮URL */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1B1723]/50 mb-2">
                        短縮URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={shortUrl}
                          readOnly
                          className="flex-1 px-4 py-3 text-sm bg-[#171158]/5 border-2 border-[#171158]/10 rounded-xl font-medium text-[#1B1723]"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shortUrl)
                            alert('短縮URLをコピーしました')
                          }}
                          className="px-4 py-3 text-sm font-semibold text-[#171158] bg-[#171158]/10 rounded-xl hover:bg-[#171158]/20 transition-colors"
                        >
                          コピー
                        </button>
                      </div>
                    </div>

                    {/* 元のURL */}
                    {data?.originalUrl && (
                      <div>
                        <label className="block text-xs font-semibold text-[#1B1723]/50 mb-2">
                          元のURL
                        </label>
                        <p className="px-4 py-3 text-sm bg-[#171158]/5 border-2 border-[#171158]/10 rounded-xl font-medium text-[#1B1723]/70 truncate">
                          {data.originalUrl}
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => router.push('/dashboard/qr-codes')}
                        className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                      >
                        ダッシュボードで管理
                      </button>
                    </div>
                  </div>
                ) : !isAuthed ? (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#171158]/5 to-[#171158]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-[#171158]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#1B1723]/60">
                        Googleログインで短縮URLが自動生成され、履歴として管理できます。
                      </p>
                    </div>
                    <div className="bg-[#171158]/5 rounded-2xl p-4 text-left">
                      <p className="text-xs font-semibold text-[#1B1723]/50 mb-2">ログインでできること</p>
                      <ul className="space-y-2 text-sm text-[#1B1723]/80">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#E6A24C]" />
                          短縮URLが自動生成されます
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#E6A24C]" />
                          QRコードの履歴管理
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#E6A24C]" />
                          再編集・再ダウンロード
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={() => (window.location.href = '/api/auth/signin?redirectTo=%2Fdashboard')}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#fff" d="M21.35 11.1h-9.87v2.95h6.01c-.26 1.38-1.05 2.55-2.23 3.35v2.78h3.6c2.1-1.93 3.29-4.78 3.29-8.14 0-.45-.03-.9-.08-1.34z"/>
                        <path fill="#fff" d="M11.48 22c2.97 0 5.46-.98 7.28-2.66l-3.6-2.78c-.97.67-2.23 1.07-3.68 1.07-2.82 0-5.23-1.91-6.1-4.47H1.14v2.82C2.95 19.53 6.64 22 11.48 22z"/>
                        <path fill="#fff" d="M5.38 12.42c-.22-.64-.35-1.34-.35-2.05 0-.71.13-1.41.35-2.05V5.5H1.69C.92 7 .5 8.63.5 10.37c0 1.74.42 3.37 1.19 4.87l3.69-2.82z"/>
                        <path fill="#fff" d="M11.48 4.37c1.62 0 3.07.55 4.21 1.63l3.15-3.12C17.46 1.08 15 0 11.48 0 6.63 0 2.95 2.47 1.14 6.13l3.69 2.82c.86-2.56 3.28-4.58 6.65-4.58z"/>
                      </svg>
                      <span>Googleでログイン</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.originalUrl && (
                      <div>
                        <label className="block text-xs font-semibold text-[#1B1723]/50 mb-2">
                          リンク先URL
                        </label>
                        <p className="px-4 py-3 text-sm bg-[#171158]/5 border-2 border-[#171158]/10 rounded-xl font-medium text-[#1B1723]/70 truncate">
                          {data.originalUrl}
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => router.push('/dashboard/qr-codes')}
                        className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                      >
                        ダッシュボードで管理
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-3xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#E6A24C]/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold mb-2">印刷のヒント</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    コントラストが低いと読み取り精度が下がる場合があります。
                    印刷前にスマートフォンでテストすることをおすすめします。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
