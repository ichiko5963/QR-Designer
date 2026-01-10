# Supabase認証とデータベース設計 完全実装ガイド - QR Designer v3.0

## 📚 目次

1. [Supabase概要と選定理由](#supabase概要と選定理由)
2. [プロジェクトセットアップ](#プロジェクトセットアップ)
3. [データベーススキーマ設計](#データベーススキーマ設計)
4. [Row Level Security (RLS)実装](#row-level-security-rls実装)
5. [Google OAuth認証実装](#google-oauth認証実装)
6. [Next.js統合パターン](#nextjs統合パターン)
7. [本番環境での考慮事項](#本番環境での考慮事項)

---

## Supabase概要と選定理由

### Supabaseとは

Supabaseは「オープンソースのFirebase代替」として知られる、フルスタックバックエンドプラットフォームです。

**コアコンポーネント**:
```
Supabase Platform
├── PostgreSQL Database (リレーショナルDB)
├── Auth (認証システム)
├── Storage (オブジェクトストレージ)
├── Realtime (WebSocket)
├── Edge Functions (サーバーレス関数)
└── Vector (ベクトル検索 - AI用)
```

### Firebase vs Supabase比較

| 項目 | Supabase | Firebase |
|------|----------|----------|
| データベース | PostgreSQL (SQL) | Firestore (NoSQL) |
| クエリ言語 | SQL | 限定的クエリ |
| トランザクション | ✅ ACID保証 | ⚠️ 制限あり |
| 複雑なJOIN | ✅ 可能 | ❌ 不可 |
| データエクスポート | ✅ 簡単(SQL) | ⚠️ 複雑 |
| 料金(1GB) | $0.125 | $0.18 |
| 無料枠 | 500MB DB + 2GB帯域 | 1GB保存 + 10GB帯域 |
| オープンソース | ✅ | ❌ |
| セルフホスト | ✅ 可能 | ❌ 不可 |

### QR Designer v3.0での選定理由

**✅ 採用理由**:
1. **SQLの柔軟性**: 複雑なクエリ（ユーザー履歴のフィルタリング等）が容易
2. **RLS（Row Level Security）**: SQL-basedの強力な権限制御
3. **コスト効率**: Firebase比で30%削減
4. **TypeScript統合**: 自動型生成で開発効率向上
5. **移植性**: 必要時にセルフホスト可能

---

## プロジェクトセットアップ

### Supabaseプロジェクト作成

**ステップ1**: Supabaseダッシュボードへアクセス
```
https://supabase.com/dashboard
```

**ステップ2**: 新規プロジェクト作成
1. 「New Project」をクリック
2. プロジェクト名: `qr-designer-prod`
3. データベースパスワード: 強力なパスワードを生成（保存必須）
4. リージョン: `Tokyo (ap-northeast-1)` （日本ユーザー向け）
5. Pricing Plan: `Free` (開発用) → `Pro` (本番用: $25/月)

**ステップ3**: 環境変数取得

```bash
# .env.local

# Supabase URL（公開情報）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Supabase Anon Key（公開可能、RLSで保護）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key（機密情報、サーバーサイドのみ）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### パッケージインストール

```bash
# Supabase SDK
npm install @supabase/supabase-js @supabase/ssr

# 型定義
npm install -D @supabase/auth-helpers-nextjs
```

### Supabaseクライアント作成

#### クライアントサイド用

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### サーバーサイド用（App Router対応）

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component内でのset呼び出しは無視
            // Middleware内でのみ動作
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // エラー無視
          }
        }
      }
    }
  )
}
```

---

## データベーススキーマ設計

### ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│   auth.users        │ (Supabase内蔵)
│─────────────────────│
│ id (UUID) PK        │
│ email               │
│ created_at          │
└─────────────────────┘
          │
          │ 1:1
          ↓
┌─────────────────────┐
│  user_profiles      │
│─────────────────────│
│ user_id (UUID) PK,FK│──┐
│ plan_type           │  │
│ last_generated_at   │  │
│ total_generated     │  │
│ created_at          │  │
│ updated_at          │  │
└─────────────────────┘  │
          │              │
          │ 1:N          │
          ↓              │
┌─────────────────────┐  │
│   qr_history        │  │
│─────────────────────│  │
│ id (UUID) PK        │  │
│ user_id (UUID) FK   │──┘
│ url                 │
│ design_name         │
│ design_config       │
│ qr_image_url        │
│ format              │
│ created_at          │
└─────────────────────┘
```

### テーブル定義SQL

#### 1. user_profiles テーブル

```sql
-- ユーザープロフィールテーブル
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  total_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックス
CREATE INDEX idx_user_profiles_plan_type ON user_profiles(plan_type);
CREATE INDEX idx_user_profiles_last_generated ON user_profiles(last_generated_at);

-- コメント
COMMENT ON TABLE user_profiles IS 'ユーザーの拡張プロフィール情報';
COMMENT ON COLUMN user_profiles.plan_type IS 'プランタイプ: free または pro';
COMMENT ON COLUMN user_profiles.last_generated_at IS '最後にQRコードを生成した日時（レート制限用）';
COMMENT ON COLUMN user_profiles.total_generated IS '累計生成回数';

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. qr_history テーブル

```sql
-- QRコード生成履歴テーブル
CREATE TABLE qr_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  design_name TEXT NOT NULL,
  design_config JSONB NOT NULL,
  qr_image_url TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'png' CHECK (format IN ('png', 'jpg', 'svg', 'pdf')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックス（パフォーマンス最適化）
CREATE INDEX idx_qr_history_user_id ON qr_history(user_id);
CREATE INDEX idx_qr_history_created_at ON qr_history(created_at DESC);
CREATE INDEX idx_qr_history_user_created ON qr_history(user_id, created_at DESC);

-- GINインデックス（JSONBフィールド用）
CREATE INDEX idx_qr_history_design_config ON qr_history USING GIN (design_config);

-- コメント
COMMENT ON TABLE qr_history IS 'QRコードの生成履歴';
COMMENT ON COLUMN qr_history.design_config IS 'デザイン設定（JSON形式）';
COMMENT ON COLUMN qr_history.qr_image_url IS 'QRコード画像のURL（Base64 または Supabase Storage）';

-- フルテキスト検索（オプション）
ALTER TABLE qr_history ADD COLUMN url_tsvector tsvector;

CREATE INDEX idx_qr_history_url_search ON qr_history USING GIN (url_tsvector);

CREATE OR REPLACE FUNCTION qr_history_url_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.url_tsvector := to_tsvector('english', NEW.url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qr_history_url_search_update
  BEFORE INSERT OR UPDATE OF url ON qr_history
  FOR EACH ROW
  EXECUTE FUNCTION qr_history_url_search_trigger();
```

### TypeScript型定義の自動生成

```bash
# Supabase CLIインストール
npm install -g supabase

# プロジェクトとリンク
supabase link --project-ref xxxxxxxxxxxxx

# 型定義生成
supabase gen types typescript --project-id xxxxxxxxxxxxx > types/database.types.ts
```

生成された型の使用例:

```typescript
// types/database.types.ts（自動生成）
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          plan_type: 'free' | 'pro'
          last_generated_at: string | null
          total_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan_type?: 'free' | 'pro'
          last_generated_at?: string | null
          total_generated?: number
        }
        Update: {
          plan_type?: 'free' | 'pro'
          last_generated_at?: string | null
          total_generated?: number
        }
      }
      qr_history: {
        Row: {
          id: string
          user_id: string
          url: string
          design_name: string
          design_config: Json
          qr_image_url: string
          format: 'png' | 'jpg' | 'svg' | 'pdf'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          design_name: string
          design_config: Json
          qr_image_url: string
          format?: 'png' | 'jpg' | 'svg' | 'pdf'
        }
        Update: {
          url?: string
          design_name?: string
          design_config?: Json
          qr_image_url?: string
          format?: 'png' | 'jpg' | 'svg' | 'pdf'
        }
      }
    }
  }
}

// 使用例
import { Database } from '@/types/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type QRHistory = Database['public']['Tables']['qr_history']['Row']
```

---

## Row Level Security (RLS)実装

### RLSの概念

Row Level Security (RLS)は、**SQLレベルでのアクセス制御**機能です。ユーザーは自分のデータのみにアクセスでき、他のユーザーのデータは見えません。

**従来のアプローチ（アプリケーション層）**:
```typescript
// ❌ アプリケーション側で制御（バグのリスク）
const { data } = await supabase
  .from('qr_history')
  .select()
  .eq('user_id', userId) // 忘れるとデータ漏洩!
```

**RLSアプローチ（データベース層）**:
```typescript
// ✅ RLSが自動的に制御（安全）
const { data } = await supabase
  .from('qr_history')
  .select()
// user_idフィルタ不要！RLSが自動適用
```

### user_profiles のRLSポリシー

```sql
-- RLS有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー1: 自分のプロフィールのみ参照可能
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- ポリシー2: 自分のプロフィールのみ挿入可能
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ポリシー3: 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ポリシー4: プロフィール削除は禁止（監査証跡保持）
-- DELETEポリシーなし = 誰も削除できない
```

### qr_history のRLSポリシー

```sql
-- RLS有効化
ALTER TABLE qr_history ENABLE ROW LEVEL SECURITY;

-- ポリシー1: 自分の履歴のみ参照可能
CREATE POLICY "Users can view own history"
ON qr_history
FOR SELECT
USING (auth.uid() = user_id);

-- ポリシー2: 自分の履歴のみ挿入可能
CREATE POLICY "Users can insert own history"
ON qr_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ポリシー3: 自分の履歴のみ削除可能
CREATE POLICY "Users can delete own history"
ON qr_history
FOR DELETE
USING (auth.uid() = user_id);

-- ポリシー4: 更新は禁止（不変性保証）
-- UPDATEポリシーなし = 誰も更新できない
```

### 管理者用ポリシー（オプション）

```sql
-- 管理者は全てのデータを閲覧可能
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND plan_type = 'admin'
  )
);
```

---

## Google OAuth認証実装

### Supabase側設定

**ステップ1**: Google Cloud Consoleでプロジェクト作成
```
https://console.cloud.google.com/
```

**ステップ2**: OAuth 2.0クライアントID作成
1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションタイプ: `ウェブアプリケーション`
4. 承認済みのリダイレクトURI:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
5. クライアントIDとシークレットをコピー

**ステップ3**: Supabaseダッシュボードで設定
1. `Authentication` → `Providers` → `Google`
2. 「Enable」をON
3. Client IDとClient Secretを貼り付け
4. 保存

### Next.js側実装

#### 認証ボタンコンポーネント

```typescript
// app/components/AuthButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 現在のユーザー取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 認証状態の監視
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('Sign in error:', error.message)
      alert('ログインに失敗しました')
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error.message)
    } else {
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="w-24 h-10 bg-gray-200 animate-pulse rounded"></div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.user_metadata.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-700">
            {user.user_metadata.full_name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Googleでログイン
    </button>
  )
}
```

#### 認証コールバックAPI

```typescript
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    // 認証コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 成功時: ユーザープロフィールを自動作成
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        // user_profilesに存在確認
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        // 存在しない場合は作成
        if (!profile) {
          await supabase.from('user_profiles').insert({
            user_id: user.id,
            plan_type: 'free',
            total_generated: 0
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラー時: ログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

---

## Next.js統合パターン

### Server Componentでのデータ取得

```typescript
// app/history/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // RLSにより自動的に user_id でフィルタされる
  const { data: history } = await supabase
    .from('qr_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">生成履歴</h1>
      <div className="grid gap-4">
        {history?.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{item.design_name}</h3>
            <p className="text-sm text-gray-600">{item.url}</p>
            <img src={item.qr_image_url} alt="QR Code" className="w-32 h-32 mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### API Routeでの認証とレート制限

```typescript
// app/api/generate-qr/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'ログインが必要です' },
      { status: 401 }
    )
  }

  // ユーザープロフィール取得
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('plan_type, last_generated_at, total_generated')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    )
  }

  // レート制限チェック（無料プラン）
  if (profile.plan_type === 'free') {
    const lastGenerated = profile.last_generated_at
      ? new Date(profile.last_generated_at)
      : null

    if (lastGenerated) {
      const hoursSince =
        (new Date().getTime() - lastGenerated.getTime()) / (1000 * 60 * 60)

      if (hoursSince < 168) {
        // 1週間 = 168時間
        const remainingDays = Math.ceil((168 - hoursSince) / 24)

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `無料プランは1週間に1回までです。あと${remainingDays}日で再生成可能です。`,
            upgradeUrl: '/pricing'
          },
          { status: 429 }
        )
      }
    }
  }

  // QRコード生成処理...
  const qrCode = await generateQRCode(/* ... */)

  // 履歴保存（RLSにより自動的にuser_idチェック）
  await supabase.from('qr_history').insert({
    user_id: user.id,
    url: /* ... */,
    design_name: /* ... */,
    design_config: /* ... */,
    qr_image_url: qrCode,
    format: 'png'
  })

  // プロフィール更新
  await supabase
    .from('user_profiles')
    .update({
      last_generated_at: new Date().toISOString(),
      total_generated: profile.total_generated + 1
    })
    .eq('user_id', user.id)

  return NextResponse.json({
    success: true,
    qrCode
  })
}
```

---

## 本番環境での考慮事項

### データベース最適化

#### 1. インデックスチューニング

```sql
-- クエリ実行計画の確認
EXPLAIN ANALYZE
SELECT * FROM qr_history
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 50;

-- 遅いクエリの特定
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 2. 接続プーリング（Supavisor）

```typescript
// 直接接続（開発用）
const directConnectionString =
  'postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres'

// プーリング接続（本番用）
const poolingConnectionString =
  'postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres'
```

### バックアップとリカバリ

```sql
-- ポイントインタイムリカバリ（PITR）
-- Supabase Proプランで自動有効

-- 手動バックアップ
pg_dump -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

-- リストア
pg_restore -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  backup_20260104.dump
```

### モニタリング

```typescript
// Supabaseダッシュボードで監視:
// - Database Health
// - Active Connections
// - Query Performance
// - API Usage

// カスタムアラート設定
// Settings → Alerts で設定可能
```

---

## 🌐 必須参照リソース

### 公式ドキュメント

1. [Supabase Documentation](https://supabase.com/docs) - 公式ドキュメント
2. [Supabase Auth Guide](https://supabase.com/docs/guides/auth) - 認証ガイド
3. [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) - RLS詳細
4. [Supabase with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Next.js統合
5. [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL公式

### 実装記事・チュートリアル

6. [Building a SaaS with Supabase](https://supabase.com/blog/supabase-saas) - SaaS構築ガイド
7. [RLS Best Practices](https://supabase.com/blog/row-level-security-best-practices) - RLSベストプラクティス
8. [Database Optimization Guide](https://supabase.com/docs/guides/database/performance-tuning) - パフォーマンスチューニング
9. [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase) - Firebase比較
10. [OAuth Implementation Guide](https://supabase.com/docs/guides/auth/social-login/auth-google) - OAuth実装

### 追加リソース

11. [Supabase GitHub](https://github.com/supabase/supabase) - ソースコード
12. [Supabase Discord Community](https://discord.supabase.com/) - コミュニティサポート
13. [Stack Overflow - Supabase Tag](https://stackoverflow.com/questions/tagged/supabase) - Q&A
14. [Supabase YouTube Channel](https://www.youtube.com/@Supabase) - 動画チュートリアル
15. [Awesome Supabase](https://github.com/lyqht/awesome-supabase) - リソース集

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
