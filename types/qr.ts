export interface QRCodeData {
  url: string
  design: {
    id: string
    name: string
    fgColor: string
    bgColor: string
    style: string
    cornerStyle: string
  }
  customization: {
    size: number
    cornerRadius: number
    logoSize: number
    logoBackground: boolean
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
    dotStyle: 'square' | 'rounded' | 'dots'
  }
  logo?: string // base64 encoded image
  format: 'png' | 'jpg' | 'svg' | 'pdf'
}

