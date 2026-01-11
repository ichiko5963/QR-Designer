'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import jsQR from 'jsqr'

interface ScannedQR {
  id: string
  url: string
  scanned_at: string
  title?: string
}

export default function QRScannerPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedUrl, setScannedUrl] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [history, setHistory] = useState<ScannedQR[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    checkAuth()
    loadHistory()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadHistory = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('scanned_qr_history')
      .select('*')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(20)

    if (data) {
      setHistory(data)
    }
  }

  const scanQRFromImage = useCallback(async (imageData: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          resolve(null)
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        // 画像サイズを設定
        const maxSize = 1000
        let width = img.width
        let height = img.height

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const imageData = ctx.getImageData(0, 0, width, height)
        const code = jsQR(imageData.data, width, height)

        if (code) {
          resolve(code.data)
        } else {
          resolve(null)
        }
      }
      img.onerror = () => {
        resolve(null)
      }
      img.src = imageData
    })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }

    setScanning(true)
    setError(null)
    setScannedUrl(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreviewImage(dataUrl)

      const result = await scanQRFromImage(dataUrl)
      setScanning(false)

      if (result) {
        setScannedUrl(result)
      } else {
        setError('QRコードを検出できませんでした。別の画像をお試しください。')
      }
    }
    reader.onerror = () => {
      setScanning(false)
      setError('ファイルの読み込みに失敗しました')
    }
    reader.readAsDataURL(file)
  }, [scanQRFromImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          handleFile(file)
          break
        }
      }
    }
  }, [handleFile])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveToHistory = async () => {
    if (!scannedUrl || !user) return

    setSaving(true)
    try {
      const supabase = createClient()

      // ページタイトルを取得（可能な場合）
      let title: string | null = null
      try {
        const url = new URL(scannedUrl)
        title = url.hostname
      } catch {
        title = scannedUrl.substring(0, 50)
      }

      const { data, error } = await supabase
        .from('scanned_qr_history')
        .insert({
          user_id: user.id,
          url: scannedUrl,
          title: title,
          scanned_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        setHistory(prev => [data, ...prev])
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteFromHistory = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('scanned_qr_history')
      .delete()
      .eq('id', id)

    if (!error) {
      setHistory(prev => prev.filter(item => item.id !== id))
    }
  }

  const reset = () => {
    setPreviewImage(null)
    setScannedUrl(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1723]">QRコード読み取り</h1>
        <p className="text-sm text-[#1B1723]/50 mt-1">
          QRコード画像からリンクを抽出します
        </p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* メイン: ドロップゾーン */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging
            ? 'border-[#E6A24C] bg-[#E6A24C]/5'
            : previewImage
              ? 'border-[#171158]/20 bg-[#FAFBFC]'
              : 'border-[#171158]/10 bg-white hover:border-[#E6A24C]/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {previewImage ? (
          <div className="space-y-6">
            {/* プレビュー画像 */}
            <div className="relative w-48 h-48 mx-auto">
              <img
                src={previewImage}
                alt="QR Code Preview"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {scanning && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#E6A24C] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#1B1723]/60">QRコードを解析中...</span>
              </div>
            )}

            {scannedUrl && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">QRコードを検出しました</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <a
                    href={scannedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#171158] hover:underline break-all text-sm"
                  >
                    {scannedUrl}
                  </a>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyToClipboard(scannedUrl, 'scanned')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#171158] bg-[#171158]/5 rounded-lg hover:bg-[#171158]/10 transition-colors"
                  >
                    {copied === 'scanned' ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        コピーしました
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        コピー
                      </>
                    )}
                  </button>
                  {user && (
                    <button
                      onClick={saveToHistory}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#E6A24C] rounded-lg hover:bg-[#D4923D] disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      )}
                      保存
                    </button>
                  )}
                  <a
                    href={scannedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#171158] rounded-lg hover:bg-[#2A2478] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    開く
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B1723]/60 hover:text-[#1B1723] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              別のQRコードを読み取る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-[#171158]/5 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-[#171158]/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M20.25 16.5V18A2.25 2.25 0 0118 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01M9 9h.01M9 15h.01M15 9h.01M15 15h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1B1723] mb-1">
                QRコード画像をドロップ
              </h3>
              <p className="text-sm text-[#1B1723]/50 mb-4">
                または <span className="text-[#E6A24C] font-medium">Ctrl+V</span> でペースト
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              ファイルを選択
            </button>
          </div>
        )}
      </div>

      {/* 履歴セクション */}
      {user && history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B1723]">読み取り履歴</h2>
          <div className="bg-white rounded-2xl border border-[#171158]/5 divide-y divide-[#171158]/5">
            {history.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-[#171158]/5 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#171158]/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B1723] truncate">
                    {item.title || item.url}
                  </p>
                  <p className="text-xs text-[#1B1723]/50 truncate">{item.url}</p>
                  <p className="text-xs text-[#1B1723]/40 mt-1">
                    {new Date(item.scanned_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="p-2 text-[#1B1723]/40 hover:text-[#E6A24C] transition-colors"
                    title="URLをコピー"
                  >
                    {copied === item.id ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#1B1723]/40 hover:text-[#171158] transition-colors"
                    title="リンクを開く"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                  <button
                    onClick={() => deleteFromHistory(item.id)}
                    className="p-2 text-[#1B1723]/40 hover:text-red-500 transition-colors"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未ログイン時のメッセージ */}
      {!user && (
        <div className="bg-[#171158]/5 rounded-2xl p-6 text-center">
          <p className="text-[#1B1723]/60 mb-4">
            ログインすると読み取ったリンクを保存できます
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all"
          >
            Googleでログイン
          </a>
        </div>
      )}
    </div>
  )
}
