import QRCode from 'qrcode'
import sharp from 'sharp'
import { motifShapeKey, type MotifKey } from '@/lib/motif'
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
  const palette = getMotifPalette(design)
  
  // AIデザイン要件を反映したスタイルSVGを生成
  const styledSvg = generateStyledSvg(url, design, customization, palette)

  // SVGをPNGに変換
  let qrBuffer = await sharp(Buffer.from(styledSvg))
    .resize(customization.size, customization.size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer()
  
  // ロゴがある場合は合成
  qrBuffer = await composeLogoIfAny({
    qrBuffer,
    logo,
    customization,
    palette
  })


  
  // 角の丸みを適用（maskで丸める）
  if (customization.cornerRadius > 0) {
    const radius = Math.min(
      Math.floor(customization.size * (customization.cornerRadius / 100)),
      Math.floor(customization.size / 2)
    )
    const maskSvg = Buffer.from(
      `<svg width="${customization.size}" height="${customization.size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${customization.size}" height="${customization.size}" rx="${radius}" ry="${radius}" /></svg>`
    )
    qrBuffer = await sharp(qrBuffer)
      .composite([{ input: maskSvg, blend: 'dest-in' }])
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

function generateStyledSvg(
  url: string,
  _design: Design,
  customization: Customization,
  _palette: MotifPalette
): string {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const moduleCount = qr.modules.size
  const margin = 4
  const cellSize = customization.size / (moduleCount + margin * 2)
  
  const color1 = sanitizeHex(customization.patternColor1 || '#000000', '#000000')
  const color2 = sanitizeHex(customization.patternColor2 || color1, color1)
  const useGradient = customization.patternGradientEnabled && color1 !== color2
  const bgColor = '#ffffff'
  
  const gradientId = 'qr-gradient'
  const gradientDef = useGradient ? `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
  ` : ''
  
  const fillColor = useGradient ? `url(#${gradientId})` : color1
  const modules: string[] = []

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.modules.get(row, col)) continue
      
      const x = (col + margin) * cellSize
      const y = (row + margin) * cellSize
      modules.push(
        `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fillColor}" />`
      )
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${customization.size}" height="${customization.size}" viewBox="0 0 ${customization.size} ${customization.size}">
      ${gradientDef}
      <rect width="100%" height="100%" fill="${bgColor}" />
      ${modules.join('')}
    </svg>
  `
}

function createModuleElement({
  x,
  y,
  size,
  style,
  color,
  gradientFill,
  motif,
  row,
  col
}: {
  x: number
  y: number
  size: number
  style: Customization['dotStyle'] | Customization['patternStyle']
  color: string
  gradientFill?: string
  motif: MotifKey
  row: number
  col: number
}) {
  const padding = style === 'square' ? size * 0.1 : size * 0.2
  const drawSize = size - padding * 2
  const offset = padding

  // モチーフがfishの場合は魚型ドットで敷き詰める
  if (motif === 'fish') {
    return createFishModule({ x, y, size, color, gradientFill, row, col })
  }

  if (style === 'dots' || style === 'dot') {
    const radius = drawSize / 2
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${radius}" fill="${
      gradientFill || color
    }" />`
  }

  if (style === 'heart') {
    const cx = x + size / 2
    const cy = y + size / 2
    const r = drawSize / 2
    const path = `
      M ${cx} ${cy + r * 0.3}
      C ${cx + r} ${cy - r * 0.4}, ${cx + r * 1.2} ${cy + r * 0.6}, ${cx} ${cy + r}
      C ${cx - r * 1.2} ${cy + r * 0.6}, ${cx - r} ${cy - r * 0.4}, ${cx} ${cy + r * 0.3}
      Z
    `
    return `<path d="${path}" fill="${gradientFill || color}" />`
  }

  if (style === 'diamond') {
    const cx = x + size / 2
    const cy = y + size / 2
    const r = drawSize / 2
    return `<polygon points="${cx} ${cy - r}, ${cx + r} ${cy}, ${cx} ${cy + r}, ${cx - r} ${cy}" fill="${
      gradientFill || color
    }" />`
  }

  if (style === 'rounder') {
    const radius = drawSize * 0.6
    return `<rect x="${x + offset}" y="${y + offset}" width="${drawSize}" height="${drawSize}" rx="${radius}" ry="${radius}" fill="${
      gradientFill || color
    }" />`
  }

  const radius =
    style === 'rounded'
      ? drawSize * 0.5
      : Math.min(drawSize * 0.15, size * 0.15)

  return `<rect x="${x + offset}" y="${y + offset}" width="${drawSize}" height="${drawSize}" rx="${radius}" ry="${radius}" fill="${
    gradientFill || color
  }" />`
}

function createFishModule({
  x,
  y,
  size,
  color,
  gradientFill,
  row,
  col
}: {
  x: number
  y: number
  size: number
  color: string
  gradientFill?: string
  row: number
  col: number
}) {
  const padding = size * 0.12
  const tailWidth = size * 0.22
  const bodyEnd = x + size - padding
  const bodyStart = x + padding
  const bodyMidY = y + size / 2
  const dir = (row + col) % 2 === 0 ? 1 : -1 // 交互に向きを変えてリズム感
  const tailDir = dir === 1 ? -1 : 1

  const tailX = dir === 1 ? bodyStart : bodyEnd
  const noseX = dir === 1 ? bodyEnd : bodyStart

  const path = `
    M ${bodyStart} ${bodyMidY - size * 0.22}
    C ${bodyStart + dir * size * 0.28} ${bodyMidY - size * 0.38},
      ${noseX - dir * size * 0.18} ${bodyMidY - size * 0.34},
      ${noseX} ${bodyMidY}
    C ${noseX - dir * size * 0.18} ${bodyMidY + size * 0.34},
      ${bodyStart + dir * size * 0.28} ${bodyMidY + size * 0.38},
      ${bodyStart} ${bodyMidY + size * 0.22}
    L ${tailX + tailDir * tailWidth} ${bodyMidY + size * 0.32}
    L ${tailX + tailDir * tailWidth} ${bodyMidY - size * 0.32}
    Z
  `

  return `<path d="${path}" fill="${gradientFill || color}" />`
}

function createFinderPatterns({
  cellSize,
  moduleCount,
  style,
  primary,
  secondary,
  accent
}: {
  cellSize: number
  moduleCount: number
  style: Design['cornerStyle']
  primary: string
  secondary: string
  accent: string
}) {
  const positions = [
    { x: 0, y: 0 },
    { x: moduleCount - 7, y: 0 },
    { x: 0, y: moduleCount - 7 }
  ]

  return positions
    .map(({ x, y }) => {
      const startX = x * cellSize
      const startY = y * cellSize
      const size = cellSize * 7
      const outerRadius = style === 'rounded' ? cellSize * 1.5 : cellSize * 0.5
      const innerSize = size - cellSize * 2
      const coreSize = size - cellSize * 4

      if (style === 'dots') {
        const outerRadiusDot = size / 2
        const innerRadiusDot = outerRadiusDot - cellSize
        const coreRadiusDot = innerRadiusDot - cellSize * 0.8

        return `
          <circle cx="${startX + size / 2}" cy="${startY + size / 2}" r="${outerRadiusDot}" fill="${primary}" opacity="0.85" />
          <circle cx="${startX + size / 2}" cy="${startY + size / 2}" r="${innerRadiusDot}" fill="${secondary}" />
          <circle cx="${startX + size / 2}" cy="${startY + size / 2}" r="${coreRadiusDot}" fill="${accent}" />
        `
      }

      return `
        <rect x="${startX}" y="${startY}" width="${size}" height="${size}" rx="${outerRadius}" ry="${outerRadius}" fill="${primary}" opacity="0.9" />
        <rect x="${startX + cellSize}" y="${startY + cellSize}" width="${innerSize}" height="${innerSize}" rx="${outerRadius}" ry="${outerRadius}" fill="${secondary}" />
        <rect x="${startX + cellSize * 2}" y="${startY + cellSize * 2}" width="${coreSize}" height="${coreSize}" rx="${cellSize}" ry="${cellSize}" fill="${accent}" />
      `
    })
    .join('')
}

function isFinderPattern(row: number, col: number, moduleCount: number) {
  const limit = 7
  const top = row < limit
  const bottom = row >= moduleCount - limit
  const left = col < limit
  const right = col >= moduleCount - limit

  return (top && left) || (top && right) || (bottom && left)
}

function getPatternBackgroundFill(
  customization: Customization,
  design: Design,
  uid: string,
  palette: MotifPalette
) {
  if (customization.patternBackgroundTransparent) {
    return { fill: 'none', defs: '' }
  }
  const base = sanitizeHex(
    customization.patternBackground1 || customization.frameBackground || palette.background,
    design.bgColor || '#ffffff'
  )
  if (customization.patternBackgroundGradientEnabled) {
    const end = sanitizeHex(
      customization.patternBackground2 || adjustColor(base, -10),
      adjustColor(base, -10)
    )
    return createGradient(
      `${uid}-pbg`,
      base,
      end,
      customization.patternBackgroundGradientStyle || 'linear',
      120
    )
  }
  return { fill: base, defs: '' }
}

function createGradient(
  uid: string,
  start: string,
  end: string,
  mode: 'linear' | 'radial' = 'linear',
  angle = 120
) {
  const gradientId = `${uid}-gradient`
  const normalizedStart = sanitizeHex(start, '#ffffff')
  const normalizedEnd = sanitizeHex(end, '#e5e5e5')

  const definition =
    mode === 'radial'
      ? `
    <radialGradient id="${gradientId}">
      <stop offset="0%" stop-color="${normalizedStart}" />
      <stop offset="100%" stop-color="${normalizedEnd}" />
    </radialGradient>`
      : `
    <linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${normalizedStart}" />
      <stop offset="100%" stop-color="${normalizedEnd}" />
    </linearGradient>
  `

  return {
    fill: `url(#${gradientId})`,
    defs: definition
  }
}

function getShadowDef(design: Design, uid: string, fgColor: string) {
  if (design.style === 'minimal') return null

  const filterId = `${uid}-shadow`
  const definition = `
    <filter id="${filterId}" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="${fgColor}" flood-opacity="0.25" />
    </filter>
  `

  return { id: filterId, definition }
}

function sanitizeHex(color: string, fallback: string) {
  if (!color) return fallback
  const match = color.match(/#[0-9a-f]{3,8}/i)
  if (!match) return fallback
  let hex = match[0].replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (hex.length !== 6) {
    hex = hex.slice(0, 6).padEnd(6, '0')
  }
  return `#${hex}`
}

function adjustColor(color: string, amount: number) {
  const normalized = sanitizeHex(color, '#888888').replace('#', '')
  const num = parseInt(normalized, 16)
  const r = clamp(((num >> 16) & 0xff) + amount, 0, 255)
  const g = clamp(((num >> 8) & 0xff) + amount, 0, 255)
  const b = clamp((num & 0xff) + amount, 0, 255)
  const hex = (r << 16) | (g << 8) | b
  return `#${hex.toString(16).padStart(6, '0')}`
}

async function composeLogoIfAny({
  qrBuffer,
  logo,
  customization,
  palette
}: {
  qrBuffer: Buffer
  logo?: Buffer
  customization: Customization
  palette: MotifPalette
}) {
  if (!logo) return qrBuffer

  const logoSize = Math.floor(customization.size * (customization.logoSize / 100))
  const logoResized = await sharp(logo)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .png()
    .toBuffer()

  // ロゴを中央に配置（白背景 + メインカラー枠）
  const framePadding = 12
  const frameSize = logoSize + framePadding * 2
  const strokeWidth = Math.max(2, Math.floor(frameSize * 0.06))
  const corner = Math.floor(frameSize * 0.12)
  const frameSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frameSize}" height="${frameSize}">
      <rect x="0" y="0" width="${frameSize}" height="${frameSize}" rx="${corner}" ry="${corner}"
        fill="#ffffff" stroke="${palette.primary}" stroke-width="${strokeWidth}" />
    </svg>`
  )
  const logoWithFrame = await sharp(frameSvg)
    .composite([{
      input: logoResized,
      left: framePadding,
      top: framePadding
    }])
    .png()
    .toBuffer()

  const finalSize = frameSize
  const logoX = Math.floor((customization.size - finalSize) / 2)
  const logoY = Math.floor((customization.size - finalSize) / 2)

  return sharp(qrBuffer)
    .composite([{
      input: logoWithFrame,
      left: logoX,
      top: logoY
    }])
    .png()
    .toBuffer()
}

async function composeFrameIfAny({
  qrBuffer,
  customization,
  palette,
  size
}: {
  qrBuffer: Buffer
  customization: Customization
  palette: MotifPalette
  size: number
}) {
  if (!customization.frameEnabled) return qrBuffer

  const padding = Math.floor(size * 0.08)
  const text = (customization.frameText || '').trim()
  const template = customization.frameTemplate || 'outline'
  const gradientEnabled = customization.frameGradientEnabled
  const frameColorBase = sanitizeHex(customization.frameColor1 || customization.frameColor || palette.primary, palette.primary)
  const frameColorSecond = sanitizeHex(customization.frameColor2 || adjustColor(frameColorBase, -18), frameColorBase)
  const frameBackgroundBase = customization.frameBackgroundTransparent
    ? 'none'
    : sanitizeHex(customization.frameBackground1 || customization.frameBackground || '#ffffff', '#ffffff')
  const frameBackgroundSecond = sanitizeHex(
    customization.frameBackground2 || adjustColor(frameBackgroundBase, -12),
    '#ffffff'
  )

  const frameWidth = size + padding * 2
  const frameHeight = size + padding * 2 + (text ? 56 : 0)
  const corner = Math.floor(frameWidth * 0.06)
  const strokeWidth = Math.max(2, Math.floor(frameWidth * 0.015))

  const frameGrad = gradientEnabled
    ? createGradient(
        `${template}-frame-${size}`,
        frameColorBase,
        frameColorSecond,
        (customization.frameGradientStyle as 'linear' | 'radial') || 'linear',
        135
      )
    : null

  const bgGrad =
    customization.frameBackgroundGradientEnabled && !customization.frameBackgroundTransparent
      ? createGradient(
          `${template}-frame-bg-${size}`,
          frameBackgroundBase,
          frameBackgroundSecond,
          (customization.frameBackgroundGradientStyle as 'linear' | 'radial') || 'linear',
          90
        )
      : null

  const frameFill = frameGrad ? frameGrad.fill : frameColorBase
  const backgroundFill =
    frameBackgroundBase === 'none' ? 'none' : bgGrad ? bgGrad.fill : frameBackgroundBase
  const defs = [frameGrad?.defs, bgGrad?.defs].filter(Boolean).join('')

  const svgParts: string[] = []
  svgParts.push(
    `<rect x="0" y="0" width="${frameWidth}" height="${frameHeight}" rx="${corner}" ry="${corner}" fill="${backgroundFill}" stroke="${frameFill}" stroke-width="${strokeWidth}" />`
  )

  if (template === 'band-bottom') {
    svgParts.push(
      `<rect x="${strokeWidth * 2}" y="${frameHeight - 48}" width="${frameWidth - strokeWidth * 4}" height="40" rx="${corner *
        0.6}" ry="${corner * 0.6}" fill="${frameFill}" opacity="0.15" />`
    )
  } else if (template === 'band-top') {
    svgParts.push(
      `<rect x="${strokeWidth * 2}" y="${strokeWidth * 2}" width="${frameWidth - strokeWidth * 4}" height="40" rx="${corner *
        0.6}" ry="${corner * 0.6}" fill="${frameFill}" opacity="0.15" />`
    )
  } else if (template === 'double') {
    svgParts.push(
      `<rect x="${strokeWidth * 2}" y="${strokeWidth * 2}" width="${frameWidth - strokeWidth * 4}" height="${frameHeight -
        strokeWidth * 4}" rx="${corner * 0.8}" ry="${corner * 0.8}" fill="none" stroke="${frameFill}" stroke-width="${Math.max(
        1,
        strokeWidth - 1
      )}" opacity="0.7" />`
    )
  } else if (template === 'ticket') {
    const notch = corner * 0.8
    svgParts.push(
      `<path d="M0 ${corner} Q0 0 ${corner} 0 H ${frameWidth - corner} Q ${frameWidth} 0 ${frameWidth} ${corner} V ${frameHeight /
        2 -
        notch} Q ${frameWidth - corner} ${frameHeight / 2} ${frameWidth} ${frameHeight / 2 + notch} V ${frameHeight -
        corner} Q ${frameWidth} ${frameHeight} ${frameWidth - corner} ${frameHeight} H ${corner} Q 0 ${frameHeight} 0 ${frameHeight -
        corner} V ${frameHeight / 2 + notch} Q ${corner} ${frameHeight / 2} 0 ${frameHeight / 2 - notch} Z" fill="none" stroke="${frameFill}" stroke-width="${strokeWidth}" />`
    )
  } else if (template === 'dotted') {
    svgParts.push(
      `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${frameWidth - strokeWidth}" height="${frameHeight -
        strokeWidth}" rx="${corner}" ry="${corner}" fill="${backgroundFill}" stroke="${frameFill}" stroke-width="${strokeWidth}" stroke-dasharray="8 6" />`
    )
  }

  if (text) {
    svgParts.push(
      `<text x="50%" y="${frameHeight - 16}" text-anchor="middle" font-family="Inter, 'Noto Sans JP', sans-serif" font-size="18" fill="${frameFill}">${escapeXml(
        text
      )}</text>`
    )
  }

  const frameSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth}" height="${frameHeight}">
      <defs>${defs}</defs>
      ${svgParts.join('\n')}
    </svg>`
  )

  const framed = await sharp(frameSvg)
    .composite([{
      input: qrBuffer,
      left: padding,
      top: padding
    }])
    .png()
    .toBuffer()

  return framed
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface MotifShapeDefinition {
  path: string
  overlays?: OverlayDefinition[]
}

interface OverlayDefinition {
  d: string
  fill?: 'accent' | 'secondary' | 'none'
  stroke?: 'accent' | 'secondary'
  opacity?: number
  strokeWidth?: number
}

interface MotifShapeOptions {
  keyword?: string
  size: number
  palette: MotifPalette
}

const MOTIF_SHAPES: Record<MotifKey, MotifShapeDefinition> = {
  fish: {
    path: 'M120 520 Q260 280 500 360 Q760 220 880 500 Q760 780 500 640 Q260 720 120 520 L240 440 L240 600 Z',
    overlays: [
      { d: 'M300 500 Q420 420 520 460', stroke: 'accent', opacity: 0.4, strokeWidth: 25 },
      { d: 'M650 470 Q700 520 650 560 Q600 520 650 470 Z', fill: 'secondary', opacity: 0.3 }
    ]
  },
  dinosaur: {
    path: 'M150 700 Q140 520 250 420 Q300 260 460 240 Q540 140 700 200 Q820 240 860 420 V620 Q780 760 620 780 H420 Q320 820 220 780 Z',
    overlays: [{ d: 'M260 460 Q320 360 420 360', stroke: 'accent', opacity: 0.35, strokeWidth: 30 }]
  },
  coffee: {
    path: 'M220 320 H700 Q820 320 820 450 Q820 580 700 580 H640 Q620 760 500 820 Q380 760 360 580 H220 Z',
    overlays: [
      { d: 'M700 360 Q760 360 760 450 Q760 540 700 540 H670 Q720 460 670 360 Z', fill: 'secondary', opacity: 0.25 },
      { d: 'M300 260 Q320 220 340 260 Q360 300 380 260 Q400 220 420 260', stroke: 'accent', opacity: 0.4, strokeWidth: 20 }
    ]
  },
  ai: {
    path: 'M350 150 H650 L850 500 L650 850 H350 L150 500 Z',
    overlays: [
      { d: 'M360 360 H640', stroke: 'accent', opacity: 0.4, strokeWidth: 20 },
      { d: 'M500 250 V750', stroke: 'accent', opacity: 0.4, strokeWidth: 20 },
      { d: 'M280 500 H720', stroke: 'secondary', opacity: 0.3, strokeWidth: 16 }
    ]
  },
  company: {
    path: 'M180 860 V320 H320 V860 M360 860 V220 H520 V860 M560 860 V420 H720 V860 H820 V910 H180 V860 Z',
    overlays: [
      { d: 'M240 360 V800', stroke: 'secondary', opacity: 0.3, strokeWidth: 18 },
      { d: 'M440 260 V800', stroke: 'secondary', opacity: 0.3, strokeWidth: 18 },
      { d: 'M640 460 V800', stroke: 'secondary', opacity: 0.3, strokeWidth: 18 }
    ]
  },
  museum: {
    path: 'M150 780 H850 V700 H150 Z M180 700 H820 L500 320 Z',
    overlays: [
      { d: 'M260 700 V780', stroke: 'secondary', opacity: 0.4, strokeWidth: 30 },
      { d: 'M420 700 V780', stroke: 'secondary', opacity: 0.4, strokeWidth: 30 },
      { d: 'M580 700 V780', stroke: 'secondary', opacity: 0.4, strokeWidth: 30 },
      { d: 'M740 700 V780', stroke: 'secondary', opacity: 0.4, strokeWidth: 30 }
    ]
  },
  nature: {
    path: 'M220 780 Q140 550 260 340 Q420 140 650 180 Q860 240 820 480 Q780 720 560 860 Q360 900 220 780 Z',
    overlays: [{ d: 'M300 700 Q420 520 540 360 Q640 240 720 220', stroke: 'accent', opacity: 0.35, strokeWidth: 25 }]
  },
  travel: {
    path: 'M150 640 L480 540 V320 H520 V540 L850 640 L520 620 V780 L600 860 H460 L480 780 V660 Z',
    overlays: [{ d: 'M520 360 L640 520', stroke: 'accent', opacity: 0.5, strokeWidth: 22 }]
  },
  education: {
    path: 'M220 280 Q380 220 500 320 Q620 220 780 280 V820 Q620 760 500 860 Q380 760 220 820 Z',
    overlays: [
      { d: 'M500 360 V820', stroke: 'secondary', opacity: 0.4, strokeWidth: 24 },
      { d: 'M280 340 V780', stroke: 'secondary', opacity: 0.2, strokeWidth: 12 },
      { d: 'M720 340 V780', stroke: 'secondary', opacity: 0.2, strokeWidth: 12 }
    ]
  },
  health: {
    path: 'M500 860 Q320 720 240 580 Q140 420 250 300 Q360 220 500 340 Q640 220 750 300 Q860 420 760 580 Q680 720 500 860 Z',
    overlays: [
      { d: 'M500 420 Q560 360 620 420', stroke: 'accent', opacity: 0.4, strokeWidth: 25 },
      { d: 'M380 420 Q440 360 500 420', stroke: 'accent', opacity: 0.4, strokeWidth: 25 }
    ]
  },
  abstract: {
    path: 'M200 320 Q240 140 440 160 Q620 140 760 260 Q880 380 820 560 Q780 760 620 820 Q460 880 320 820 Q160 760 160 560 Q160 420 200 320 Z',
    overlays: [
      { d: 'M260 360 Q500 540 760 400', stroke: 'accent', opacity: 0.3, strokeWidth: 28 },
      { d: 'M320 640 Q500 760 680 660', stroke: 'secondary', opacity: 0.25, strokeWidth: 24 }
    ]
  }
}

function createMotifOverlay(options: MotifShapeOptions) {
  const motifKey = motifShapeKey(options.keyword)
  const definition = MOTIF_SHAPES[motifKey]
  if (!definition) return ''

  const scale = options.size / 1000
  const transform = `scale(${scale})`
  const baseOpacity = motifKey === 'fish' ? 0.3 : 0.22
  const base = `<path d="${definition.path}" transform="${transform}" fill="${options.palette.overlay}" opacity="${baseOpacity}" />`
  const overlays = definition.overlays
    ? definition.overlays
        .map((overlay) =>
          `<path d="${overlay.d}" transform="${transform}" ${buildOverlayAttributes(
            overlay,
            options.palette.highlight,
            options.palette.secondary
          )} />`
        )
        .join('')
    : ''

  return `<g>${base}${overlays}</g>`
}

function buildOverlayAttributes(
  overlay: OverlayDefinition,
  accent: string,
  secondary: string
) {
  const fillColor = getOverlayColor(overlay.fill, accent, secondary)
  const strokeColor = getOverlayColor(overlay.stroke, accent, secondary)
  const attributes = [
    fillColor ? `fill="${fillColor}"` : '',
    strokeColor ? `stroke="${strokeColor}"` : '',
    overlay.opacity ? `opacity="${overlay.opacity}"` : '',
    overlay.strokeWidth ? `stroke-width="${overlay.strokeWidth}"` : ''
  ].filter(Boolean)

  if (!overlay.fill && !overlay.stroke) {
    attributes.push('fill="none"')
  }

  return attributes.join(' ')
}

function getOverlayColor(
  type: OverlayDefinition['fill'],
  accent: string,
  secondary: string
) {
  if (!type) return ''
  if (type === 'accent') return accent
  if (type === 'secondary') return secondary
  if (type === 'none') return 'none'
  return type
}

interface MotifPalette {
  primary: string
  secondary: string
  background: string
  highlight: string
  overlay: string
}

const MOTIF_PALETTES: Record<MotifKey, MotifPalette> = {
  fish: {
    primary: '#0B2F4A',
    secondary: '#86CBDD',
    background: '#E0F7FA',
    highlight: '#FFFFFF',
    overlay: '#D6F2FF'
  },
  dinosaur: {
    primary: '#2F5B3B',
    secondary: '#9CBD7C',
    background: '#F2E7D0',
    highlight: '#C57F3B',
    overlay: '#E9DCC5'
  },
  coffee: {
    primary: '#4C2A1F',
    secondary: '#C7A17A',
    background: '#F9F1E7',
    highlight: '#F0D3B7',
    overlay: '#E6C8A6'
  },
  ai: {
    primary: '#1F2B53',
    secondary: '#6BC9FF',
    background: '#0B1020',
    highlight: '#8FF5FF',
    overlay: '#14264D'
  },
  company: {
    primary: '#1A2A44',
    secondary: '#7BA4D7',
    background: '#E6EEF6',
    highlight: '#2F80ED',
    overlay: '#D4E1F4'
  },
  museum: {
    primary: '#3D2C2C',
    secondary: '#B59A7A',
    background: '#F4EADF',
    highlight: '#D4B592',
    overlay: '#E8D4C3'
  },
  nature: {
    primary: '#1F4D2B',
    secondary: '#7BC67D',
    background: '#EFF8EC',
    highlight: '#B7E4C7',
    overlay: '#D7F0D5'
  },
  travel: {
    primary: '#1C3D5A',
    secondary: '#F2994A',
    background: '#EAF4FF',
    highlight: '#F6C28B',
    overlay: '#D9E9FF'
  },
  education: {
    primary: '#2C3E50',
    secondary: '#F2C94C',
    background: '#FFF7E3',
    highlight: '#F4D06F',
    overlay: '#FFE6A7'
  },
  health: {
    primary: '#1E3E3E',
    secondary: '#7BDCB5',
    background: '#E8F8F5',
    highlight: '#C2FBE1',
    overlay: '#D4F5EC'
  },
  abstract: {
    primary: '#2F2F3A',
    secondary: '#B67DEB',
    background: '#F2ECFF',
    highlight: '#FFB3C6',
    overlay: '#E6D8FF'
  }
}

function getMotifPalette(design: Design): MotifPalette {
  const key = motifShapeKey(design.motifKeyword)
  const palette = MOTIF_PALETTES[key]
  if (palette) return palette
  return {
    primary: design.fgColor || '#000000',
    secondary: adjustColor(design.bgColor || '#f5f5f5', -10),
    background: design.bgColor || '#ffffff',
    highlight: adjustColor(design.fgColor || '#000000', 20),
    overlay: adjustColor(design.bgColor || '#ffffff', 10)
  }
}

function getPatternColor(customization: Customization, palette: MotifPalette, uid: string) {
  const base = sanitizeHex(customization.patternColor1 || palette.primary, palette.primary)
  if (customization.patternGradientEnabled) {
    const end = sanitizeHex(
      customization.patternColor2 || adjustColor(base, -25),
      adjustColor(base, -25)
    )
    const grad = createGradient(
      `${uid}-pattern`,
      base,
      end,
      customization.patternGradientStyle || 'linear',
      135
    )
    return { fill: `url(#${uid}-pattern)`, fillGradient: grad.fill, defs: grad.defs, baseColor: base }
  }
  return { fill: base, fillGradient: '', defs: '', baseColor: base }
}
