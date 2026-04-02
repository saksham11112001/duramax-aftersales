import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: allocs } = await admin
    .from('supervisor_allocations')
    .select('ticket_id, allocated_at, sla_deadline, tickets(status, updated_at, payments(amount_paise, status))')
    .eq('supervisor_id', user.id)

  const { data: feedbacks } = await admin
    .from('feedback')
    .select('overall_rating, supervisor_rating, timeliness_rating, quality_rating, comment, submitted_at, tickets(ticket_number, client_name)')
    .in('ticket_id', (allocs ?? []).map((a: { ticket_id: string }) => a.ticket_id))
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(5)

  const now = Date.now()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

  let closed = 0, inProgress = 0, onTime = 0, thisMonth = 0
  for (const a of allocs ?? []) {
    const t = a.tickets as { status: string; updated_at: string } | null
    if (!t) continue
    if (t.status === 'closed') {
      closed++
      const closedAt = new Date(t.updated_at).getTime()
      if (closedAt > monthStart) thisMonth++
      if (closedAt < new Date(a.sla_deadline).getTime()) onTime++
    } else inProgress++
  }

  const ratings = (feedbacks ?? []).map(f => f.overall_rating).filter(Boolean) as number[]
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null

  return NextResponse.json({
    stats: {
      total_assigned: (allocs ?? []).length,
      total_closed:   closed,
      in_progress:    inProgress,
      avg_rating:     avgRating ? parseFloat(avgRating) : null,
      this_month:     thisMonth,
      on_time_pct:    closed > 0 ? Math.round((onTime / closed) * 100) : 0,
    },
    recent_feedback: feedbacks ?? [],
  })
}
