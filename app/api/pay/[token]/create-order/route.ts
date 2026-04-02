import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRazorpay } from '@/lib/razorpay'

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = await params
  const supabase  = createAdminClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('id, amount_paise, status, token_expires_at, ticket_id')
    .eq('token', token)
    .single()

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  if (new Date(payment.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Payment link expired' }, { status: 410 })
  }

  try {
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount:   payment.amount_paise,
      currency: 'INR',
      notes:    { payment_id: payment.id, token },
    })

    // Store the order_id so the webhook can match it
    await supabase
      .from('payments')
      .update({ razorpay_order_id: order.id })
      .eq('id', payment.id)

    return NextResponse.json({ order_id: order.id, amount: payment.amount_paise })
  } catch (e: unknown) {
    console.error('Razorpay order error:', e)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
