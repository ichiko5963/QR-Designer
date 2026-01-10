'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import URLInput from './components/URLInput'
import DesignGrid from './components/DesignGrid'
import QRPreview from './components/QRPreview'
import AuthButton from './components/AuthButton'
import LoginModal from './components/LoginModal'
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

interface LogoFrameColorOption {
  id: string
  name: string
  color: string | 'auto' | 'gradient'
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
  const [extractedLogoColors, setExtractedLogoColors] = useState<string[]>([])
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [autoPaletteSync, setAutoPaletteSync] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const router = useRouter()

  // ログインチェックはAuthButtonコンポーネントで処理されるため、ここでは削除
  // これにより、ログイン画面（AuthButton）が常に表示される

  // ユーザー状態を取得
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user ? { id: user.id, email: user.email ?? undefined } : null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ログイン後に保留中のQRコードを自動保存
  useEffect(() => {
    const savePendingQR = async () => {
      if (!currentUser) return

      const pendingData = localStorage.getItem('qr-pending-save')
      if (!pendingData) return

      try {
        const pending = JSON.parse(pendingData)
        localStorage.removeItem('qr-pending-save') // 先に削除して重複保存を防ぐ

        // 保存APIを呼び出す
        const response = await fetch('/api/generate-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: pending.url,
            design: pending.design,
            customization: pending.customization,
            logo: pending.logo,
            logoUrl: pending.logoUrl,
            saveToHistory: true
          })
        })

        const result = await response.json()
        if (result.success && result.saved) {
          // 保存成功 - finalページへ遷移
          localStorage.setItem(
            'qr-final',
            JSON.stringify({
              qrCode: result.qrCode,
              design: pending.design,
              customization: pending.customization,
              originalUrl: pending.url,
              shortUrl: result.shortUrl
            })
          )
          router.push('/final')
        }
      } catch (err) {
        console.error('Failed to save pending QR:', err)
      }
    }

    savePendingQR()
  }, [currentUser, router])

  // 状態を完全にリセット
  const handleReset = () => {
    setUrl('')
    setAnalysis(null)
    setDesigns([])
    setSelectedDesign(null)
    setCustomization(defaultCustomization)
    setQrCode(null)
    setIsLoading(false)
    setLogoUrl(null)
    setLogoMode('auto')
    setUploadedLogo(null)
    setExtractedLogoColors([])
    setColorPresets([])
    setSelectedPresetId(null)
    setAutoPaletteSync(true)
    setResetKey(prev => prev + 1)
  }

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

    // グラデーションバリエーション（最初に配置）
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

    // グラデーションを最初に追加
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

    // 単色プリセットを追加（グラデーションの後）
    const usedSolidColors = new Set<string>()

    // ロゴカラーから単色を追加
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

    // サイトカラーから単色を追加
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

  // 認証チェックとリダイレクトはAuthButtonコンポーネントで処理される

  const handleAnalyze = async (inputUrl: string) => {
    // 全状態を確実にリセット
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

    // 生成開始時に古いQRコードをクリア（ちらつき防止）
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

        // APIレスポンスを返す（履歴保存時のrequiresAuthやshortUrlを取得するため）
        return data
      } else {
        throw new Error(data.error || 'QRコード生成に失敗しました')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('QRコード生成に失敗しました')
      return null
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

  const handleConfirm = async () => {
    if (!qrCode) return

    // 未ログインの場合はペンディングデータを保存してログインモーダルを表示
    if (!currentUser) {
      // ログイン後に自動保存するためのデータを保存
      localStorage.setItem('qr-pending-save', JSON.stringify({
        url,
        design: selectedDesign,
        customization,
        logo: logoMode === 'upload' ? uploadedLogo : null,
        logoUrl: logoMode === 'auto' ? logoUrl : null
      }))
      setShowLoginModal(true)
      return
    }

    try {
      // ログイン済みの場合は履歴保存を実行
      let finalQrCode = qrCode
      let shortUrlData = null
      if (selectedDesign) {
        const result = await generateQRCode(selectedDesign, true, logoMode === 'upload' ? uploadedLogo : null, customization, false)
        if (result?.requiresAuth) {
          setShowLoginModal(true)
          return
        }
        // APIから返されたQRコードと短縮URLを使用
        finalQrCode = result?.qrCode || qrCode
        shortUrlData = result?.shortUrl || null
      }

      localStorage.setItem(
        'qr-final',
        JSON.stringify({
          qrCode: finalQrCode,
          design: selectedDesign,
          customization,
          originalUrl: url,
          shortUrl: shortUrlData
        })
      )
      router.push('/final')
    } catch (err) {
      console.error('Failed to save QR code', err)
      alert('QRコードの保存に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-[#171158]/5 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="QR Code Designer"
                width={44}
                height={44}
                className="object-contain"
              />
              <div className="text-left">
                <h1 className="text-lg font-bold text-[#1B1723] tracking-tight">
                  QR Code Designer
                </h1>
                <p className="text-xs text-[#171158]/60">
                  AI-Powered QR Generator
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                ホーム
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                プラン一覧
              </Link>
              <Link
                href="/legal/tokushoho"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                特定商取引法
              </Link>
            </nav>

            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!designs.length && (
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#171158]/[0.02] to-[#E6A24C]/[0.05]">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-[#E6A24C]/20 via-[#E6A24C]/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#171158]/20 via-[#171158]/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#171158]/5 via-transparent to-transparent rounded-full" />
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-[#E6A24C]/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#171158]/10 to-transparent rounded-full blur-2xl" />
          </div>

          <div className="relative py-20 px-6">
            <div className="max-w-5xl mx-auto">
              {/* Hero content */}
              <div className="text-center mb-16">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#171158]/5 to-[#E6A24C]/10 rounded-full mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#E6A24C]" />
                  <span className="text-sm font-medium text-[#171158]">
                    AIがURLを解析し、最適なQRコードを自動生成
                  </span>
                </div>

                {/* Main heading */}
                <h2 className="text-5xl md:text-6xl font-bold text-[#1B1723] mb-6 leading-tight tracking-tight">
                  URLを入力するだけで
                  <br />
                  <span className="bg-gradient-to-r from-[#171158] via-[#171158] to-[#E6A24C] bg-clip-text text-transparent">
                    ブランドに最適なQRコードを生成
                  </span>
                </h2>

                {/* Description */}
                <p className="text-lg text-[#1B1723]/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                  サイトのコンテンツ・カラー・雰囲気をAIが自動解析し、
                  あなたのブランドにぴったりのデザインを瞬時に提案します。
                </p>

                {/* Process flow */}
                <div className="flex items-center justify-center gap-4 mb-12">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#171158]/5 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-[#171158]" />
                    <span className="text-sm text-[#171158] font-medium">URL入力</span>
                  </div>
                  <svg className="w-4 h-4 text-[#1B1723]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#171158]/5 rounded-full">
                    <span className="text-sm text-[#171158] font-medium">AIがURLを解析</span>
                  </div>
                  <svg className="w-4 h-4 text-[#1B1723]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#E6A24C]/10 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-[#E6A24C]" />
                    <span className="text-sm text-[#E6A24C] font-medium">QR生成</span>
                  </div>
                </div>

                {/* URL Input */}
                <div className="max-w-2xl mx-auto">
                  <URLInput key={`hero-${resetKey}`} onAnalyze={handleAnalyze} isLoading={isLoading} />
                </div>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    title: 'AI自動解析',
                    desc: 'URLの内容をAIが理解し、サイトのテーマや雰囲気に合わせたデザインを自動生成',
                    color: '#171158'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    ),
                    title: 'ブランドカラー抽出',
                    desc: 'サイトやロゴから自動でブランドカラーを検出し、QRコードに美しく反映',
                    color: '#E6A24C'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    title: 'ロゴ自動検出',
                    desc: 'ホームページからAIがロゴを探し、QRコード中央に美しく自動配置',
                    color: '#1B1723'
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#171158]/5 p-6 shadow-lg shadow-[#171158]/5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4"
                      style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-[#1B1723] text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#1B1723]/60 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Animated Demo Section */}
              <div className="bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-3xl p-8 md:p-12 text-white mb-16 overflow-hidden">
                <h3 className="text-2xl font-bold mb-4 text-center">AIが瞬時にQRコードを生成</h3>
                <p className="text-white/70 text-center mb-10 max-w-xl mx-auto">
                  URLを入力するだけで、AIがサイトを解析し、あなたにぴったりのQRコードを自動生成します
                </p>

                {/* Animated Flow */}
                <div className="relative max-w-4xl mx-auto">
                  {/* Connection Lines with flowing dots */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#E6A24C]/0 via-[#E6A24C]/30 to-[#E6A24C]/0 -translate-y-1/2 hidden md:block" />

                  {/* Flowing data dots */}
                  <div className="absolute top-1/2 left-[20%] -translate-y-1/2 hidden md:flex gap-3">
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-1" />
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-2" />
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-3" />
                  </div>
                  <div className="absolute top-1/2 right-[20%] -translate-y-1/2 hidden md:flex gap-3">
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-1" />
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-2" />
                    <div className="w-2 h-2 bg-[#E6A24C] rounded-full animate-bounce-dot-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Step 1: URL Input */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
                          <div className="opacity-0 animate-pop-1">
                            <svg className="w-12 h-12 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#E6A24C] rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      </div>
                      <h4 className="font-bold text-lg mb-2">URLを入力</h4>
                      <p className="text-white/60 text-sm">サイトのURLをペーストするだけ</p>
                      <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-white/50 font-mono">
                        https://example.com
                      </div>
                    </div>

                    {/* Step 2: AI Analysis */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
                          <div className="relative opacity-0 animate-pop-2">
                            {/* AI Sparkle Diamond Star Icon */}
                            <svg className="w-12 h-12 text-[#E6A24C]" viewBox="0 0 24 24" fill="currentColor">
                              {/* Main diamond star shape */}
                              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
                            </svg>
                            {/* Sparkle particles around the star */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute top-0 left-1/4 w-1.5 h-1.5 bg-[#E6A24C] rounded-full animate-ping" style={{ animationDelay: '0s' }} />
                              <div className="absolute top-1/4 right-0 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[#E6A24C] rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#E6A24C] rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      </div>
                      <h4 className="font-bold text-lg mb-2">AIが解析</h4>
                      <p className="text-white/60 text-sm">コンテンツ・カラー・ロゴを自動検出</p>
                      <div className="mt-4 flex gap-2 justify-center">
                        <span className="px-3 py-1 bg-[#E6A24C]/20 rounded-full text-xs text-[#E6A24C]">カラー抽出</span>
                        <span className="px-3 py-1 bg-[#E6A24C]/20 rounded-full text-xs text-[#E6A24C]">ロゴ検出</span>
                      </div>
                    </div>

                    {/* Step 3: QR Generation */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                          <svg className="w-12 h-12 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#E6A24C] rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                      </div>
                      <h4 className="font-bold text-lg mb-2">QR完成</h4>
                      <p className="text-white/60 text-sm">ブランドに最適なデザインを生成</p>
                      <div className="mt-4 flex gap-2 justify-center">
                        <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400">PNG</span>
                        <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400">SVG</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-[#1B1723] text-center mb-8">使い方は簡単3ステップ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      step: '01',
                      title: 'URLを入力',
                      desc: 'QRコード化したいウェブサイトのURLを入力するだけ。特別な準備は不要です。'
                    },
                    {
                      step: '02',
                      title: 'デザインを選択',
                      desc: 'AIが生成した複数のデザイン候補から、お好みのものを選択。色やスタイルもカスタマイズ可能。'
                    },
                    {
                      step: '03',
                      title: 'ダウンロード',
                      desc: '高解像度のPNG/SVG形式でダウンロード。印刷物からデジタルまで幅広く使えます。'
                    }
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -top-4 -left-4 z-10 w-12 h-12 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#E6A24C]/30">
                        {item.step}
                      </div>
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-[#171158]/5 p-6 pt-10 shadow-lg shadow-[#171158]/5">
                        <h4 className="font-bold text-[#1B1723] text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-[#1B1723]/60 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Differentiation */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#171158]/5 p-8 md:p-12 shadow-xl shadow-[#171158]/5">
                <h3 className="text-2xl font-bold text-[#1B1723] text-center mb-8">従来ツールとの違い</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#171158]/10">
                        <th className="text-left py-4 px-4 font-semibold text-[#1B1723]">機能</th>
                        <th className="text-center py-4 px-4 font-semibold text-[#1B1723]/50">従来ツール</th>
                        <th className="text-center py-4 px-4 font-bold text-[#E6A24C]">QR Code Designer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: 'デザイン生成', old: '手動カスタマイズ', new: 'AIが自動最適化' },
                        { feature: 'コンテンツ理解', old: 'なし', new: 'URLの中身を解析' },
                        { feature: 'カラー抽出', old: '手動入力', new: 'ロゴから自動抽出' },
                        { feature: 'ロゴ配置', old: '手動調整', new: '自動検出・配置' },
                        { feature: 'デザイン提案', old: '1-2種類', new: '4種類を自動生成' }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#171158]/5">
                          <td className="py-4 px-4 font-medium text-[#1B1723]">{row.feature}</td>
                          <td className="py-4 px-4 text-center text-[#1B1723]/50">{row.old}</td>
                          <td className="py-4 px-4 text-center text-[#171158] font-medium">{row.new}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Preview Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#171158]/5 p-8 md:p-12 shadow-xl shadow-[#171158]/5">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-[#1B1723] mb-3">シンプルな料金プラン</h3>
                  <p className="text-[#1B1723]/60">無料でも無制限。もっと使いたい方にはお手頃な有料プランへ。パーソナルが人気です。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Free */}
                  <div className="bg-gradient-to-br from-[#171158]/5 to-transparent rounded-2xl p-6 border border-[#171158]/10">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-[#1B1723] text-lg">Free</h4>
                      <p className="text-3xl font-bold text-[#1B1723] mt-2">無料</p>
                      <p className="text-xs text-[#1B1723]/50 mt-1">Googleログインで開始</p>
                    </div>
                    <ul className="space-y-2 text-sm text-[#1B1723]/70">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        無制限QR生成
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        1024px解像度
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        履歴保存
                      </li>
                    </ul>
                  </div>

                  {/* Personal */}
                  <div className="bg-gradient-to-br from-[#171158]/5 to-transparent rounded-2xl p-6 border border-[#171158]/10">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-[#1B1723] text-lg">Personal</h4>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-[#1B1723]">¥499</span>
                        <span className="text-[#1B1723]/50 text-sm">/月</span>
                      </div>
                      <p className="text-xs text-[#1B1723]/50 mt-1">個人クリエイター向け</p>
                    </div>
                    <ul className="space-y-2 text-sm text-[#1B1723]/70">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        2048px解像度
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        テンプレート10件
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        スマートダッシュボード
                      </li>
                    </ul>
                  </div>

                  {/* Pro */}
                  <div className="relative bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl p-6 text-white">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#E6A24C] text-white text-xs font-bold rounded-full">
                      人気
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-lg">Pro</h4>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">¥980</span>
                        <span className="text-white/50 text-sm">/月</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">ビジネス利用に最適</p>
                    </div>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        4096px解像度
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        SVG/PDF出力
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        動的QR・スキャン分析
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#171158] bg-[#171158]/10 rounded-xl hover:bg-[#171158]/20 transition-colors"
                  >
                    すべてのプランを見る
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Google Auth Promotion Section */}
              <div className="bg-gradient-to-br from-[#E6A24C]/10 via-white to-[#171158]/5 rounded-3xl p-8 md:p-12 border border-[#E6A24C]/20">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E6A24C]/10 rounded-full mb-6">
                    <svg className="w-5 h-5 text-[#E6A24C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-semibold text-[#E6A24C]">完全無料</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#1B1723] mb-4">
                    Googleアカウントで
                    <span className="text-[#E6A24C]">無制限</span>
                    にQR生成
                  </h3>
                  <p className="text-[#1B1723]/60 max-w-xl mx-auto">
                    無料のGoogleログインだけで、すべてのQRコードをダッシュボードで一元管理。
                    履歴保存・再編集・再ダウンロードが無制限で利用できます。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ),
                      title: '無制限生成',
                      desc: '何度でもQRコードを生成可能'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      ),
                      title: '履歴保存',
                      desc: 'ダッシュボードで一覧管理'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      ),
                      title: 'WiFi QR',
                      desc: '自宅やオフィスのWiFi共有'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      ),
                      title: '短縮URL',
                      desc: 'オリジナルの短縮リンク'
                    }
                  ].map((feature, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-[#171158]/5 shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-xl flex items-center justify-center text-white mb-3">
                        {feature.icon}
                      </div>
                      <h4 className="font-bold text-[#1B1723] mb-1">{feature.title}</h4>
                      <p className="text-sm text-[#1B1723]/60">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-sm text-[#1B1723]/50 mb-4">
                    ログインなしでも月2回まで無料で生成できます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && !qrCode && (
        <div className="py-24">
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="text-center">
              <p className="text-[#1B1723] font-semibold">サイトを解析中...</p>
              <p className="text-sm text-[#171158]/60 mt-1">🤖がコンテンツを理解しています</p>
            </div>
          </div>
        </div>
      )}

      {/* Design Section */}
      {designs.length > 0 && (
        <main className="max-w-7xl mx-auto px-6 py-10">
          {/* Compact URL Input */}
          <div className="mb-10">
            <URLInput key={`design-${resetKey}`} onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Preview Panel */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              {selectedDesign && (
                <QRPreview
                  qrCode={qrCode}
                  design={selectedDesign}
                  customization={customization}
                  onConfirm={handleConfirm}
                />
              )}
            </div>

            {/* Controls Panel */}
            <div className="lg:col-span-7 space-y-8">
              {/* Design & Color Card - Merged */}
              <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
                  <h3 className="text-xl font-bold text-[#1B1723]">デザイン & カラー</h3>
                  <p className="text-sm text-[#1B1723]/60 mt-1">
                    AIが生成したデザインと抽出したカラーから選択
                  </p>
                </div>

                <div className="p-8 space-y-8">
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
                                className={`w-12 h-12 rounded-xl shadow-md transition-all ${
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
                                className={`w-12 h-12 rounded-xl shadow-md transition-all ${
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
              <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
                  <h3 className="text-xl font-bold text-[#1B1723]">ロゴ設定</h3>
                  <p className="text-sm text-[#1B1723]/60 mt-1">
                    ロゴの取得方法と枠のスタイルを設定
                  </p>
                </div>

                <div className="p-8 space-y-6">
                  {/* Logo Mode */}
                  <div className="flex gap-3">
                    {(['auto', 'upload'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLogoMode(mode)}
                        className={`flex-1 px-5 py-3.5 text-sm font-semibold rounded-xl border-2 transition-all ${
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
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#171158]/20 rounded-2xl cursor-pointer hover:border-[#E6A24C]/50 hover:bg-[#E6A24C]/5 transition-all">
                      <svg className="w-10 h-10 text-[#171158]/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-[#1B1723]/60 font-medium">クリックしてロゴをアップロード</span>
                      <span className="text-xs text-[#1B1723]/40 mt-1">PNG, JPG, SVG (1:1推奨)</span>
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
                          className={`flex-1 flex flex-col items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl border-2 transition-all ${
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
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
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
                            className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
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
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                            customization.logoFrameColor === '#000000'
                              ? 'bg-[#171158] text-white border-[#171158]'
                              : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-black" />
                          <span>ブラック</span>
                        </button>

                        {/* QR連動 */}
                        <button
                          onClick={async () => {
                            const syncColor = customization.patternColor1 || '#171158'
                            const newCustomization: Customization = {
                              ...customization,
                              logoFrameColor: syncColor
                            }
                            setCustomization(newCustomization)
                            if (selectedDesign) {
                              await generateQRCode(selectedDesign, false, logoMode === 'upload' ? uploadedLogo : null, newCustomization)
                            }
                          }}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                            customization.logoFrameColor && customization.logoFrameColor !== 'auto' && customization.logoFrameColor !== '#000000' && customization.logoFrameColor !== '#ffffff' && !extractedLogoColors.includes(customization.logoFrameColor) && customization.logoFrameColor === customization.patternColor1
                              ? 'bg-[#171158] text-white border-[#171158]'
                              : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customization.patternColor1 || '#171158' }} />
                          <span>QR連動</span>
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
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition-all flex items-center gap-2 ${
                            customization.logoFrameColor === '#ffffff'
                              ? 'bg-[#171158] text-white border-[#171158]'
                              : 'bg-white text-[#1B1723]/60 border-[#171158]/10 hover:border-[#171158]/30'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white border border-gray-300" />
                          <span>ホワイト</span>
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
                            className="w-8 h-8 rounded-lg shadow-md ring-2 ring-white"
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
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-[#171158]/5 mt-24 bg-gradient-to-b from-white to-[#171158]/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="QR Code Designer"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-sm font-medium text-[#1B1723]/70">QR Code Designer</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#1B1723]/50">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-[#171158] to-[#E6A24C] bg-clip-text text-transparent">AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="QRコードを保存するにはGoogleアカウントでログインしてください。ログイン後、履歴として管理できます。"
        redirectPath="/dashboard/generate"
      />
    </div>
  )
}
