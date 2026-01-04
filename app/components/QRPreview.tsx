'use client'

import { useState } from 'react'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

interface QRPreviewProps {
  qrCode: string | null
  design: Design | null
  customization: Customization
  onSaveToHistory: () => Promise<void>
  requiresAuth?: boolean
  rateLimitExceeded?: boolean
  rateLimitMessage?: string
}

export default function QRPreview({
  qrCode,
  design,
  customization,
  onSaveToHistory,
  requiresAuth,
  rateLimitExceeded,
  rateLimitMessage
}: QRPreviewProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleDownload = () => {
    if (!qrCode) return
    
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qr-code-${Date.now()}.png`
    link.click()
  }

  const handleSaveToHistory = async () => {
    setIsSaving(true)
    try {
      await onSaveToHistory()
    } finally {
      setIsSaving(false)
    }
  }

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
        
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダウンロード
          </button>
          
          <button
            onClick={handleSaveToHistory}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? '保存中...' : 'Googleで認証してダウンロード'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600 text-center">
          今作成したQRコードをダウンロードできます。<br />
          過去のQRコード管理・再編集・高解像度ダウンロードも可能になります。
        </div>

        {rateLimitExceeded && rateLimitMessage && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{rateLimitMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}

