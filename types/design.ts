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
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  dotStyle: 'square' | 'rounded' | 'dots'
  frameEnabled?: boolean
  frameText?: string
  frameColor?: string
  frameBackground?: string
  /**
   * QR外枠スタイル（square = 角あり, round = 角丸）
   */
  outerShape?: 'square' | 'round'
}
