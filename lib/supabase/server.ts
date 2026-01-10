import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string) {
          try {
            cookieStore.set(name, value)
          } catch {
            // Ignore as Server Components cannot mutate cookies
          }
        },
        async remove(name: string) {
          try {
            cookieStore.delete(name)
          } catch {
            // Ignore as Server Components cannot mutate cookies
          }
        }
      },
    }
  )
}
