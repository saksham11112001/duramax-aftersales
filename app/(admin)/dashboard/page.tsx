import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile) redirect('/login')

  switch (profile.role) {
    case 'admin':
      redirect('/dashboard/admin')
    default:
      await supabase.auth.signOut()
      redirect('/login')
  }
}
