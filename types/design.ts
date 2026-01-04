export interface Design {
  id: string
  name: string
  description: string
  fgColor: string
  bgColor: string
  style: 'bold' | 'minimal' | 'colorful' | 'elegant'
  cornerStyle: 'square' | 'rounded' | 'dots'
  preview?: string
}

export interface Customization {
  size: number
  cornerRadius: number
  logoSize: number
  logoBackground: boolean
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  dotStyle: 'square' | 'rounded' | 'dots'
}

