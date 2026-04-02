import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'
import type { Ticket, Profile } from '@/lib/types'

// Accounts role gets the same dashboard — TicketDetail actions are
// safe because the API routes check role on every request.
export default async function AccountsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'accounts') redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, supervisor_allocations(*, profiles(full_name, mobile)), site_visits(*), payments(*), feedback(*)')
    .order('created_at', { ascending: false })

  const { data: supervisors } = await supabase
    .from('profiles')
    .select('id, full_name, mobile, role, is_active')
    .eq('role', 'supervisor')
    .eq('is_active', true)

  return (
    <AdminDashboard
      initialTickets={(tickets as Ticket[]) ?? []}
      supervisors={(supervisors as Profile[]) ?? []}
      userFullName={profile.full_name}
    />
  )
}
