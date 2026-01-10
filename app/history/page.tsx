import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: '生成履歴 | QR Code Designer',
  description: '過去に生成したQRコードの履歴'
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/')
  }

  const { data: history, error: historyError } = await supabase
    .from('qr_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (historyError) {
    console.error('Error fetching history:', historyError)
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#171158] hover:text-[#E6A24C] font-semibold mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          <h1 className="text-4xl font-bold text-[#1B1723] mb-2">生成履歴</h1>
          <p className="text-[#1B1723]/60">
            過去に生成したQRコード: {history?.length || 0}件
          </p>
        </div>

        {/* History List */}
        {!history || history.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#171158]/5 shadow-xl shadow-[#171158]/5 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#171158]/5 to-[#E6A24C]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#171158]/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1B1723] mb-2">
              履歴がありません
            </h3>
            <p className="text-[#1B1723]/60 mb-6">
              まだQRコードを生成していません。
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all"
            >
              QRコードを生成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#171158]/5 shadow-lg shadow-[#171158]/5 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                {/* QR Code Image */}
                <div className="p-6 bg-gradient-to-br from-[#171158]/[0.02] to-[#E6A24C]/[0.03] flex items-center justify-center">
                  <img
                    src={item.qr_image_url}
                    alt={`QR Code for ${item.url}`}
                    className="w-48 h-48 object-contain rounded-xl shadow-lg"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-[#1B1723] mb-2">
                    {item.design_name}
                  </h3>
                  <p className="text-sm text-[#1B1723]/60 mb-2 truncate">
                    {item.url}
                  </p>
                  <p className="text-xs text-[#1B1723]/40">
                    {new Date(item.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <a
                      href={item.qr_image_url}
                      download={`qr-${item.id}.png`}
                      className="flex-1 text-center py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#171158] to-[#1B1723] rounded-xl hover:from-[#2A2478] hover:to-[#171158] transition-all"
                    >
                      ダウンロード
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.url)
                        alert('URLをコピーしました')
                      }}
                      className="py-2.5 px-4 text-sm font-semibold text-[#1B1723]/70 bg-[#171158]/5 rounded-xl hover:bg-[#171158]/10 transition-all"
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
