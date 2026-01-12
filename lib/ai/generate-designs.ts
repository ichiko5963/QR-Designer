import { getGeminiModel } from './gemini'
import { deriveMotifKeyword } from '@/lib/motif'
import type { URLAnalysis } from '@/types/analysis'
import type { Design } from '@/types/design'

interface AIDesignResponse {
  name: string
  description: string
  fgColor: string
  bgColor: string
  style: Design['style']
  cornerStyle: Design['cornerStyle']
  motifKeyword?: string
}

export async function generateDesigns(analysis: URLAnalysis): Promise<Design[]> {
  const model = getGeminiModel()
  const primaryColor = analysis.mainColor || analysis.designSuggestion.primaryColor
  const palette = buildPalette(primaryColor, analysis.colors)
  const motifKeyword = deriveMotifKeyword(analysis)
  
  const prompt = `
あなたはQRコードデザイナーです。
以下の情報を元に、4種類のQRコードデザインを提案してください。

サイト情報:
- ブランドメインカラー: ${primaryColor || '抽出できず（AI推定可）'}
- カラー候補: ${palette.join(', ')}

各デザインには以下を含めてください（4案すべてで色・スタイル・角が被らないこと）:
1. 名前（色や特徴を表すシンプルな名前。例: "ネイビー", "グラデーション", "モノクロ", "パステル", "ダーク", "ライト"など）
2. 説明（色の特徴のみ。例: "深い青で落ち着いた印象", "明るい緑でポップに"など、15文字以内）
3. 前景色（HEXコード）
4. 背景色（HEXコード）
5. スタイル（bold/minimal/colorful/elegant をばらけさせる）
6. 角のスタイル（square/rounded/dots をばらけさせる）

重要: 名前は「電脳」「迷宮」「神秘」などの抽象的・詩的な表現を避け、色の名前や視覚的特徴のみで命名すること。

例:
[
  {"name": "ダークブルー", "description": "深い青で落ち着いた印象", "fgColor": "#1A365D", "bgColor": "#FFFFFF", "style": "minimal", "cornerStyle": "square"},
  {"name": "グラデーション", "description": "青から緑へ滑らかに変化", "fgColor": "#2E8B57", "bgColor": "#FFFFFF", "style": "colorful", "cornerStyle": "dots"}
]

JSON配列で出力してください。4つのデザインを含めてください。
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSONを抽出
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
    
    const rawDesigns: AIDesignResponse[] = JSON.parse(jsonText.trim())
    const normalized = rawDesigns.map((design, index) =>
      normalizeDesign(design, `design-${index + 1}`, analysis, primaryColor, motifKeyword)
    )

    return ensureFourDesigns(normalized, primaryColor, palette, motifKeyword, analysis)
  } catch (error) {
    console.error('Error generating designs:', error)
    // フォールバック: デフォルトデザインを返す
    return buildFallbackDesigns(primaryColor, palette, motifKeyword, analysis)
  }
}

function buildPalette(primaryColor?: string, colors?: string[]): string[] {
  const set = new Set<string>()
  if (primaryColor) set.add(primaryColor)
  colors?.forEach((c) => {
    if (c) set.add(c)
  })
  return Array.from(set).slice(0, 4)
}

function normalizeDesign(
  design: AIDesignResponse,
  id: string,
  analysis: URLAnalysis,
  primaryColor?: string,
  motif?: string
): Design {
  const safePrimary = sanitizeHex(primaryColor, '#000000')
  return {
    id,
    name: design.name || 'デザイン',
    description: design.description || analysis.theme || 'AI提案デザイン',
    fgColor: sanitizeHex(design.fgColor, safePrimary),
    bgColor: sanitizeHex(design.bgColor, '#FFFFFF'),
    style: design.style || 'minimal',
    cornerStyle: design.cornerStyle || 'square',
    motifKeyword: deriveMotifKeyword(analysis, design.motifKeyword || motif)
  }
}

function ensureFourDesigns(
  designs: Design[],
  primaryColor: string | undefined,
  palette: string[],
  motif: string,
  analysis: URLAnalysis
): Design[] {
  const unique: Design[] = []
  const seen = new Set<string>()

  const pushIfNew = (design: Design) => {
    const key = `${design.name.toLowerCase()}|${design.fgColor}|${design.bgColor}|${design.cornerStyle}|${design.style}`
    if (seen.has(key)) return
    seen.add(key)
    unique.push(design)
  }

  designs.forEach(pushIfNew)

  const fillers = buildFallbackDesigns(primaryColor, palette, motif, analysis)
  for (const filler of fillers) {
    if (unique.length >= 4) break
    pushIfNew(filler)
  }

  return unique.slice(0, 4)
}

function buildFallbackDesigns(
  primaryColor: string | undefined,
  palette: string[],
  motif: string,
  _analysis: URLAnalysis
): Design[] {
  const base = sanitizeHex(primaryColor, palette[0] || '#0B2F4A')
  const color2 = sanitizeHex(palette[1], adjustColor(base, -28))
  const color3 = sanitizeHex(palette[2], adjustColor(base, 24))

  const candidates: Design[] = [
    {
      id: 'design-1',
      name: 'グラデーション斜め',
      description: '斜めグラデーションで動きのある印象',
      fgColor: base,
      bgColor: '#FFFFFF',
      style: 'colorful',
      cornerStyle: 'dots',
      motifKeyword: motif,
      customization: {
        patternStyle: 'dot',
        colorStyle: 'gradient',
        gradientDirection: 'to-br',
        logoFrameShape: 'circle',
        patternColor1: base,
        patternColor2: color2,
        patternColor3: color3
      }
    },
    {
      id: 'design-2',
      name: 'グラデーション放射',
      description: '中心から広がる放射グラデーション',
      fgColor: base,
      bgColor: '#FFFFFF',
      style: 'elegant',
      cornerStyle: 'rounded',
      motifKeyword: motif,
      customization: {
        patternStyle: 'square',
        colorStyle: 'gradient',
        gradientDirection: 'radial',
        logoFrameShape: 'rounded',
        patternColor1: base,
        patternColor2: color2,
        patternColor3: color3
      }
    },
    {
      id: 'design-3',
      name: 'シンプル黒',
      description: '定番の黒で高い視認性',
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      style: 'minimal',
      cornerStyle: 'square',
      motifKeyword: motif,
      customization: {
        patternStyle: 'square',
        colorStyle: 'gradient',
        logoFrameShape: 'square',
        patternColor1: '#000000',
        patternColor2: '#000000',
        patternColor3: '#000000'
      }
    },
    {
      id: 'design-4',
      name: 'ブランドカラー',
      description: 'サイトの色を素直に反映',
      fgColor: base,
      bgColor: '#FFFFFF',
      style: 'bold',
      cornerStyle: 'rounded',
      motifKeyword: motif,
      customization: {
        patternStyle: 'round',
        colorStyle: 'gradient',
        logoFrameShape: 'rounded',
        patternColor1: base,
        patternColor2: base,
        patternColor3: base
      }
    }
  ]

  return candidates
}

function sanitizeHex(color?: string, fallback = '#000000') {
  if (!color) return fallback
  const match = color.match(/#[0-9a-f]{3,8}/i)
  if (!match) return fallback
  let hex = match[0].replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (hex.length < 6) {
    hex = hex.padEnd(6, '0')
  }
  return `#${hex.slice(0, 6).toUpperCase()}`
}

function adjustColor(color: string, amount: number) {
  const normalized = sanitizeHex(color, '#888888').replace('#', '')
  const num = parseInt(normalized, 16)
  const r = clamp(((num >> 16) & 0xff) + amount, 0, 255)
  const g = clamp(((num >> 8) & 0xff) + amount, 0, 255)
  const b = clamp((num & 0xff) + amount, 0, 255)
  const hex = (r << 16) | (g << 8) | b
  return `#${hex.toString(16).padStart(6, '0')}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
