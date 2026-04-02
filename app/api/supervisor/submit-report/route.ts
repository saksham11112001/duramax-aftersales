import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    ticket_id, visit_date, client_complaint, observed_issue,
    urgency_level, est_repair_time, warranty_status,
    supervisor_signed, client_signed, remarks, spare_parts,
  } = await request.json()

  if (!ticket_id || !client_complaint || !observed_issue) {
    return NextResponse.json({ error: 'ticket_id, client_complaint, observed_issue required' }, { status: 400 })
  }
  if (!supervisor_signed || !client_signed) {
    return NextResponse.json({ error: 'Both supervisor and client must sign off before submitting' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify this ticket is assigned to this supervisor
  const { data: allocation } = await admin
    .from('supervisor_allocations')
    .select('id')
    .eq('ticket_id', ticket_id)
    .eq('supervisor_id', user.id)
    .single()

  if (!allocation) {
    return NextResponse.json({ error: 'This ticket is not assigned to you' }, { status: 403 })
  }

  // Create site visit record
  const { data: visit, error: visitErr } = await admin
    .from('site_visits')
    .insert({
      ticket_id,
      supervisor_id:    user.id,
      visit_date:       visit_date || new Date().toISOString().split('T')[0],
      client_complaint,
      observed_issue,
      urgency_level:    urgency_level || 'medium',
      est_repair_time:  est_repair_time || null,
      warranty_status:  warranty_status || null,
      supervisor_signed: true,
      client_signed:     true,
      remarks:           remarks || null,
    })
    .select('id')
    .single()

  if (visitErr || !visit) {
    console.error('Site visit insert error:', visitErr)
    return NextResponse.json({ error: 'Failed to save site visit' }, { status: 500 })
  }

  // Insert spare parts
  if (Array.isArray(spare_parts) && spare_parts.length > 0) {
    const parts = spare_parts
      .filter((p: { article_name?: string }) => p.article_name?.trim())
      .map((p: { article_name: string; article_number?: string; quantity?: number; unit_price?: number; remarks?: string }, i: number) => ({
        site_visit_id:    visit.id,
        s_no:             i + 1,
        article_name:     p.article_name.trim(),
        article_number:   p.article_number?.trim() || null,
        quantity:         p.quantity || 1,
        unit_price_paise: p.unit_price ? Math.round(p.unit_price * 100) : null,
        remarks:          p.remarks?.trim() || null,
      }))

    if (parts.length > 0) {
      await admin.from('spare_parts').insert(parts)
    }
  }

  // Advance ticket to 'visited'
  const { data: ticket } = await admin
    .from('tickets')
    .update({ status: 'visited' })
    .eq('id', ticket_id)
    .select('ticket_number, client_name, client_mobile')
    .single()

  // Notify admin
  if (ticket) {
    await sendNotification('visit_report_submitted', {
      ticketId:     ticket_id,
      ticketNumber: ticket.ticket_number,
      clientName:   ticket.client_name,
      clientMobile: ticket.client_mobile,
    })
  }

  return NextResponse.json({ success: true, visit_id: visit.id })
}
