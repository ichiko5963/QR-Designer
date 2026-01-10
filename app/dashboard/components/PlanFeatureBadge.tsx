'use client'

import Link from 'next/link'

interface PlanFeatureBadgeProps {
  requiredPlan: 'free' | 'personal' | 'pro'
  currentPlan: string
  featureName: string
  children?: React.ReactNode
}

const planOrder = ['free', 'personal', 'pro', 'business', 'agency', 'enterprise']

export default function PlanFeatureBadge({
  requiredPlan,
  currentPlan,
  featureName,
  children
}: PlanFeatureBadgeProps) {
  const currentPlanIndex = planOrder.indexOf(currentPlan)
  const requiredPlanIndex = planOrder.indexOf(requiredPlan)
  const hasAccess = currentPlanIndex >= requiredPlanIndex

  if (hasAccess) {
    return <>{children}</>
  }

  const planNames: Record<string, string> = {
    free: 'Free',
    personal: 'Personal（¥499/月）',
    pro: 'Pro（¥980/月）',
    business: 'Business',
    agency: 'Agency',
    enterprise: 'Enterprise'
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#171158]/10 to-[#E6A24C]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#171158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1B1723] mb-1">
            {planNames[requiredPlan]}プランが必要です
          </p>
          <p className="text-xs text-[#1B1723]/60 mb-3">
            {featureName}を利用するには
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#171158] to-[#E6A24C] rounded-lg hover:from-[#2A2478] hover:to-[#D4923D] transition-all"
          >
            プランをアップグレード
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
