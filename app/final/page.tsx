'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FinalData {
  qrCode: string
  design?: unknown
  customization?: unknown
}

export default function FinalPage() {
  const [data, setData] = useState<FinalData | null>(null)
  const [isAuthed, setIsAuthed] = useState(false)
  const [shortUrl, setShortUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qr-final')
      if (stored) {
        setData(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load final QR', err)
    }
  }, [])

  const handleDownload = () => {
    if (!data?.qrCode) return
    const link = document.createElement('a')
    link.href = data.qrCode
    link.download = `qr-code-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">QRコードのダウンロード</h1>
        <p className="text-gray-600">
          生成したQRコードです。ダウンロードしてご利用ください。
        </p>

        {!data?.qrCode && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            QRコードが見つかりませんでした。再生成してください。
          </div>
        )}

        {data?.qrCode && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={data.qrCode}
              alt="QR Code"
              className="max-w-full h-auto border border-gray-200 rounded-lg"
              style={{ width: '320px' }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ダウンロード
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                デザインに戻る
              </button>
            </div>

            <div className="w-full border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">短縮URLの設定</div>
                  <p className="text-xs text-gray-500">
                    Google認証すると短縮URLを設定できます。
                  </p>
                </div>
                {!isAuthed && (
                  <button
                    onClick={() => setIsAuthed(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Googleで認証
                  </button>
                )}
              </div>
              {isAuthed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">短縮URL</span>
                  <input
                    value={shortUrl}
                    onChange={(e) => setShortUrl(e.target.value)}
                    placeholder="例: https://qr.ly/mybrand"
                    className="flex-1 rounded border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => alert(`短縮URLを保存しました: ${shortUrl || '(未入力)'}`)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    保存
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          コントラストが低いと読み取り精度が下がります。印刷前にテストをおすすめします。
        </div>
      </div>
    </div>
  )
}

