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
    if (ticket.status !== 'closed') {
      return NextResponse.json({ error: 'Ticket must be closed before sending feedback form' }, { status: 409 })
    }

    // Get or create feedback record
    let { data: feedbackRow } = await supabase
      .from('feedback')
      .select('token, token_used, submitted_at')
      .eq('ticket_id', ticket_id)
      .single()

    if (!feedbackRow) {
      const { data: newFb } = await supabase
        .from('feedback')
        .insert({ ticket_id })
        .select('token, token_used, submitted_at')
        .single()
      feedbackRow = newFb
    }

    if (!feedbackRow) {
      return NextResponse.json({ error: 'Failed to create feedback record' }, { status: 500 })
    }

    if (feedbackRow.submitted_at) {
      return NextResponse.json({ error: 'Feedback already submitted by customer' }, { status: 409 })
    }

    const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackRow.token}`

    await sendNotification('ticket_closed', {
      ticketId:     ticket_id,
      ticketNumber: ticket.ticket_number,
      clientName:   ticket.client_name,
      clientMobile: ticket.client_mobile,
      feedbackUrl,
    })

    return NextResponse.json({ success: true, feedback_url: feedbackUrl })
  } catch (e) {
    console.error('POST /api/admin/send-feedback error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
