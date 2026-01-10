'use client'

import { useEffect, useState } from 'react'
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
  cornerRadius: 0,
  logoSize: 18,
  logoBackground: true,
  errorCorrectionLevel: 'H',
  dotStyle: 'square',
  outerShape: 'square',
  frameEnabled: false,
  frameText: '',
  frameTemplate: 'none',
  frameGradientEnabled: false,
  frameGradientStyle: 'linear',
  frameColor1: '#000000',
  frameColor2: '#000000',
  frameBackgroundTransparent: true,
  frameBackgroundGradientEnabled: false,
  frameBackgroundGradientStyle: 'linear',
  frameBackground1: '#ffffff',
  frameBackground2: '#ffffff',
  patternStyle: 'square',
  patternGradientEnabled: false,
  patternGradientStyle: 'linear',
  patternColor1: '#000000',
  patternColor2: '#000000',
  patternBackgroundTransparent: false,
  patternBackgroundGradientEnabled: false,
  patternBackgroundGradientStyle: 'linear',
  patternBackground1: '#ffffff',
  patternBackground2: '#ffffff',
  cornerFrameStyle: 'square',
  cornerDotStyle: 'square'
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [analysis, setAnalysis] = useState<URLAnalysis | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [customization, setCustomization] = useState<Customization>(defaultCustomization)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoMode, setLogoMode] = useState<'auto' | 'upload'>('auto')
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null)
  const router = useRouter()

  const applyCustomizationAndRefresh = async (updater: (prev: Customization) => Customization) => {
    setCustomization((prev) => {
      const next = updater(prev)
      return next
    })
    if (selectedDesign) {
      await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null)
    }
  }

  useEffect(() => {
    if (selectedDesign && !qrCode) {
      generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null)
    }
  }, [selectedDesign]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async (inputUrl: string) => {
    setIsLoading(true)
    setUrl(inputUrl)
    setAnalysis(null)
    setDesigns([])
    setSelectedDesign(null)
    setQrCode(null)

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
      const analysisResult = analyzeData.data
      setAnalysis(analysisResult)
      // ロゴはファビコンを優先して埋め込む
      setLogoUrl(analysisResult.favicon || null)
      setLogoMode('auto')
      setUploadedLogo(null)
      
      // サイトから抽出した色をカスタマイズに反映
      const siteColors = analysisResult.colors || ['#000000', '#333333', '#666666']
      setCustomization(prev => ({
        ...prev,
        patternColor1: siteColors[0] || '#000000',
        patternColor2: siteColors[1] || siteColors[0] || '#333333',
        patternGradientEnabled: true
      }))

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

  const generateQRCode = async (design: Design, saveToHistory: boolean, inlineLogo?: string | null, overrideCustomization?: Customization) => {
    if (!design || !url) return

    setIsLoading(true)
    try {
      const currentCustomization = overrideCustomization || customization
      const payload: Record<string, unknown> = {
        url,
        design,
        customization: currentCustomization,
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
    // デザインの色をカスタマイズに反映
    const newCustomization: Customization = {
      ...customization,
      patternColor1: design.fgColor || customization.patternColor1,
      patternColor2: design.bgColor !== '#ffffff' && design.bgColor !== '#FFFFFF' 
        ? design.bgColor 
        : customization.patternColor2,
      patternGradientEnabled: true
    }
    setCustomization(newCustomization)
    await generateQRCode(design, false, null, newCustomization)
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
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">QRをデザインする</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    「操作 → 結果」がすぐ左に反映されます。
                  </p>
                </div>

                {/* ロゴ設定 */}
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
                        {mode === 'auto' ? '自動' : 'アップロード'}
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

                {/* グラデーション設定 */}
                <section className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700">カラー設定</div>
                  {analysis && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-600">サイトから抽出した色:</span>
                      {analysis.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションを使用</label>
                    <input
                      type="checkbox"
                      checked={!!customization.patternGradientEnabled}
                      onChange={async (e) =>
                        await applyCustomizationAndRefresh((prev) => ({
                          ...prev,
                          patternGradientEnabled: e.target.checked
                        }))
                      }
                    />
                  </div>
                </section>
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
