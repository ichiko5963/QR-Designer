import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Googleアカウントでログインしてください' },
        { status: 401 }
      )
    }
    
    const { data: history, error } = await supabase
      .from('qr_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      history: history || []
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { success: false, error: '履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

