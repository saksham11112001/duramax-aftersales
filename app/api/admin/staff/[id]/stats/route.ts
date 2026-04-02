import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const supabase = createAdminClient()

  // All allocations for this staff member
  const { data: allocs } = await supabase
    .from('supervisor_allocations')
    .select('ticket_id, allocated_at, sla_deadline, tickets(status, updated_at, payments(amount_paise, status, payment_type))')
    .eq('supervisor_id', id)

  // Feedback for their tickets
  const { data: feedbacks } = await supabase
    .from('feedback')
    .select('overall_rating, supervisor_rating, submitted_at')
    .in('ticket_id', (allocs ?? []).map((a: { ticket_id: string }) => a.ticket_id))
    .not('submitted_at', 'is', null)

  const now      = Date.now()
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

  let closed = 0, inProgress = 0, onTime = 0, revenue = 0, thisMonth = 0
  for (const a of allocs ?? []) {
    const t = a.tickets as { status: string; updated_at: string; payments: { amount_paise: number; status: string; payment_type: string }[] } | null
    if (!t) continue
    if (t.status === 'closed') {
      closed++
      if (new Date(t.updated_at).getTime() < thisMonthStart + 30*24*3600*1000 && new Date(t.updated_at).getTime() > thisMonthStart) thisMonth++
      if (new Date(t.updated_at).getTime() < new Date(a.sla_deadline).getTime()) onTime++
      const paid = t.payments?.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount_paise, 0) ?? 0
      revenue += paid
    } else {
      inProgress++
    }
  }

  const ratings = (feedbacks ?? []).map(f => f.overall_rating).filter(Boolean) as number[]
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  return NextResponse.json({
    stats: {
      total_assigned: (allocs ?? []).length,
      total_closed:   closed,
      in_progress:    inProgress,
      avg_rating:     avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      total_revenue:  revenue,
      this_month:     thisMonth,
      on_time_pct:    closed > 0 ? Math.round((onTime / closed) * 100) : 0,
    }
  })
}
