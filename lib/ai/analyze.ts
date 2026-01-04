import { getGeminiModel } from './gemini'
import type { URLAnalysis } from '@/types/analysis'
import type { Metadata } from '@/lib/scraper/cheerio'

export async function analyzeURL(
  htmlSnippet: string,
  metadata: Metadata
): Promise<URLAnalysis> {
  const model = getGeminiModel('gemini-pro')
  
  const prompt = `
あなたはウェブサイトのデザイン分析の専門家です。
与えられたウェブサイトのHTMLスニペットとメタデータから、最適なQRコードデザインを提案してください。

HTMLスニペット（最初の20行）:
${htmlSnippet}

メタデータ:
- タイトル: ${metadata.title}
- 説明: ${metadata.description}

分析項目:
1. 業種・カテゴリー（教育、飲食、テクノロジーなど）
2. テーマ・雰囲気（モダン、レトロ、ナチュラルなど）
3. 推奨カラー（3色のHEXコード）
4. デザインモチーフ（恐竜、コーヒー、回路など）

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
    
    const analysis = JSON.parse(jsonText.trim())
    
    return {
      url: '', // 呼び出し元で設定
      title: metadata.title,
      description: metadata.description,
      favicon: metadata.favicon,
      ogImage: metadata.ogImage,
      ...analysis
    }
  } catch (error) {
    console.error('Error analyzing URL:', error)
    // フォールバック: デフォルトの分析結果を返す
    return {
      url: '',
      title: metadata.title,
      description: metadata.description,
      favicon: metadata.favicon,
      ogImage: metadata.ogImage,
      category: 'その他',
      theme: 'modern',
      mood: 'professional',
      colors: ['#000000', '#666666', '#CCCCCC'],
      motif: 'geometric',
      designSuggestion: {
        primaryColor: '#000000',
        accentColor: '#666666',
        style: 'minimal'
      }
    }
  }
}

