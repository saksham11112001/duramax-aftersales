import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StaffManagement from '@/components/admin/StaffManagement'
import type { Profile } from '@/lib/types'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: staff } = await admin
    .from('profiles')
    .select('id, full_name, mobile, role, is_active, created_at')
    .in('role', ['supervisor', 'installer'])
    .order('role').order('full_name')

  return <StaffManagement initialStaff={(staff as Profile[]) ?? []} adminName={profile.full_name}/>
}
