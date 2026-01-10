'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface FinalData {
  qrCode: string
  design?: unknown
  customization?: unknown
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
        setData(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load final QR', err)
    }
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
                    <h3 className="text-lg font-bold text-[#1B1723]">短縮URL設定</h3>
                    <p className="text-sm text-[#1B1723]/50 mt-1">カスタムURLでトラッキング</p>
                  </div>
                  <div className="px-3 py-1.5 bg-gradient-to-r from-[#E6A24C]/10 to-[#E6A24C]/20 text-[#E6A24C] text-xs font-bold rounded-full">
                    Premium
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!isAuthed ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#171158]/5 to-[#171158]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-[#171158]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#1B1723]/60 mb-4">
                      Google認証で短縮URLを設定できます
                    </p>
                    <button
                      onClick={() => setIsAuthed(true)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-[#1B1723]/80 bg-white border-2 border-[#171158]/10 rounded-xl hover:border-[#171158]/30 hover:bg-[#171158]/[0.02] transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Googleで認証</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1B1723]/70 mb-2">
                        短縮URL
                      </label>
                      <input
                        value={shortUrl}
                        onChange={(e) => setShortUrl(e.target.value)}
                        placeholder="https://qr.ly/mybrand"
                        className="w-full px-4 py-3 text-sm border-2 border-[#171158]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6A24C]/30 focus:border-[#E6A24C] transition-all font-medium text-[#1B1723]"
                      />
                    </div>
                    <button
                      onClick={() => alert(`短縮URLを保存しました: ${shortUrl || '(未入力)'}`)}
                      className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                    >
                      保存
                    </button>
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
