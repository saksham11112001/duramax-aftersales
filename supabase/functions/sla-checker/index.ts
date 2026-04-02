import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY   = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM  = Deno.env.get('RESEND_FROM_EMAIL') ?? 'alerts@duromax.in'
const ADMIN_EMAIL  = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'admin@duromax.in'
const APP_URL      = Deno.env.get('APP_URL') ?? ''

async function sendEmail(subject: string, html: string) {
  if (!RESEND_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to: ADMIN_EMAIL, subject, html }),
  })
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Tickets paid for 46+ hours with no supervisor assigned
  const cutoff = new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString()

  const { data: unassigned } = await supabase
    .from('tickets')
    .select('id, ticket_number, client_name, client_mobile, site_address, updated_at')
    .eq('status', 'paid')
    .lt('updated_at', cutoff)

  for (const ticket of unassigned ?? []) {
    const hoursElapsed = Math.round((Date.now() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60))
    await sendEmail(
      `⚠️ SLA Breach: ${ticket.ticket_number}`,
      `<p>Ticket <strong>${ticket.ticket_number}</strong> has been in 'paid' status for <strong>${hoursElapsed} hours</strong> without a supervisor being assigned.</p>
       <p>Customer: ${ticket.client_name} (${ticket.client_mobile})<br>Site: ${ticket.site_address}</p>
       <p><a href="${APP_URL}/dashboard/admin">Assign Supervisor Now →</a></p>`
    )
    await supabase.from('notification_log').insert({
      ticket_id: ticket.id, channel: 'email', recipient: ADMIN_EMAIL,
      template_name: 'sla_breach', status: 'sent',
    })
  }

  // Also check supervisor_allocations where sla_deadline has passed
  const { data: breached } = await supabase
    .from('supervisor_allocations')
    .select('id, ticket_id, sla_deadline, tickets(ticket_number, client_name)')
    .lt('sla_deadline', new Date().toISOString())
    .eq('sla_alerted', false)

  for (const alloc of breached ?? []) {
    const t = alloc.tickets as { ticket_number: string; client_name: string } | null
    await sendEmail(
      `⚠️ Visit SLA Breach: ${t?.ticket_number}`,
      `<p>Supervisor visit SLA has been breached for ticket <strong>${t?.ticket_number}</strong> (${t?.client_name}).</p>
       <p><a href="${APP_URL}/dashboard/admin">Review in Dashboard →</a></p>`
    )
    await supabase.from('supervisor_allocations').update({ sla_alerted: true }).eq('id', alloc.id)
  }

  return new Response(JSON.stringify({ unassigned: unassigned?.length ?? 0, breached: breached?.length ?? 0 }))
})
