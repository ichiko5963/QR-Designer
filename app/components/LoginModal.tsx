'use client'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  redirectPath?: string
}

const FREE_PLAN_BENEFITS = [
  { icon: '✓', text: 'QRコード無制限生成', highlight: true },
  { icon: '✓', text: '作成履歴を永久保存' },
  { icon: '✓', text: '短縮URL自動生成' },
  { icon: '✓', text: 'クリック数トラッキング' },
  { icon: '✓', text: 'PNG/SVG形式でダウンロード' },
  { icon: '✓', text: 'カスタムデザイン保存' },
  { icon: '✓', text: 'ロゴ自動抽出・配色提案' },
  { icon: '✓', text: 'いつでもQRコードを再編集' },
]

export default function LoginModal({ isOpen, onClose, message, redirectPath }: LoginModalProps) {
  if (!isOpen) return null

  const handleSignIn = () => {
    const redirect = redirectPath || window.location.pathname
    window.location.href = `/api/auth/signin?redirectTo=${encodeURIComponent(redirect)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl overflow-hidden">
        {/* 背景グラデーション装飾 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E6A24C]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#171158]/5 to-transparent rounded-tr-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative">
          {/* ヘッダー部分 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E6A24C] to-[#D4943F] text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              <span className="text-lg">🎉</span>
              <span>Freeプラン - 完全無料</span>
            </div>

            <h3 className="text-2xl font-bold text-[#1B1723] mb-2">
              ログインでもっと便利に
            </h3>
            <p className="text-[#1B1723]/60 text-sm">
              {message || 'Googleアカウントでログインして、すべての機能を無料でご利用ください'}
            </p>
          </div>

          {/* メリット一覧 */}
          <div className="bg-gradient-to-br from-[#F8F7FC] to-[#F0EFF8] rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-[#171158] mb-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#E6A24C] rounded-full"></span>
              Freeプランに含まれる機能
            </p>
            <div className="grid grid-cols-1 gap-2">
              {FREE_PLAN_BENEFITS.map((benefit, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    benefit.highlight
                      ? 'text-[#171158] font-bold'
                      : 'text-[#1B1723]/70'
                  }`}
                >
                  <span className="text-[#E6A24C] font-bold">{benefit.icon}</span>
                  <span>{benefit.text}</span>
                  {benefit.highlight && (
                    <span className="text-xs bg-[#E6A24C]/10 text-[#E6A24C] px-2 py-0.5 rounded-full font-bold">
                      無制限
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ログインボタン */}
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
            <span>Googleでログイン（無料）</span>
          </button>

          <p className="mt-4 text-center text-xs text-[#1B1723]/40">
            ログイン後、作成したQRコードは自動的に保存されます
          </p>
        </div>
      </div>
    </div>
  )
}
