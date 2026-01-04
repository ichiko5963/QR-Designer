export interface URLAnalysis {
  url: string
  title: string
  description: string
  favicon?: string
  ogImage?: string
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

