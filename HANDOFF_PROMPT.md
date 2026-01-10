# Supabase認証フロー修正の引き継ぎプロンプト

## 現在の問題状況

Next.js 16.1.1 + Supabase + `@supabase/ssr`を使用したGoogle OAuth認証フローで、以下の問題が発生しています：

### 1. PKCE Code Verifierエラー
- **エラー**: `PKCE code verifier not found in storage`
- **発生箇所**: `/api/auth/callback`で`exchangeCodeForSession`を呼び出す際
- **原因**: サーバー側でOAuthを開始する際に、PKCE code verifierがクッキーに正しく保存されていない、またはコールバック時に読み取れていない

### 2. セッションが保存されない
- **エラー**: `[Dashboard Layout] Auth session missing!`
- **発生箇所**: `/dashboard`のレイアウトで`getUser()`を呼び出す際
- **症状**: ログイン成功後、ダッシュボードにリダイレクトされるが、セッションが存在しないため再度ホームページにリダイレクトされる

### 3. ログイン画面が見れなくなる問題（一部解決済み）
- **症状**: ログインしているユーザーがログイン画面（AuthButton）を見れなくなる
- **現在の状態**: `app/page.tsx`から認証チェックを削除し、AuthButtonコンポーネントに任せるように変更済み

## ユーザーの要望

1. **ログインしたらダッシュボードに遷移**: Google OAuthでログイン成功後、自動的に`/dashboard`にリダイレクトされる
2. **ログイン中は常にダッシュボードにいる状態**: ログインしているユーザーがホームページ（`/`）にアクセスした場合、自動的にダッシュボードにリダイレクトされる
3. **ログイン画面は常に表示**: ログインしていないユーザーは、常にログインボタン（AuthButton）を見ることができる

## 現在の実装状況

### ファイル構成

#### 1. `/app/api/auth/signin/route.ts`
- サーバー側でOAuthを開始するAPIルート
- `signInWithOAuth`を呼び出し、PKCE code verifierをクッキーに保存しようとしている
- リダイレクトレスポンスにクッキーを含めるように実装済み

#### 2. `/app/api/auth/callback/route.ts`
- OAuthコールバックを処理するAPIルート
- `exchangeCodeForSession`を呼び出してセッションを交換
- リダイレクトレスポンスを先に作成し、`setAll`メソッドでクッキーを設定するように実装済み
- **問題**: PKCE code verifierが見つからないエラーが発生

#### 3. `/app/dashboard/layout.tsx`
- ダッシュボードのレイアウトコンポーネント
- `getUser()`でユーザーを取得し、存在しない場合はホームページにリダイレクト
- **問題**: セッションが存在しないため、常にリダイレクトされる

#### 4. `/lib/supabase/server.ts`
- サーバー側のSupabaseクライアントを作成
- `createServerClient`を使用し、クッキーを設定するように実装済み

#### 5. `/lib/supabase/client.ts`
- クライアント側のSupabaseクライアントを作成
- `createBrowserClient`を使用（クッキー設定なし）

#### 6. `/app/components/AuthButton.tsx`
- ログイン/ログアウトボタンコンポーネント
- `/api/auth/signin`にリダイレクトするように変更済み
- ログイン済みユーザーがホームページにいる場合、ダッシュボードにリダイレクトするロジックを含む

## 技術スタック

- **フレームワーク**: Next.js 16.1.1 (App Router)
- **認証**: Supabase Auth (Google OAuth)
- **SSR**: `@supabase/ssr` v0.1.0
- **Supabase JS**: `@supabase/supabase-js` v2.39.0

## エラーログ

```
[Auth Callback] ERROR: PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.

[Dashboard Layout] Auth error or no user: "Auth session missing!"
[Dashboard Layout] Session status: "No session"
```

## 試した解決策（うまくいかなかった）

1. サーバー側でOAuthを開始するように変更（`/api/auth/signin`を作成）
2. コールバックルートでリダイレクトレスポンスを先に作成し、`setAll`メソッドでクッキーを設定
3. クッキーのオプション（path、sameSite、secure、httpOnly）を適切に設定
4. リダイレクトレスポンスにすべてのクッキーをコピー

## 期待される動作

1. ユーザーが「ログイン」ボタンをクリック
2. `/api/auth/signin`にリダイレクト → Google OAuth画面にリダイレクト（PKCE code verifierがクッキーに保存される）
3. Google認証後、`/api/auth/callback`にリダイレクト
4. PKCE code verifierをクッキーから読み取り、セッションを交換
5. セッションをクッキーに保存し、`/dashboard`にリダイレクト
6. ダッシュボードのレイアウトでセッションを読み取り、ユーザー情報を取得
7. ダッシュボードが正常に表示される

## 解決してほしいこと

1. **PKCE code verifierエラーの解決**: サーバー側でOAuthを開始する際に、PKCE code verifierがクッキーに正しく保存され、コールバック時に読み取れるようにする
2. **セッションの永続化**: ログイン成功後、セッションがクッキーに正しく保存され、ダッシュボードで読み取れるようにする
3. **動作確認**: ログイン → ダッシュボード遷移 → セッション維持が正常に動作することを確認

## 参考資料

- `@supabase/ssr`のドキュメント: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Next.js App RouterでのSupabase認証: https://supabase.com/docs/guides/auth/server-side/nextjs

## 注意事項

- 現在のコードは動作していないため、根本的な修正が必要
- `@supabase/ssr`の正しい使用方法に従って実装し直す必要がある可能性がある
- クッキーの設定方法や、サーバー/クライアント間でのクッキー共有方法を見直す必要がある
