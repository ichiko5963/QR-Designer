# QR Designer v3.0 マスターリファレンス - 全URL集約

> **最終更新**: 2026-01-04
> **総URL数**: 90+
> **カテゴリ**: 公式ドキュメント、実装記事、コミュニティ、ツール

---

## 📚 目次

1. [Next.js & React](#nextjs--react)
2. [Google Gemini AI](#google-gemini-ai)
3. [Supabase](#supabase)
4. [QRコード生成](#qrコード生成)
5. [画像処理 (Sharp)](#画像処理-sharp)
6. [Vercel & デプロイメント](#vercel--デプロイメント)
7. [TypeScript](#typescript)
8. [テスト & 品質保証](#テスト--品質保証)
9. [セキュリティ](#セキュリティ)
10. [パフォーマンス最適化](#パフォーマンス最適化)
11. [コミュニティ & サポート](#コミュニティ--サポート)
12. [ツール & ユーティリティ](#ツール--ユーティリティ)

---

## Next.js & React

### 公式ドキュメント
- [Next.js 14 Documentation](https://nextjs.org/docs) - 公式ドキュメント
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration) - App Router移行
- [Next.js API Reference](https://nextjs.org/docs/app/api-reference) - API完全リファレンス
- [React Server Components](https://react.dev/reference/rsc/server-components) - RSC詳細
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) - メタデータ最適化

### 実装ガイド
- [Building Your First App Router Project](https://vercel.com/blog/building-your-first-app-router-project) - 実践チュートリアル
- [Server vs Client Components](https://www.joshwcomeau.com/react/server-components/) - 詳細解説
- [Next.js Performance Patterns](https://vercel.com/blog/next-js-performance-patterns) - パフォーマンス最適化
- [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript) - TypeScript統合

### リソース
- [Next.js Examples Repository](https://github.com/vercel/next.js/tree/canary/examples) - 公式サンプル集
- [Next.js Discord Community](https://discord.gg/nextjs) - コミュニティサポート
- [Awesome Next.js](https://github.com/unicodeveloper/awesome-nextjs) - リソース集

---

## Google Gemini AI

### 公式ドキュメント
- [Google AI for Developers](https://ai.google.dev/) - 公式ポータル
- [Gemini API Documentation](https://ai.google.dev/docs) - 完全ドキュメント
- [Gemini API Pricing](https://ai.google.dev/pricing) - 料金詳細
- [Generative AI SDK for JavaScript](https://github.com/google/generative-ai-js) - 公式SDK
- [Gemini API Quickstart](https://ai.google.dev/tutorials/quickstart) - クイックスタート

### ベストプラクティス
- [Prompt Engineering for Gemini](https://ai.google.dev/docs/prompt_best_practices) - プロンプトガイド
- [JSON Mode with Gemini](https://ai.google.dev/docs/structured_output) - 構造化出力
- [Error Handling Best Practices](https://cloud.google.com/blog/products/ai-machine-learning/gemini-api-error-handling) - エラーハンドリング
- [Mastering Controlled Generation](https://developers.googleblog.com/en/mastering-controlled-generation-with-gemini-15-schema-adherence/) - スキーマ遵守

### ツール
- [Google AI Studio](https://makersuite.google.com/) - プロンプトテストツール
- [Gemini API Changelog](https://ai.google.dev/docs/changelog) - 変更履歴

### コミュニティ
- [Gemini API Community](https://discuss.ai.google.dev/) - コミュニティフォーラム
- [Awesome Gemini](https://github.com/awesome-gemini/awesome-gemini) - リソース集

---

## Supabase

### 公式ドキュメント
- [Supabase Documentation](https://supabase.com/docs) - 公式ドキュメント
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth) - 認証ガイド
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) - RLS詳細
- [Supabase with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Next.js統合
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL公式

### 実装ガイド
- [Building a SaaS with Supabase](https://supabase.com/blog/supabase-saas) - SaaS構築ガイド
- [RLS Best Practices](https://supabase.com/blog/row-level-security-best-practices) - RLSベストプラクティス
- [Database Optimization Guide](https://supabase.com/docs/guides/database/performance-tuning) - パフォーマンスチューニング
- [OAuth Implementation Guide](https://supabase.com/docs/guides/auth/social-login/auth-google) - OAuth実装

### 比較・分析
- [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase) - Firebase比較

### コミュニティ
- [Supabase GitHub](https://github.com/supabase/supabase) - ソースコード
- [Supabase Discord Community](https://discord.supabase.com/) - コミュニティサポート
- [Awesome Supabase](https://github.com/lyqht/awesome-supabase) - リソース集
- [Supabase YouTube Channel](https://www.youtube.com/@Supabase) - 動画チュートリアル

---

## QRコード生成

### 公式ドキュメント
- [node-qrcode Documentation](https://github.com/soldair/node-qrcode) - QRCode公式
- [QR Code Specification (ISO/IEC 18004)](https://www.iso.org/standard/62021.html) - ISO標準
- [QR Code Tutorial](https://www.thonky.com/qr-code-tutorial/) - QR仕様詳解
- [Error Correction in QR Codes](https://www.qrcode.com/en/about/error_correction.html) - エラー訂正詳細

### ライブラリ
- [qrcode-styling](https://qr-code-styling.com/) - スタイリング特化
- [kozakdenys/qr-code-styling (GitHub)](https://github.com/kozakdenys/qr-code-styling) - GitHub

### ベストプラクティス
- [QR Code Best Practices](https://www.qr-code-generator.com/qr-code-marketing/qr-codes-basics/) - ベストプラクティス
- [QR Code Design Inspiration](https://www.qr-code-generator.com/qr-code-examples/) - デザイン事例

### コミュニティ
- [QR Code Generator Examples](https://github.com/topics/qr-code-generator) - GitHub例

---

## 画像処理 (Sharp)

### 公式ドキュメント
- [Sharp Documentation](https://sharp.pixelplumbing.com/) - Sharp公式
- [Sharp API - Composite](https://sharp.pixelplumbing.com/api-composite) - 画像合成
- [Sharp Performance](https://sharp.pixelplumbing.com/performance) - パフォーマンス最適化
- [Sharp Installation](https://sharp.pixelplumbing.com/install) - インストールガイド

### 実装ガイド
- [High-Performance Image Processing](https://sharp.pixelplumbing.com/performance) - 高性能処理
- [Image Optimization Techniques](https://web.dev/fast/#optimize-your-images) - 最適化テクニック

### コミュニティ
- [Sharp GitHub](https://github.com/lovell/sharp) - ソースコード
- [Sharp GitHub Discussions](https://github.com/lovell/sharp/discussions) - コミュニティサポート

---

## Vercel & デプロイメント

### 公式ドキュメント
- [Vercel Documentation](https://vercel.com/docs) - Vercel完全ガイド
- [Next.js Deployment](https://nextjs.org/docs/deployment) - Next.jsデプロイ
- [Vercel CLI](https://vercel.com/docs/cli) - CLIリファレンス
- [Vercel Functions](https://vercel.com/docs/functions) - サーバーレス関数
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) - 制限事項

### トラブルシューティング
- [Troubleshooting Build Error: 250MB Limit](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit) - バンドルサイズ制限
- [How to bypass 4.5MB body size limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) - ペイロード制限回避

### パフォーマンス
- [Vercel Analytics](https://vercel.com/analytics) - アナリティクス
- [How to Optimize Next.js](https://vercel.com/blog/how-to-optimize-nextjs) - 最適化ガイド
- [Building Production-Grade Apps](https://vercel.com/blog/building-production-grade-nextjs-apps) - 本番環境構築

### セキュリティ
- [Vercel Security](https://vercel.com/docs/security) - セキュリティガイド

### コミュニティ
- [Vercel Community](https://github.com/vercel/vercel/discussions) - コミュニティ
- [Vercel Status](https://www.vercel-status.com/) - ステータスページ
- [Vercel YouTube](https://www.youtube.com/@VercelHQ) - 動画チュートリアル

---

## TypeScript

### 公式ドキュメント
- [TypeScript Official Documentation](https://www.typescriptlang.org/docs/) - 公式ドキュメント
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - ハンドブック
- [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript) - Next.js統合

### ベストプラクティス
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 詳細ガイド
- [Type-safe API Design](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) - 型安全API設計

---

## テスト & 品質保証

### テストフレームワーク
- [Vitest Documentation](https://vitest.dev/) - 高速テストフレームワーク
- [Playwright Documentation](https://playwright.dev/) - E2Eテスト
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React Testing Library

### 品質管理
- [ESLint Official](https://eslint.org/) - リンター
- [Prettier Official](https://prettier.io/) - フォーマッター
- [Husky](https://typicode.github.io/husky/) - Git hooks

---

## セキュリティ

### ガイドライン
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - セキュリティリスク
- [Securing Serverless APIs - AWS](https://aws.amazon.com/blogs/compute/securing-serverless-apis/) - サーバーレスセキュリティ
- [Next.js Authentication](https://nextjs.org/docs/authentication) - 認証ベストプラクティス

### ツール
- [Snyk](https://snyk.io/) - 脆弱性スキャナー
- [Sentry](https://sentry.io/) - エラートラッキング

---

## パフォーマンス最適化

### Web Vitals
- [Web Vitals](https://web.dev/vitals/) - Core Web Vitals
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - パフォーマンス計測

### 最適化ガイド
- [Performance Best Practices](https://web.dev/fast/) - 高速化ガイド
- [Image Optimization](https://web.dev/fast/#optimize-your-images) - 画像最適化

---

## コミュニティ & サポート

### Stack Overflow
- [Next.js Tag](https://stackoverflow.com/questions/tagged/next.js)
- [Supabase Tag](https://stackoverflow.com/questions/tagged/supabase)
- [Vercel Tag](https://stackoverflow.com/questions/tagged/vercel)
- [QR Code Tag](https://stackoverflow.com/questions/tagged/qr-code)
- [Google Gemini Tag](https://stackoverflow.com/questions/tagged/google-gemini)

### Reddit
- [r/nextjs](https://reddit.com/r/nextjs)
- [r/Supabase](https://reddit.com/r/Supabase)
- [r/webdev](https://reddit.com/r/webdev)

### Discord
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com/)

### YouTube
- [Vercel HQ](https://www.youtube.com/@VercelHQ)
- [Supabase](https://www.youtube.com/@Supabase)
- [Fireship](https://www.youtube.com/@Fireship) - 技術解説

---

## ツール & ユーティリティ

### 開発ツール
- [Postman](https://www.postman.com/) - API テスト
- [Insomnia](https://insomnia.rest/) - APIクライアント
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - バンドル分析

### デザインツール
- [Figma](https://www.figma.com/) - UIデザイン
- [Excalidraw](https://excalidraw.com/) - 図表作成

### データベース管理
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [Supabase Studio](https://supabase.com/docs/guides/database/overview) - Supabase内蔵

### AI開発ツール
- [Google AI Studio](https://makersuite.google.com/) - プロンプトテスト
- [LangChain](https://python.langchain.com/) - LLMフレームワーク

---

## カテゴリ別URL統計

```
総URL数: 90+

Next.js & React: 12
Google Gemini AI: 10
Supabase: 11
QRコード生成: 7
画像処理 (Sharp): 6
Vercel & デプロイメント: 11
TypeScript: 5
テスト & 品質保証: 6
セキュリティ: 5
パフォーマンス最適化: 4
コミュニティ: 8
ツール & ユーティリティ: 10+
```

---

## 📖 推奨学習パス

### 初級 (1-2週間)
1. Next.js 14基礎 → [Next.js Documentation](https://nextjs.org/docs)
2. TypeScript基礎 → [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
3. React Server Components → [React Documentation](https://react.dev/)

### 中級 (2-4週間)
4. Supabase認証 → [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
5. Gemini API統合 → [Gemini API Quickstart](https://ai.google.dev/tutorials/quickstart)
6. QRコード生成 → [node-qrcode](https://github.com/soldair/node-qrcode)

### 上級 (4-8週間)
7. RLS実装 → [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
8. パフォーマンス最適化 → [Web Vitals](https://web.dev/vitals/)
9. 本番デプロイ → [Vercel Documentation](https://vercel.com/docs)

---

## 🔄 定期更新推奨リソース

### 毎週チェック
- [Vercel Blog](https://vercel.com/blog)
- [Next.js Blog](https://nextjs.org/blog)
- [Supabase Blog](https://supabase.com/blog)

### 毎月チェック
- [Google AI Blog](https://blog.google/technology/ai/)
- [npm Trends](https://npmtrends.com/) - パッケージ比較
- [Can I Use](https://caniuse.com/) - ブラウザ互換性

---

**ドキュメント保守**: このリファレンスは定期的に更新してください（推奨: 月1回）

**最終更新**: 2026-01-04
**次回更新予定**: 2026-02-04
**メンテナー**: QR Designer開発チーム

---

**注意**: URLリンク切れを発見した場合は、GitHub Issuesで報告してください。
