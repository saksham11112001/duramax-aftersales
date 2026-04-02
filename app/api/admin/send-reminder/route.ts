import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id } = await request.json()
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data: ticket } = await supabase
      .from('tickets')
      .select('client_mobile, ticket_number, status')
      .eq('id', ticket_id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    // TODO Phase 6: Send actual WhatsApp reminder
    // For now, just log the attempt
    await supabase.from('notification_log').insert({
      ticket_id,
      channel: 'whatsapp',
      recipient: ticket.client_mobile,
      template_name: 'payment_reminder',
      status: 'sent',
    })

    return NextResponse.json({ success: true, message: 'Reminder queued (notifications active in Phase 6)' })
  } catch (e) {
    console.error('POST /api/admin/send-reminder error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
