'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import URLInput from '@/app/components/URLInput'
import DesignGrid from '@/app/components/DesignGrid'
import QRPreview from '@/app/components/QRPreview'
import type { URLAnalysis } from '@/types/analysis'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

interface ColorPreset {
  id: string
  name: string
  color: string
  isGradient?: boolean
  colors?: string[]
  gradientDirection?: 'to-br' | 'to-bl' | 'to-tr' | 'to-tl' | 'to-r' | 'to-b' | 'radial' | 'radial-tl' | 'radial-br'
}

// グラデーション方向をCSSに変換
function getGradientCSS(direction: ColorPreset['gradientDirection'], colors: string[]): string {
  const colorStops = colors.join(', ')
  switch (direction) {
    case 'to-r':
      return `linear-gradient(90deg, ${colorStops})`
    case 'to-b':
      return `linear-gradient(180deg, ${colorStops})`
    case 'to-bl':
      return `linear-gradient(225deg, ${colorStops})`
    case 'to-tr':
      return `linear-gradient(45deg, ${colorStops})`
    case 'to-tl':
      return `linear-gradient(315deg, ${colorStops})`
    case 'to-br':
      return `linear-gradient(135deg, ${colorStops})`
    case 'radial':
      return `radial-gradient(circle at center, ${colorStops})`
    case 'radial-tl':
      return `radial-gradient(circle at top left, ${colorStops})`
    case 'radial-br':
      return `radial-gradient(circle at bottom right, ${colorStops})`
    default:
      return `linear-gradient(135deg, ${colorStops})`
  }
}

// 白色・薄い色かどうかを判定
function isWhiteColor(hex: string): boolean {
  const color = hex.replace('#', '').toLowerCase()
  if (color.length !== 6) return false
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  if (brightness > 200) return true
  if (r >= 200 && g >= 200 && b >= 200) return true
  return false
}

const defaultCustomization: Customization = {
  size: 512,
  cornerRadius: 0,
  logoSize: 18,
  logoBackground: true,
  logoFrameShape: 'rounded',
  errorCorrectionLevel: 'H',
  dotStyle: 'square',
  outerShape: 'square',
  frameEnabled: false,
  frameText: '',
  frameTemplate: 'none',
  frameGradientEnabled: false,
  frameGradientStyle: 'linear',
  frameColor1: '#171158',
  frameColor2: '#E6A24C',
  frameBackgroundTransparent: true,
  frameBackgroundGradientEnabled: false,
  frameBackgroundGradientStyle: 'linear',
  frameBackground1: '#ffffff',
  frameBackground2: '#ffffff',
  patternStyle: 'square',
  patternGradientEnabled: false,
  patternGradientStyle: 'linear',
  patternColor1: '#171158',
  patternColor2: '#1B1723',
  patternColor3: '#E6A24C',
  colorStyle: 'gradient',
  patternBackgroundTransparent: false,
  patternBackgroundGradientEnabled: false,
  patternBackgroundGradientStyle: 'linear',
  patternBackground1: '#ffffff',
  patternBackground2: '#ffffff',
  cornerFrameStyle: 'square',
  cornerDotStyle: 'square'
}

export default function GeneratePage() {
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
  const [extractedLogoColors, setExtractedLogoColors] = useState<string[]>([])
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const router = useRouter()

  // 色プリセットを生成
  const generateColorPresets = (logoColors: string[], siteColors: string[]): ColorPreset[] => {
    const presets: ColorPreset[] = []
    const filteredLogoColors = logoColors.filter(c => !isWhiteColor(c))
    const filteredSiteColors = siteColors.filter(c => !isWhiteColor(c))
    const allColors = [...filteredLogoColors, ...filteredSiteColors].filter(
      (c, i, arr) => arr.findIndex(x => x.toLowerCase() === c.toLowerCase()) === i
    )

    if (allColors.length < 2) {
      allColors.push('#171158', '#E6A24C', '#1B1723')
    }

    const color1 = allColors[0] || '#171158'
    const color2 = allColors[1] || '#E6A24C'
    const color3 = allColors[2] || color2

    const gradientVariations: Array<{
      id: string
      name: string
      colors: string[]
      direction: ColorPreset['gradientDirection']
    }> = [
      { id: 'grad-br', name: '↘ 斜め', colors: [color1, color2, color3], direction: 'to-br' },
      { id: 'grad-tr', name: '↗ 斜め', colors: [color1, color2, color3], direction: 'to-tr' },
      { id: 'grad-r', name: '→ 横', colors: [color1, color2, color3], direction: 'to-r' },
      { id: 'grad-b', name: '↓ 縦', colors: [color1, color2, color3], direction: 'to-b' },
      { id: 'grad-radial', name: '◎ 中心', colors: [color1, color2, color3], direction: 'radial' },
      { id: 'grad-radial-tl', name: '◐ 左上', colors: [color1, color2, color3], direction: 'radial-tl' },
    ]

    gradientVariations.forEach(variation => {
      presets.push({
        id: variation.id,
        name: variation.name,
        color: variation.colors[0],
        isGradient: true,
        colors: variation.colors,
        gradientDirection: variation.direction
      })
    })

    const usedSolidColors = new Set<string>()

    filteredLogoColors.forEach((color, index) => {
      const normalizedColor = color.toLowerCase()
      if (!usedSolidColors.has(normalizedColor)) {
        usedSolidColors.add(normalizedColor)
        presets.push({
          id: `logo-${index}`,
          name: 'ロゴ',
          color: color,
          isGradient: false
        })
      }
    })

    filteredSiteColors.forEach((color, index) => {
      const normalizedColor = color.toLowerCase()
      if (!usedSolidColors.has(normalizedColor)) {
        usedSolidColors.add(normalizedColor)
        presets.push({
          id: `site-${index}`,
          name: 'サイト',
          color: color,
          isGradient: false
        })
      }
    })

    return presets
  }

  useEffect(() => {
    if (selectedDesign && !qrCode) {
      generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null)
    }
  }, [selectedDesign]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async (inputUrl: string) => {
    setUrl(inputUrl)
    setAnalysis(null)
    setDesigns([])
    setSelectedDesign(null)
    setCustomization(defaultCustomization)
    setQrCode(null)
    setLogoUrl(null)
    setLogoMode('auto')
    setUploadedLogo(null)
    setExtractedLogoColors([])
    setColorPresets([])
    setSelectedPresetId(null)
    setIsLoading(true)

    try {
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
      setLogoUrl(analysisResult.favicon || null)
      setLogoMode('auto')
      setUploadedLogo(null)

      const siteColors = analysisResult.colors || ['#171158', '#1B1723', '#E6A24C']

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

      if (designsData.designs.length > 0) {
        setSelectedDesign(designsData.designs[0])
        await generateQRCode(designsData.designs[0], false, null, undefined, true, siteColors)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCode = async (
    design: Design,
    saveToHistory: boolean,
    inlineLogo?: string | null,
    overrideCustomization?: Customization,
    applyLogoColors?: boolean,
    siteColors?: string[]
  ) => {
    if (!design || !url) return

    setQrCode(null)
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
        if (applyLogoColors && data.extractedLogoColors && data.extractedLogoColors.length > 0) {
          setExtractedLogoColors(data.extractedLogoColors)
          const presets = generateColorPresets(
            data.extractedLogoColors,
            siteColors || analysis?.colors || []
          )
          setColorPresets(presets)

          if (presets.length > 0) {
            const firstPreset = presets[0]
            const colors = firstPreset.colors || [firstPreset.color]
            const color1 = colors[0]
            const color2 = colors[1] || color1
            const color3 = colors[2] || color2

            const newCustomization: Customization = {
              ...currentCustomization,
              patternColor1: color1,
              patternColor2: color2,
              patternColor3: color3,
              colorStyle: 'gradient',
              gradientDirection: firstPreset.gradientDirection || 'to-br'
            }
            setCustomization(newCustomization)
            setSelectedPresetId(firstPreset.id)

            const regenPayload: Record<string, unknown> = {
              url,
              design,
              customization: newCustomization,
              saveToHistory: false
            }
            if (logoMode === 'upload' && (inlineLogo || uploadedLogo)) {
              regenPayload.logo = inlineLogo || uploadedLogo
            } else if (logoUrl) {
              regenPayload.logoUrl = logoUrl
            }

            const regenResponse = await fetch('/api/generate-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(regenPayload)
            })
            const regenData = await regenResponse.json()
            if (regenData.success) {
              setQrCode(regenData.qrCode)
            } else {
              setQrCode(data.qrCode)
            }
          } else {
            setQrCode(data.qrCode)
          }
        } else {
          setQrCode(data.qrCode)
          if (data.extractedLogoColors && data.extractedLogoColors.length > 0) {
            setExtractedLogoColors(data.extractedLogoColors)
            const presets = generateColorPresets(
              data.extractedLogoColors,
              siteColors || analysis?.colors || []
            )
            setColorPresets(presets)
          }
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
    const siteColors = analysis?.colors || []
    const newCustomization: Customization = {
      ...customization,
      patternColor1: design.fgColor || siteColors[0] || customization.patternColor1,
      patternColor2: (design.bgColor !== '#ffffff' && design.bgColor !== '#FFFFFF')
        ? design.bgColor
        : siteColors[1] || customization.patternColor2,
      patternColor3: siteColors[2] || customization.patternColor3
    }
    setCustomization(newCustomization)
    await generateQRCode(design, false, null, newCustomization)
  }

  const handlePresetSelect = async (preset: ColorPreset) => {
    setSelectedPresetId(preset.id)
    let newCustomization: Customization

    if (preset.isGradient && preset.colors) {
      const c1 = preset.colors[0]
      const c2 = preset.colors[1] || c1
      const c3 = preset.colors.length >= 3 ? preset.colors[2] : c2

      newCustomization = {
        ...customization,
        patternColor1: c1,
        patternColor2: c2,
        patternColor3: c3,
        colorStyle: 'gradient',
        gradientDirection: preset.gradientDirection || 'to-br'
      }
    } else {
      newCustomization = {
        ...customization,
        patternColor1: preset.color,
        patternColor2: preset.color,
        patternColor3: preset.color,
        colorStyle: 'gradient',
        gradientDirection: undefined
      }
    }

    setCustomization(newCustomization)
    if (selectedDesign) {
      await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
    }
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

  // QRコードを保存してダッシュボードに戻る
  const handleConfirm = async () => {
    if (!qrCode || !selectedDesign) return

    try {
      // 履歴に保存
      await generateQRCode(selectedDesign, true, logoMode === 'upload' ? uploadedLogo : null, customization)
      // ダッシュボードに戻る
      router.push('/dashboard/qr-codes')
    } catch (err) {
      console.error('Failed to save QR code', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">AIでQRコード生成</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          URLを入力するとAIが最適なデザインを提案します
        </p>
      </div>

      {/* URL入力 */}
      <div className="bg-white rounded-2xl border border-[#171158]/5 p-6 shadow-sm">
        <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />
      </div>

      {/* Loading State */}
      {isLoading && !qrCode && (
        <div className="py-16">
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#171158]/10" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-[#E6A24C] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-[#1B1723] font-semibold">サイトを解析中...</p>
              <p className="text-sm text-[#171158]/60 mt-1">AIがコンテンツを理解しています</p>
            </div>
          </div>
        </div>
      )}

      {/* Design Section */}
      {designs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Preview Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            {selectedDesign && (
              <QRPreview
                qrCode={qrCode}
                design={selectedDesign}
                customization={customization}
                onConfirm={handleConfirm}
                confirmLabel="保存してダッシュボードへ"
              />
            )}
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-7 space-y-6">
            {/* Design & Color Card */}
            <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
                <h3 className="text-lg font-bold text-[#1B1723]">デザイン & カラー</h3>
                <p className="text-sm text-[#1B1723]/60 mt-1">
                  AIが生成したデザインと抽出したカラーから選択
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Color Presets */}
                {colorPresets.length > 0 && (
                  <div>
                    <span className="text-xs text-[#1B1723]/50 font-semibold mb-4 block uppercase tracking-wider">カラーパレット</span>
                    <div className="flex flex-wrap gap-3">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset)}
                          className={`group relative transition-all ${
                            selectedPresetId === preset.id
                              ? 'scale-110'
                              : 'hover:scale-105'
                          }`}
                          title={preset.name}
                        >
                          {preset.isGradient && preset.colors ? (
                            <div
                              className={`w-10 h-10 rounded-xl shadow-md transition-all ${
                                selectedPresetId === preset.id
                                  ? 'ring-2 ring-[#171158] ring-offset-2'
                                  : 'ring-1 ring-[#171158]/10'
                              }`}
                              style={{
                                background: getGradientCSS(preset.gradientDirection, preset.colors)
                              }}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-xl shadow-md transition-all ${
                                selectedPresetId === preset.id
                                  ? 'ring-2 ring-[#171158] ring-offset-2'
                                  : 'ring-1 ring-[#171158]/10'
                              }`}
                              style={{ backgroundColor: preset.color }}
                            />
                          )}
                          {selectedPresetId === preset.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#171158] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Grid */}
                <div>
                  <span className="text-xs text-[#1B1723]/50 font-semibold mb-4 block uppercase tracking-wider">AIデザイン候補</span>
                  <DesignGrid
                    designs={designs}
                    selectedDesign={selectedDesign}
                    onSelectDesign={handleSelectDesign}
                  />
                </div>
              </div>
            </div>

            {/* Logo Settings Card */}
            <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
                <h3 className="text-lg font-bold text-[#1B1723]">ロゴ設定</h3>
                <p className="text-sm text-[#1B1723]/60 mt-1">
                  ロゴの取得方法を設定
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Logo Mode */}
                <div className="flex gap-3">
                  {(['auto', 'upload'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLogoMode(mode)}
                      className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                        logoMode === mode
                          ? 'bg-[#171158] text-white border-[#171158] shadow-lg shadow-[#171158]/20'
                          : 'bg-white text-[#1B1723]/70 border-[#171158]/10 hover:border-[#171158]/30'
                      }`}
                    >
                      {mode === 'auto' ? '自動取得' : 'アップロード'}
                    </button>
                  ))}
                </div>

                {logoMode === 'upload' && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#171158]/20 rounded-xl cursor-pointer hover:border-[#E6A24C]/50 hover:bg-[#E6A24C]/5 transition-all">
                    <svg className="w-8 h-8 text-[#171158]/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-[#1B1723]/60 font-medium">クリックしてロゴをアップロード</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) await handleLogoUpload(file)
                      }}
                    />
                  </label>
                )}

                {/* Extracted Logo Colors */}
                {extractedLogoColors.length > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#171158]/5 to-[#E6A24C]/5 rounded-xl">
                    <span className="text-xs text-[#1B1723]/60 font-semibold">抽出した色</span>
                    <div className="flex gap-2">
                      {extractedLogoColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-lg shadow-md ring-2 ring-white"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
