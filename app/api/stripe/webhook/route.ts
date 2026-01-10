import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover'
  })
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Price IDからプラン名を取得するヘルパー関数
async function getPlanNameByPriceId(supabase: ReturnType<typeof getSupabase>, priceId: string): Promise<string> {
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .single()

  return plan?.name || 'free'
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = getSupabase()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No stripe-signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`Processing webhook event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('No user_id in session metadata')
          break
        }

        if (!subscriptionId) {
          console.error('No subscription ID in checkout session')
          break
        }

        // サブスクリプション詳細取得
        const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionData = subscriptionResponse as any
        const priceId = subscriptionData.items?.data?.[0]?.price?.id

        if (!priceId) {
          console.error('No price ID found in subscription')
          break
        }

        // プラン名をPrice IDから特定
        const planName = await getPlanNameByPriceId(supabase, priceId)

        // 期間情報を取得
        const periodStart = subscriptionData.current_period_start || subscriptionData.billing_cycle_anchor
        const periodEnd = subscriptionData.current_period_end || null

        // DB更新
        const { error: upsertError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan_name: planName,
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        }, {
          onConflict: 'user_id'
        })

        if (upsertError) {
          console.error('Failed to upsert subscription:', upsertError)
          throw upsertError
        }

        console.log(`Subscription created/updated for user ${userId}: ${planName}`)
        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any
        const periodStart = subscription.current_period_start
        const periodEnd = subscription.current_period_end

        // Price IDを取得（プランアップグレード/ダウングレード対応）
        const priceId = subscription.items?.data?.[0]?.price?.id

        // プラン名を取得
        let planName: string | undefined
        if (priceId) {
          planName = await getPlanNameByPriceId(supabase, priceId)
        }

        // 更新データを構築
        const updateData: Record<string, unknown> = {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        }

        // 期間情報を追加
        if (periodStart) {
          updateData.current_period_start = new Date(periodStart * 1000).toISOString()
        }
        if (periodEnd) {
          updateData.current_period_end = new Date(periodEnd * 1000).toISOString()
        }

        // プランが変更された場合は更新
        if (priceId) {
          updateData.stripe_price_id = priceId
        }
        if (planName) {
          updateData.plan_name = planName
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Failed to update subscription:', updateError)
          throw updateError
        }

        console.log(`Subscription updated: ${subscription.id}, plan: ${planName}, status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_name: 'free',
            stripe_subscription_id: null,
            stripe_price_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('Failed to cancel subscription:', deleteError)
          throw deleteError
        }

        console.log(`Subscription canceled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const { error: failError } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (failError) {
            console.error('Failed to update subscription status:', failError)
            throw failError
          }

          console.log(`Payment failed for subscription: ${subscriptionId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        // 支払い成功時にステータスをactiveに戻す（past_dueからの復帰）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          const { error: successError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (successError) {
            console.error('Failed to update subscription status:', successError)
          } else {
            console.log(`Payment succeeded, subscription active: ${subscriptionId}`)
          }
        }
        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    // Stripeに500を返すと再試行される
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
