'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import URLInput from '@/app/components/URLInput'
import DesignGrid from '@/app/components/DesignGrid'
import QRPreview from '@/app/components/QRPreview'
import LoginModal from '@/app/components/LoginModal'
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

// 白色・薄い色かどうかを判定（QRで読み取りにくい色を除外）
// HSVベースの相対彩度で判定し、彩度のある明るい色は残す
function isWhiteColor(hex: string): boolean {
  const color = hex.replace('#', '').toLowerCase()
  if (color.length !== 6) return false
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)

  // 明るさを計算
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // HSV彩度（相対彩度）: 0-1の範囲
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const relativeSaturation = max > 0 ? (max - min) / max : 0

  // 除外条件:
  // 1. 明るさが250以上かつ彩度が20%未満 → ほぼ白
  if (brightness > 250 && relativeSaturation < 0.2) return true
  // 2. 明るさが230以上かつ彩度が10%未満 → 白に近い
  if (brightness > 230 && relativeSaturation < 0.1) return true
  // 3. RGB全て245以上 → 白
  if (r >= 245 && g >= 245 && b >= 245) return true

  // 彩度が十分にある明るい色（明るいオレンジ、イエローなど）は除外しない
  return false
}

function clampColorValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function shiftHexColor(hex: string, amount: number) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const num = parseInt(normalized, 16)
  const r = clampColorValue(((num >> 16) & 0xff) + amount, 0, 255)
  const g = clampColorValue(((num >> 8) & 0xff) + amount, 0, 255)
  const b = clampColorValue((num & 0xff) + amount, 0, 255)
  const combined = (r << 16) | (g << 8) | b
  return `#${combined.toString(16).padStart(6, '0')}`
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

const applyPresetToCustomization = (
  preset: ColorPreset,
  baseCustomization: Customization
): Customization => {
  if (preset.isGradient && preset.colors) {
    const c1 = preset.colors[0]
    const c2 = preset.colors[1] || shiftHexColor(c1, -20)
    const c3 = preset.colors[2] || shiftHexColor(c2, 20)

    return {
      ...baseCustomization,
      patternColor1: c1,
      patternColor2: c2,
      patternColor3: c3,
      colorStyle: 'gradient',
      gradientDirection: preset.gradientDirection || 'to-br'
    }
  }

  return {
    ...baseCustomization,
    patternColor1: preset.color,
    patternColor2: preset.color,
    patternColor3: preset.color,
    colorStyle: 'gradient',
    gradientDirection: preset.gradientDirection
  }
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
  const [autoPaletteSync, setAutoPaletteSync] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const router = useRouter()

  // 色プリセットを生成（グラデーション優先 + 単色）
  // ロゴ色を最優先で使用し、不足分のみサイト色で補完
  const generateColorPresets = (logoColors: string[], siteColors: string[]): ColorPreset[] => {
    const presets: ColorPreset[] = []

    // 白色・薄い色をフィルタリング
    const filteredLogoColors = logoColors.filter(c => !isWhiteColor(c))
    const filteredSiteColors = siteColors.filter(c => !isWhiteColor(c))

    // グラデーション用の色を決定（ロゴ色を最優先）
    // ロゴ色が1色以上あれば、それを中心にグラデーションを作成
    // 不足分はサイト色またはロゴ色のシフトで補完
    let color1: string
    let color2: string
    let color3: string

    if (filteredLogoColors.length >= 3) {
      // ロゴから3色以上取れた場合はそのまま使用
      color1 = filteredLogoColors[0]
      color2 = filteredLogoColors[1]
      color3 = filteredLogoColors[2]
    } else if (filteredLogoColors.length === 2) {
      // ロゴから2色取れた場合は、3色目をサイト色またはシフトで補完
      color1 = filteredLogoColors[0]
      color2 = filteredLogoColors[1]
      // サイト色でロゴ色と重複しない色があれば使用
      const unusedSiteColor = filteredSiteColors.find(
        sc => !filteredLogoColors.some(lc => lc.toLowerCase() === sc.toLowerCase())
      )
      color3 = unusedSiteColor || shiftHexColor(color2, 20)
    } else if (filteredLogoColors.length === 1) {
      // ロゴから1色だけ取れた場合は、その色を中心にグラデーションを作成
      color1 = filteredLogoColors[0]
      // サイト色でロゴ色と重複しない色を取得
      const unusedSiteColors = filteredSiteColors.filter(
        sc => !filteredLogoColors.some(lc => lc.toLowerCase() === sc.toLowerCase())
      )
      color2 = unusedSiteColors[0] || shiftHexColor(color1, -30)
      color3 = unusedSiteColors[1] || shiftHexColor(color1, 30)
    } else {
      // ロゴ色が取れなかった場合はサイト色を使用
      if (filteredSiteColors.length >= 3) {
        color1 = filteredSiteColors[0]
        color2 = filteredSiteColors[1]
        color3 = filteredSiteColors[2]
      } else if (filteredSiteColors.length >= 1) {
        color1 = filteredSiteColors[0]
        color2 = filteredSiteColors[1] || shiftHexColor(color1, -30)
        color3 = filteredSiteColors[2] || shiftHexColor(color1, 30)
      } else {
        // フォールバック
        color1 = '#171158'
        color2 = '#1B1723'
        color3 = '#E6A24C'
      }
    }

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
    setAutoPaletteSync(true)
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
        // 認証が必要な場合
        if (saveToHistory && data.requiresAuth) {
          alert(data.message || 'QRコードは生成されましたが、履歴を保存するにはログインが必要です。')
          setQrCode(data.qrCode)
          return { saved: false, requiresAuth: true }
        }

        // レート制限に達した場合
        if (saveToHistory && data.rateLimitExceeded) {
          alert(data.message || '履歴保存の上限に達しました。')
          setQrCode(data.qrCode)
          return { saved: false, rateLimitExceeded: true }
        }

        const paletteColors = siteColors || analysis?.colors || []

        const regenerateWithCustomization = async (updatedCustomization: Customization) => {
          const regenPayload: Record<string, unknown> = {
            url,
            design,
            customization: updatedCustomization,
            saveToHistory: false
          }
          if (logoMode === 'upload' && (inlineLogo || uploadedLogo)) {
            regenPayload.logo = inlineLogo || uploadedLogo
          } else if (logoUrl) {
            regenPayload.logoUrl = logoUrl
          }

          try {
            const regenResponse = await fetch('/api/generate-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(regenPayload)
            })
            const regenData = await regenResponse.json()
            if (regenData.success) {
              setQrCode(regenData.qrCode)
              return true
            }
          } catch (err) {
            console.error('Failed to regenerate QR with palette', err)
          }

          setQrCode(data.qrCode)
          return false
        }

        const applyPaletteFromColors = async (logoColors: string[]) => {
          setExtractedLogoColors(logoColors)
          const presets = generateColorPresets(logoColors, paletteColors)
          setColorPresets(presets)

          if (presets.length === 0) {
            setSelectedPresetId(null)
            return false
          }

          const hasExistingSelection = presets.some(preset => preset.id === selectedPresetId)
          if (!hasExistingSelection) {
            setSelectedPresetId(presets[0].id)
          }

          const shouldAutoApplyPreset = (applyLogoColors || autoPaletteSync) && presets.length > 0

          if (shouldAutoApplyPreset) {
            const firstPreset = presets[0]
            const newCustomization = applyPresetToCustomization(firstPreset, currentCustomization)
            setCustomization(newCustomization)
            setSelectedPresetId(firstPreset.id)
            return await regenerateWithCustomization(newCustomization)
          }

          return false
        }

        const paletteApplied = await applyPaletteFromColors(data.extractedLogoColors || [])

        if (!paletteApplied) {
          setQrCode(data.qrCode)
        }

        // saveToHistoryがtrueでここまで来たら保存成功
        if (saveToHistory) {
          return { saved: true, shortUrl: data.shortUrl, qrCode: data.qrCode }
        }
      } else {
        throw new Error(data.error || 'QRコード生成に失敗しました')
      }

      return { saved: false, qrCode: data.qrCode }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('QRコード生成に失敗しました')
      return { saved: false, error: true }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDesign = async (design: Design) => {
    setSelectedDesign(design)

    // autoPaletteSyncをオフにして、デザインの設定を優先
    setAutoPaletteSync(false)
    setSelectedPresetId(null)

    // デザインに紐づくカスタマイズプリセットがあれば適用
    const designPreset = design.customization || {}

    const newCustomization: Customization = {
      ...customization,
      // デザインプリセットの設定を適用
      patternStyle: designPreset.patternStyle || customization.patternStyle,
      colorStyle: designPreset.colorStyle || customization.colorStyle,
      gradientDirection: designPreset.gradientDirection || customization.gradientDirection,
      logoFrameShape: designPreset.logoFrameShape || customization.logoFrameShape,
      // カラー設定
      patternColor1: designPreset.patternColor1 || design.fgColor || customization.patternColor1,
      patternColor2: designPreset.patternColor2 || customization.patternColor2,
      patternColor3: designPreset.patternColor3 || customization.patternColor3,
    }

    setCustomization(newCustomization)
    // applyLogoColorsをfalseにして色の自動適用を防ぐ
    await generateQRCode(design, false, null, newCustomization, false)
  }

  const handlePresetSelect = async (preset: ColorPreset) => {
    setAutoPaletteSync(false)
    setSelectedPresetId(preset.id)
    const newCustomization = applyPresetToCustomization(preset, customization)
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
        setAutoPaletteSync(true)
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
      const result = await generateQRCode(selectedDesign, true, logoMode === 'upload' ? uploadedLogo : null, customization, false)

      if (result?.requiresAuth) {
        // ログインが必要な場合はログインモーダルを表示
        setShowLoginModal(true)
        return
      }

      // 保存が成功した場合のみダッシュボードに戻る
      if (result?.saved) {
        router.push('/dashboard/qr-codes')
      }
      // rateLimitExceeded の場合はalertが表示されているので、ここでは何もしない
    } catch (err) {
      console.error('Failed to save QR code', err)
      alert('QRコードの保存に失敗しました。もう一度お試しください。')
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
                    paletteColors={extractedLogoColors}
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

                {/* Logo Frame Shape */}
                <div>
                  <span className="text-xs text-[#1B1723]/50 font-semibold mb-3 block uppercase tracking-wider">ロゴ枠の形状</span>
                  <div className="flex gap-2">
                    {([
                      { key: 'rounded', label: '角丸', icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="4" y="4" width="16" height="16" rx="4" ry="4" />
                        </svg>
                      )},
                      { key: 'circle', label: '丸', icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      )},
                      { key: 'square', label: '四角', icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="4" y="4" width="16" height="16" />
                        </svg>
                      )},
                      { key: 'none', label: 'なし', icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                    ] as const).map((shape) => (
                      <button
                        key={shape.key}
                        onClick={async () => {
                          const newCustomization: Customization = {
                            ...customization,
                            logoFrameShape: shape.key
                          }
                          setCustomization(newCustomization)
                          if (selectedDesign) {
                            await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                          }
                        }}
                        className={`flex-1 flex flex-col items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border-2 transition-all ${
                          customization.logoFrameShape === shape.key
                            ? 'bg-[#171158] text-white border-[#171158]'
                            : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                        }`}
                      >
                        {shape.icon}
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Frame Color - 枠なしの場合は非表示 */}
                {customization.logoFrameShape !== 'none' && (
                  <div>
                    <span className="text-xs text-[#1B1723]/50 font-semibold mb-3 block uppercase tracking-wider">ロゴ枠の色</span>
                    <div className="flex flex-wrap gap-2">
                      {/* 自動（抽出色） */}
                      <button
                        onClick={async () => {
                          const newCustomization: Customization = {
                            ...customization,
                            logoFrameColor: 'auto'
                          }
                          setCustomization(newCustomization)
                          if (selectedDesign) {
                            await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                          }
                        }}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                          !customization.logoFrameColor || customization.logoFrameColor === 'auto'
                            ? 'bg-[#171158] text-white border-[#171158]'
                            : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                        }`}
                      >
                        {extractedLogoColors.length > 0 ? (
                          <div className="flex -space-x-1">
                            {extractedLogoColors.slice(0, 3).map((c, i) => (
                              <div key={i} className="w-4 h-4 rounded-full ring-1 ring-white" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#171158] to-[#E6A24C]" />
                        )}
                        <span>自動</span>
                      </button>

                      {/* ロゴ抽出色を個別に選択可能 */}
                      {extractedLogoColors.map((color, i) => (
                        <button
                          key={`logo-color-${i}`}
                          onClick={async () => {
                            const newCustomization: Customization = {
                              ...customization,
                              logoFrameColor: color
                            }
                            setCustomization(newCustomization)
                            if (selectedDesign) {
                              await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                            }
                          }}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                            customization.logoFrameColor === color
                              ? 'bg-[#171158] text-white border-[#171158]'
                              : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                          <span>ロゴ{i + 1}</span>
                        </button>
                      ))}

                      {/* ブラック */}
                      <button
                        onClick={async () => {
                          const newCustomization: Customization = {
                            ...customization,
                            logoFrameColor: '#000000'
                          }
                          setCustomization(newCustomization)
                          if (selectedDesign) {
                            await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                          }
                        }}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                          customization.logoFrameColor === '#000000'
                            ? 'bg-[#171158] text-white border-[#171158]'
                            : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-black" />
                        <span>黒</span>
                      </button>

                      {/* ホワイト */}
                      <button
                        onClick={async () => {
                          const newCustomization: Customization = {
                            ...customization,
                            logoFrameColor: '#ffffff'
                          }
                          setCustomization(newCustomization)
                          if (selectedDesign) {
                            await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                          }
                        }}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                          customization.logoFrameColor === '#ffffff'
                            ? 'bg-[#171158] text-white border-[#171158]'
                            : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white border border-gray-300" />
                        <span>白</span>
                      </button>
                    </div>
                  </div>
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="QRコードを保存するにはGoogleアカウントでログインしてください。"
        redirectPath="/dashboard/generate"
      />
    </div>
  )
}
