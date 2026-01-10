'use client'

import { useState } from 'react'
import { z } from 'zod'

const URLSchema = z.string().url('有効なURLを入力してください')

interface URLInputProps {
  onAnalyze: (url: string) => Promise<void>
  isLoading?: boolean
}

export default function URLInput({ onAnalyze, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      URLSchema.parse(url)
      await onAnalyze(url)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError('URLの解析に失敗しました')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative flex items-center gap-2 p-2 bg-white rounded-2xl border-2 transition-all duration-300
          ${isFocused ? 'border-[#E6A24C] shadow-xl shadow-[#E6A24C]/10' : 'border-[#171158]/10 shadow-lg shadow-[#171158]/5'}
          ${error ? 'border-red-400' : ''}
        `}
      >
        {/* Link Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#171158]/5 to-[#171158]/10 rounded-xl shrink-0">
          <svg className="w-5 h-5 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="https://example.com"
          className="flex-1 px-2 py-3 text-[#1B1723] placeholder-[#1B1723]/30 bg-transparent outline-none text-base font-medium"
          disabled={isLoading}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !url}
          className={`
            flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-xl transition-all duration-300
            ${isLoading || !url
              ? 'bg-[#171158]/10 text-[#1B1723]/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#E6A24C] to-[#D4923D] text-white hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 hover:shadow-xl hover:shadow-[#E6A24C]/40 hover:-translate-y-0.5'
            }
          `}
        >
          {isLoading ? (
            <span>解析中</span>
          ) : (
            <>
              <span>QR生成</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 mt-3 px-4 text-sm text-red-500 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </form>
  )
}
