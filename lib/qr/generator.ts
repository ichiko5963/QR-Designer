import QRCode from 'qrcode'
import sharp from 'sharp'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

export interface QRCodeOptions {
  url: string
  design: Design
  customization: Customization
  logo?: Buffer
}

export async function generateQRCode(options: QRCodeOptions): Promise<Buffer> {
  const { url, design, customization, logo } = options
  
  // QRコードを生成（SVG形式）
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    width: customization.size,
    margin: 1,
    color: {
      dark: design.fgColor,
      light: design.bgColor
    },
    errorCorrectionLevel: customization.errorCorrectionLevel
  })
  
  // SVGをPNGに変換
  let qrBuffer = await sharp(Buffer.from(qrSvg))
    .resize(customization.size, customization.size)
    .png()
    .toBuffer()
  
  // ロゴがある場合は合成
  if (logo) {
    const logoSize = Math.floor(customization.size * (customization.logoSize / 100))
    const logoResized = await sharp(logo)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer()
    
    // ロゴを中央に配置
    const logoX = Math.floor((customization.size - logoSize) / 2)
    const logoY = Math.floor((customization.size - logoSize) / 2)
    
    if (customization.logoBackground) {
      // 白い背景を追加
      const logoWithBackground = await sharp({
        create: {
          width: logoSize + 20,
          height: logoSize + 20,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{
          input: logoResized,
          left: 10,
          top: 10
        }])
        .png()
        .toBuffer()
      
      qrBuffer = await sharp(qrBuffer)
        .composite([{
          input: logoWithBackground,
          left: logoX - 10,
          top: logoY - 10
        }])
        .png()
        .toBuffer()
    } else {
      qrBuffer = await sharp(qrBuffer)
        .composite([{
          input: logoResized,
          left: logoX,
          top: logoY
        }])
        .png()
        .toBuffer()
    }
  }
  
  // 角の丸みを適用
  if (customization.cornerRadius > 0) {
    const radius = Math.floor(customization.size * (customization.cornerRadius / 100))
    qrBuffer = await sharp(qrBuffer)
      .roundedCorners(radius)
      .png()
      .toBuffer()
  }
  
  return qrBuffer
}

export async function generateQRCodeAsDataURL(
  options: QRCodeOptions
): Promise<string> {
  const buffer = await generateQRCode(options)
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}

