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
  frameText: 'スキャンして！',
  frameTemplate: 'outline',
  frameGradientEnabled: false,
  frameGradientStyle: 'linear',
  frameColor1: '#6B4CFB',
  frameColor2: '#8C6CFF',
  frameBackgroundTransparent: false,
  frameBackgroundGradientEnabled: false,
  frameBackgroundGradientStyle: 'linear',
  frameBackground1: '#ffffff',
  frameBackground2: '#f2f2ff',
  patternStyle: 'square',
  patternGradientEnabled: false,
  patternGradientStyle: 'linear',
  patternColor1: '#000000',
  patternColor2: '#222222',
  patternBackgroundTransparent: false,
  patternBackgroundGradientEnabled: false,
  patternBackgroundGradientStyle: 'linear',
  patternBackground1: '#ffffff',
  patternBackground2: '#f5f5f5',
  cornerFrameStyle: 'outline',
  cornerDotStyle: 'square'
}

export default function Home() {
  const frameTemplates = [
    'none',
    'outline',
    'double',
    'band-bottom',
    'band-top',
    'ticket',
    'dotted',
    'badge',
    'ribbon-left',
    'ribbon-right',
    'shadow',
    'glow',
    'minimal'
  ]

  const patternStyles: { key: Customization['patternStyle'] | Customization['dotStyle']; label: string }[] = [
    { key: 'square', label: '標準四角' },
    { key: 'round', label: '角丸' },
    { key: 'rounder', label: 'より丸' },
    { key: 'dot', label: 'ドット' },
    { key: 'heart', label: 'ハート' },
    { key: 'diamond', label: '菱形' }
  ]

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

  const handleSwapPatternColors = async () => {
    setCustomization((prev) => ({
      ...prev,
      patternColor1: prev.patternBackground1,
      patternBackground1: prev.patternColor1
    }))
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
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">QRをデザインする</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    「操作 → 結果」がすぐ左に反映されます。
                  </p>
                </div>

                {/* A) フレーム */}
                <section className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">フレーム</div>
                    <p className="text-xs text-gray-500">
                      フレームを使うとQRコードが目立ち、より多くのスキャンを促すことができます。
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
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
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-full">
                      {frameTemplates.map((tmpl) => (
                        <button
                          key={tmpl}
                          onClick={() => setCustomization((prev) => ({ ...prev, frameTemplate: tmpl }))}
                          className={`min-w-[88px] h-20 rounded-lg border flex items-center justify-center text-xs ${
                            customization.frameTemplate === tmpl
                              ? 'border-purple-500 ring-2 ring-purple-200'
                              : 'border-gray-200'
                          }`}
                        >
                          {tmpl === 'none' ? 'なし' : tmpl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">フレームテキスト</label>
                    <input
                      value={customization.frameText || ''}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameText: e.target.value }))
                      }
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="スキャンして！"
                    />
                    <span className="text-gray-400 text-sm">✎</span>
                  </div>
                </section>

                {/* B) フレームカラー */}
                <section className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700">フレームカラー</div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションのフレームカラーを使う</label>
                    <input
                      type="checkbox"
                      checked={!!customization.frameGradientEnabled}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameGradientEnabled: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションスタイル</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={customization.frameGradientStyle || 'linear'}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameGradientStyle: e.target.value as any }))
                      }
                    >
                      <option value="linear">線形</option>
                      <option value="radial">放射</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'フレームカラー-1', key: 'frameColor1', value: customization.frameColor1 || '#000000' },
                      { label: 'フレームカラー-2', key: 'frameColor2', value: customization.frameColor2 || '#2F6BFD' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded border"
                          style={{ backgroundColor: item.value }}
                          onClick={() => {}}
                          aria-label={item.label}
                        />
                        <input
                          value={item.value}
                          onChange={(e) =>
                            setCustomization((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className="flex-1 rounded border px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* C) フレーム背景色 */}
                <section className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700">フレームの背景色</div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={!!customization.frameBackgroundTransparent}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, frameBackgroundTransparent: e.target.checked }))
                      }
                    />
                    透明な背景
                  </label>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションの背景色を使う</label>
                    <input
                      type="checkbox"
                      checked={!!customization.frameBackgroundGradientEnabled}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          frameBackgroundGradientEnabled: e.target.checked
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションスタイル</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={customization.frameBackgroundGradientStyle || 'linear'}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          frameBackgroundGradientStyle: e.target.value as any
                        }))
                      }
                    >
                      <option value="linear">線形</option>
                      <option value="radial">放射</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: '背景色1', key: 'frameBackground1', value: customization.frameBackground1 || '#ffffff' },
                      { label: '背景色2', key: 'frameBackground2', value: customization.frameBackground2 || '#f2f2f2' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded border"
                          style={{ backgroundColor: item.value }}
                          onClick={() => {}}
                          aria-label={item.label}
                        />
                        <input
                          value={item.value}
                          onChange={(e) =>
                            setCustomization((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className="flex-1 rounded border px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </section>

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

                {/* D) QRコードパターン */}
                <section className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">QRコードパターン</div>
                    <p className="text-xs text-gray-500">QRコードのパターンを選択し、色を選びます。</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {patternStyles.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setCustomization((prev) => ({ ...prev, patternStyle: p.key as any, dotStyle: p.key as any }))
                          if (selectedDesign) generateQRCode(selectedDesign, false)
                        }}
                        className={`h-16 rounded-lg border text-xs flex items-center justify-center ${
                          customization.patternStyle === p.key || customization.dotStyle === p.key
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-gray-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションパターンカラーを使用</label>
                    <input
                      type="checkbox"
                      checked={!!customization.patternGradientEnabled}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, patternGradientEnabled: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSwapPatternColors}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-purple-700 border border-purple-200 rounded"
                    >
                      ⟳ 入替
                    </button>
                    <span className="text-xs text-gray-500">柄色と背景色をスワップ</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: '柄の色1', key: 'patternColor1', value: customization.patternColor1 || '#000000' },
                      { label: '柄の色2', key: 'patternColor2', value: customization.patternColor2 || '#222222' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded border"
                          style={{ backgroundColor: item.value }}
                          onClick={() => {}}
                          aria-label={item.label}
                        />
                        <input
                          value={item.value}
                          onChange={(e) =>
                            setCustomization((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className="flex-1 rounded border px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">透明な背景</label>
                    <input
                      type="checkbox"
                      checked={!!customization.patternBackgroundTransparent}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          patternBackgroundTransparent: e.target.checked
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">グラデーションの背景色を使う</label>
                    <input
                      type="checkbox"
                      checked={!!customization.patternBackgroundGradientEnabled}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          patternBackgroundGradientEnabled: e.target.checked
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: '背景色1', key: 'patternBackground1', value: customization.patternBackground1 || '#ffffff' },
                      { label: '背景色2', key: 'patternBackground2', value: customization.patternBackground2 || '#f5f5f5' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded border"
                          style={{ backgroundColor: item.value }}
                          onClick={() => {}}
                          aria-label={item.label}
                        />
                        <input
                          value={item.value}
                          onChange={(e) =>
                            setCustomization((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          className="flex-1 rounded border px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* E) QRコードコーナー */}
                <section className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">QRコードコーナー</div>
                    <p className="text-xs text-gray-500">QRコードの角のスタイルを選択してください</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded">
                    {(['square', 'round'] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => handleShapeChange(shape)}
                        className={`h-14 rounded border text-xs ${
                          (shape === 'round' && customization.cornerRadius > 0) ||
                          (shape === 'square' && customization.cornerRadius === 0)
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-gray-200'
                        }`}
                      >
                        {shape === 'square' ? '角あり' : 'ラウンド'}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">フレーム周囲のドットの色</label>
                    <input
                      value={customization.patternColor1 || '#000000'}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, patternColor1: e.target.value }))
                      }
                      className="rounded border px-2 py-1 text-sm"
                    />
                    <label className="text-xs text-gray-600">コーナードットの色</label>
                    <input
                      value={customization.patternBackground1 || '#000000'}
                      onChange={(e) =>
                        setCustomization((prev) => ({ ...prev, patternBackground1: e.target.value }))
                      }
                      className="rounded border px-2 py-1 text-sm"
                    />
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
