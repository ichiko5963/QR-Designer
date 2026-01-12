'use client'

import { useState } from 'react'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

interface QRPreviewProps {
  qrCode: string | null
  design: Design | null
  customization: Customization
  onConfirm: () => void
  confirmLabel?: string
}

export default function QRPreview({
  qrCode,
  design,
  customization,
  onConfirm,
  confirmLabel = 'このデザインで確定'
}: QRPreviewProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!qrCode) {
    return (
      <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#171158]/5 to-[#E6A24C]/10 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#171158]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-[#1B1723]/50 text-sm font-medium">QRコードを生成中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#171158]/5 bg-gradient-to-r from-[#171158]/[0.02] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#171158] to-[#1B1723] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1B1723]">プレビュー</h3>
            <p className="text-sm text-[#1B1723]/50">リアルタイムで確認</p>
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="p-6">
        <div className="relative bg-gradient-to-br from-[#171158]/[0.02] to-[#E6A24C]/[0.03] rounded-2xl p-6 flex items-center justify-center">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-[#171158] rounded-lg" />
          </div>

          <img
            src={qrCode}
            alt="Generated QR Code"
            className="relative z-10 rounded-xl shadow-2xl shadow-[#171158]/10 aspect-square object-contain"
            style={{
              width: Math.min(customization.size, 320),
              maxWidth: '100%'
            }}
          />
        </div>

        {/* Design Info */}
        {design && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[#1B1723]/60">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-lg ring-2 ring-white shadow-md"
                style={{ backgroundColor: design.fgColor }}
              />
              <span className="font-medium">{design.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
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
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-bold rounded-xl transition-all duration-300
            ${isConfirming
              ? 'bg-[#171158]/10 text-[#1B1723]/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#E6A24C] to-[#D4923D] text-white hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 hover:shadow-xl hover:shadow-[#E6A24C]/40 hover:-translate-y-0.5'
            }
          `}
        >
          {isConfirming ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>確定中...</span>
            </>
          ) : (
            <>
              <span>{confirmLabel}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-[#1B1723]/40">
          確定後、ダウンロード画面に移動します
        </p>
      </div>
    </div>
  )
}
