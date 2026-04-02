import { createClient } from '@/lib/supabase/server'

export async function requireAdminAuth() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized', status: 401 as const }

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profileError || !profile) return { error: 'Profile not found', status: 403 as const }
  if (profile.role !== 'admin') return { error: 'Admin access required', status: 403 as const }

  return { userId: user.id, role: 'admin' as const }
}
