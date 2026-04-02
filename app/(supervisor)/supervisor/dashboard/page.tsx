import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SupervisorDashboard from '@/components/supervisor/SupervisorDashboard'

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/supervisor/verify')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role, mobile').eq('id', user.id).single()
  if (!profile || !['supervisor','installer'].includes(profile.role)) redirect('/supervisor/verify')

  const admin = createAdminClient()

  const { data: allocations } = await admin
    .from('supervisor_allocations')
    .select('*, tickets(id, ticket_number, client_name, client_mobile, site_address, complaint_description, status)')
    .eq('supervisor_id', user.id)
    .order('visit_date', { ascending: true })

  // Initial stats
  const allocs = allocations ?? []
  const closed     = allocs.filter((a: { tickets: { status: string } | null }) => a.tickets?.status === 'closed').length
  const inProgress = allocs.filter((a: { tickets: { status: string } | null }) => a.tickets && a.tickets.status !== 'closed').length

  const ticketIds = allocs.map((a: { ticket_id: string }) => a.ticket_id)
  const { data: feedbacks } = ticketIds.length
    ? await admin.from('feedback').select('overall_rating').in('ticket_id', ticketIds).not('submitted_at','is',null)
    : { data: [] }

  const ratings = (feedbacks ?? []).map((f: { overall_rating: number | null }) => f.overall_rating).filter(Boolean) as number[]
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : null

  const now = Date.now()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const thisMonth = allocs.filter((a: { tickets: { status: string; updated_at: string } | null }) => {
    if (a.tickets?.status !== 'closed') return false
    const t = new Date(a.tickets.updated_at).getTime()
    return t > monthStart && t < now
  }).length

  return (
    <SupervisorDashboard
      supervisorName={profile.full_name}
      supervisorRole={profile.role as 'supervisor'|'installer'}
      initialAllocations={allocs}
      initialStats={{ total_assigned: allocs.length, total_closed: closed, in_progress: inProgress, avg_rating: avgRating ? parseFloat(avgRating) : null, this_month: thisMonth, total_revenue: 0, on_time_pct: 0 }}
    />
  )
}
