'use client'

import Image from 'next/image'
import Link from 'next/link'
import AuthButton from '../components/AuthButton'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Googleログインで無制限生成',
    features: [
      { text: '無制限QR生成', included: true },
      { text: '最大1024px解像度', included: true },
      { text: 'WiFi QR生成', included: true },
      { text: '短縮URL', included: true },
      { text: '履歴保存', included: true },
      { text: '透かしなし', included: true },
      { text: 'テンプレート保存', included: false },
      { text: 'SVG/PDF出力', included: false },
      { text: '動的QRコード', included: false },
      { text: 'スキャン分析', included: false },
    ],
    cta: 'Googleで無料開始',
    ctaLink: '/dashboard',
    popular: false,
    gradient: false,
  },
  {
    name: 'Personal',
    price: 499,
    description: '個人クリエイター向け',
    features: [
      { text: '無制限QR生成', included: true },
      { text: '最大2048px解像度', included: true },
      { text: 'WiFi QR生成', included: true },
      { text: '短縮URL（カスタムスラッグ）', included: true },
      { text: '履歴保存', included: true },
      { text: '透かしなし', included: true },
      { text: 'テンプレート保存 10件', included: true },
      { text: 'スマートダッシュボード', included: true },
      { text: 'リンク切れチェック', included: true },
      { text: 'SVG/PDF出力', included: false },
      { text: '動的QRコード', included: false },
      { text: 'スキャン分析', included: false },
    ],
    cta: 'Personal を始める',
    ctaLink: '/dashboard/settings/billing',
    popular: true,
    gradient: true,
  },
  {
    name: 'Pro',
    price: 980,
    description: 'ビジネス利用に最適',
    features: [
      { text: '無制限QR生成', included: true },
      { text: '最大4096px解像度', included: true },
      { text: 'WiFi QR生成', included: true },
      { text: '短縮URL（カスタムスラッグ）', included: true },
      { text: '履歴保存', included: true },
      { text: '透かしなし', included: true },
      { text: 'テンプレート保存 無制限', included: true },
      { text: 'スマートダッシュボード', included: true },
      { text: 'リンク切れチェック', included: true },
      { text: 'SVG/PDF出力', included: true },
      { text: '動的QRコード 無制限', included: true },
      { text: 'スキャン分析（高度）', included: true },
      { text: 'CSV一括生成 500件', included: true },
      { text: 'パスワード保護QR', included: true },
      { text: 'A/Bテスト・地域別リダイレクト', included: true },
    ],
    cta: 'Pro を始める',
    ctaLink: '/dashboard/settings/billing',
    popular: false,
    gradient: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-[#171158]/5 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="QR Code Designer"
                width={44}
                height={44}
                className="object-contain"
              />
              <div className="text-left">
                <h1 className="text-lg font-bold text-[#1B1723] tracking-tight">
                  QR Code Designer
                </h1>
                <p className="text-xs text-[#171158]/60">
                  AI-Powered QR Generator
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                ホーム
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-[#171158] transition-colors"
              >
                プラン一覧
              </Link>
              <Link
                href="/legal/tokushoho"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                特定商取引法
              </Link>
            </nav>

            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#171158]/[0.02] to-[#E6A24C]/[0.05] py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-[#E6A24C]/20 via-[#E6A24C]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#171158]/20 via-[#171158]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#171158]/5 to-[#E6A24C]/10 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-[#E6A24C] animate-pulse" />
              <span className="text-sm font-medium text-[#171158]">
                シンプルな料金体系
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1B1723] mb-6 leading-tight tracking-tight">
              あなたに合った
              <span className="bg-gradient-to-r from-[#171158] via-[#171158] to-[#E6A24C] bg-clip-text text-transparent">
                プラン
              </span>
              を選ぶ
            </h2>
            <p className="text-lg text-[#1B1723]/70 max-w-2xl mx-auto">
              シンプルな料金プラン。無料でも無制限にQRコードを生成できます。
              もっと使いたい方はお手軽な有料プランへ。パーソナルが人気です。
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-3xl border-2 p-6 transition-all ${
                  plan.popular
                    ? 'border-[#171158] shadow-xl shadow-[#171158]/10 scale-105 z-10'
                    : 'border-[#171158]/10 hover:border-[#171158]/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#171158] to-[#1B1723] text-white text-sm font-bold rounded-full shadow-lg">
                    人気No.1
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#1B1723]">{plan.name}</h3>
                  <p className="text-sm text-[#1B1723]/60 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-[#1B1723]">無料</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-[#1B1723]">
                          ¥{plan.price.toLocaleString()}
                        </span>
                        <span className="text-[#1B1723]/50 text-sm">/月</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-3 text-sm ${
                        feature.included ? 'text-[#1B1723]/80' : 'text-[#1B1723]/40'
                      }`}
                    >
                      {feature.included ? (
                        <svg className="w-5 h-5 text-[#E6A24C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#1B1723]/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`block w-full py-3 text-center font-bold rounded-xl transition-all ${
                    plan.gradient
                      ? 'text-white bg-gradient-to-r from-[#171158] to-[#1B1723] hover:from-[#2A2478] hover:to-[#171158] shadow-lg shadow-[#171158]/20'
                      : plan.price === 0
                        ? 'text-white bg-[#E6A24C] hover:bg-[#D4923D] shadow-lg shadow-[#E6A24C]/20'
                        : 'text-[#171158] bg-[#171158]/10 hover:bg-[#171158]/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#171158]/5 to-[#E6A24C]/5 rounded-3xl border border-[#171158]/10 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#171158] to-[#1B1723] rounded-2xl flex items-center justify-center text-white shrink-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1B1723] mb-2">Enterprise</h3>
                  <p className="text-[#1B1723]/60 mb-6">
                    大規模チームや企業向けのカスタムプラン。チーム機能、カスタムドメイン、API連携、SSO、専任サポートなど、ビジネスに必要な高度な機能を提供します。
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {[
                      'チーム・ワークスペース',
                      'カスタムドメイン',
                      'API連携',
                      'SSO・監査ログ',
                      'ホワイトラベル',
                      '専任サポート',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-[#1B1723]/70">
                        <svg className="w-4 h-4 text-[#E6A24C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                  <a
                    href="mailto:jiuhot10@gmail.com?subject=QR Designer 法人向けプランのお問い合わせ"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg shadow-[#171158]/20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    お問い合わせ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-[#1B1723] text-center mb-12">よくある質問</h3>
          <div className="space-y-6">
            {[
              {
                q: '無料プランでも本当に無制限に使えますか？',
                a: 'はい、Googleアカウントでログインすれば、QRコード生成は無制限です。解像度は1024pxまでですが、通常の印刷やデジタル利用には十分なクオリティです。',
              },
              {
                q: 'プランはいつでも変更できますか？',
                a: 'はい、いつでもアップグレードまたはダウングレードできます。アップグレードは即座に反映され、ダウングレードは現在の請求期間の終了時に適用されます。',
              },
              {
                q: 'キャンセルした場合どうなりますか？',
                a: '現在の請求期間の終了まで有料機能を利用できます。その後、自動的に無料プランに移行し、作成したQRコードは引き続き動作します。',
              },
              {
                q: '支払い方法は？',
                a: 'クレジットカード（Visa、Mastercard、AMEX）に対応しています。Stripeによる安全な決済処理を行います。',
              },
              {
                q: '動的QRコードとは何ですか？',
                a: 'QRコードのリンク先を後から変更できる機能です。印刷後でもリダイレクト先を変更でき、スキャン数のトラッキングも可能です。',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#171158]/5 p-6 shadow-sm">
                <h4 className="font-bold text-[#1B1723] mb-2">{faq.q}</h4>
                <p className="text-sm text-[#1B1723]/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#171158] to-[#1B1723]">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            今すぐ無料で始めましょう
          </h3>
          <p className="text-white/70 mb-8">
            Googleアカウントで即座に開始。クレジットカード不要です。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-[#171158] bg-white rounded-xl hover:bg-white/90 transition-all shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleで無料開始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#171158]/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="QR Code Designer"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-sm font-medium text-[#1B1723]/70">QR Code Designer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#1B1723]/50">
              <Link href="/legal/tokushoho" className="hover:text-[#171158] transition-colors">
                特定商取引法
              </Link>
              <Link href="/legal/privacy" className="hover:text-[#171158] transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
