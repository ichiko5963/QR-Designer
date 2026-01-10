export interface Design {
  id: string
  name: string
  description: string
  fgColor: string
  bgColor: string
  style: 'bold' | 'minimal' | 'colorful' | 'elegant'
  cornerStyle: 'square' | 'rounded' | 'dots'
  motifKeyword: string
  preview?: string
}

export interface Customization {
  size: number
  cornerRadius: number
  logoSize: number
  logoBackground: boolean
  logoFrameShape?: 'square' | 'rounded' | 'circle'
  logoFrameColor?: string | 'auto'
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  dotStyle: 'square' | 'rounded' | 'round' | 'rounder' | 'dots' | 'dot' | 'heart' | 'diamond'
  frameEnabled?: boolean
  frameText?: string
  frameColor?: string
  frameBackground?: string
  /**
   * QR外枠スタイル（square = 角あり, round = 角丸）
   */
  outerShape?: 'square' | 'round'
  frameTemplate?: string
  frameGradientEnabled?: boolean
  frameGradientStyle?: 'linear' | 'radial'
  frameColor1?: string
  frameColor2?: string
  frameBackgroundTransparent?: boolean
  frameBackgroundGradientEnabled?: boolean
  frameBackgroundGradientStyle?: 'linear' | 'radial'
  frameBackground1?: string
  frameBackground2?: string
  patternStyle?: 'square' | 'round' | 'rounder' | 'dot' | 'heart' | 'diamond'
  patternGradientEnabled?: boolean
  patternGradientStyle?: 'linear' | 'radial'
  patternColor1?: string
  patternColor2?: string
  patternColor3?: string
  colorStyle?: 'gradient' | 'stripe' | 'random' | 'radial' | 'corners'
  gradientDirection?: 'to-br' | 'to-bl' | 'to-tr' | 'to-tl' | 'to-r' | 'to-b' | 'radial' | 'radial-tl' | 'radial-br'
  patternBackgroundTransparent?: boolean
  patternBackgroundGradientEnabled?: boolean
  patternBackgroundGradientStyle?: 'linear' | 'radial'
  patternBackground1?: string
  patternBackground2?: string
  cornerFrameStyle?: string
  cornerDotStyle?: string
}
