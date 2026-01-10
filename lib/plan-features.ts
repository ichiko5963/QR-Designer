import type { PlanFeatures } from './plan-limits'

export type PlanName = 'free' | 'personal' | 'pro' | 'business' | 'agency' | 'enterprise'

export interface FeatureRequirement {
  feature: string
  requiredPlan: PlanName
  description: string
}

export const FEATURE_REQUIREMENTS: Record<string, FeatureRequirement> = {
  // 基本機能
  qr_generation: {
    feature: 'QRコード生成',
    requiredPlan: 'free',
    description: '基本的なQRコード生成'
  },
  history: {
    feature: '履歴保存',
    requiredPlan: 'free',
    description: '生成したQRコードの履歴を保存'
  },
  wifi_qr: {
    feature: 'WiFi QR生成',
    requiredPlan: 'free',
    description: 'WiFi接続情報のQRコード生成'
  },
  short_url: {
    feature: '短縮URL生成',
    requiredPlan: 'free',
    description: 'カスタムスラッグ対応の短縮URL生成'
  },
  
  // Personalプラン（¥499/月）
  smart_dashboard: {
    feature: 'スマートダッシュボード',
    requiredPlan: 'personal',
    description: 'サイトタイプ自動判定、カテゴリ別自動分類'
  },
  template_save: {
    feature: 'テンプレート保存（10件まで）',
    requiredPlan: 'personal',
    description: 'デザインテンプレートを保存して再利用'
  },
  link_check: {
    feature: 'リンク切れ検知・通知',
    requiredPlan: 'personal',
    description: 'URLの有効性を自動チェック'
  },
  high_resolution: {
    feature: '高解像度（2048px）',
    requiredPlan: 'personal',
    description: '2048pxまでの高解像度出力'
  },
  
  // Proプラン（¥980/月）
  ultra_high_resolution: {
    feature: '超高解像度（4096px）',
    requiredPlan: 'pro',
    description: '4096pxまでの超高解像度出力'
  },
  svg_pdf_export: {
    feature: 'SVG/PDF出力',
    requiredPlan: 'pro',
    description: 'SVG形式とPDF形式でのエクスポート'
  },
  unlimited_templates: {
    feature: 'テンプレート保存（無制限）',
    requiredPlan: 'pro',
    description: '無制限にテンプレートを保存'
  },
  csv_batch: {
    feature: 'CSV一括生成（月500件）',
    requiredPlan: 'pro',
    description: 'CSVファイルから一括でQRコードを生成'
  },
  dynamic_qr: {
    feature: '動的QRコード（無制限）',
    requiredPlan: 'pro',
    description: '後からURLを変更可能な動的QRコード'
  },
  advanced_analytics: {
    feature: '高度な分析機能',
    requiredPlan: 'pro',
    description: '誰が、どれくらい、どの時間にアクセスしたかの詳細分析'
  },
  redirect_management: {
    feature: 'リダイレクト管理',
    requiredPlan: 'pro',
    description: 'A/Bテスト、地域別、時間帯別、デバイス別リダイレクト'
  },
  conversion_tracking: {
    feature: 'コンバージョン追跡',
    requiredPlan: 'pro',
    description: 'QRスキャン後の行動追跡'
  },
  multi_url: {
    feature: 'マルチURL',
    requiredPlan: 'pro',
    description: '複数URLを1つのQRコードにまとめる'
  },
  app_store_qr: {
    feature: 'アプリストアリンクQR',
    requiredPlan: 'pro',
    description: 'App Store/Google Play自動判定'
  },
  social_profile_qr: {
    feature: 'ソーシャルメディアプロフィール統合QR',
    requiredPlan: 'pro',
    description: '複数SNSを1つのQRに'
  },
  landing_optimization: {
    feature: 'ランディングページ最適化アドバイス',
    requiredPlan: 'pro',
    description: 'AIによるランディングページ改善提案'
  },
  qr_expiry: {
    feature: 'QRコードの有効期限設定',
    requiredPlan: 'pro',
    description: '期限切れで自動無効化'
  },
  scan_limit: {
    feature: 'スキャン回数制限',
    requiredPlan: 'pro',
    description: '指定回数で自動無効化'
  },
  password_protection: {
    feature: 'パスワード保護QR',
    requiredPlan: 'pro',
    description: 'スキャン時にパスワード要求'
  },
  menu_qr: {
    feature: 'メニューQR（飲食店向け）',
    requiredPlan: 'pro',
    description: '多言語対応のメニューQRコード'
  },
  review_qr: {
    feature: 'レビュー依頼QR',
    requiredPlan: 'pro',
    description: 'Googleレビューなどへの自動誘導'
  },
  event_qr: {
    feature: 'イベントQR',
    requiredPlan: 'pro',
    description: 'カレンダー追加機能付き'
  }
}

export function canUseFeature(featureKey: string, currentPlan: PlanName): boolean {
  const requirement = FEATURE_REQUIREMENTS[featureKey]
  if (!requirement) return true // 定義されていない機能は利用可能とする
  
  const planOrder: PlanName[] = ['free', 'personal', 'pro', 'business', 'agency', 'enterprise']
  const currentIndex = planOrder.indexOf(currentPlan)
  const requiredIndex = planOrder.indexOf(requirement.requiredPlan)
  
  return currentIndex >= requiredIndex
}

export function getRequiredPlan(featureKey: string): PlanName | null {
  return FEATURE_REQUIREMENTS[featureKey]?.requiredPlan || null
}

export function getFeatureInfo(featureKey: string): FeatureRequirement | null {
  return FEATURE_REQUIREMENTS[featureKey] || null
}
