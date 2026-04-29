import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function refreshAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.refreshSession()
  if (error) return null
  return data.session?.access_token ?? null
}
