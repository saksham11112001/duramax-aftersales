import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'
import type { Ticket, Profile } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, supervisor_allocations(*, profiles(full_name, mobile, role)), site_visits(*), payments(*), feedback(*)')
    .order('created_at', { ascending: false })

  // Fetch supervisors AND installers for assign modal
  const { data: fieldStaff } = await supabase
    .from('profiles')
    .select('id, full_name, mobile, role, is_active, created_at')
    .in('role', ['supervisor', 'installer'])
    .eq('is_active', true)
    .order('full_name')

  return (
    <AdminDashboard
      initialTickets={(tickets as Ticket[]) ?? []}
      supervisors={(fieldStaff as Profile[]) ?? []}
      userFullName={profile.full_name}
    />
  )
}
