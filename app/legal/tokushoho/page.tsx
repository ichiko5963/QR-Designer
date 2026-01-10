import Image from 'next/image'
import Link from 'next/link'

export default function TokushohoPage() {
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
                href="/pricing"
                className="text-sm font-medium text-[#1B1723]/60 hover:text-[#171158] transition-colors"
              >
                プラン一覧
              </Link>
              <Link
                href="/legal/tokushoho"
                className="text-sm font-medium text-[#171158] transition-colors"
              >
                特定商取引法
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1B1723] mb-8">
          特定商取引法に基づく表記
        </h1>

        <div className="bg-white rounded-2xl border border-[#171158]/5 shadow-sm overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  販売業者
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  QR Code Designer 運営者
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  運営責任者
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  市岡 直人
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  所在地
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  請求があった場合、遅滞なく開示いたします。
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  電話番号
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  請求があった場合、遅滞なく開示いたします。
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  メールアドレス
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  jiuhot10@gmail.com
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  販売価格
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  各サービスページに記載された価格（税込）
                  <br />
                  <Link href="/pricing" className="text-[#171158] hover:underline">
                    プラン一覧を見る
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  商品代金以外の必要料金
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  なし
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  支払い方法
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  クレジットカード（Visa、Mastercard、AMEX）
                  <br />
                  ※ Stripeによる安全な決済処理
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  支払い時期
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  サブスクリプション開始時および更新時
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  サービス提供時期
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  決済完了後、即時利用可能
                </td>
              </tr>
              <tr className="border-b border-[#171158]/5">
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  返品・キャンセルについて
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  デジタルサービスの性質上、購入後の返金は原則としてお受けしておりません。
                  ただし、サービスに重大な不具合がある場合は、個別に対応いたします。
                  <br />
                  <br />
                  サブスクリプションのキャンセルはいつでも可能です。
                  キャンセル後も、現在の請求期間の終了までサービスをご利用いただけます。
                </td>
              </tr>
              <tr>
                <th className="w-1/3 bg-[#171158]/[0.02] px-6 py-4 text-left text-sm font-semibold text-[#1B1723]">
                  動作環境
                </th>
                <td className="px-6 py-4 text-sm text-[#1B1723]/80">
                  最新版のGoogle Chrome、Safari、Firefox、Microsoft Edge
                  <br />
                  ※ Internet Explorerは非対応
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#171158] hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            トップページに戻る
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#171158]/5 bg-white mt-auto">
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
              <Link href="/legal/tokushoho" className="text-[#171158] font-medium">
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
