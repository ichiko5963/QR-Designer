# セキュリティ & コンプライアンス完全ガイド - QR Designer v3.0

> **最終更新**: 2026-01-04
> **対象**: QR Designer v3.0 本番環境
> **セキュリティレベル**: Enterprise Grade

---

## 📚 目次

1. [セキュリティアーキテクチャ概要](#セキュリティアーキテクチャ概要)
2. [認証とアクセス制御](#認証とアクセス制御)
3. [データ保護とプライバシー](#データ保護とプライバシー)
4. [APIセキュリティ](#apiセキュリティ)
5. [インフラストラクチャセキュリティ](#インフラストラクチャセキュリティ)
6. [脅威モデリングと対策](#脅威モデリングと対策)
7. [コンプライアンス](#コンプライアンス)
8. [セキュリティ監視とインシデント対応](#セキュリティ監視とインシデント対応)
9. [セキュリティチェックリスト](#セキュリティチェックリスト)

---

## セキュリティアーキテクチャ概要

### 多層防御戦略（Defense in Depth）

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 7: Application Security (認証・認可・入力検証)          │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: API Security (レート制限・CORS・トークン検証)         │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Database Security (RLS・暗号化・監査ログ)             │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Transport Security (HTTPS/TLS 1.3・HSTS)            │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Infrastructure (Vercel Firewall・DDoS保護)           │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Network Security (VPC・ファイアウォールルール)        │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Physical Security (Vercel・Supabase データセンター)  │
└─────────────────────────────────────────────────────────────┘
```

### セキュリティ原則

1. **最小権限の原則（Least Privilege）**: 必要最小限のアクセス権限のみ付与
2. **ゼロトラストアーキテクチャ**: すべてのリクエストを検証
3. **暗号化（Encryption Everywhere）**: データの保存時・転送時ともに暗号化
4. **多要素防御（Defense in Depth）**: 複数のセキュリティレイヤー
5. **監査可能性（Auditability）**: すべての操作をログに記録

---

## 認証とアクセス制御

### Google OAuth 2.0実装

```typescript
// lib/supabase/auth.ts
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'email profile', // 最小限のスコープ
    }
  })

  if (error) {
    console.error('OAuth error:', error)
    throw new Error('認証に失敗しました')
  }

  return data
}
```

### セッション管理とセキュリティ

```typescript
// middleware.ts - セッション検証
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // セッション検証
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // セッションタイムアウト検証（24時間）
  if (session) {
    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000 // 24時間

    if (sessionAge > MAX_SESSION_AGE) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // 保護されたルートのチェック
  if (req.nextUrl.pathname.startsWith('/history') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/history/:path*', '/api/:path*']
}
```

### Row Level Security (RLS) ポリシー

```sql
-- user_profilesテーブルのRLS
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- qr_historyテーブルのRLS
CREATE POLICY "Users can view own history"
ON qr_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
ON qr_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service Roleのみが全データにアクセス可能
CREATE POLICY "Service role full access"
ON user_profiles
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
```

---

## データ保護とプライバシー

### データ暗号化

```typescript
// lib/security/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32バイト

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // IV + 認証タグ + 暗号化データ
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### 個人情報保護（GDPR/CCPA対応）

```typescript
// lib/privacy/data-retention.ts
export async function deleteUserData(userId: string) {
  const supabase = createClient()

  // GDPR準拠: ユーザーデータの完全削除
  await supabase.from('qr_history').delete().eq('user_id', userId)
  await supabase.from('user_profiles').delete().eq('user_id', userId)

  // 監査ログに記録
  await supabase.from('audit_logs').insert({
    event_type: 'user_data_deleted',
    user_id: userId,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP()
  })
}

// データ保持期間の自動削除（90日）
export async function cleanupOldData() {
  const supabase = createClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  await supabase
    .from('qr_history')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
}
```

### PII（個人識別情報）のマスキング

```typescript
// lib/privacy/pii-masking.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local.charAt(0) + '***' + local.slice(-1)
  return `${maskedLocal}@${domain}`
}

export function maskIP(ip: string): string {
  // IPv4: 192.168.1.100 → 192.168.*.*
  return ip.replace(/\.\d+\.\d+$/, '.*.*')
}

// ログ出力時に自動マスキング
export function sanitizeLog(data: any) {
  const sanitized = { ...data }

  if (sanitized.email) sanitized.email = maskEmail(sanitized.email)
  if (sanitized.ip) sanitized.ip = maskIP(sanitized.ip)

  return sanitized
}
```

---

## APIセキュリティ

### レート制限実装

```typescript
// lib/security/rate-limit.ts
import { createClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  windowMs: number // タイムウィンドウ（ミリ秒）
  maxRequests: number // 最大リクエスト数
}

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = await createClient()

  const windowStart = new Date(Date.now() - config.windowMs)

  // 過去のリクエストカウント
  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString())

  if (error) throw error

  if ((count || 0) >= config.maxRequests) {
    const retryAfter = Math.ceil(config.windowMs / 1000) // 秒単位
    return { allowed: false, retryAfter }
  }

  // リクエストを記録
  await supabase.from('rate_limit_logs').insert({
    user_id: userId,
    endpoint,
    created_at: new Date().toISOString()
  })

  return { allowed: true }
}
```

### 入力検証とサニタイゼーション

```typescript
// lib/security/validation.ts
import { z } from 'zod'
import validator from 'validator'

// URLスキーマ検証
export const urlSchema = z.string()
  .url('有効なURLを入力してください')
  .refine(
    (url) => {
      const parsed = new URL(url)
      // 安全なプロトコルのみ許可
      return ['http:', 'https:'].includes(parsed.protocol)
    },
    { message: 'HTTP/HTTPSのみサポートしています' }
  )
  .refine(
    (url) => {
      // SSRFを防ぐためローカルIPを拒否
      const parsed = new URL(url)
      const hostname = parsed.hostname

      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
      ) {
        return false
      }
      return true
    },
    { message: 'ローカルネットワークのURLは使用できません' }
  )

// QRコード設定検証
export const qrConfigSchema = z.object({
  size: z.number().int().min(256).max(4096),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']),
  cornerRadius: z.number().min(0).max(50),
  logoSize: z.number().min(10).max(35).optional(),
  format: z.enum(['png', 'jpeg', 'svg', 'pdf'])
})

// HTMLサニタイゼーション
export function sanitizeHTML(html: string): string {
  return validator.escape(html)
}

// SQLインジェクション対策（Supabaseクライアントは自動エスケープ）
export function sanitizeSQL(input: string): string {
  // Supabaseは自動的にパラメータ化クエリを使用
  // 追加の検証として危険な文字を除去
  return input.replace(/['";\\]/g, '')
}
```

### CORS設定

```typescript
// next.config.ts
const config = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://qr-designer.vercel.app'
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24時間
          }
        ]
      }
    ]
  }
}
```

---

## インフラストラクチャセキュリティ

### 環境変数の安全な管理

```typescript
// lib/security/env-validator.ts
import { z } from 'zod'

const envSchema = z.object({
  // 必須の秘密鍵
  GOOGLE_GEMINI_API_KEY: z.string().min(30),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),
  ENCRYPTION_KEY: z.string().length(64), // 32バイトのhex

  // パブリック変数
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),

  // オプション
  SENTRY_DSN: z.string().url().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional()
})

export function validateEnv() {
  try {
    envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 環境変数検証エラー:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

// アプリケーション起動時に実行
if (process.env.NODE_ENV === 'production') {
  validateEnv()
}
```

### Secret Rotation（キーローテーション）

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Supabase JWT Secret Rotation
echo "🔄 Rotating Supabase JWT Secret..."
supabase secrets set JWT_SECRET=$(openssl rand -hex 32)

# Encryption Key Rotation
echo "🔄 Rotating Encryption Key..."
NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)
vercel env add ENCRYPTION_KEY production <<< "$NEW_ENCRYPTION_KEY"

# Gemini API Key Rotation (手動で新しいキーを生成)
echo "⚠️  Gemini API Keyは手動でGoogle AI Studioで生成してください"
echo "https://makersuite.google.com/app/apikey"

echo "✅ Secret rotation completed"
```

---

## 脅威モデリングと対策

### OWASP Top 10対策

| 脅威 | 対策 | 実装 |
|------|------|------|
| **A01: Broken Access Control** | RLS + 認証チェック | Supabase RLS ポリシー |
| **A02: Cryptographic Failures** | TLS 1.3 + AES-256-GCM | Vercel自動HTTPS + 暗号化関数 |
| **A03: Injection** | パラメータ化クエリ | Supabase自動エスケープ + Zod検証 |
| **A04: Insecure Design** | セキュアアーキテクチャ | 多層防御 + ゼロトラスト |
| **A05: Security Misconfiguration** | 環境変数検証 | env-validator.ts |
| **A06: Vulnerable Components** | 依存関係スキャン | npm audit + Dependabot |
| **A07: Authentication Failures** | OAuth 2.0 + セッション管理 | Supabase Auth + middleware |
| **A08: Software Integrity** | SRI + コード署名 | Vercel自動最適化 |
| **A09: Logging Failures** | 監査ログ | audit_logs テーブル |
| **A10: SSRF** | URL検証 + ネットワーク制限 | urlSchema + ローカルIP拒否 |

### DDoS対策

```typescript
// lib/security/ddos-protection.ts
import { NextRequest } from 'next/server'

// IP-based rate limiting (Vercel Edge Middleware)
export async function ddosProtection(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for')

  if (!ip) {
    return new Response('Forbidden', { status: 403 })
  }

  // Vercel Firewall Rules (設定例)
  // Rate Limit: 100 requests per minute per IP
  // Burst: 20 requests per second

  return null // 正常なリクエスト
}
```

---

## コンプライアンス

### GDPR準拠

```typescript
// app/api/privacy/export-data/route.ts
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ユーザーデータのエクスポート（GDPR Article 20）
  const [profile, history] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('qr_history').select('*').eq('user_id', user.id)
  ])

  const exportData = {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    profile: profile.data,
    history: history.data,
    exported_at: new Date().toISOString()
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename=my-data.json'
    }
  })
}
```

### Cookie同意管理

```typescript
// app/components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)

    // Google Analyticsを有効化
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          このサイトはCookieを使用してユーザー体験を向上させています。
          <a href="/privacy" className="underline ml-2">プライバシーポリシー</a>
        </p>
        <button
          onClick={acceptCookies}
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
        >
          同意する
        </button>
      </div>
    </div>
  )
}
```

---

## セキュリティ監視とインシデント対応

### セキュリティイベントログ

```sql
-- 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT,
  status TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
```

### 異常検知アラート

```typescript
// lib/security/anomaly-detection.ts
export async function detectAnomalies(userId: string) {
  const supabase = createClient()

  // 過去1時間のリクエスト数
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  // 異常な頻度（1時間に100回以上）
  if ((count || 0) > 100) {
    await sendSecurityAlert({
      type: 'HIGH_FREQUENCY_ACCESS',
      userId,
      count,
      threshold: 100
    })
  }

  // 異常なIPアドレス変更
  const { data: recentIPs } = await supabase
    .from('audit_logs')
    .select('ip_address')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())
    .limit(10)

  const uniqueIPs = new Set(recentIPs?.map((log) => log.ip_address))
  if (uniqueIPs.size > 3) {
    await sendSecurityAlert({
      type: 'MULTIPLE_IP_ADDRESSES',
      userId,
      ipCount: uniqueIPs.size
    })
  }
}
```

### インシデント対応プロセス

```markdown
## インシデント対応手順

### Phase 1: 検知 (Detection)
1. 自動アラート受信（Sentry, Vercel Logs）
2. 異常パターンの特定
3. 影響範囲の初期評価

### Phase 2: 封じ込め (Containment)
1. 疑わしいIPをブロック
2. 影響を受けたユーザーセッションを無効化
3. レート制限を強化

### Phase 3: 調査 (Investigation)
1. 監査ログを分析
2. 攻撃ベクトルを特定
3. データ侵害の有無を確認

### Phase 4: 復旧 (Recovery)
1. 脆弱性を修正
2. システムを復元
3. セキュリティパッチを適用

### Phase 5: 事後分析 (Post-Incident)
1. インシデントレポート作成
2. 再発防止策の策定
3. セキュリティポリシー更新
```

---

## セキュリティチェックリスト

### デプロイ前チェック

- [ ] **認証**
  - [ ] OAuth 2.0設定完了
  - [ ] セッションタイムアウト設定（24時間）
  - [ ] CSRF保護有効化

- [ ] **データ保護**
  - [ ] RLS有効化確認
  - [ ] 暗号化キー設定
  - [ ] バックアップ設定

- [ ] **API**
  - [ ] レート制限実装
  - [ ] 入力検証実装
  - [ ] CORS設定

- [ ] **インフラ**
  - [ ] HTTPS強制（HSTS）
  - [ ] 環境変数検証
  - [ ] Secret Rotation計画

- [ ] **監視**
  - [ ] エラートラッキング（Sentry）
  - [ ] 監査ログ有効化
  - [ ] アラート設定

### 月次セキュリティレビュー

- [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] 監査ログレビュー
- [ ] アクセス権限レビュー
- [ ] Secret Rotation実施
- [ ] セキュリティパッチ適用

---

## 🌐 必須参照リソース

### セキュリティガイドライン

1. [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Webアプリケーションセキュリティリスク
2. [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) - APIセキュリティ
3. [Next.js Security](https://nextjs.org/docs/authentication) - Next.js認証ベストプラクティス
4. [Vercel Security](https://vercel.com/docs/security) - Vercelセキュリティガイド
5. [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security) - RLSベストプラクティス

### コンプライアンス

6. [GDPR Official](https://gdpr.eu/) - GDPR完全ガイド
7. [CCPA Compliance](https://oag.ca.gov/privacy/ccpa) - カリフォルニア州プライバシー法
8. [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html) - 情報セキュリティ標準

### ツール

9. [Snyk](https://snyk.io/) - 脆弱性スキャナー
10. [Sentry](https://sentry.io/welcome/) - エラートラッキング
11. [npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit) - 依存関係セキュリティ
12. [OWASP ZAP](https://www.zaproxy.org/) - セキュリティテストツール

### 学習リソース

13. [Web Security Academy](https://portswigger.net/web-security) - 実践的セキュリティ学習
14. [Google Security Blog](https://security.googleblog.com/) - セキュリティ最新情報
15. [Krebs on Security](https://krebsonsecurity.com/) - セキュリティニュース

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
**セキュリティレベル**: Enterprise Grade
