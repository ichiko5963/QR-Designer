# QR Designer v3.0

AIがURLの内容を理解して、最適でおしゃれなQRコードを自動生成するNext.jsアプリケーション。

## 機能

- **AI自動デザイン生成**: URLを入力するだけで、AIがサイトの内容を解析し、4種類のデザインを自動生成
- **認証不要でQRコード生成**: 誰でもすぐにQRコードを生成可能
- **履歴保存**: Googleアカウントでログインすると、生成したQRコードを履歴に保存
- **無料プラン**: 1週間に1回まで生成可能
- **有料プラン**: $4/月で無制限生成

## 技術スタック

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API (gemini-pro)
- **認証・データベース**: Supabase (PostgreSQL)
- **QRコード生成**: qrcode, sharp
- **HTML解析**: cheerio

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/schema.sql`のSQLを実行してテーブルを作成
3. Authentication > Providers でGoogle OAuthを有効化
4. Redirect URLsに `http://localhost:3000/api/auth/callback` を追加（本番環境のURLも追加）

### 3. パッケージのインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
qr-designer/
├── app/
│   ├── api/              # API Routes
│   │   ├── analyze-url/  # URL解析API
│   │   ├── generate-designs/  # デザイン生成API
│   │   ├── generate-qr/  # QRコード生成API
│   │   ├── get-history/ # 履歴取得API
│   │   └── auth/         # 認証コールバック
│   ├── components/       # Reactコンポーネント
│   ├── page.tsx         # メインページ
│   └── layout.tsx       # ルートレイアウト
├── lib/
│   ├── ai/              # AI関連（Gemini API）
│   ├── scraper/         # HTML解析（Cheerio）
│   ├── qr/              # QRコード生成
│   └── supabase/        # Supabaseクライアント
├── types/               # TypeScript型定義
└── supabase/            # データベーススキーマ
```

## ライセンス

MIT
