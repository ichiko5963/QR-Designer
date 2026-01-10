import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profile_cards')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!profile) {
    notFound()
  }

  const links = (profile.links || []) as Array<{
    id: string
    platform: string
    url: string
    icon: string
  }>

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: `linear-gradient(135deg, ${profile.theme_color}15, ${profile.theme_color}05)`
    }}>
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl p-8 text-white shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${profile.theme_color}, ${profile.theme_color}dd)` }}
        >
          {/* プロフィール */}
          <div className="text-center mb-6">
            <div
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4"
            >
              {profile.display_name.charAt(0)}
            </div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            {profile.username && (
              <p className="text-white/70">@{profile.username}</p>
            )}
          </div>

          {/* 自己紹介 */}
          {profile.bio && (
            <p className="text-white/80 text-center mb-6">{profile.bio}</p>
          )}

          {/* リンク */}
          <div className="space-y-3">
            {links.filter(l => l.url).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 bg-white/10 backdrop-blur hover:bg-white/20 rounded-xl transition-colors"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="font-medium">{link.platform}</span>
                <svg className="w-5 h-5 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[#1B1723]/40 hover:text-[#1B1723]/60 transition-colors"
          >
            Powered by QR Designer
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profile_cards')
    .select('display_name, bio')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!profile) {
    return { title: 'Not Found' }
  }

  return {
    title: `${profile.display_name} | QR Designer`,
    description: profile.bio || `${profile.display_name}のプロフィールページ`,
  }
}
