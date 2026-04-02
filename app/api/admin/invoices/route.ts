import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id, payment_type, is_outstation, amount_paise } = await request.json()
    if (!ticket_id || !payment_type) {
      return NextResponse.json({ error: 'ticket_id and payment_type are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status, client_mobile, client_name, is_outstation, ticket_number')
      .eq('id', ticket_id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    if (payment_type === 'visit_fee' && ticket.status !== 'new') {
      return NextResponse.json({ error: 'Visit fee already raised' }, { status: 409 })
    }
    if (payment_type === 'spare_parts' && ticket.status !== 'visited') {
      return NextResponse.json({ error: 'Spare parts invoice only after visit' }, { status: 409 })
    }

    let finalAmount = amount_paise
    if (payment_type === 'visit_fee') {
      const outstation = is_outstation ?? ticket.is_outstation
      finalAmount = outstation ? 450000 : 300000
      if (is_outstation !== undefined) {
        await supabase.from('tickets').update({ is_outstation }).eq('id', ticket_id)
      }
    }

    const { data: payment } = await supabase
      .from('payments')
      .insert({ ticket_id, payment_type, amount_paise: finalAmount })
      .select('id, token, amount_paise')
      .single()

    if (!payment) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })

    const nextStatus = payment_type === 'visit_fee' ? 'invoiced' : 'parts_invoiced'
    await supabase.from('tickets').update({ status: nextStatus }).eq('id', ticket_id)

    const payUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payment.token}`
    const amtStr  = '₹' + (finalAmount / 100).toLocaleString('en-IN')
    const event   = payment_type === 'visit_fee' ? 'invoice_raised_visit' : 'invoice_raised_parts'

    await sendNotification(event as Parameters<typeof sendNotification>[0], {
      ticketId:     ticket.id,
      ticketNumber: ticket.ticket_number,
      clientName:   ticket.client_name,
      clientMobile: ticket.client_mobile,
      amount:       amtStr,
      payUrl,
    })

    return NextResponse.json({ success: true, payment_id: payment.id, token: payment.token,
      amount_paise: payment.amount_paise, pay_url: payUrl, new_status: nextStatus })
  } catch (e) {
    console.error('POST /api/admin/invoices error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
