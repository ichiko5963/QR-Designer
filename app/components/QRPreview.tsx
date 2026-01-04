'use client'

import { useState } from 'react'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

interface QRPreviewProps {
  qrCode: string | null
  design: Design | null
  customization: Customization
  onConfirm: () => void
}

export default function QRPreview({
  qrCode,
  design,
  customization,
  onConfirm
}: QRPreviewProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!qrCode) {
    return null
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-1">QRコードプレビュー</h2>
      <p className="text-sm text-gray-500 mb-4">QRコードの準備ができました</p>
      
      <div className="flex flex-col items-center gap-4">
        <img
          src={qrCode}
          alt="QR Code"
          className="max-w-full h-auto"
          style={{ width: `${customization.size}px` }}
        />
        
        <button
          onClick={async () => {
            setIsConfirming(true)
            try {
              onConfirm()
            } finally {
              setIsConfirming(false)
            }
          }}
          disabled={isConfirming}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isConfirming ? '確定中...' : 'これで確定して次へ'}
        </button>
        
        <div className="text-sm text-gray-600 text-center">
          確定後、ダウンロード画面に移動します。
        </div>
      </div>
    </div>
  )
}

