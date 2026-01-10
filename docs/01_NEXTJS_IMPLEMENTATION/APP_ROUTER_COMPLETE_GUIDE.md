# Next.js 14 App Router 完全実装ガイド - QR Designer v3.0

## 📚 目次

1. [App Routerの基礎理解](#app-routerの基礎理解)
2. [プロジェクト構造設計](#プロジェクト構造設計)
3. [Server ComponentsとClient Components](#server-componentsとclient-components)
4. [ルーティングとナビゲーション](#ルーティングとナビゲーション)
5. [データフェッチング戦略](#データフェッチング戦略)
6. [メタデータとSEO最適化](#メタデータとseo最適化)
7. [本番環境での考慮事項](#本番環境での考慮事項)

---

## App Routerの基礎理解

### Pages Routerからの進化

Next.js 14のApp Routerは、従来のPages Routerから大きく進化し、React Server Components (RSC)を完全にサポートしています。

**主な変更点**:

```typescript
// ❌ 旧: Pages Router (pages/index.tsx)
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  const data = await fetchData()
  return { props: { data } }
}

export default function Page({ data }) {
  return <div>{data}</div>
}

// ✅ 新: App Router (app/page.tsx)
async function Page() {
  const data = await fetchData() // サーバーで直接実行
  return <div>{data}</div>
}

export default Page
```

### App Routerの利点

| 機能 | Pages Router | App Router |
|------|-------------|-----------|
| Server Components | ❌ | ✅ |
| ネストレイアウト | ⚠️ 制限あり | ✅ 完全サポート |
| ストリーミング | ❌ | ✅ |
| 並列ルート | ❌ | ✅ |
| インターセプト | ❌ | ✅ |
| TypeScript統合 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| パフォーマンス | 良い | 優れている |

---

## プロジェクト構造設計

### QR Designer v3.0のディレクトリ構造

```
qr-designer/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # ホームページ
│   ├── globals.css                   # グローバルスタイル
│   │
│   ├── components/                   # クライアントコンポーネント
│   │   ├── URLInput.tsx
│   │   ├── DesignGrid.tsx
│   │   ├── QRPreview.tsx
│   │   ├── AuthButton.tsx
│   │   └── CustomizePanel.tsx
│   │
│   ├── api/                          # API Routes
│   │   ├── analyze-url/
│   │   │   └── route.ts
│   │   ├── generate-designs/
│   │   │   └── route.ts
│   │   ├── generate-qr/
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   │
│   ├── history/                      # 履歴ページ
│   │   ├── page.tsx
│   │   └── loading.tsx
│   │
│   └── pricing/                      # 料金ページ
│       └── page.tsx
│
├── lib/                              # ビジネスロジック
│   ├── ai/
│   │   ├── gemini.ts
│   │   ├── analyze.ts
│   │   └── generate-designs.ts
│   ├── qr/
│   │   └── generator.ts
│   ├── scraper/
│   │   └── cheerio.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
│
├── types/                            # TypeScript型定義
│   ├── analysis.ts
│   ├── design.ts
│   ├── qr.ts
│   └── env.d.ts
│
├── public/                           # 静的ファイル
│   └── assets/
│
├── .env.local                        # 環境変数
├── next.config.ts                    # Next.js設定
├── tailwind.config.ts                # Tailwind設定
├── tsconfig.json                     # TypeScript設定
└── package.json
```

### ファイル規約の理解

```typescript
// app/ディレクトリ内の特殊ファイル

layout.tsx      // 共有レイアウト（子ルートで再利用）
page.tsx        // ページコンポーネント（URLに対応）
loading.tsx     // ローディングUI（Suspenseフォールバック）
error.tsx       // エラーUI（Error Boundary）
not-found.tsx   // 404ページ
route.ts        // APIルート（Server-side only）
template.tsx    // レイアウトの代替（毎回再マウント）
default.tsx     // 並列ルートのフォールバック
```

---

## Server ComponentsとClient Components

### Server Components（デフォルト）

**特徴**:
- サーバーでのみ実行される
- JavaScriptバンドルに含まれない → パフォーマンス向上
- データベース、ファイルシステム、APIキーに直接アクセス可能
- `useState`, `useEffect`等のReact Hooksは使用不可

**QR Designerでの使用例**:

```typescript
// app/history/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryList from '@/app/components/HistoryList'

export default async function HistoryPage() {
  const supabase = await createClient()

  // サーバーで認証チェック
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // サーバーでデータ取得
  const { data: history } = await supabase
    .from('qr_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">生成履歴</h1>
      <HistoryList history={history} />
    </div>
  )
}
```

### Client Components

**特徴**:
- ブラウザで実行される
- インタラクティブ機能が必要な場合に使用
- `'use client'`ディレクティブが必須
- React Hooksが使用可能

**QR Designerでの使用例**:

```typescript
// app/components/URLInput.tsx (Client Component)
'use client'

import { useState } from 'react'
import { z } from 'zod'

const URLSchema = z.string().url('有効なURLを入力してください')

interface URLInputProps {
  onAnalyze: (url: string) => Promise<void>
  isLoading: boolean
}

export default function URLInput({ onAnalyze, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // クライアントサイドバリデーション
      URLSchema.parse(url)
      await onAnalyze(url)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          URL
        </label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !url}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '解析中...' : 'デザインを生成'}
      </button>
    </form>
  )
}
```

### 使い分けのガイドライン

```typescript
// ✅ Server Componentを使用すべき場合:
- データフェッチング（DB、API）
- 機密情報へのアクセス（APIキー、トークン）
- 大きな依存関係（画像処理ライブラリ等）
- 静的コンテンツの表示

// ✅ Client Componentを使用すべき場合:
- イベントハンドラー（onClick, onChange等）
- React Hooks（useState, useEffect, useContext等）
- ブラウザAPI（localStorage, window等）
- カスタムHooks
```

### Compositionパターン

Server ComponentsとClient Componentsを効果的に組み合わせる:

```typescript
// ✅ 推奨パターン: Server Componentがラップ
// app/page.tsx (Server Component)
import ClientComponent from './components/ClientComponent'

async function ServerComponent() {
  const data = await fetchData() // サーバーで実行

  return (
    <div>
      <h1>サーバーコンテンツ</h1>
      <ClientComponent initialData={data} />
    </div>
  )
}

// ❌ 非推奨: Client ComponentからServer Componentをimport
'use client'

import ServerComponent from './ServerComponent' // エラー!

function ClientComponent() {
  return <ServerComponent />
}
```

---

## ルーティングとナビゲーション

### 動的ルート

```typescript
// app/qr/[id]/page.tsx
interface PageProps {
  params: {
    id: string
  }
}

export default async function QRDetailPage({ params }: PageProps) {
  const { id } = params

  const supabase = await createClient()
  const { data: qr } = await supabase
    .from('qr_history')
    .select('*')
    .eq('id', id)
    .single()

  if (!qr) {
    notFound() // 404ページへ
  }

  return (
    <div>
      <h1>{qr.design_name}</h1>
      <img src={qr.qr_image_url} alt="QR Code" />
    </div>
  )
}

// 静的パス生成（オプション）
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: qrs } = await supabase
    .from('qr_history')
    .select('id')
    .limit(100)

  return qrs?.map((qr) => ({
    id: qr.id
  })) || []
}
```

### プログラマティックナビゲーション

```typescript
'use client'

import { useRouter } from 'next/navigation'

export default function NavigationExample() {
  const router = useRouter()

  const handleNavigate = () => {
    // ナビゲーション
    router.push('/history')

    // 置き換え（履歴に残さない）
    router.replace('/login')

    // 戻る
    router.back()

    // 進む
    router.forward()

    // リフレッシュ（Server Componentsを再実行）
    router.refresh()
  }

  return <button onClick={handleNavigate}>移動</button>
}
```

### Linkコンポーネント

```typescript
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      {/* 基本的な使用 */}
      <Link href="/history">履歴</Link>

      {/* プリフェッチ無効化 */}
      <Link href="/pricing" prefetch={false}>
        料金プラン
      </Link>

      {/* 外部リンク */}
      <Link
        href="https://github.com/yourname/qr-designer"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </Link>

      {/* 動的ルート */}
      <Link href={`/qr/${qrId}`}>
        QR詳細
      </Link>
    </nav>
  )
}
```

---

## データフェッチング戦略

### Server Componentsでのフェッチ

```typescript
// app/page.tsx
async function fetchRecentQRs() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('qr_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching QRs:', error)
    return []
  }

  return data
}

export default async function HomePage() {
  // 並列フェッチ
  const [recentQRs, stats] = await Promise.all([
    fetchRecentQRs(),
    fetchStats()
  ])

  return (
    <div>
      <Stats data={stats} />
      <RecentQRList qrs={recentQRs} />
    </div>
  )
}
```

### ストリーミングとSuspense

```typescript
// app/history/page.tsx
import { Suspense } from 'react'
import HistoryList from './HistoryList'
import HistorySkeleton from './HistorySkeleton'

export default function HistoryPage() {
  return (
    <div>
      <h1>生成履歴</h1>

      {/* ストリーミング: HistoryListの読み込みを待たずにページ表示 */}
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryList />
      </Suspense>
    </div>
  )
}

// HistoryList.tsx (Server Component)
async function HistoryList() {
  const supabase = await createClient()
  const { data: history } = await supabase
    .from('qr_history')
    .select('*')
    .order('created_at', { ascending: false })

  // このコンポーネントの準備ができるまで、Suspenseがfallbackを表示
  return (
    <ul>
      {history?.map((item) => (
        <li key={item.id}>{item.design_name}</li>
      ))}
    </ul>
  )
}
```

### キャッシング戦略

```typescript
// デフォルト: 自動キャッシュ（無期限）
async function fetchData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

// オプション1: 再検証間隔指定
async function fetchDataWithRevalidate() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // 1時間ごとに再検証
  })
  return res.json()
}

// オプション2: キャッシュ無効化
async function fetchDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store' // キャッシュしない
  })
  return res.json()
}

// オプション3: ページレベル設定
export const dynamic = 'force-dynamic' // 常に動的レンダリング
export const revalidate = 3600 // ページ全体を1時間ごとに再検証

export default async function Page() {
  // ...
}
```

---

## メタデータとSEO最適化

### 静的メタデータ

```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | QR Designer',
    default: 'QR Designer - AI駆動型QRコード生成'
  },
  description: 'URLを入力するだけで、AIが最適でおしゃれなQRコードを自動生成',
  keywords: ['QRコード', '生成', 'AI', 'デザイン', '無料'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://qr-designer.com',
    siteName: 'QR Designer',
    images: [
      {
        url: 'https://qr-designer.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QR Designer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@qrdesigner',
    creator: '@yourname'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'your-google-verification-code'
  }
}
```

### 動的メタデータ

```typescript
// app/qr/[id]/page.tsx
import type { Metadata } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params

  const supabase = await createClient()
  const { data: qr } = await supabase
    .from('qr_history')
    .select('*')
    .eq('id', id)
    .single()

  if (!qr) {
    return {
      title: 'QRコードが見つかりません'
    }
  }

  return {
    title: `${qr.design_name} - QRコード`,
    description: `${qr.url}のQRコード`,
    openGraph: {
      images: [qr.qr_image_url]
    }
  }
}

export default async function QRDetailPage({ params }: PageProps) {
  // ...
}
```

### JSON-LD構造化データ

```typescript
// app/page.tsx
export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'QR Designer',
    description: 'AI駆動型QRコード生成ツール',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    author: {
      '@type': 'Organization',
      name: 'QR Designer'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>{/* コンテンツ */}</main>
    </>
  )
}
```

---

## 本番環境での考慮事項

### 環境変数の管理

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    GOOGLE_GEMINI_API_KEY: string
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}

// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  GOOGLE_GEMINI_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
})

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ 環境変数が不正です:', parsed.error.flatten().fieldErrors)
    throw new Error('環境変数の検証に失敗しました')
  }

  return parsed.data
}
```

### エラーハンドリング

```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentryなどにエラーを送信
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        再試行
      </button>
    </div>
  )
}
```

### ローディング状態

```typescript
// app/history/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}
```

### 404ページ

```typescript
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-600 mt-4">ページが見つかりませんでした</p>
      <Link
        href="/"
        className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        ホームに戻る
      </Link>
    </div>
  )
}
```

---

## 🌐 必須参照リソース

### 公式ドキュメント

1. [Next.js 14 Documentation](https://nextjs.org/docs) - 公式ドキュメント
2. [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration) - 移行ガイド
3. [React Server Components](https://react.dev/reference/rsc/server-components) - RSC詳細
4. [Next.js API Reference](https://nextjs.org/docs/app/api-reference) - API完全リファレンス
5. [Vercel Next.js Guide](https://vercel.com/docs/frameworks/nextjs) - Vercel統合

### 実装記事・チュートリアル

6. [Building Your First App Router Project](https://vercel.com/blog/building-your-first-app-router-project) - 実践チュートリアル
7. [Server vs Client Components](https://www.joshwcomeau.com/react/server-components/) - 詳細解説
8. [Next.js Performance Patterns](https://vercel.com/blog/next-js-performance-patterns) - パフォーマンス最適化
9. [App Router Best Practices](https://nextjs.org/docs/app/building-your-application/routing) - ベストプラクティス
10. [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript) - TypeScript統合

### 追加リソース

11. [Next.js Examples Repository](https://github.com/vercel/next.js/tree/canary/examples) - 公式サンプル集
12. [Next.js Discord Community](https://discord.gg/nextjs) - コミュニティサポート
13. [Stack Overflow - Next.js Tag](https://stackoverflow.com/questions/tagged/next.js) - Q&A
14. [Next.js YouTube Channel](https://www.youtube.com/@VercelHQ) - 動画チュートリアル
15. [Awesome Next.js](https://github.com/unicodeveloper/awesome-nextjs) - リソース集

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
