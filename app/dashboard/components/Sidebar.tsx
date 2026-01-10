'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: {
    id?: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
      name?: string
    }
  }
  plan: string
}

interface QRHistory {
  id: string
  url: string
  page_title?: string
  design_name?: string
  qr_image_url?: string
  created_at: string
}

const navigation = [
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: HomeIcon,
    exact: true
  },
  {
    name: '生成したQRコード',
    href: '/dashboard/qr-codes',
    icon: QrCodeIcon,
    badge: null
  },
  {
    name: 'プライベートQR',
    href: '/dashboard/private-qr',
    icon: IdCardIcon,
    badge: null
  },
  {
    name: 'アンケート',
    href: '/dashboard/forms',
    icon: ClipboardDocumentListIcon,
    badge: null
  },
  {
    name: 'スキャン分析',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
    badge: 'Pro',
    requiredPlans: ['pro', 'business', 'agency', 'enterprise']
  },
  {
    name: 'ロゴ管理',
    href: '/dashboard/logos',
    icon: PhotoIcon,
    badge: 'Personal+',
    requiredPlans: ['personal', 'pro', 'business', 'agency', 'enterprise']
  }
]

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function ClipboardDocumentListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function Cog6ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function Bars3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

export default function Sidebar({ user, plan }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [qrHistory, setQrHistory] = useState<QRHistory[]>([])
  const [showAllQR, setShowAllQR] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchQRHistory()
    }
  }, [user?.id])

  const fetchQRHistory = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('qr_history')
      .select('id, url, page_title, design_name, qr_image_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setQrHistory(data)
  }

  const handleDeleteQR = async (id: string) => {
    if (!confirm('このQRコードを削除しますか？')) return

    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('qr_history')
      .delete()
      .eq('id', id)

    if (!error) {
      setQrHistory(prev => prev.filter(qr => qr.id !== id))
    }
    setDeletingId(null)
  }

  const handleDownload = (qr: QRHistory) => {
    if (!qr.qr_image_url) return
    const link = document.createElement('a')
    link.href = qr.qr_image_url
    link.download = `qr-${qr.page_title || qr.id}.png`
    link.click()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const isAccessible = (requiredPlans?: string[]) => {
    if (!requiredPlans) return true
    return requiredPlans.includes(plan)
  }

  const isPaidPlan = plan !== 'free'

  const planDisplayNames: Record<string, string> = {
    free: 'Free',
    personal: 'Personal',
    pro: 'Pro',
    business: 'Business',
    agency: 'Agency',
    enterprise: 'Enterprise'
  }
  const planDisplayName = planDisplayNames[plan] || plan.charAt(0).toUpperCase() + plan.slice(1)

  const displayedQRs = showAllQR ? qrHistory : qrHistory.slice(0, 4)

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-white border-r border-[#171158]/5 px-4 pb-4">
      {/* ロゴ */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="QR Code Designer"
            width={32}
            height={32}
            className="object-contain"
          />
          <div>
            <h1 className="text-base font-bold text-[#1B1723]">QR Designer</h1>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              plan === 'free'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-gradient-to-r from-[#E6A24C]/20 to-[#E6A24C]/10 text-[#E6A24C]'
            }`}>
              {planDisplayName}
            </span>
          </div>
        </Link>
      </div>

      {/* 新規作成ボタン */}
      <Link
        href="/dashboard/generate"
        className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E6A24C] to-[#D4923D] rounded-xl hover:from-[#F0B86E] hover:to-[#E6A24C] shadow-lg shadow-[#E6A24C]/30 transition-all hover:-translate-y-0.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span>新規QRコード作成</span>
      </Link>

      {/* ナビゲーション */}
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-4">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const accessible = isAccessible(item.requiredPlans)
                const active = isActive(item.href, item.exact)

                return (
                  <li key={item.name}>
                    <Link
                      href={accessible ? item.href : '/dashboard/settings/billing'}
                      className={`group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#171158] to-[#1B1723] text-white shadow-lg shadow-[#171158]/20'
                          : accessible
                            ? 'text-[#1B1723]/70 hover:bg-[#171158]/5 hover:text-[#1B1723]'
                            : 'text-[#1B1723]/40 cursor-not-allowed'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : ''}`} />
                      {item.name}
                      {item.badge && !accessible && (
                        <span className="ml-auto text-[10px] bg-[#E6A24C]/10 text-[#E6A24C] px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>

          {/* 設定セクション */}
          <li className="mt-auto">
            <div className="text-xs font-semibold text-[#1B1723]/40 mb-2 px-2">設定</div>
            <ul className="-mx-2 space-y-1">
              {[
                { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon, highlight: false },
                {
                  name: 'プランを確認',
                  href: '/dashboard/settings/billing',
                  icon: CreditCardIcon,
                  highlight: plan === 'free'
                }
              ].map((item) => {
                const active = isActive(item.href, item.href === '/dashboard/settings')
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 transition-all ${
                        active
                          ? 'bg-[#171158]/10 text-[#171158]'
                          : item.highlight
                            ? 'text-[#E6A24C] bg-[#E6A24C]/10 hover:bg-[#E6A24C]/20'
                            : 'text-[#1B1723]/60 hover:bg-[#171158]/5 hover:text-[#1B1723]'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {item.name === 'プランを確認' && plan === 'free' && (
                        <span className="text-[10px] font-bold text-[#E6A24C]">NEW</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <>
      {/* モバイルメニューボタン */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden border-b border-[#171158]/5">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-[#1B1723]/70 lg:hidden"
          onClick={() => setIsMobileOpen(true)}
        >
          <span className="sr-only">サイドバーを開く</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold text-[#1B1723]">
          QR Designer
        </div>
      </div>

      {/* モバイルサイドバー */}
      {isMobileOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#1B1723]/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="sr-only">閉じる</span>
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* デスクトップサイドバー */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  )
}
