export interface URLAnalysis {
  url: string
  title: string
  description: string
  favicon?: string
  ogImage?: string
  /**
   * Webサイトから抽出したメインカラー（存在しない場合はAI推奨色で補完）
   */
  mainColor?: string
  category: string
  theme: string
  mood: string
  colors: string[]
  motif: string
  designSuggestion: {
    primaryColor: string
    accentColor: string
    style: string
  }
}

