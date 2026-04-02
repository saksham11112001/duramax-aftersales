import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id } = await request.json()
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: ticket } = await supabase
      .from('tickets')
      .select('status, client_mobile, client_name, ticket_number')
      .eq('id', ticket_id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (ticket.status !== 'parts_paid') {
      return NextResponse.json({ error: 'Ticket must be in parts_paid to close' }, { status: 409 })
    }

    const { data: feedbackRow } = await supabase
      .from('feedback')
      .insert({ ticket_id })
      .select('token')
      .single()

    await supabase.from('tickets').update({ status: 'closed' }).eq('id', ticket_id)

    const feedbackUrl = feedbackRow
      ? `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackRow.token}`
      : undefined

    await sendNotification('ticket_closed', {
      ticketId:     ticket_id,
      ticketNumber: ticket.ticket_number,
      clientName:   ticket.client_name,
      clientMobile: ticket.client_mobile,
      feedbackUrl,
    })

    return NextResponse.json({ success: true, feedback_url: feedbackUrl })
  } catch (e) {
    console.error('POST /api/admin/close-ticket error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
