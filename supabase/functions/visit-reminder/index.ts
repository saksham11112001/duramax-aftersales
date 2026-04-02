import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WA_TOKEN    = Deno.env.get('WHATSAPP_TOKEN') ?? ''
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''

async function sendWA(to: string, template: string, params: string[]) {
  if (!WA_TOKEN || !WA_PHONE_ID) return
  const phone = '91' + to.replace(/\D/g, '').slice(-10)
  await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: phone, type: 'template',
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

  // Find visits scheduled for tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: visits } = await supabase
    .from('supervisor_allocations')
    .select('*, tickets(ticket_number, client_name, client_mobile, status), profiles(full_name, mobile)')
    .eq('visit_date', tomorrowStr)

  let sent = 0
  for (const visit of visits ?? []) {
    const ticket = visit.tickets as { status: string; client_name: string; client_mobile: string; ticket_number: string } | null
    if (!ticket || ticket.status !== 'scheduled') continue

    const dateStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

    // Remind customer
    await sendWA(ticket.client_mobile, 'visit_reminder', [
      ticket.client_name, dateStr, visit.time_slot
    ])

    await supabase.from('notification_log').insert({
      ticket_id: visit.ticket_id, channel: 'whatsapp',
      recipient: ticket.client_mobile, template_name: 'visit_reminder', status: 'sent',
    })
    sent++
  }

  return new Response(JSON.stringify({ reminders_sent: sent }))
})
