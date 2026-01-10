import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const pairs = document.cookie.split(';')
          return pairs.map(pair => {
            const [name, ...rest] = pair.trim().split('=')
            return { name, value: decodeURIComponent(rest.join('=')) }
          }).filter(c => c.name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieStr = `${name}=${encodeURIComponent(value)}`
            if (options?.path) cookieStr += `; path=${options.path}`
            if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
            if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
            document.cookie = cookieStr
          })
        },
      },
    }
  )
}

