'use client'

import { useState } from 'react'
import URLInput from './components/URLInput'
import DesignGrid from './components/DesignGrid'
import QRPreview from './components/QRPreview'
import AuthButton from './components/AuthButton'
import type { URLAnalysis } from '@/types/analysis'
import type { Design } from '@/types/design'
import type { Customization } from '@/types/design'

const defaultCustomization: Customization = {
  size: 512,
  cornerRadius: 20,
  logoSize: 18,
  logoBackground: true,
  errorCorrectionLevel: 'M',
  dotStyle: 'square'
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [analysis, setAnalysis] = useState<URLAnalysis | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [customization, setCustomization] = useState<Customization>(defaultCustomization)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')

  const handleAnalyze = async (inputUrl: string) => {
    setIsLoading(true)
    setUrl(inputUrl)
    setAnalysis(null)
    setDesigns([])
    setSelectedDesign(null)
    setQrCode(null)
    setRequiresAuth(false)
    setRateLimitExceeded(false)
    setRateLimitMessage('')

    try {
      // Step 1: URL解析
      const analyzeResponse = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      })

      if (!analyzeResponse.ok) {
        throw new Error('URLの解析に失敗しました')
      }

      const analyzeData = await analyzeResponse.json()
      setAnalysis(analyzeData.data)

      // Step 2: デザイン生成
      const designsResponse = await fetch('/api/generate-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analyzeData.data })
      })

      if (!designsResponse.ok) {
        throw new Error('デザイン生成に失敗しました')
      }

      const designsData = await designsResponse.json()
      setDesigns(designsData.designs)
      
      // 最初のデザインを自動選択
      if (designsData.designs.length > 0) {
        setSelectedDesign(designsData.designs[0])
        // 自動的にQRコードを生成
        await generateQRCode(designsData.designs[0], false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCode = async (design: Design, saveToHistory: boolean) => {
    if (!design || !url) return

    setIsLoading(true)
    setRequiresAuth(false)
    setRateLimitExceeded(false)
    setRateLimitMessage('')

    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          design,
          customization,
          saveToHistory
        })
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.qrCode)
        
        if (data.requiresAuth) {
          setRequiresAuth(true)
        }
        
        if (data.rateLimitExceeded) {
          setRateLimitExceeded(true)
          setRateLimitMessage(data.message)
        }
      } else {
        throw new Error(data.error || 'QRコード生成に失敗しました')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('QRコード生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDesign = async (design: Design) => {
    setSelectedDesign(design)
    await generateQRCode(design, false)
  }

  const handleSaveToHistory = async () => {
    if (!selectedDesign) return
    await generateQRCode(selectedDesign, true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              QR Designer
            </h1>
            <p className="text-lg text-gray-600">
              URLを入力するだけで、AIが最適でおしゃれなQRコードを自動生成
            </p>
          </div>
          <AuthButton />
        </div>

        <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {isLoading && !qrCode && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">サイトを解析しています...</p>
          </div>
        )}

        {designs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div>
              <DesignGrid
                designs={designs}
                selectedDesign={selectedDesign}
                onSelectDesign={handleSelectDesign}
              />
            </div>

            <div className="lg:sticky lg:top-8">
              {selectedDesign && (
                <QRPreview
                  qrCode={qrCode}
                  design={selectedDesign}
                  customization={customization}
                  onSaveToHistory={handleSaveToHistory}
                  requiresAuth={requiresAuth}
                  rateLimitExceeded={rateLimitExceeded}
                  rateLimitMessage={rateLimitMessage}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
