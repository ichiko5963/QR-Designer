import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './components/Sidebar'
import DashboardHeader from './components/DashboardHeader'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // セッションも確認
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user }, error } = await supabase.auth.getUser()

  // デバッグログ
  console.log('[Dashboard Layout] Session:', session ? 'exists' : 'missing')
  console.log('[Dashboard Layout] User:', user ? user.email : 'none')
  console.log('[Dashboard Layout] Error:', error?.message || 'none')

  // 認証エラーまたはユーザーが存在しない場合、ホームページにリダイレクト
  // ただし、無限ループを防ぐため、リダイレクト前にエラーログを出力
  if (error || !user) {
    console.error('[Dashboard Layout] Auth error or no user:', error?.message || 'No user')
    console.error('[Dashboard Layout] Session status:', session ? 'Session exists but no user' : 'No session')
    redirect('/')
  }

  // サブスクリプション情報取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name, status, monthly_qr_generated, dynamic_qr_count')
    .eq('user_id', user.id)
    .single()

  const plan = subscription?.plan_name || 'free'
  const usage = {
    qrGenerated: subscription?.monthly_qr_generated || 0,
    dynamicQr: subscription?.dynamic_qr_count || 0
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* サイドバー（デスクトップ） */}
      <Sidebar user={user} plan={plan} />

      {/* メインコンテンツ */}
      <div className="lg:pl-72">
        {/* ヘッダー */}
        <DashboardHeader user={user} plan={plan} />

        {/* コンテンツエリア */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
