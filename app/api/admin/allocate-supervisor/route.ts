import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id, supervisor_id, visit_date, time_slot, notes } = await request.json()
    if (!ticket_id || !supervisor_id || !visit_date || !time_slot) {
      return NextResponse.json({ error: 'ticket_id, supervisor_id, visit_date, time_slot required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: ticket } = await supabase
      .from('tickets')
      .select('status, client_mobile, client_name, ticket_number')
      .eq('id', ticket_id)
      .single()
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (!['paid', 'scheduled', 'parts_paid'].includes(ticket.status)) {
      return NextResponse.json({ error: 'Ticket must be in paid, scheduled, or parts_paid status' }, { status: 409 })
    }

    const { data: supervisor } = await supabase
      .from('profiles').select('full_name, mobile').eq('id', supervisor_id).single()
    if (!supervisor) return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 })

    const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    await supabase.from('supervisor_allocations').upsert({
      ticket_id, supervisor_id, allocated_by: auth.userId,
      visit_date, time_slot, notes: notes || null, sla_deadline: slaDeadline, sla_alerted: false,
    }, { onConflict: 'ticket_id' })

    // Only advance to 'scheduled' if currently in 'paid'; preserve 'parts_paid' status
    if (ticket.status === 'paid') {
      await supabase.from('tickets').update({ status: 'scheduled' }).eq('id', ticket_id)
    }

    const visitDateFormatted = new Date(visit_date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })

    await sendNotification('supervisor_assigned', {
      ticketId:       ticket_id,
      ticketNumber:   ticket.ticket_number,
      clientName:     ticket.client_name,
      clientMobile:   ticket.client_mobile,
      supervisorName: supervisor.full_name,
      visitDate:      visitDateFormatted,
      visitSlot:      time_slot,
    })

    return NextResponse.json({ success: true, supervisor_name: supervisor.full_name, visit_date, time_slot })
  } catch (e) {
    console.error('POST /api/admin/allocate-supervisor error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
