'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import URLInput from './components/URLInput'
import DesignGrid from './components/DesignGrid'
import QRPreview from './components/QRPreview'
import AuthButton from './components/AuthButton'
import type { URLAnalysis } from '@/types/analysis'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

const defaultCustomization: Customization = {
  size: 512,
  cornerRadius: 20,
  logoSize: 18,
  logoBackground: true,
  errorCorrectionLevel: 'M',
  dotStyle: 'square',
  outerShape: 'round',
  frameEnabled: true,
  frameText: 'Scan me!',
  frameColor: '#000000',
  frameBackground: '#ffffff'
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [analysis, setAnalysis] = useState<URLAnalysis | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [customization, setCustomization] = useState<Customization>(defaultCustomization)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoMode, setLogoMode] = useState<'auto' | 'upload'>('auto')
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalyze = async (inputUrl: string) => {
    setIsLoading(true)
    setUrl(inputUrl)
    setAnalysis(null)
    setDesigns([])
    setSelectedDesign(null)
    setQrCode(null)
    setRequiresAuth(false)
    setRateLimitExceeded(false)
    setRateLimitMessage('')

    try {
      // Step 1: URL解析
      const analyzeResponse = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      })

      if (!analyzeResponse.ok) {
        throw new Error('URLの解析に失敗しました')
      }

      const analyzeData = await analyzeResponse.json()
      setAnalysis(analyzeData.data)
      // ロゴはファビコンを優先して埋め込む
      setLogoUrl(analyzeData.data.favicon || null)
      setLogoMode('auto')
      setUploadedLogo(null)

      // Step 2: デザイン生成
      const designsResponse = await fetch('/api/generate-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analyzeData.data })
      })

      if (!designsResponse.ok) {
        throw new Error('デザイン生成に失敗しました')
      }

      const designsData = await designsResponse.json()
      setDesigns(designsData.designs)
      
      // 最初のデザインを自動選択
      if (designsData.designs.length > 0) {
        setSelectedDesign(designsData.designs[0])
        // 自動的にQRコードを生成
        await generateQRCode(designsData.designs[0], false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCode = async (design: Design, saveToHistory: boolean, inlineLogo?: string | null) => {
    if (!design || !url) return

    setIsLoading(true)
    setRequiresAuth(false)
    setRateLimitExceeded(false)
    setRateLimitMessage('')

    try {
      const payload: Record<string, unknown> = {
        url,
        design,
        customization,
        saveToHistory
      }
      if (logoMode === 'upload' && (inlineLogo || uploadedLogo)) {
        payload.logo = inlineLogo || uploadedLogo
      } else if (logoUrl) {
        payload.logoUrl = logoUrl
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.qrCode)
        
        if (data.requiresAuth) {
          setRequiresAuth(true)
        }
        
        if (data.rateLimitExceeded) {
          setRateLimitExceeded(true)
          setRateLimitMessage(data.message)
        }
      } else {
        throw new Error(data.error || 'QRコード生成に失敗しました')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('QRコード生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDesign = async (design: Design) => {
    setSelectedDesign(design)
    await generateQRCode(design, false)
  }

  const handleSaveToHistory = async () => {
    if (!selectedDesign) return
    await generateQRCode(selectedDesign, true)
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setUploadedLogo(result)
        setLogoMode('upload')
        if (selectedDesign) {
          await generateQRCode(selectedDesign, false, result)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDotStyleChange = async (style: Customization['dotStyle']) => {
    setCustomization((prev) => ({ ...prev, dotStyle: style }))
    if (selectedDesign) {
      await generateQRCode(selectedDesign, false)
    }
  }

  const handleShapeChange = async (shape: 'square' | 'round') => {
    const radius = shape === 'round' ? 18 : 0
    setCustomization((prev) => ({ ...prev, cornerRadius: radius, outerShape: shape }))
    if (selectedDesign) {
      await generateQRCode(selectedDesign, false)
    }
  }

  const handleConfirm = () => {
    if (!qrCode) return
    try {
      localStorage.setItem(
        'qr-final',
        JSON.stringify({
          qrCode,
          design: selectedDesign,
          customization
        })
      )
      router.push('/final')
    } catch (err) {
      console.error('Failed to persist QR for final page', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              QR Designer
            </h1>
            <p className="text-lg text-gray-600">
              URLを入力するだけで、AIが最適でおしゃれなQRコードを自動生成
            </p>
          </div>
          <AuthButton />
        </div>

        <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {isLoading && !qrCode && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">サイトを解析しています...</p>
          </div>
        )}

        {designs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="lg:sticky lg:top-8 order-2 lg:order-1">
              {selectedDesign && (
                <QRPreview
                  qrCode={qrCode}
                  design={selectedDesign}
                  customization={customization}
                  onConfirm={handleConfirm}
                />
              )}
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-gray-800">QRをデザインする</h3>

                <section className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">フレーム設定</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        setCustomization((prev) => ({ ...prev, frameEnabled: !prev.frameEnabled }))
                      }
                      className={`px-3 py-2 text-sm rounded border ${
                        customization.frameEnabled
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {customization.frameEnabled ? 'フレームON' : 'フレームOFF'}
                    </button>
                  </div>
                  <label className="block">
                    <span className="text-xs text-gray-600">フレームテキスト</span>
                    <input
                      value={customization.frameText || ''}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameText: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Scan me!"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">フレームカラー</span>
                    <input
                      type="color"
                      value={customization.frameColor || '#000000'}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameColor: e.target.value }))
                      }
                      className="mt-1 h-10 w-20 rounded border border-gray-300"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">フレーム背景色</span>
                    <input
                      type="color"
                      value={customization.frameBackground || '#ffffff'}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameBackground: e.target.value }))
                      }
                      className="mt-1 h-10 w-20 rounded border border-gray-300"
                    />
                  </label>
                </section>

                <section className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">ロゴ設定</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['auto', 'upload'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLogoMode(mode)}
                        className={`px-3 py-2 text-sm rounded border ${
                          logoMode === mode
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {mode === 'auto' ? '自動(favicon)' : 'アップロード'}
                      </button>
                    ))}
                  </div>
                  {logoMode === 'upload' && (
                    <label className="block">
                      <span className="text-xs text-gray-600">ロゴ画像（1:1推奨）</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 w-full text-sm"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) await handleLogoUpload(file)
                        }}
                      />
                    </label>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">パターン（ドット）設定</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['square', 'rounded', 'dots'] as Customization['dotStyle'][]).map((style) => (
                      <button
                        key={style}
                        onClick={() => handleDotStyleChange(style)}
                        className={`px-3 py-2 text-sm rounded border ${
                          customization.dotStyle === style
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {style === 'square' ? '四角' : style === 'rounded' ? '丸' : 'ドット'}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">コーナー設定</div>
                  <div className="flex gap-2">
                    {(['square', 'round'] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => handleShapeChange(shape)}
                        className={`px-3 py-2 text-sm rounded border ${
                          (shape === 'round' && customization.cornerRadius > 0) ||
                          (shape === 'square' && customization.cornerRadius === 0)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {shape === 'square' ? '角あり' : 'ラウンド'}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  お忘れなく！背景とコードのコントラストを高める配色をおすすめします。
                </div>
              </div>

              <DesignGrid
                designs={designs}
                selectedDesign={selectedDesign}
                onSelectDesign={handleSelectDesign}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
