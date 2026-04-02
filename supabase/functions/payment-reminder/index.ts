import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_URL = Deno.env.get('APP_URL') ?? ''
const WA_TOKEN  = Deno.env.get('WHATSAPP_TOKEN') ?? ''
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''

async function sendWA(to: string, template: string, params: string[]) {
  if (!WA_TOKEN || !WA_PHONE_ID) return
  const phone = '91' + to.replace(/\D/g, '').slice(-10)
  await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: { name: template, language: { code: 'en' },
        components: params.length ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: p })) }] : [] },
    }),
  })
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find tickets where invoice was raised 24+ hours ago and not yet paid
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, client_name, client_mobile, status, payments(*)')
    .in('status', ['invoiced', 'parts_invoiced'])
    .lt('updated_at', cutoff)

  let sent = 0
  for (const ticket of tickets ?? []) {
    const payment = ticket.payments?.find((p: { status: string; payment_type: string }) =>
      p.status === 'pending' &&
      (ticket.status === 'invoiced' ? p.payment_type === 'visit_fee' : p.payment_type === 'spare_parts')
    ) as { token: string; amount_paise: number } | undefined

    if (!payment) continue

    const payUrl = `${APP_URL}/pay/${payment.token}`
    const amount = '₹' + (payment.amount_paise / 100).toLocaleString('en-IN')

    await sendWA(ticket.client_mobile, 'payment_reminder', [
      ticket.client_name, ticket.ticket_number, amount, payUrl
    ])

    await supabase.from('notification_log').insert({
      ticket_id: ticket.id,
      channel: 'whatsapp',
      recipient: ticket.client_mobile,
      template_name: 'payment_reminder',
      status: 'sent',
    })

    sent++
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
