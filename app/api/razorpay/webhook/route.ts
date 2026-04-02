import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body).digest('hex')

  if (signature !== expected) {
    console.error('[Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('[Webhook] Event:', event.event)

  if (event.event === 'payment.captured') {
    const rpPayment = event.payload.payment.entity
    const supabase  = createAdminClient()

    // Find our payment by Razorpay order ID
    const { data: payment } = await supabase
      .from('payments')
      .select('*, tickets(id, ticket_number, client_name, client_mobile, status, is_outstation)')
      .eq('razorpay_order_id', rpPayment.order_id)
      .single()

    if (!payment) {
      console.error('[Webhook] Payment not found for order:', rpPayment.order_id)
      return NextResponse.json({ received: true })
    }
    if (payment.status === 'paid') return NextResponse.json({ received: true }) // duplicate

    const ticket = payment.tickets as {
      id: string; ticket_number: string; client_name: string;
      client_mobile: string; status: string; is_outstation: boolean
    }

    // ── STEP 1: Mark payment as paid ─────────────────────────
    await supabase.from('payments').update({
      status:              'paid',
      razorpay_payment_id: rpPayment.id,
      paid_at:             new Date().toISOString(),
    }).eq('id', payment.id)

    // ── STEP 2: Advance ticket to next status ────────────────
    // visit_fee paid → 'paid' (admin can now assign supervisor)
    // spare_parts paid → 'parts_paid' (admin can now close)
    const nextStatus = payment.payment_type === 'visit_fee' ? 'paid' : 'parts_paid'
    await supabase.from('tickets').update({ status: nextStatus }).eq('id', ticket.id)

    // ── STEP 3: Supabase Realtime fires automatically ─────────
    // Because tickets table changed, all subscribers (admin dashboard,
    // customer tracker) receive the update within ~100ms.
    // No extra code needed — Supabase broadcasts the change.

    const amountStr = '₹' + (payment.amount_paise / 100).toLocaleString('en-IN')

    // ── STEP 4: WhatsApp notifications ───────────────────────
    if (payment.payment_type === 'visit_fee') {
      await sendNotification('visit_fee_paid', {
        ticketId:     ticket.id,
        ticketNumber: ticket.ticket_number,
        clientName:   ticket.client_name,
        clientMobile: ticket.client_mobile,
        amount:       amountStr,
      })
    } else {
      await sendNotification('parts_paid', {
        ticketId:     ticket.id,
        ticketNumber: ticket.ticket_number,
        clientName:   ticket.client_name,
        clientMobile: ticket.client_mobile,
        amount:       amountStr,
      })
    }

    console.log('[Webhook] Processed:', ticket.ticket_number, '→', nextStatus)
  }

  return NextResponse.json({ received: true })
}
