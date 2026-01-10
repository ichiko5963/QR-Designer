import { getGeminiModel } from './gemini'
import type { URLAnalysis } from '@/types/analysis'
import type { Metadata } from '@/lib/scraper/cheerio'

export async function analyzeURL(
  htmlSnippet: string,
  metadata: Metadata
): Promise<URLAnalysis> {
  const model = getGeminiModel()

  const providedMainColor = sanitizeHex(metadata.mainColor)
  
  const prompt = `
あなたはウェブサイトのデザイン分析の専門家です。
与えられたウェブサイトのHTMLスニペットとメタデータから、最適なQRコードデザインを提案してください。

HTMLスニペット（最初の20行）:
${htmlSnippet}

メタデータ:
- タイトル: ${metadata.title}
- 説明: ${metadata.description}
- 抽出されたメインカラー: ${providedMainColor || 'なし（見つからない場合は内容から推定）'}

分析項目:
1. 業種・カテゴリー（教育、飲食、テクノロジーなど）
2. テーマ・雰囲気（モダン、レトロ、ナチュラルなど）
3. 推奨カラー（3色のHEXコード）
4. デザインモチーフ（恐竜、コーヒー、回路など）
5. 抽出されたメインカラーがある場合は、デザイン案のprimaryColorに必ず反映してください

出力形式: JSON
{
  "category": "教育・文化",
  "theme": "prehistoric",
  "mood": "educational, adventurous",
  "colors": ["#2E8B57", "#228B22", "#6B8E23"],
  "motif": "dinosaur, fossil, nature",
  "designSuggestion": {
    "primaryColor": "#2E8B57",
    "accentColor": "#8B4513",
    "style": "bold and organic"
  }
}

JSONのみを出力してください。
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSONを抽出（```json で囲まれている場合がある）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
    
    const rawAnalysis = JSON.parse(jsonText.trim())
    
    const primaryColor = sanitizeHex(
      providedMainColor ||
        rawAnalysis?.designSuggestion?.primaryColor ||
        rawAnalysis?.colors?.[0] ||
        ''
    ) || '#000000'

    const accentColor = sanitizeHex(
      rawAnalysis?.designSuggestion?.accentColor ||
        adjustColor(primaryColor, -25)
    )

    const normalizedColors = buildColorPalette(primaryColor, rawAnalysis?.colors)
    
    return {
      url: '', // 呼び出し元で設定
      title: metadata.title,
      description: metadata.description,
      favicon: metadata.favicon,
      ogImage: metadata.ogImage,
      mainColor: primaryColor,
      colors: normalizedColors,
      category: rawAnalysis.category,
      theme: rawAnalysis.theme,
      mood: rawAnalysis.mood,
      motif: rawAnalysis.motif,
      designSuggestion: {
        primaryColor,
        accentColor: accentColor || adjustColor(primaryColor, -20),
        style: rawAnalysis?.designSuggestion?.style || 'minimal'
      }
    }
  } catch (error) {
    console.error('Error analyzing URL:', error)
    // フォールバック: デフォルトの分析結果を返す
    const primaryColor = providedMainColor || '#000000'
    return {
      url: '',
      title: metadata.title,
      description: metadata.description,
      favicon: metadata.favicon,
      ogImage: metadata.ogImage,
      mainColor: primaryColor,
      category: 'その他',
      theme: 'modern',
      mood: 'professional',
      colors: buildColorPalette(primaryColor, ['#000000', '#666666', '#CCCCCC']),
      motif: 'geometric',
      designSuggestion: {
        primaryColor,
        accentColor: adjustColor(primaryColor, -20),
        style: 'minimal'
      }
    }
  }
}

function sanitizeHex(color: string | undefined, fallback = ''): string {
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

function buildColorPalette(primary: string, suggested?: string[]): string[] {
  const palette = new Set<string>()
  if (primary) palette.add(primary)
  if (Array.isArray(suggested)) {
    suggested.forEach((color) => {
      const normalized = sanitizeHex(color)
      if (normalized) palette.add(normalized)
    })
  }
  // パレットが不足する場合は補助色を追加
  if (palette.size === 1) {
    palette.add(adjustColor(primary, -20))
    palette.add(adjustColor(primary, 20))
  }
  return Array.from(palette).slice(0, 3)
}

