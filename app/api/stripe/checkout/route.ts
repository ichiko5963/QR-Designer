import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover'
  })
}

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }

    // Price IDがDBに存在するか確認
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('name')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single()

    if (!planData) {
      console.error('Invalid price ID:', priceId)
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    // 既存のStripe顧客を取得
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    // 既存のアクティブなサブスクリプションがある場合
    if (subscription?.stripe_subscription_id && subscription?.status === 'active') {
      // Stripeカスタマーポータルにリダイレクト（プラン変更はそこで行う）
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId!,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing`
        })
        return NextResponse.json({ sessionUrl: portalSession.url, isPortal: true })
      } catch (portalError) {
        console.error('Failed to create portal session:', portalError)
        // ポータル作成に失敗した場合は通常のチェックアウトに進む
      }
    }

    if (!customerId) {
      // 新規Stripe顧客作成
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id

      // DBに保存
      const { error: upsertError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan_name: 'free',
        status: 'active'
      }, {
        onConflict: 'user_id'
      })

      if (upsertError) {
        console.error('Failed to save customer ID:', upsertError)
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Checkoutセッション作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id }
      },
      // 日本円の場合は税金の設定
      automatic_tax: { enabled: false },
      // 請求先住所の収集
      billing_address_collection: 'auto',
      // カスタマーがセッションを完了しなかった場合のメール
      allow_promotion_codes: true
    })

    if (!session.url) {
      console.error('Checkout session created but no URL returned')
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ sessionUrl: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    )
  }
}
