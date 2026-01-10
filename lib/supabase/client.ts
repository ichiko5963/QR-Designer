import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ビルド時に環境変数がない場合はダミーを返す
  if (!supabaseUrl || !supabaseKey) {
    // ビルド時のみ - ランタイムでは環境変数が必要
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      )
    }
    throw new Error('Supabase URL and Key are required')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

