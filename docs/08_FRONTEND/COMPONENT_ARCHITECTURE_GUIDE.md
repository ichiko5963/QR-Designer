# フロントエンド コンポーネント設計完全ガイド - QR Designer v3.0

> **最終更新**: 2026-01-04
> **対象**: Next.js 16 App Router + React Server Components
> **デザインシステム**: Tailwind CSS 4

---

## 📚 目次

1. [コンポーネント設計原則](#コンポーネント設計原則)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [Server Components vs Client Components](#server-components-vs-client-components)
4. [コアコンポーネント実装](#コアコンポーネント実装)
5. [状態管理戦略](#状態管理戦略)
6. [スタイリングパターン](#スタイリングパターン)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [アクセシビリティ](#アクセシビリティ)
9. [コンポーネントテスト](#コンポーネントテスト)

---

## コンポーネント設計原則

### SOLID原則の適用

```typescript
// ❌ 悪い例: 単一責任の原則違反
function QRGeneratorComponent() {
  const [url, setUrl] = useState('')
  const [designs, setDesigns] = useState([])
  const [qrCode, setQRCode] = useState(null)

  // URL解析、デザイン生成、QR生成を1つのコンポーネントで処理
  // → 複雑で再利用困難
}

// ✅ 良い例: 責任を分離
function URLInputForm({ onSubmit }) { /* URL入力のみ */ }
function DesignSelector({ designs, onSelect }) { /* デザイン選択のみ */ }
function QRCodePreview({ qrCode, onDownload }) { /* QRプレビューのみ */ }
```

### コンポーネント分類

```
┌─────────────────────────────────────────────────┐
│ Pages (app/)                                     │
│ - ルーティング                                    │
│ - データフェッチング                               │
│ - レイアウト構成                                  │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Features (app/components/features/)              │
│ - ビジネスロジック                                │
│ - 複数のUIコンポーネントを組み合わせ                │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ UI Components (app/components/ui/)               │
│ - 再利用可能なUIパーツ                            │
│ - ビジネスロジックを持たない                       │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Primitives (app/components/primitives/)          │
│ - Button, Input, Card等の基本要素                │
│ - デザインシステムのベース                         │
└─────────────────────────────────────────────────┘
```

---

## ディレクトリ構造

```
app/
├── (routes)/
│   ├── page.tsx                    # ホームページ
│   ├── history/
│   │   └── page.tsx                # 履歴ページ
│   └── layout.tsx                  # ルートレイアウト
│
├── components/
│   ├── features/                   # 機能コンポーネント
│   │   ├── QRGenerator/
│   │   │   ├── URLInput.tsx
│   │   │   ├── DesignGrid.tsx
│   │   │   ├── QRPreview.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── Auth/
│   │   │   ├── AuthButton.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── History/
│   │       ├── HistoryCard.tsx
│   │       ├── HistoryGrid.tsx
│   │       └── index.ts
│   │
│   ├── ui/                         # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   │
│   ├── layout/                     # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   │
│   └── providers/                  # コンテキストプロバイダー
│       ├── ThemeProvider.tsx
│       └── ToastProvider.tsx
│
└── api/                            # APIルート
    ├── analyze-url/
    ├── generate-designs/
    └── generate-qr/
```

---

## Server Components vs Client Components

### Server Components（デフォルト）

```typescript
// app/page.tsx - Server Component
import { createClient } from '@/lib/supabase/server'
import URLInput from '@/app/components/features/QRGenerator/URLInput'

export default async function HomePage() {
  const supabase = await createClient()

  // サーバーサイドでデータフェッチ
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // Server Componentの利点:
  // 1. データベース直接アクセス
  // 2. 機密情報（API Key）を安全に使用
  // 3. JavaScriptバンドルに含まれない（高速初期ロード）

  return (
    <div>
      <h1>QR Designer</h1>
      {user ? (
        <p>ようこそ、{user.email}さん</p>
      ) : (
        <p>ログインしてください</p>
      )}

      {/* Client Componentを埋め込み */}
      <URLInput />
    </div>
  )
}
```

### Client Components（インタラクティブ）

```typescript
// app/components/features/QRGenerator/URLInput.tsx
'use client'

import { useState } from 'react'
import { urlSchema } from '@/lib/security/validation'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'

export default function URLInput() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    const result = urlSchema.safeParse(url)
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) throw new Error('解析に失敗しました')

      const data = await response.json()
      // 次のステップへ遷移...
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー')
    } finally {
      setLoading(false)
    }
  }

  // Client Componentの利点:
  // 1. useState, useEffectなどのフック使用可能
  // 2. イベントハンドラー（onClick, onChange等）
  // 3. ブラウザAPIアクセス（localStorage等）

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        error={error}
        disabled={loading}
      />

      <Button type="submit" loading={loading} fullWidth>
        {loading ? '解析中...' : 'QRコードを生成'}
      </Button>
    </form>
  )
}
```

---

## コアコンポーネント実装

### 1. Button コンポーネント

```typescript
// app/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // ベーススタイル
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false
    }
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export default function Button({
  variant,
  size,
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}

      {children}

      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}

// 使用例
// <Button variant="primary" size="lg" loading={isLoading}>
//   送信
// </Button>
```

### 2. Input コンポーネント

```typescript
// app/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'input-error' : helperText ? 'input-helper' : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id="input-error" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id="input-helper" className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
```

### 3. Modal コンポーネント

```typescript
// app/components/ui/Modal.tsx
'use client'

import { useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // スクロール防止
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダルコンテンツ */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl w-full transform transition-all',
          sizeClasses[size]
        )}
      >
        {/* ヘッダー */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* コンテンツ */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// 使用例
// const [isOpen, setIsOpen] = useState(false)
//
// <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="確認">
//   <p>本当に削除しますか？</p>
//   <div className="flex gap-2 mt-4">
//     <Button variant="danger">削除</Button>
//     <Button variant="secondary" onClick={() => setIsOpen(false)}>キャンセル</Button>
//   </div>
// </Modal>
```

### 4. Toast通知システム

```typescript
// app/components/providers/ToastProvider.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])

    // 3秒後に自動削除
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cn(
                  'px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-slide-in',
                  typeStyles[toast.type]
                )}
                role="alert"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{toast.message}</p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-current opacity-70 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

// 使用例
// const { showToast } = useToast()
// showToast('success', 'QRコードを生成しました！')
```

---

## 状態管理戦略

### URL State（検索パラメータ）

```typescript
// app/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function QRGeneratorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentStep = searchParams.get('step') || '1'
  const url = searchParams.get('url') || ''

  const goToNextStep = (newUrl: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('step', '2')
    params.set('url', newUrl)
    router.push(`?${params.toString()}`)
  }

  // URL状態の利点:
  // 1. ブックマーク可能
  // 2. 共有可能
  // 3. ブラウザの戻る/進むボタンが動作

  return <div>{/* ... */}</div>
}
```

### Context API（グローバル状態）

```typescript
// app/components/providers/QRGeneratorProvider.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface QRGeneratorState {
  url: string
  analysis: any
  selectedDesign: any
  qrCode: string | null
}

interface QRGeneratorContextType extends QRGeneratorState {
  setUrl: (url: string) => void
  setAnalysis: (analysis: any) => void
  setSelectedDesign: (design: any) => void
  setQRCode: (qrCode: string) => void
  reset: () => void
}

const QRGeneratorContext = createContext<QRGeneratorContextType | null>(null)

export function useQRGenerator() {
  const context = useContext(QRGeneratorContext)
  if (!context) {
    throw new Error('useQRGenerator must be used within QRGeneratorProvider')
  }
  return context
}

export default function QRGeneratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QRGeneratorState>({
    url: '',
    analysis: null,
    selectedDesign: null,
    qrCode: null
  })

  const setUrl = (url: string) => setState((prev) => ({ ...prev, url }))
  const setAnalysis = (analysis: any) => setState((prev) => ({ ...prev, analysis }))
  const setSelectedDesign = (design: any) => setState((prev) => ({ ...prev, selectedDesign: design }))
  const setQRCode = (qrCode: string) => setState((prev) => ({ ...prev, qrCode }))
  const reset = () =>
    setState({
      url: '',
      analysis: null,
      selectedDesign: null,
      qrCode: null
    })

  return (
    <QRGeneratorContext.Provider
      value={{
        ...state,
        setUrl,
        setAnalysis,
        setSelectedDesign,
        setQRCode,
        reset
      }}
    >
      {children}
    </QRGeneratorContext.Provider>
  )
}
```

---

## スタイリングパターン

### Tailwind CSS 4 + CVA

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}

export default config
```

---

## パフォーマンス最適化

### 1. Code Splitting（動的インポート）

```typescript
// app/page.tsx
import dynamic from 'next/dynamic'

// 重いコンポーネントは動的読み込み
const QRPreview = dynamic(() => import('@/app/components/features/QRGenerator/QRPreview'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  ssr: false // クライアントサイドのみ
})

export default function Page() {
  return (
    <div>
      <h1>QR Designer</h1>
      <QRPreview />
    </div>
  )
}
```

### 2. 画像最適化

```typescript
// app/components/QRCodeImage.tsx
import Image from 'next/image'

export default function QRCodeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={512}
      height={512}
      quality={90}
      priority // LCP対策: 重要な画像は優先読み込み
      placeholder="blur" // ブラー効果
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    />
  )
}
```

### 3. メモ化

```typescript
// app/components/features/QRGenerator/DesignCard.tsx
import { memo } from 'react'

interface DesignCardProps {
  design: {
    name: string
    color: string
    backgroundColor: string
  }
  onSelect: () => void
}

function DesignCard({ design, onSelect }: DesignCardProps) {
  return (
    <div
      className="p-4 border rounded-lg cursor-pointer hover:shadow-lg transition"
      onClick={onSelect}
    >
      <div
        className="w-full h-32 rounded"
        style={{ backgroundColor: design.color }}
      />
      <h3 className="mt-2 font-semibold">{design.name}</h3>
    </div>
  )
}

// メモ化して不要な再レンダリングを防ぐ
export default memo(DesignCard, (prevProps, nextProps) => {
  return prevProps.design.name === nextProps.design.name
})
```

---

## アクセシビリティ

### ARIAラベルとセマンティックHTML

```typescript
// app/components/features/QRGenerator/DesignGrid.tsx
export default function DesignGrid({ designs, onSelect }) {
  return (
    <section aria-labelledby="design-section-title">
      <h2 id="design-section-title" className="text-2xl font-bold mb-4">
        デザインを選択
      </h2>

      <div
        role="list"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {designs.map((design, index) => (
          <button
            key={design.name}
            role="listitem"
            aria-label={`デザイン${index + 1}: ${design.name}を選択`}
            onClick={() => onSelect(design)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <DesignCard design={design} />
          </button>
        ))}
      </div>
    </section>
  )
}
```

### キーボードナビゲーション

```typescript
// app/components/ui/Tabs.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

export default function Tabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % tabs.length
      setActiveIndex(nextIndex)
      tabRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (index - 1 + tabs.length) % tabs.length
      setActiveIndex(prevIndex)
      tabRefs.current[prevIndex]?.focus()
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="QR設定">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={activeIndex === index ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeIndex !== index}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

---

## コンポーネントテスト

```typescript
// app/components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should display spinner when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })

  it('should apply correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })
})
```

---

## 🌐 必須参照リソース

### React & Next.js

1. [React Documentation](https://react.dev/) - React公式ドキュメント
2. [Next.js Documentation](https://nextjs.org/docs) - Next.js完全ガイド
3. [React Server Components](https://react.dev/reference/rsc/server-components) - RSC詳細
4. [Next.js App Router](https://nextjs.org/docs/app) - App Router
5. [React Hooks Reference](https://react.dev/reference/react) - フック一覧

### コンポーネントライブラリ

6. [Radix UI](https://www.radix-ui.com/) - アクセシブルなHeadless UI
7. [shadcn/ui](https://ui.shadcn.com/) - コピペ可能なコンポーネント集
8. [Headless UI](https://headlessui.com/) - Tailwind公式UIライブラリ

### スタイリング

9. [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSS
10. [CVA (Class Variance Authority)](https://cva.style/docs) - バリアント管理
11. [Tailwind CSS Forms](https://github.com/tailwindlabs/tailwindcss-forms) - フォームスタイル

### アクセシビリティ

12. [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - ARIAパターン集
13. [WebAIM](https://webaim.org/) - アクセシビリティガイド
14. [axe DevTools](https://www.deque.com/axe/devtools/) - アクセシビリティ検証ツール

### パフォーマンス

15. [Web.dev Performance](https://web.dev/fast/) - パフォーマンス最適化ガイド

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
**フレームワーク**: Next.js 16 + React 19
