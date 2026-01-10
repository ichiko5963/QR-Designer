# テスト & 品質保証完全ガイド - QR Designer v3.0

> **最終更新**: 2026-01-04
> **テストカバレッジ目標**: 80%+
> **対象**: QR Designer v3.0 全コンポーネント

---

## 📚 目次

1. [テスト戦略概要](#テスト戦略概要)
2. [単体テスト（Unit Tests）](#単体テストunit-tests)
3. [統合テスト（Integration Tests）](#統合テストintegration-tests)
4. [E2Eテスト（End-to-End Tests）](#e2eテストend-to-end-tests)
5. [APIテスト](#apiテスト)
6. [パフォーマンステスト](#パフォーマンステスト)
7. [セキュリティテスト](#セキュリティテスト)
8. [CI/CD統合](#cicd統合)
9. [品質メトリクス](#品質メトリクス)

---

## テスト戦略概要

### テストピラミッド

```
         ╱╲
        ╱  ╲      E2E Tests (10%)
       ╱────╲     - Playwright
      ╱      ╲    - Critical user flows
     ╱────────╲
    ╱          ╲  Integration Tests (30%)
   ╱────────────╲ - API testing
  ╱              ╲ - Database integration
 ╱────────────────╲
╱                  ╲ Unit Tests (60%)
────────────────────  - Functions, components
                      - Vitest
```

### テストカバレッジ目標

| レイヤー | カバレッジ目標 | ツール |
|----------|---------------|--------|
| ユニットテスト | 80%+ | Vitest + Testing Library |
| 統合テスト | 70%+ | Vitest + MSW |
| E2Eテスト | 主要フロー100% | Playwright |
| APIテスト | 全エンドポイント | Vitest + Supertest |

---

## 単体テスト（Unit Tests）

### セットアップ

```bash
# 依存関係インストール
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.next/',
        '**/*.config.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

```typescript
// test/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})
```

### ユーティリティ関数のテスト

```typescript
// lib/qr/generator.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateQRCode } from './generator'
import QRCode from 'qrcode'
import sharp from 'sharp'

// モック
vi.mock('qrcode')
vi.mock('sharp')

describe('QRCode Generator', () => {
  it('should generate QR code with correct options', async () => {
    const mockQRBuffer = Buffer.from('mock-qr-data')
    vi.mocked(QRCode.toBuffer).mockResolvedValue(mockQRBuffer)

    const mockSharpInstance = {
      resize: vi.fn().mockReturnThis(),
      composite: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('final-qr'))
    }
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any)

    const result = await generateQRCode({
      url: 'https://example.com',
      size: 512,
      errorCorrectionLevel: 'H',
      color: '#FF6B6B',
      backgroundColor: '#FFFFFF'
    })

    expect(QRCode.toBuffer).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        errorCorrectionLevel: 'H',
        color: {
          dark: '#FF6B6B',
          light: '#FFFFFF'
        }
      })
    )

    expect(mockSharpInstance.resize).toHaveBeenCalledWith(512, 512)
    expect(result).toBeInstanceOf(Buffer)
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(QRCode.toBuffer).mockRejectedValue(new Error('QR generation failed'))

    await expect(
      generateQRCode({
        url: 'https://example.com',
        size: 512,
        errorCorrectionLevel: 'L'
      })
    ).rejects.toThrow('QR generation failed')
  })
})
```

### AI機能のテスト

```typescript
// lib/ai/analyze.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeURL } from './analyze'
import { GoogleGenerativeAI } from '@google/generative-ai'

vi.mock('@google/generative-ai')

describe('AI URL Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should analyze URL and return structured data', async () => {
    const mockResponse = {
      response: {
        text: () => JSON.stringify({
          title: 'Example Site',
          category: 'Technology',
          keywords: ['tech', 'innovation'],
          colorPalette: ['#FF6B6B', '#4ECDC4']
        })
      }
    }

    const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse)
    const mockModel = {
      generateContent: mockGenerateContent
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    } as any))

    const result = await analyzeURL('https://example.com', '<html>...</html>')

    expect(result).toEqual({
      title: 'Example Site',
      category: 'Technology',
      keywords: ['tech', 'innovation'],
      colorPalette: ['#FF6B6B', '#4ECDC4']
    })

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.arrayContaining([
          expect.objectContaining({
            role: 'user'
          })
        ])
      })
    )
  })

  it('should handle API errors', async () => {
    vi.mocked(GoogleGenerativeAI).mockImplementation(() => {
      throw new Error('API key invalid')
    })

    await expect(
      analyzeURL('https://example.com', '<html>...</html>')
    ).rejects.toThrow('API key invalid')
  })
})
```

### Reactコンポーネントのテスト

```typescript
// app/components/URLInput.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import URLInput from './URLInput'

describe('URLInput Component', () => {
  it('should render input field and submit button', () => {
    render(<URLInput onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/URLを入力/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /生成/i })).toBeInTheDocument()
  })

  it('should call onSubmit with valid URL', async () => {
    const mockOnSubmit = vi.fn()
    const user = userEvent.setup()

    render(<URLInput onSubmit={mockOnSubmit} />)

    const input = screen.getByPlaceholderText(/URLを入力/i)
    const button = screen.getByRole('button', { name: /生成/i })

    await user.type(input, 'https://example.com')
    await user.click(button)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('should show error for invalid URL', async () => {
    const user = userEvent.setup()
    render(<URLInput onSubmit={vi.fn()} />)

    const input = screen.getByPlaceholderText(/URLを入力/i)
    const button = screen.getByRole('button', { name: /生成/i })

    await user.type(input, 'invalid-url')
    await user.click(button)

    expect(await screen.findByText(/有効なURLを入力してください/i)).toBeInTheDocument()
  })

  it('should disable submit button while loading', async () => {
    const mockOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    const user = userEvent.setup()

    render(<URLInput onSubmit={mockOnSubmit} />)

    const input = screen.getByPlaceholderText(/URLを入力/i)
    const button = screen.getByRole('button', { name: /生成/i })

    await user.type(input, 'https://example.com')
    await user.click(button)

    expect(button).toBeDisabled()
    expect(screen.getByText(/生成中/i)).toBeInTheDocument()
  })
})
```

---

## 統合テスト（Integration Tests）

### API統合テスト

```typescript
// app/api/generate-designs/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { POST } from './route'

describe('POST /api/generate-designs', () => {
  it('should generate 4 design patterns', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        url: 'https://jurassicworld.com',
        analysis: {
          title: 'Jurassic World',
          category: 'Entertainment',
          keywords: ['dinosaur', 'adventure']
        }
      }
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.designs).toHaveLength(4)
    expect(data.designs[0]).toHaveProperty('name')
    expect(data.designs[0]).toHaveProperty('color')
    expect(data.designs[0]).toHaveProperty('backgroundColor')
  })

  it('should handle missing analysis gracefully', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        url: 'https://example.com'
      }
    })

    const response = await POST(req as any)

    expect(response.status).toBe(400)
  })
})
```

### データベース統合テスト

```typescript
// lib/supabase/queries.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { saveQRHistory, checkRateLimit } from './queries'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe('Supabase Queries', () => {
  const testUserId = 'test-user-id'

  beforeAll(async () => {
    // テストユーザー作成
    await supabase.from('user_profiles').insert({
      user_id: testUserId,
      plan_type: 'free'
    })
  })

  afterAll(async () => {
    // クリーンアップ
    await supabase.from('qr_history').delete().eq('user_id', testUserId)
    await supabase.from('user_profiles').delete().eq('user_id', testUserId)
  })

  it('should save QR code to history', async () => {
    const result = await saveQRHistory({
      userId: testUserId,
      url: 'https://example.com',
      designName: 'Test Design',
      qrImageUrl: 'https://storage.example.com/qr.png'
    })

    expect(result.error).toBeNull()
    expect(result.data).toHaveProperty('id')
  })

  it('should enforce rate limit for free users', async () => {
    const canGenerate = await checkRateLimit(testUserId)
    expect(canGenerate).toBe(true)

    // 最初の生成
    await saveQRHistory({
      userId: testUserId,
      url: 'https://example.com',
      designName: 'Test',
      qrImageUrl: 'https://example.com/qr.png'
    })

    // すぐにもう一度チェック（1週間以内）
    const canGenerateAgain = await checkRateLimit(testUserId)
    expect(canGenerateAgain).toBe(false)
  })
})
```

---

## E2Eテスト（End-to-End Tests）

### Playwrightセットアップ

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### クリティカルユーザーフローのテスト

```typescript
// e2e/qr-generation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('QR Code Generation Flow', () => {
  test('should generate QR code for valid URL', async ({ page }) => {
    await page.goto('/')

    // URLを入力
    await page.fill('input[placeholder*="URL"]', 'https://dinosaur-museum.com')
    await page.click('button:has-text("生成")')

    // デザイン選択画面を待つ
    await expect(page.locator('text=デザインを選択')).toBeVisible({ timeout: 10000 })

    // 4つのデザインが表示される
    const designs = page.locator('[data-testid="design-card"]')
    await expect(designs).toHaveCount(4)

    // 最初のデザインを選択
    await designs.first().click()

    // QRコードプレビューが表示される
    await expect(page.locator('img[alt*="QR Code"]')).toBeVisible()

    // ダウンロードボタンが有効
    const downloadButton = page.locator('button:has-text("ダウンロード")')
    await expect(downloadButton).toBeEnabled()
  })

  test('should show error for invalid URL', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[placeholder*="URL"]', 'not-a-valid-url')
    await page.click('button:has-text("生成")')

    // エラーメッセージが表示される
    await expect(page.locator('text=有効なURLを入力してください')).toBeVisible()
  })

  test('should respect rate limit for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    // 1回目の生成（成功）
    await page.fill('input[placeholder*="URL"]', 'https://example1.com')
    await page.click('button:has-text("生成")')
    await expect(page.locator('text=デザインを選択')).toBeVisible({ timeout: 10000 })

    // ホームに戻る
    await page.goto('/')

    // 2回目の生成（レート制限）
    await page.fill('input[placeholder*="URL"]', 'https://example2.com')
    await page.click('button:has-text("生成")')

    // レート制限メッセージが表示される
    await expect(page.locator('text=1週間に1回まで')).toBeVisible()
  })
})

test.describe('Authentication Flow', () => {
  test('should authenticate with Google OAuth', async ({ page }) => {
    await page.goto('/')

    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")')

    // Google OAuthページにリダイレクト（モック）
    // 本番環境ではGoogle認証画面が表示される
    await expect(page).toHaveURL(/accounts\.google\.com/)
  })
})
```

### ビジュアルリグレッションテスト

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage.png')
  })

  test('QR preview should match snapshot', async ({ page }) => {
    await page.goto('/preview?url=https://example.com&design=classic')

    // QRコードが読み込まれるまで待つ
    await page.waitForSelector('img[alt*="QR Code"]')

    await expect(page).toHaveScreenshot('qr-preview.png')
  })
})
```

---

## APIテスト

### API契約テスト

```typescript
// test/api-contract.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// APIレスポンススキーマ
const AnalysisResponseSchema = z.object({
  title: z.string(),
  category: z.string(),
  keywords: z.array(z.string()),
  colorPalette: z.array(z.string())
})

const DesignResponseSchema = z.object({
  designs: z.array(
    z.object({
      name: z.string(),
      color: z.string(),
      backgroundColor: z.string(),
      cornerRadius: z.number(),
      logoSize: z.number().optional()
    })
  )
})

describe('API Contract Tests', () => {
  it('GET /api/analyze-url should match schema', async () => {
    const response = await fetch('http://localhost:3000/api/analyze-url?url=https://example.com')
    const data = await response.json()

    expect(() => AnalysisResponseSchema.parse(data)).not.toThrow()
  })

  it('POST /api/generate-designs should match schema', async () => {
    const response = await fetch('http://localhost:3000/api/generate-designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        analysis: {
          title: 'Example',
          category: 'Tech',
          keywords: ['test']
        }
      })
    })
    const data = await response.json()

    expect(() => DesignResponseSchema.parse(data)).not.toThrow()
  })
})
```

---

## パフォーマンステスト

### Lighthouseテスト

```typescript
// test/performance.test.ts
import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals', async ({ page }) => {
    await page.goto('/')

    await playAudit({
      page,
      thresholds: {
        performance: 90,
        accessibility: 100,
        'best-practices': 90,
        seo: 90
      },
      port: 9222
    })
  })
})
```

### ロードテスト（k6）

```javascript
// test/load/qr-generation.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // 10ユーザーまで増加
    { duration: '3m', target: 10 },  // 10ユーザーを維持
    { duration: '1m', target: 0 }    // 0まで減少
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%のリクエストが2秒以内
    http_req_failed: ['rate<0.01']     // エラー率1%未満
  }
}

export default function () {
  // URL解析
  const analyzeRes = http.get('https://qr-designer.vercel.app/api/analyze-url?url=https://example.com')
  check(analyzeRes, {
    'analyze status is 200': (r) => r.status === 200,
    'analyze duration < 2s': (r) => r.timings.duration < 2000
  })

  sleep(1)

  // デザイン生成
  const designRes = http.post(
    'https://qr-designer.vercel.app/api/generate-designs',
    JSON.stringify({
      url: 'https://example.com',
      analysis: JSON.parse(analyzeRes.body)
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(designRes, {
    'design status is 200': (r) => r.status === 200,
    'design duration < 3s': (r) => r.timings.duration < 3000
  })

  sleep(2)
}
```

---

## セキュリティテスト

### OWASP ZAPスキャン

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 0'  # 毎週日曜2am
  workflow_dispatch:

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://qr-designer.vercel.app'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

---

## CI/CD統合

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 品質メトリクス

### カバレッジレポート

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

### 品質ゲート

```yaml
# sonar-project.properties
sonar.projectKey=qr-designer
sonar.sources=app,lib
sonar.tests=test,e2e
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# 品質ゲート基準
sonar.qualitygate.wait=true
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts
```

---

## 🌐 必須参照リソース

### テストフレームワーク

1. [Vitest Documentation](https://vitest.dev/) - 高速ユニットテストフレームワーク
2. [Playwright Documentation](https://playwright.dev/) - E2Eテストフレームワーク
3. [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React Testing Library
4. [MSW (Mock Service Worker)](https://mswjs.io/) - APIモッキング
5. [Jest DOM](https://github.com/testing-library/jest-dom) - DOMマッチャー

### パフォーマンステスト

6. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - CI統合Lighthouse
7. [k6 Documentation](https://k6.io/docs/) - ロードテスト
8. [WebPageTest](https://www.webpagetest.org/) - パフォーマンス計測

### セキュリティテスト

9. [OWASP ZAP](https://www.zaproxy.org/) - セキュリティスキャナー
10. [Snyk](https://snyk.io/) - 脆弱性スキャン
11. [npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit) - 依存関係チェック

### CI/CD

12. [GitHub Actions](https://docs.github.com/en/actions) - CI/CDプラットフォーム
13. [Codecov](https://about.codecov.io/) - カバレッジレポート
14. [SonarCloud](https://sonarcloud.io/) - コード品質分析

### 学習リソース

15. [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) - テストベストプラクティス集

---

**更新日**: 2026-01-04
**ドキュメントバージョン**: 1.0.0
**対象プロジェクト**: QR Designer v3.0
**テストカバレッジ**: 80%+
