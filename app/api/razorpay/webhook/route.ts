import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex')
  if (signature !== expected) {
    console.error('[Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  if (event.event === 'payment.captured') {
    const rpPayment = event.payload.payment.entity
    const supabase  = createAdminClient()

    const { data: payment } = await supabase
      .from('payments')
      .select('*, tickets(id, ticket_number, client_name, client_mobile, status)')
      .eq('razorpay_order_id', rpPayment.order_id)
      .single()

    if (!payment || payment.status === 'paid') return NextResponse.json({ received: true })

    const ticket = payment.tickets as { id:string; ticket_number:string; client_name:string; client_mobile:string; status:string }

    // Update payment
    await supabase.from('payments').update({
      status:              'paid',
      razorpay_payment_id: rpPayment.id,
      paid_at:             new Date().toISOString(),
    }).eq('id', payment.id)

    // Advance ticket
    const nextStatus = payment.payment_type === 'visit_fee' ? 'paid' : 'parts_paid'
    await supabase.from('tickets').update({ status: nextStatus }).eq('id', ticket.id)

    // Regenerate PDF with PAID stamp (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invoices/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: payment.id }),
    }).catch(e => console.error('PDF paid stamp error:', e))

    const amtStr = '₹' + (payment.amount_paise / 100).toLocaleString('en-IN')
    if (payment.payment_type === 'visit_fee') {
      await sendNotification('visit_fee_paid', { ticketId:ticket.id, ticketNumber:ticket.ticket_number, clientName:ticket.client_name, clientMobile:ticket.client_mobile, amount:amtStr })
    } else {
      await sendNotification('parts_paid', { ticketId:ticket.id, ticketNumber:ticket.ticket_number, clientName:ticket.client_name, clientMobile:ticket.client_mobile, amount:amtStr })
    }
  }
  return NextResponse.json({ received: true })
}
