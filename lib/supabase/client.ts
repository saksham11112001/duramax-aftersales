import { createBrowserClient } from '@supabase/ssr'

/**
 * Use this inside React components and client-side code.
 * Reads auth session from browser cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
