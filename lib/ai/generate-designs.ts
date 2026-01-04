import { getGeminiModel } from './gemini'
import type { URLAnalysis } from '@/types/analysis'
import type { Design } from '@/types/design'

export async function generateDesigns(analysis: URLAnalysis): Promise<Design[]> {
  const model = getGeminiModel('gemini-pro')
  
  const prompt = `
あなたはQRコードデザイナーです。
以下の情報を元に、4種類のユニークで美しいQRコードデザインを提案してください。

サイト情報:
- カテゴリー: ${analysis.category}
- テーマ: ${analysis.theme}
- 雰囲気: ${analysis.mood}
- カラー: ${analysis.colors.join(', ')}
- モチーフ: ${analysis.motif}

各デザインには以下を含めてください:
1. 名前（キャッチーな日本語、10文字以内）
2. 説明（どんな印象を与えるか、20文字以内）
3. 前景色（HEXコード）
4. 背景色（HEXコード）
5. スタイル（bold/minimal/colorful/elegant）
6. 角のスタイル（square/rounded/dots）

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
    
    const designs: Design[] = JSON.parse(jsonText.trim()).map((design: any, index: number) => ({
      id: `design-${index + 1}`,
      name: design.name,
      description: design.description,
      fgColor: design.fgColor,
      bgColor: design.bgColor,
      style: design.style,
      cornerStyle: design.cornerStyle
    }))
    
    return designs
  } catch (error) {
    console.error('Error generating designs:', error)
    // フォールバック: デフォルトデザインを返す
    return [
      {
        id: 'design-1',
        name: 'クラシック',
        description: 'シンプルで使いやすい',
        fgColor: '#000000',
        bgColor: '#FFFFFF',
        style: 'minimal',
        cornerStyle: 'square'
      },
      {
        id: 'design-2',
        name: 'モダン',
        description: '洗練されたデザイン',
        fgColor: analysis.designSuggestion.primaryColor,
        bgColor: '#FFFFFF',
        style: 'minimal',
        cornerStyle: 'rounded'
      }
    ]
  }
}

