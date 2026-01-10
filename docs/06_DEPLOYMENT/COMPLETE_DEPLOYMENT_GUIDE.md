# デプロイメント＆運用 完全ガイド - QR Designer v3.0

## 📚 目次

1. [Vercelデプロイメント](#vercelデプロイメント)
2. [環境変数設定](#環境変数設定)
3. [セキュリティベストプラクティス](#セキュリティベストプラクティス)
4. [パフォーマンス最適化](#パフォーマンス最適化)
5. [モニタリングとアラート](#モニタリングとアラート)
6. [トラブルシューティング](#トラブルシューティング)
7. [運用チェックリスト](#運用チェックリスト)

---

## Vercelデプロイメント

### 初回デプロイ手順

**ステップ1: Vercelアカウント作成**
```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login
```

**ステップ2: プロジェクト設定**
```bash
# プロジェクトディレクトリで実行
cd /Users/ichiokanaoto/qr-designer

# デプロイ
vercel

# プロンプトに従って設定:
# - Set up and deploy? Y
# - Which scope? Your Account
# - Link to existing project? N
# - Project name? qr-designer
# - Directory? ./
# - Override settings? N
```

**ステップ3: 本番デプロイ**
```bash
# 本番環境にデプロイ
vercel --prod
```

### 自動デプロイ設定（GitHub連携）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Vercel設定ファイル

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1", "hnd1"], // US East + Tokyo
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0, stale-while-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

---

## 環境変数設定

### 本番環境変数

```bash
# Vercelダッシュボードで設定
# Settings → Environment Variables

# Google Gemini API
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Analytics (オプション)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### CLIでの環境変数設定

```bash
# 一括設定
vercel env add GOOGLE_GEMINI_API_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 環境変数一覧
vercel env ls
```

---

## セキュリティベストプラクティス

### 1. APIキー保護

```typescript
// lib/security/validate-env.ts
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
    console.error('❌ 環境変数エラー:', parsed.error.flatten().fieldErrors)
    throw new Error('環境変数の検証に失敗しました')
  }

  return parsed.data
}

// 起動時に検証
validateEnv()
```

### 2. CORS設定

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://qr-designer.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ]
  }
}
```

### 3. レート制限（Vercel Firewall）

```javascript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Vercel IPブロックリスト（悪意のあるIP）
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || []
  const clientIP = request.ip || request.headers.get('x-forwarded-for')

  if (clientIP && blockedIPs.includes(clientIP)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

---

## パフォーマンス最適化

### 1. 画像最適化

```typescript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 31536000 // 1年
  }
}
```

### 2. バンドルアナライザ

```bash
# バンドルサイズ分析
npm install -D @next/bundle-analyzer

# package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // ...設定
})
```

### 3. エッジキャッシング

```typescript
// app/api/analyze-url/route.ts
export const runtime = 'edge' // エッジランタイム使用
export const revalidate = 3600 // 1時間キャッシュ

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  // キャッシュヘッダー設定
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
    }
  })
}
```

---

## モニタリングとアラート

### Vercel Analytics統合

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### エラートラッキング（Sentry）

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
})
```

### カスタムメトリクス

```typescript
// lib/monitoring/metrics.ts
export function trackEvent(eventName: string, properties?: object) {
  if (typeof window !== 'undefined') {
    // Vercel Analytics
    window.va?.('event', eventName, properties)

    // Google Analytics
    window.gtag?.('event', eventName, properties)
  }
}

// 使用例
trackEvent('qr_generated', {
  design: 'ジュラシック',
  size: 512,
  hasLogo: true
})
```

---

## トラブルシューティング

### よくあるエラーと対処法

#### 1. ビルドエラー: "Module not found"

```bash
# 原因: node_modulesの不整合
# 対処:
rm -rf node_modules package-lock.json
npm install
```

#### 2. デプロイエラー: "Function payload too large"

```bash
# 原因: バンドルサイズ超過
# 対処: Dynamic Import使用
```

```typescript
// ❌ 静的import
import HeavyComponent from './HeavyComponent'

// ✅ 動的import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

#### 3. ランタイムエラー: "Sharp installation failed"

```json
// package.json
{
  "scripts": {
    "postinstall": "npm rebuild sharp"
  }
}
```

#### 4. Supabase接続エラー

```typescript
// 接続プーリング使用
const connectionString = process.env.SUPABASE_POOL_URL // ポート6543
```

### デバッグモード

```bash
# ローカルでVercel環境を再現
vercel dev

# ビルドログ確認
vercel logs --follow

# 環境変数確認
vercel env pull .env.local
```

---

## 運用チェックリスト

### デプロイ前チェック

- [ ] 環境変数が全て設定されている
- [ ] テストが全て通過している
- [ ] バンドルサイズが制限内（< 50MB）
- [ ] セキュリティスキャン完了
- [ ] データベースマイグレーション適用済み
- [ ] RLS（Row Level Security）有効化確認
- [ ] レート制限設定完了

### デプロイ後チェック

- [ ] ヘルスチェックエンドポイント正常
- [ ] 主要ページが正常表示
- [ ] API呼び出しが正常動作
- [ ] 認証フローが正常動作
- [ ] QRコード生成が正常動作
- [ ] モニタリングダッシュボード確認
- [ ] エラーログ確認（過去24時間）

### 週次チェック

- [ ] パフォーマンスメトリクス確認
- [ ] エラーレート確認（< 1%）
- [ ] データベース使用量確認
- [ ] API使用量とコスト確認
- [ ] セキュリティアラート確認

### 月次チェック

- [ ] 依存パッケージ更新
- [ ] セキュリティパッチ適用
- [ ] データバックアップ確認
- [ ] ログローテーション
- [ ] コスト分析とレビュー

---

## 🌐 必須参照リソース

### 公式ドキュメント

1. [Vercel Documentation](https://vercel.com/docs) - Vercel完全ガイド
2. [Next.js Deployment](https://nextjs.org/docs/deployment) - Next.jsデプロイ
3. [Vercel CLI](https://vercel.com/docs/cli) - CLIリファレンス
4. [Vercel Analytics](https://vercel.com/analytics) - アナリティクス
5. [Vercel Security](https://vercel.com/docs/security) - セキュリティガイド

### 実装記事・チュートリアル

6. [Production Checklist](https://vercel.com/docs/concepts/deployments/overview) - 本番チェックリスト
7. [Monitoring Best Practices](https://vercel.com/guides/monitoring-best-practices) - モニタリング
8. [Performance Optimization](https://vercel.com/blog/how-to-optimize-nextjs) - 最適化ガイド
9. [Security Best Practices](https://nextjs.org/docs/authentication) - セキュリティ
10. [Troubleshooting Guide](https://vercel.com/docs/platform/troubleshooting) - トラブルシューティング

### 追加リソース

11. [Vercel Community](https://github.com/vercel/vercel/discussions) - コミュニティ
12. [Stack Overflow - Vercel Tag](https://stackoverflow.com/questions/tagged/vercel) - Q&A
13. [Vercel Status](https://www.vercel-status.com/) - ステータスページ
14. [Vercel YouTube](https://www.youtube.com/@VercelHQ) - 動画チュートリアル
15. [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) - サンプル集

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
