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
  const model = getGeminiModel('gemini-pro')
  const primaryColor = analysis.mainColor || analysis.designSuggestion.primaryColor
  const palette = buildPalette(primaryColor, analysis.colors)
  
  const prompt = `
あなたはQRコードデザイナーです。
以下の情報を元に、4種類のユニークで美しいQRコードデザインを提案してください。

サイト情報:
- カテゴリー: ${analysis.category}
- テーマ: ${analysis.theme}
- 雰囲気: ${analysis.mood}
- ブランドメインカラー: ${primaryColor || '抽出できず（AI推定可）'}
- カラー候補: ${palette.join(', ')}
- モチーフ: ${analysis.motif}

各デザインには以下を含めてください:
1. 名前（キャッチーな日本語、10文字以内）
2. 説明（どんな印象を与えるか、20文字以内）
3. 前景色（HEXコード）
4. 背景色（HEXコード）
5. スタイル（bold/minimal/colorful/elegant）
6. 角のスタイル（square/rounded/dots）
7. モチーフキーワード（URLの特徴を表す英語1単語: dinosaur, aquarium, ai, coffee, company など）

例: 恐竜博物館の場合
{
  "name": "ジュラシック",
  "description": "力強い恐竜の世界",
  "fgColor": "#2E8B57",
  "bgColor": "#F5F5DC",
  "style": "bold",
  "cornerStyle": "dots"
}

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
    const designs: Design[] = rawDesigns.map((design, index) => ({
      id: `design-${index + 1}`,
      name: design.name,
      description: design.description,
      fgColor: design.fgColor || primaryColor || '#000000',
      bgColor: design.bgColor || '#FFFFFF',
      style: design.style,
      cornerStyle: design.cornerStyle,
      motifKeyword: deriveMotifKeyword(analysis, design.motifKeyword)
    }))
    
    return designs
  } catch (error) {
    console.error('Error generating designs:', error)
    // フォールバック: デフォルトデザインを返す
    const fallbackMotif = deriveMotifKeyword(analysis)
    const fallbackPrimary = primaryColor || '#000000'
    return [
      {
        id: 'design-1',
        name: 'クラシック',
        description: 'シンプルで使いやすい',
        fgColor: fallbackPrimary,
        bgColor: '#FFFFFF',
        style: 'minimal',
        cornerStyle: 'square',
        motifKeyword: fallbackMotif
      },
      {
        id: 'design-2',
        name: 'モダン',
        description: '洗練されたデザイン',
        fgColor: fallbackPrimary,
        bgColor: '#FFFFFF',
        style: 'minimal',
        cornerStyle: 'rounded',
        motifKeyword: fallbackMotif
      }
    ]
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
