/**
 * Central notification dispatcher.
 * All WhatsApp and email sends go through here.
 * Import sendNotification() in any API route.
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ── WhatsApp via Meta Cloud API ──────────────────────────────
async function sendWhatsApp(to: string, templateName: string, params: string[]) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token   = process.env.WHATSAPP_TOKEN

  if (!phoneId || !token) {
    console.warn('[WA] Credentials not set — skipping WhatsApp send')
    return false
  }

  // Normalise: strip everything except digits, ensure +91 prefix
  const mobile = to.replace(/\D/g, '')
  const phone  = mobile.startsWith('91') ? mobile : '91' + mobile.slice(-10)

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: params.length ? [{
        type: 'body',
        parameters: params.map(p => ({ type: 'text', text: p })),
      }] : [],
    },
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const err = await res.json()
      console.error('[WA] Send failed:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[WA] Network error:', e)
    return false
  }
}

// ── Email via Resend ─────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const key  = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'alerts@duromax.in'

  if (!key) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send')
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[Email] Send failed:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[Email] Network error:', e)
    return false
  }
}

// ── Log every send attempt ───────────────────────────────────
async function logNotification(
  ticketId: string | null,
  channel: string,
  recipient: string,
  templateName: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  const supabase = createAdminClient()
  await supabase.from('notification_log').insert({
    ticket_id:     ticketId,
    channel,
    recipient,
    template_name: templateName,
    status,
    error_message: errorMessage ?? null,
  })
}

// ── Public API ───────────────────────────────────────────────

export interface NotificationPayload {
  ticketId:      string | null
  ticketNumber?: string
  clientName?:   string
  clientMobile?: string
  adminEmail?:   string
  payUrl?:       string
  amount?:       string          // e.g. "₹3,000"
  supervisorName?: string
  visitDate?:    string
  visitSlot?:    string
  supervisorLoginUrl?: string
  feedbackUrl?:  string
}

export type NotificationEvent =
  | 'ticket_created'
  | 'invoice_raised_visit'
  | 'invoice_raised_parts'
  | 'visit_fee_paid'
  | 'supervisor_assigned'
  | 'visit_reminder'
  | 'visit_report_submitted'
  | 'parts_invoice_raised'
  | 'parts_paid'
  | 'ticket_closed'
  | 'payment_reminder'
  | 'sla_breach'

export async function sendNotification(event: NotificationEvent, payload: NotificationPayload) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@duromax.in'
  const p = payload

  switch (event) {

    case 'ticket_created': {
      // → Customer: confirmation on WhatsApp
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'ticket_created', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'ticket_created', ok ? 'sent' : 'failed')
      }
      // → Admin: email alert
      const html = `<p>New service request received.</p>
        <ul>
          <li><strong>Ticket:</strong> ${p.ticketNumber}</li>
          <li><strong>Customer:</strong> ${p.clientName}</li>
          <li><strong>Mobile:</strong> ${p.clientMobile}</li>
        </ul>
        <p><a href="${appUrl}/dashboard/admin">View in Dashboard →</a></p>`
      const emailOk = await sendEmail(adminEmail, `New ticket: ${p.ticketNumber}`, html)
      await logNotification(p.ticketId, 'email', adminEmail, 'ticket_created_admin', emailOk ? 'sent' : 'failed')
      break
    }

    case 'invoice_raised_visit': {
      if (p.clientMobile && p.payUrl) {
        const ok = await sendWhatsApp(p.clientMobile, 'invoice_raised_visit', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.amount ?? '₹3,000',
          p.payUrl,
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'invoice_raised_visit', ok ? 'sent' : 'failed')
      }
      break
    }

    case 'invoice_raised_parts': {
      if (p.clientMobile && p.payUrl) {
        const ok = await sendWhatsApp(p.clientMobile, 'invoice_raised_parts', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.amount ?? '',
          p.payUrl,
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'invoice_raised_parts', ok ? 'sent' : 'failed')
      }
      break
    }

    case 'visit_fee_paid': {
      // → Customer: receipt
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'visit_fee_paid', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.amount ?? '₹3,000',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'visit_fee_paid', ok ? 'sent' : 'failed')
      }
      // → Admin: payment alert
      const html = `<p>Visit fee received for ticket <strong>${p.ticketNumber}</strong>.</p>
        <p>Customer: ${p.clientName} (${p.clientMobile})</p>
        <p>Amount: ${p.amount}</p>
        <p><a href="${appUrl}/dashboard/admin">Assign Supervisor →</a></p>`
      const emailOk = await sendEmail(adminEmail, `Payment received: ${p.ticketNumber}`, html)
      await logNotification(p.ticketId, 'email', adminEmail, 'visit_fee_paid_admin', emailOk ? 'sent' : 'failed')
      break
    }

    case 'supervisor_assigned': {
      // → Customer: visit confirmed
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'supervisor_assigned', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.supervisorName ?? 'our technician',
          p.visitDate ?? '',
          p.visitSlot ?? '',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'supervisor_assigned', ok ? 'sent' : 'failed')
      }
      // → Supervisor: login magic link
      // NOTE: In practice the supervisor gets an OTP-gated link
      // The supervisorLoginUrl is /supervisor/verify pre-filled with ticket context
      break
    }

    case 'visit_reminder': {
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'visit_reminder', [
          p.clientName ?? 'Customer',
          p.visitDate ?? '',
          p.visitSlot ?? '',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'visit_reminder', ok ? 'sent' : 'failed')
      }
      break
    }

    case 'visit_report_submitted': {
      const html = `<p>Supervisor has submitted the site visit report for <strong>${p.ticketNumber}</strong>.</p>
        <p>Customer: ${p.clientName}</p>
        <p>Please review and raise the spare parts invoice.</p>
        <p><a href="${appUrl}/dashboard/admin">Open Dashboard →</a></p>`
      const emailOk = await sendEmail(adminEmail, `Visit complete: ${p.ticketNumber}`, html)
      await logNotification(p.ticketId, 'email', adminEmail, 'visit_report_submitted', emailOk ? 'sent' : 'failed')
      break
    }

    case 'parts_paid': {
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'parts_paid', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.amount ?? '',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'parts_paid', ok ? 'sent' : 'failed')
      }
      const html = `<p>Parts payment received for <strong>${p.ticketNumber}</strong>.</p>
        <p>Amount: ${p.amount}. Please mark the ticket as closed.</p>
        <p><a href="${appUrl}/dashboard/admin">Close Ticket →</a></p>`
      const emailOk = await sendEmail(adminEmail, `Parts paid: ${p.ticketNumber}`, html)
      await logNotification(p.ticketId, 'email', adminEmail, 'parts_paid_admin', emailOk ? 'sent' : 'failed')
      break
    }

    case 'ticket_closed': {
      if (p.clientMobile) {
        const ok = await sendWhatsApp(p.clientMobile, 'ticket_closed', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.feedbackUrl ?? '',
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'ticket_closed', ok ? 'sent' : 'failed')
      }
      break
    }

    case 'payment_reminder': {
      if (p.clientMobile && p.payUrl) {
        const ok = await sendWhatsApp(p.clientMobile, 'payment_reminder', [
          p.clientName ?? 'Customer',
          p.ticketNumber ?? '',
          p.amount ?? '',
          p.payUrl,
        ])
        await logNotification(p.ticketId, 'whatsapp', p.clientMobile, 'payment_reminder', ok ? 'sent' : 'failed')
      }
      break
    }

    case 'sla_breach': {
      const html = `<p>⚠️ <strong>SLA BREACH</strong></p>
        <p>Ticket <strong>${p.ticketNumber}</strong> (${p.clientName}) has been in 'paid' status for more than 48 hours without a supervisor being assigned.</p>
        <p><a href="${appUrl}/dashboard/admin">Assign Now →</a></p>`
      const emailOk = await sendEmail(adminEmail, `⚠️ SLA Breach: ${p.ticketNumber}`, html)
      await logNotification(p.ticketId, 'email', adminEmail, 'sla_breach', emailOk ? 'sent' : 'failed')
      break
    }
  }
}
