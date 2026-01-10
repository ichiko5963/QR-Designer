import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: '生成履歴 | QR Designer',
  description: '過去に生成したQRコードの履歴'
}

export default async function HistoryPage() {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/')
  }

  // 履歴取得（RLSにより自動的にユーザーでフィルタ）
  const { data: history, error: historyError } = await supabase
    .from('qr_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (historyError) {
    console.error('Error fetching history:', historyError)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← ホームに戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">生成履歴</h1>
          <p className="text-gray-600">
            過去に生成したQRコード: {history?.length || 0}件
          </p>
        </div>

        {/* 履歴リスト */}
        {!history || history.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              履歴がありません
            </h3>
            <p className="text-gray-600 mb-4">
              まだQRコードを生成していません。
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              QRコードを生成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* QRコード画像 */}
                <div className="p-6 bg-gray-50 flex items-center justify-center">
                  <img
                    src={item.qr_image_url}
                    alt={`QR Code for ${item.url}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>

                {/* 情報 */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.design_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    {item.url}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {/* アクション */}
                  <div className="mt-4 flex gap-2">
                    <a
                      href={item.qr_image_url}
                      download={`qr-${item.id}.png`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition text-sm"
                    >
                      ダウンロード
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.url)
                        alert('URLをコピーしました')
                      }}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition text-sm"
                    >
                      URLコピー
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
