import { SupabaseClient } from '@supabase/supabase-js'

export interface PlanFeatures {
  qr_limit_per_month: number
  max_resolution: number
  svg_pdf_export: boolean
  template_limit: number
  csv_batch_limit: number
  dynamic_qr_limit: number
  scan_analytics: boolean
  team_seats: number
  custom_domain: number
  logo_storage_mb: number
  watermark_removable: boolean
  priority_support: boolean
  api_access: boolean
}

export interface PlanUsage {
  qr_generated: number
  dynamic_qr: number
}

export interface PlanInfo {
  plan: string
  features: PlanFeatures
  usage: PlanUsage
}

const DEFAULT_FEATURES: PlanFeatures = {
  qr_limit_per_month: 4,
  max_resolution: 512,
  svg_pdf_export: false,
  template_limit: 0,
  csv_batch_limit: 0,
  dynamic_qr_limit: 0,
  scan_analytics: false,
  team_seats: 1,
  custom_domain: 0,
  logo_storage_mb: 0,
  watermark_removable: false,
  priority_support: false,
  api_access: false
}

export async function getPlanInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanInfo> {
  // サブスクリプション取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name, monthly_qr_generated, dynamic_qr_count')
    .eq('user_id', userId)
    .single()

  const planName = subscription?.plan_name || 'free'

  // プラン定義取得
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('features')
    .eq('name', planName)
    .single()

  return {
    plan: planName,
    features: (plan?.features as PlanFeatures) || DEFAULT_FEATURES,
    usage: {
      qr_generated: subscription?.monthly_qr_generated || 0,
      dynamic_qr: subscription?.dynamic_qr_count || 0
    }
  }
}

export interface LimitCheckResult {
  allowed: boolean
  limit: number
  remaining: number
  message?: string
}

export function checkQRLimit(
  usage: number,
  limit: number
): LimitCheckResult {
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 }
  }

  const remaining = Math.max(0, limit - usage)
  return {
    allowed: usage < limit,
    limit,
    remaining,
    message: remaining === 0
      ? `今月のQR生成上限（${limit}回）に達しました`
      : undefined
  }
}

export function checkDynamicQRLimit(
  usage: number,
  limit: number
): LimitCheckResult {
  if (limit === 0) {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      message: '動的QRコードは Business プラン以上で利用できます'
    }
  }

  const remaining = Math.max(0, limit - usage)
  return {
    allowed: usage < limit,
    limit,
    remaining,
    message: remaining === 0
      ? `動的QRコードの上限（${limit}件）に達しました`
      : undefined
  }
}

export function checkResolutionLimit(
  requested: number,
  limit: number
): LimitCheckResult {
  return {
    allowed: requested <= limit,
    limit,
    remaining: 0,
    message: requested > limit
      ? `最大解像度は ${limit}px です（現在のプラン）`
      : undefined
  }
}

export function checkLogoStorageLimit(
  currentMB: number,
  limitMB: number
): LimitCheckResult {
  if (limitMB === 0) {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      message: 'ロゴ保存は Starter プラン以上で利用できます'
    }
  }

  const remaining = Math.max(0, limitMB - currentMB)
  return {
    allowed: currentMB < limitMB,
    limit: limitMB,
    remaining,
    message: remaining === 0
      ? `ロゴストレージの上限（${limitMB}MB）に達しました`
      : undefined
  }
}

export function canAccessFeature(
  feature: 'scan_analytics' | 'svg_pdf_export' | 'api_access',
  features: PlanFeatures
): boolean {
  return features[feature] === true
}

export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    scan_analytics: 'スキャン分析は Business プラン以上で利用できます',
    svg_pdf_export: 'SVG/PDF出力は Pro プラン以上で利用できます',
    api_access: 'APIアクセスは Enterprise プランで利用できます',
    dynamic_qr: '動的QRコードは Business プラン以上で利用できます',
    logo_storage: 'ロゴ保存は Starter プラン以上で利用できます',
    templates: 'テンプレート保存は Starter プラン以上で利用できます'
  }
  return messages[feature] || 'この機能を利用するにはプランのアップグレードが必要です'
}
