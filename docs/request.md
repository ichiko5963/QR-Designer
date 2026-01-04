QR Designer v3.0 完全要件定義書
プロジェクト名: QR Designer v3.0 - Next.js AI-Powered Edition
作成日: 2025-01-04
バージョン: 3.0.0
技術スタック: Next.js (App Router) + TypeScript + AI API連携

📌 目次
プロジェクト概要
過去の要件からの進化
システム全体構成
機能要件
AI機能の詳細設計
デザイン要件
技術要件
API設計
データフロー
UI/UX設計
実装計画
セキュリティ要件
1. プロジェクト概要
1.1 プロジェクトの目的
「URLを入力するだけで、AIがそのサイトの内容を理解し、最適でおしゃれなQRコードデザインを自動生成する」

静的サイトでは実現不可能だったURLコンテンツ解析とAI自動デザイン生成をNext.jsのサーバーサイド機能で実現する。

1.2 コアコンセプト
URL入力 → AI解析 → コンテンツ理解 → 最適デザイン生成 → QRコード出力
例:

恐竜博物館のURL → 緑の恐竜をモチーフにしたQRコード
AIスタートアップのURL → 未来的なグラデーションQRコード
カフェのURL → 温かみのあるブラウン系QRコード
音楽フェスのURL → カラフルでポップなQRコード
1.3 ターゲットユーザー
マーケター: イベント、キャンペーン用QRコード
デザイナー: クライアント向けブランドQRコード
起業家: プロダクト、サービス用QRコード
学生: プレゼン、課題用QRコード
1.4 差別化ポイント
項目	従来のツール	QR Designer v3.0
デザイン生成	手動でカスタマイズ	AIが自動で最適化
コンテンツ理解	なし	URLの中身を解析
デザイン提案数	1-2種類	4種類を自動生成
ブランド整合性	低い	URLコンテンツに完全一致
ロゴ処理	手動調整	自動トリミング＋カラー抽出
使いやすさ	複雑	URL入力だけで完結
2. 過去の要件からの進化
2.1 チャット履歴の要件分析
📅 要件の変遷
Phase 1: カラフル＆ポップな多機能QRコード生成ツール

メール、電話、WiFiなど多様なタイプ対応
手動カスタマイズ重視
Phase 2: ロゴベースAI自動生成（静的サイト版）

URLのみに特化
ロゴから色抽出 → 4パターン生成
手動カスタマイズは補助的
Phase 3（最新）: URLコンテンツ解析AI自動生成（Next.js版）← 今回実装

URLの中身を理解してデザイン生成
恐竜サイト → 恐竜モチーフのQRコード
カフェ → ブラウン系のQRコード
AIスタートアップ → 未来的デザイン
2.2 最新要件（今回の指示）
なんかURLが恐竜に関するURLだったら、URL恐竜ので出すとか、なんかそういう風な。
おしゃれにね、恐竜の例えば緑の恐竜とかで出すとか、なんかそういう風なのを
めちゃくちゃ工夫した上で、おしゃれなロゴを出すっていう風なホームページを作成してください。
さらに、AIがサイトで使われているメインカラーを抽出し、その色をQRコードのベースカラーとして自動適用すること。
🎯 解釈
URLの内容を解析

HTMLをスクレイピング
メタタグ、タイトル、description取得
画像、色、テーマを分析
コンテンツに合わせたデザイン

恐竜サイト → 緑系＋恐竜モチーフ
カフェ → ブラウン系＋コーヒーモチーフ
テックスタートアップ → ブルー系＋モダンデザイン
おしゃれなロゴ自動生成

URLから取得したファビコン
または、AIが生成したアイコン
または、サイトのスクリーンショット
工夫したデザイン

単なる色変更ではなく、テーマに沿ったビジュアル
恐竜ならグリーン＋力強いデザイン
カフェなら温かみのある柔らかいデザイン
2.3 技術的制約の解消
制約	静的サイト版	Next.js版（今回）
URLスクレイピング	❌ CORS制約で不可	✅ サーバーサイドで可能
AI API呼び出し	❌ APIキー露出リスク	✅ API Routeで安全に実行
画像処理	⚠️ クライアントのみ	✅ サーバー＋クライアント両方
コンテンツ解析	❌ 不可	✅ Cheerio等で解析可能
3. システム全体構成
3.1 技術スタック
フロントエンド:
├── Next.js 14 (App Router)
├── TypeScript
├── Tailwind CSS
├── React Hook Form
└── Framer Motion (アニメーション)

バックエンド (API Routes):
├── Next.js API Routes
├── Cheerio (HTMLパース - 最初の20行程度のみ)
├── Sharp (画像処理)
└── Google Gemini API (AI分析 - 最安プラン)

QRコード生成:
├── qrcode (Node.js)
├── Canvas API
└── SVG生成

AI連携:
├── Google Gemini API (コンテンツ分析 - 最安プラン)
└── Color Thief (カラー抽出 - オプション)

注意: Puppeteerは使用しない（Vercel制約 + コスト削減）
注意: DALL-E 3ロゴ生成は削除（コスト削減）

デプロイ:
└── Vercel
3.2 アーキテクチャ図
┌─────────────────────────────────────────┐
│          User (ブラウザ)                 │
└─────────────────────────────────────────┘
                    │
                    │ URL入力
                    ↓
┌─────────────────────────────────────────┐
│     Next.js Frontend (App Router)       │
│  - URL入力フォーム                       │
│  - デザイン選択UI                        │
│  - カスタマイズパネル                     │
│  - プレビュー＆ダウンロード              │
└─────────────────────────────────────────┘
                    │
                    │ API Request
                    ↓
┌─────────────────────────────────────────┐
│       Next.js API Routes (Server)       │
│  - /api/analyze-url                     │
│  - /api/generate-designs                │
│  - /api/generate-qr                     │
│  - /api/upload-logo                     │
└─────────────────────────────────────────┘
         │              │              │
         │              │              │
    ↓ HTML解析     ↓ AI分析      ↓ QR生成
         │              │              │
┌────────┴──────┐  ┌──┴─────┐  ┌────┴─────┐
│  Cheerio      │  │ Gemini │  │  qrcode  │
│  (最初20行)   │  │  API   │  │  Sharp   │
└───────────────┘  └────────┘  └──────────┘
4. 機能要件
4.1 コア機能
🔹 機能1: URL解析＆コンテンツ理解
概要: 入力されたURLのコンテンツを解析し、サイトのテーマ・業種・色・雰囲気を理解する

入力:

URL（必須）
処理フロー:

1. URLアクセス（Cheerio - 軽量）
2. HTMLの最初の20行程度を取得（headタグ + 最初のbody部分）
3. メタデータ取得
   - <title>
   - <meta name="description">
   - <meta property="og:image">
   - favicon
4. メインカラー抽出
   - <meta name="theme-color"> のHEX取得
   - HTML/CSS内のHEXカラー頻度からブランドカラーを推定（白黒グレー除外）
5. キーワード抽出（title + description）
6. AI分析（Gemini API - 最安プラン）
   - 業種判定
   - テーマ判定
   - デザイン方向性提案
   - 推奨カラー（抽出したメインカラーを優先して利用）

注意: 画像解析は削除（コスト削減）。メタタグとAI推測で対応
出力:

Copy{
  "url": "https://dinosaur-museum.com",
  "title": "国立恐竜博物館",
  "description": "恐竜の化石や生態を学べる博物館",
  "favicon": "https://...",
  "ogImage": "https://...",
  "colors": ["#2E8B57", "#228B22", "#6B8E23"],
  "keywords": ["恐竜", "博物館", "化石", "古生物"],
  "category": "教育・文化",
  "theme": "prehistoric",
  "mood": "educational, adventurous",
  "designSuggestion": {
    "primaryColor": "#2E8B57",
    "accentColor": "#8B4513",
    "style": "bold and organic",
    "motif": "dinosaur, fossil, nature"
  }
}
🔹 機能2: AI自動デザイン生成（4パターン）
概要: URL解析結果を元に、4種類の最適なQRコードデザインを自動生成

入力:

URL解析結果
ロゴ画像（任意）
生成ロジック:

パターン1: コンテンツベース
Copy// 恐竜サイトの例
{
  name: "ジュラシック",
  description: "恐竜の力強さを表現",
  fgColor: "#2E8B57", // フォレストグリーン
  bgColor: "#F5F5DC", // ベージュ（化石感）
  style: "bold",
  cornerStyle: "dots", // ドット風で有機的に
  logoEffect: "shadow" // 影で立体感
}
パターン2: モダン解釈
Copy{
  name: "モダンプレヒストリック",
  description: "現代的な恐竜デザイン",
  fgColor: "#1a1a1a", // ダークグレー
  bgColor: "linear-gradient(135deg, #2E8B57, #228B22)", // グラデーション
  style: "minimal",
  cornerStyle: "rounded"
}
パターン3: ビビッド
Copy{
  name: "トロピカルジャングル",
  description: "鮮やかな熱帯雨林",
  fgColor: "#228B22", // ブライトグリーン
  bgColor: "#FFF8DC", // コーンシルク
  style: "colorful",
  accentColor: "#FF6347" // トマトレッド（アクセント）
}
パターン4: エレガント
Copy{
  name: "フォッシルエレガンス",
  description: "化石のような落ち着き",
  fgColor: "#8B7355", // ブラウン
  bgColor: "#FFFFFF",
  style: "elegant",
  cornerStyle: "square-smooth"
}
動的生成アルゴリズム:

Copyfunction generateDesigns(analysis: URLAnalysis, logo?: Buffer) {
  const { colors, theme, mood, designSuggestion } = analysis;
  
  // AIにデザイン提案を依頼
  const aiPrompt = `
    ウェブサイトの情報:
    - テーマ: ${theme}
    - 雰囲気: ${mood}
    - 主要カラー: ${colors.join(', ')}
    
    このサイトに最適なQRコードデザインを4パターン提案してください。
    各パターンには以下を含めてください:
    - 名前（キャッチーな日本語）
    - 説明
    - 前景色（HEX）
    - 背景色（HEX or gradient）
    - スタイル（bold/minimal/colorful/elegant）
  `;
  
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: aiPrompt }]
  });
  
  return parseAIDesignResponse(aiResponse);
}
🔹 機能3: ロゴ処理
3-1. ロゴアップロード

ユーザーがロゴをアップロード
自動で正方形（1:1）にトリミング
Color Thiefでカラー抽出
3-2. ロゴ自動取得

URLからfavicon取得
og:image取得
スクリーンショット取得（Puppeteer）
3-3. ロゴ自動取得（簡易版）

- URLからfavicon取得（自動）
- og:image取得（自動）
- ユーザーアップロード（任意）

注意: AI生成ロゴ（DALL-E 3）は削除（コスト削減）
🔹 機能4: リアルタイムカスタマイズ
調整可能項目:

 QRコードの色
 背景色（単色/グラデーション）
 サイズ（256px〜2048px）
 角の丸み（0%〜50%）
 ロゴサイズ（10%〜35%）
 エラー訂正レベル（L/M/Q/H）
 ロゴ背景（白背景ON/OFF）
 QRドットスタイル（square/rounded/dots）
 グラデーション方向（縦/横/斜め）
🔹 機能5: エクスポート
形式:

PNG（透過対応）
JPEG
SVG
PDF（印刷用）
サイズプリセット:

Web用: 512px
印刷用: 2048px
名刺用: 1024px
ポスター用: 4096px
4.2 サブ機能
🔹 履歴管理（認証ユーザーのみ）
生成したQRコードを履歴に保存・閲覧
- Googleアカウントでログインが必要
- Supabaseに保存（URL、デザイン設定、画像URL）
- 履歴ページ（/history）で一覧表示
- 過去に生成したQRコードの再ダウンロード可能
- デザイン設定の確認・再編集可能
- 未ログイン時は「ログインして保存」ボタンを表示
🔹 一括生成
複数URLをCSVでアップロード
一括でQRコード生成＆ZIP出力
🔹 テンプレート保存
よく使うデザインをテンプレート化
ワンクリックで適用
5. AI機能の詳細設計
5.1 URL解析フロー（最適化版）
Copy// /app/api/analyze-url/route.ts

import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const { url } = await req.json();
  
  // Step 1: URLアクセス（Cheerio - 軽量）
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Step 2: HTMLの最初の20行程度を取得（headタグ + 最初のbody部分）
  const htmlSnippet = html.split('\n').slice(0, 20).join('\n');
  
  // Step 3: メタデータ取得
  const metadata = {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || ''
  };
  
  // Step 4: Gemini APIでAI分析（HTMLスニペット + メタデータ）
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const analysis = await analyzeWithGemini(htmlSnippet, metadata, model);
  
  return Response.json({
    ...metadata,
    ...analysis
  });
}
5.2 AI分析プロンプト（Gemini API用）
Copyasync function analyzeWithGemini(htmlSnippet: string, metadata: any, model: any) {
  const prompt = `
あなたはウェブサイトのデザイン分析の専門家です。
与えられたウェブサイトのHTMLスニペットとメタデータから、最適なQRコードデザインを提案してください。

HTMLスニペット（最初の20行）:
${htmlSnippet}

メタデータ:
- タイトル: ${metadata.title}
- 説明: ${metadata.description}

分析項目:
1. 業種・カテゴリー（教育、飲食、テクノロジーなど）
2. テーマ・雰囲気（モダン、レトロ、ナチュラルなど）
3. 推奨カラー（3色のHEXコード）
4. デザインモチーフ（恐竜、コーヒー、回路など）

出力形式: JSON
{
  "category": "教育・文化",
  "theme": "prehistoric",
  "mood": "educational, adventurous",
  "colors": ["#2E8B57", "#228B22", "#6B8E23"],
  "motif": "dinosaur, fossil, nature",
  "designSuggestion": {
    "primaryColor": "#2E8B57",
    "accentColor": "#8B4513",
    "style": "bold and organic"
  }
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // JSONをパース
  return JSON.parse(text);
}
5.3 デザイン生成AI
Copyconst designPrompt = `
あなたはQRコードデザイナーです。
以下の情報を元に、4種類のユニークで美しいQRコードデザインを提案してください。

サイト情報:
- カテゴリー: ${category}
- テーマ: ${theme}
- カラー: ${colors}
- モチーフ: ${motif}

各デザインには以下を含めてください:
1. 名前（キャッチーな日本語、10文字以内）
2. 説明（どんな印象を与えるか、20文字以内）
3. 前景色（HEXコード）
4. 背景色（HEXコードまたはlinear-gradient）
5. スタイル（bold/minimal/colorful/elegant）
6. 角のスタイル（square/rounded/dots）

例: 恐竜博物館の場合
{
  "name": "ジュラシック",
  "description": "力強い恐竜の世界",
  "fgColor": "#2E8B57",
  "bgColor": "#F5F5DC",
  "style": "bold",
  "cornerStyle": "dots"
}

JSON配列で出力してください。
`;
6. デザイン要件
6.1 デザインシステム
カラーパレット（ベース）
Copy:root {
  /* Base Colors */
  --black: #000000;
  --white: #ffffff;
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-800: #262626;
  --gray-900: #171717;
  
  /* Brand Colors (変更可能) */
  --brand-primary: #000000;
  --brand-accent: #666666;
  
  /* Semantic Colors */
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}
タイポグラフィ
Copy/* Japanese */
font-family: 'Noto Sans JP', sans-serif;

/* English/Numbers */
font-family: 'Inter', sans-serif;

/* Weights */
--font-thin: 200;
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Letter Spacing */
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
6.2 UIコンポーネント
入力フォーム
┌────────────────────────────────────┐
│ URL                                │
│ __________________________________ │
│ https://example.com                │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ロゴ（任意）                        │
│                                    │
│    ┌──────────────────┐            │
│    │  クリックして    │            │
│    │  アップロード    │            │
│    │   ↑             │            │
│    └──────────────────┘            │
│                                    │
└────────────────────────────────────┘

        [デザインを生成 →]
デザイン選択カード
┌─────────────────────────┐
│     ジュラシック         │
├─────────────────────────┤
│                         │
│    [QR Preview]         │
│                         │
├─────────────────────────┤
│ 力強い恐竜の世界         │
│                         │
│ □ フォレストグリーン     │
│ □ ベージュ背景          │
└─────────────────────────┘
カスタマイズパネル
カスタマイズ
─────────────────

QRコードの色    #2E8B57
[■■■■■■         ]

背景色          #F5F5DC
[■■■■■■         ]

サイズ          512px
[────●──────────]

角の丸み        20%
[──────●────────]

ロゴサイズ      18%
[────●──────────]
6.3 アニメーション
ローディング:

Skeleton Loading
Spinner（AI分析中）
Progress Bar（4ステップ）
トランジション:

Copy// Framer Motion
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};
マイクロインタラクション:

ボタンホバー: scale(1.02)
カード選択: border-color変化
色変更: スムーズなcolor transition
7. 技術要件
7.1 Next.js構成
qr-designer-next/
├── app/
│   ├── layout.tsx                 # ルートレイアウト
│   ├── page.tsx                   # トップページ
│   ├── api/
│   │   ├── analyze-url/
│   │   │   └── route.ts           # URL解析API
│   │   ├── generate-designs/
│   │   │   └── route.ts           # デザイン生成API
│   │   ├── generate-qr/
│   │   │   └── route.ts           # QR生成API
│   │   └── upload-logo/
│   │       └── route.ts           # ロゴアップロードAPI
│   └── components/
│       ├── URLInput.tsx
│       ├── DesignGrid.tsx
│       ├── CustomizePanel.tsx
│       ├── QRPreview.tsx
│       ├── AuthButton.tsx          # Google認証ボタン
│       ├── HistoryButton.tsx        # 履歴保存ボタン（認証チェック付き）
│       └── HistoryList.tsx          # 履歴一覧表示
├── lib/
│   ├── ai/
│   │   ├── openai.ts              # OpenAI連携
│   │   └── analyze.ts             # AI分析ロジック
│   ├── scraper/
│   │   ├── puppeteer.ts           # スクレイピング
│   │   └── cheerio.ts             # HTMLパース
│   ├── qr/
│   │   ├── generator.ts           # QR生成
│   │   └── customizer.ts          # カスタマイズ
│   └── utils/
│       ├── colors.ts              # カラー操作
│       └── image.ts               # 画像処理
├── types/
│   ├── analysis.ts
│   ├── design.ts
│   └── qr.ts
├── public/
│   └── assets/
├── styles/
│   └── globals.css
├── .env.local                      # API Keys
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
7.2 環境変数
Copy# .env.local

# Google Gemini API (最安プラン)
GOOGLE_GEMINI_API_KEY=your-api-key-here

# Supabase (認証 + データベース)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel (自動設定)
VERCEL_URL=
VERCEL_ENV=
7.3 パッケージ
Copy{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    
    "qrcode": "^1.5.3",
    "cheerio": "^1.0.0-rc.12",
    "sharp": "^0.33.0",
    "color-thief-node": "^2.0.2",
    
    "@google/generative-ai": "^0.2.0",
    
    "tailwindcss": "^3.4.0",
    "framer-motion": "^10.16.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    
    "@vercel/analytics": "^1.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/qrcode": "^1.5.5",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
8. API設計
8.1 POST /api/analyze-url
リクエスト:

Copy{
  "url": "https://dinosaur-museum.com"
}
レスポンス:

Copy{
  "success": true,
  "data": {
    "url": "https://dinosaur-museum.com",
    "title": "国立恐竜博物館",
    "description": "恐竜の化石や生態を学べる博物館",
    "favicon": "https://dinosaur-museum.com/favicon.ico",
    "ogImage": "https://dinosaur-museum.com/og-image.jpg",
    "colors": ["#2E8B57", "#228B22", "#6B8E23"],
    "keywords": ["恐竜", "博物館", "化石"],
    "category": "教育・文化",
    "theme": "prehistoric",
    "mood": "educational, adventurous",
    "designSuggestion": {
      "primaryColor": "#2E8B57",
      "accentColor": "#8B4513",
      "style": "bold and organic",
      "motif": "dinosaur, fossil, nature"
    }
  }
}
8.2 POST /api/generate-designs
リクエスト:

Copy{
  "analysis": { /* URL解析結果 */ },
  "logo": "base64..." // Optional
}
レスポンス:

Copy{
  "success": true,
  "designs": [
    {
      "id": "1",
      "name": "ジュラシック",
      "description": "力強い恐竜の世界",
      "fgColor": "#2E8B57",
      "bgColor": "#F5F5DC",
      "style": "bold",
      "cornerStyle": "dots",
      "preview": "data:image/png;base64,..."
    },
    // ... 3 more
  ]
}
8.3 POST /api/generate-qr
リクエスト:

Copy{
  "url": "https://example.com",
  "design": { /* 選択されたデザイン */ },
  "customization": {
    "size": 512,
    "cornerRadius": 20,
    "logoSize": 18,
    "logoBackground": true
  },
  "logo": "base64...", // Optional
  "format": "png" // png | jpg | svg | pdf
}
レスポンス:

Copy{
  "success": true,
  "qrCode": "data:image/png;base64,..."
}
9. データフロー
9.1 全体フロー
[ユーザー]
    │
    │ 1. URL入力
    ↓
[フロントエンド]
    │
    │ 2. POST /api/analyze-url
    ↓
[API Route: analyze-url]
    │
    ├→ Puppeteerでアクセス
    ├→ メタデータ取得
    ├→ スクリーンショット
    ├→ カラー抽出
    └→ OpenAI分析
    │
    │ 3. 解析結果返却
    ↓
[フロントエンド]
    │
    │ 4. POST /api/generate-designs
    ↓
[API Route: generate-designs]
    │
    └→ OpenAI: デザイン4パターン生成
    │
    │ 5. デザイン返却
    ↓
[フロントエンド]
    │
    │ 6. ユーザーが1つ選択
    │ 7. カスタマイズ
    │ 8. POST /api/generate-qr
    ↓
[API Route: generate-qr]
    │
    ├→ QRコード生成（qrcode）
    ├→ ロゴ合成（Sharp）
    └→ カスタマイズ適用
    │
    │ 9. QRコード返却
    ↓
[フロントエンド]
    │
    │ 10. プレビュー表示
    │ 11. ダウンロード
    ↓
[ユーザー]
9.2 状態管理
Copy// Zustand or React Context

interface QRState {
  // Step 1
  url: string;
  logo: File | null;
  
  // Step 2
  analysis: URLAnalysis | null;
  isAnalyzing: boolean;
  
  // Step 3
  designs: Design[];
  selectedDesign: Design | null;
  
  // Step 4
  customization: Customization;
  finalQR: string | null;
  
  // Actions
  setUrl: (url: string) => void;
  setLogo: (file: File) => void;
  analyzeURL: () => Promise<void>;
  generateDesigns: () => Promise<void>;
  selectDesign: (design: Design) => void;
  updateCustomization: (key: string, value: any) => void;
  generateFinalQR: () => Promise<void>;
  downloadQR: (format: string) => void;
}
10. UI/UX設計
10.1 ユーザージャーニー
1. ランディング
   ↓
   シンプルなURL入力欄
   "URLを入力してAIに任せる"
   （認証不要でQRコード生成可能）
   
2. URL入力 + ロゴアップロード（任意）
   ↓
   [デザインを生成]ボタン
   
3. QRコード生成完了
   ↓
   プレビュー表示
   [ダウンロード]ボタン
   [履歴に保存]ボタン（未ログイン時は「Googleアカウントでログイン」表示）
   
4. 履歴保存時（未ログインの場合）
   ↓
   "履歴を保存するにはGoogleアカウントでログインしてください"
   [Googleアカウントでログイン]ボタン
   
5. ログイン完了後
   ↓
   自動的に履歴に保存
   履歴ページで確認可能
   
3. ローディング（AI分析中）
   ↓
   "サイトを解析しています..."
   "カラーを抽出しています..."
   "デザインを生成しています..."
   
4. デザイン選択
   ↓
   4つのカード表示
   - ジュラシック
   - モダンプレヒストリック
   - トロピカルジャングル
   - フォッシルエレガンス
   
5. カスタマイズ
   ↓
   スライダーで微調整
   リアルタイムプレビュー
   
6. ダウンロード
   ↓
   PNG / JPG / SVG / PDF
10.2 エラーハンドリング
エラー	表示メッセージ	対処
URL無効	"有効なURLを入力してください"	バリデーション
スクレイピング失敗	"サイトにアクセスできませんでした"	リトライボタン
AI分析失敗	"デザイン生成に失敗しました"	デフォルトパターン表示
ロゴアップロード失敗	"画像形式が対応していません"	PNG/JPG推奨表示
10.3 レスポンシブ対応
ブレークポイント:

Copy/* Mobile First */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  /* Tablet */
  .container {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  /* Desktop */
  .container {
    padding: 3rem;
    max-width: 1280px;
  }
}
レイアウト:

モバイル: 1カラム（縦積み）
タブレット: 1カラム
デスクトップ: 2カラム（プレビュー | コントロール）
11. 実装計画
11.1 Phase 1: 基盤構築（Week 1）
 Next.js 14セットアップ
 TypeScript設定
 Tailwind CSS設定
 プロジェクト構造作成
 環境変数設定
11.2 Phase 2: 認証・データベース構築（Week 2）
 Supabaseプロジェクト作成
 Google OAuth設定
 データベーススキーマ作成（user_profiles, qr_history）
 RLS（Row Level Security）設定
 認証ミドルウェア実装

11.3 Phase 3: API実装（Week 3-4）
 /api/analyze-url

CheerioでHTML解析（最初20行）
メタデータ抽出
Gemini API連携
 /api/generate-designs

AIプロンプト設計
デザイン生成ロジック（Gemini API）
 /api/generate-qr

QRコード生成
ロゴ合成
カスタマイズ適用
レート制限チェック（Supabase）
11.4 Phase 4: フロントエンド実装（Week 5-6）
 URL入力フォーム
 ロゴアップロード
 ローディング状態
 デザイン選択UI
 カスタマイズパネル
 プレビュー＆ダウンロード
11.5 Phase 5: 統合テスト（Week 7）
 E2Eテスト
 パフォーマンス最適化
 エラーハンドリング
 SEO対策
11.6 Phase 6: デプロイ（Week 8）
 Vercelデプロイ
 ドメイン設定
 Analytics設定
 監視設定
12. セキュリティ要件
12.1 APIキー管理
Copy// ❌ NG: クライアントで直接使用
const genAI = new GoogleGenerativeAI('your-api-key'); // 露出リスク

// ✅ OK: サーバーサイドのみ
// /app/api/analyze-url/route.ts
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!); // 安全
12.2 入力バリデーション
Copyimport { z } from 'zod';

const URLSchema = z.object({
  url: z.string().url('有効なURLを入力してください')
});

export async function POST(req: Request) {
  const body = await req.json();
  const { url } = URLSchema.parse(body); // バリデーション
  // ...
}
12.3 認証・レート制限（Supabase対応）
Copy// Supabaseでユーザー認証 + レート制限管理
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  // Step 1: 認証チェック
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json(
      { error: 'Unauthorized', message: 'Googleアカウントでログインしてください' },
      { status: 401 }
    );
  }
  
  // Step 2: ユーザープラン取得
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('plan_type, last_generated_at, total_generated')
    .eq('user_id', user.id)
    .single();
  
  // プロフィールが存在しない場合は作成（初回ログイン）
  if (profileError && profileError.code === 'PGRST116') {
    await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        plan_type: 'free',
        total_generated: 0
      });
  }
  
  const planType = profile?.plan_type || 'free';
  
  // Step 3: レート制限チェック（無料プランの場合）
  if (planType === 'free') {
    const lastGenerated = profile?.last_generated_at 
      ? new Date(profile.last_generated_at)
      : null;
    const now = new Date();
    const hoursSinceLastGeneration = lastGenerated
      ? (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60)
      : 168; // 初回は168時間（1週間）経過とみなす
    
    if (hoursSinceLastGeneration < 168) { // 168時間 = 1週間
      const remainingHours = Math.ceil(168 - hoursSinceLastGeneration);
      const remainingDays = Math.ceil(remainingHours / 24);
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: `無料プランは1週間に1回までです。次回生成可能まであと${remainingDays}日です。有料プラン（$4/月）で無制限利用できます。`
        },
        { status: 429 }
      );
    }
  }
  
  // Step 4: 生成実行（API処理）
  // ... QRコード生成処理 ...
  
  // Step 5: 生成履歴を更新
  await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      last_generated_at: new Date().toISOString(),
      total_generated: (profile?.total_generated || 0) + 1
    }, {
      onConflict: 'user_id'
    });
  
  return Response.json({ success: true, ... });
}
12.4 CORS設定
Copy// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
        ],
      },
    ];
  },
};
13. パフォーマンス要件
13.1 目標指標
指標	目標値
URL解析	< 5秒
デザイン生成	< 3秒
QR生成	< 2秒
Total Time	< 10秒
LCP	< 2.5秒
FID	< 100ms
CLS	< 0.1
13.2 最適化戦略
キャッシング:

Copy// URL解析結果をキャッシュ
import { unstable_cache } from 'next/cache';

const getCachedAnalysis = unstable_cache(
  async (url: string) => analyzeURL(url),
  ['url-analysis'],
  { revalidate: 3600 } // 1時間
);
並列処理:

Copy// 複数APIを並列実行
const [analysis, designs] = await Promise.all([
  analyzeURL(url),
  generateDesigns(url)
]);
画像最適化:

Copyimport sharp from 'sharp';

// ロゴを最適化
const optimizedLogo = await sharp(logoBuffer)
  .resize(512, 512)
  .webp({ quality: 80 })
  .toBuffer();
14. 拡張機能（Future）
14.1 Phase 2機能
 動的QRコード

URLを後から変更可能
アクセス解析
 A/Bテスト

複数デザインの効果測定
 チーム機能

デザイン共有
コメント機能
14.2 Phase 3機能
 AI生成ロゴ

DALL-E 3でロゴ自動生成
 アニメーションQRコード

GIFエクスポート
 AR対応

3DモデルQRコード
15. モネタイズ戦略
15.1 プラン構成
無料プラン:
- 1週間に1回までQRコード生成可能
- 標準解像度（512px）
- 基本的なカスタマイズ機能
- 生成履歴の閲覧・保存（Googleアカウントログイン必須）
- 広告表示（オプション）

有料プラン（$4/月）:
- 無制限でQRコード生成可能
- 高解像度（最大4096px）
- 一括生成機能（CSVアップロード）
- 全エクスポート形式対応（PNG/JPEG/SVG/PDF）
- 生成履歴の閲覧・保存
- 広告非表示
- 優先サポート

15.2 決済システム
- Stripe連携（サブスクリプション）
- または PayPal
- または クレジットカード直接決済

15.3 収益予測
想定:
- 無料ユーザー: 1000人/月
- 有料ユーザー: 50人/月（5%転換率）
- 月間収益: $200/月（$4 × 50人）
- 年間収益: $2,400/年

コスト:
- Gemini API: 約$50/月（1000リクエスト × $0.05）
- Vercel Pro: $20/月
- Supabase: $0/月（無料プランで開始、後で$25/月にアップグレード可能）
- Stripe: 決済手数料のみ（2.9% + $0.30/取引）
- その他: $10/月
- 合計: 約$80/月（初期段階、Supabase無料プラン使用時）

純利益: 約$150/月（初期段階）

16. 成功指標（KPI）
KPI	目標値
生成成功率	> 95%
ユーザー満足度	> 4.5/5
平均生成時間	< 5秒（最適化後）
リピート率	> 40%
シェア率	> 20%
無料→有料転換率	> 5%
17. まとめ
17.1 コア価値提案
"URLを入力するだけで、AIが最適でおしゃれなQRコードを数秒で自動生成"

17.2 差別化ポイント
✅ URLコンテンツ理解（恐竜サイト → 恐竜デザイン）
✅ AI自動デザイン生成（4パターン提案）
✅ Gemini APIでコスト削減（最安プラン）
✅ Cheerioで軽量・高速（最初20行のみ解析）
✅ 無料プランで気軽に試せる（1週間に1回）
✅ 有料プランは$4/月で手頃
✅ ログインユーザーは生成履歴を閲覧・管理可能

17.3 技術的優位性（最適化後）
項目	従来	QR Designer v3.0
スクレイピング	❌	✅ Cheerio（軽量）
AI分析	❌	✅ Gemini API（最安）
デザイン提案	手動	✅ AI自動
カスタマイズ	限定的	✅ 高度
エクスポート	PNG	✅ PNG/JPG/SVG/PDF
コスト効率	-	✅ 大幅削減（Puppeteer/DALL-E削除）
