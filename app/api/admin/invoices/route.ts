import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'
import { generateInvoicePDF, COMPANY } from '@/lib/invoice-generator'

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id, payment_type, is_outstation, amount_paise } = await request.json()
    if (!ticket_id || !payment_type) {
      return NextResponse.json({ error: 'ticket_id and payment_type required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status, client_mobile, client_name, site_address, is_outstation, ticket_number, complaint_description, brand_installed')
      .eq('id', ticket_id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (payment_type === 'visit_fee' && ticket.status !== 'new') {
      return NextResponse.json({ error: 'Visit fee already raised' }, { status: 409 })
    }
    if (payment_type === 'spare_parts' && ticket.status !== 'visited') {
      return NextResponse.json({ error: 'Spare parts invoice only after visit' }, { status: 409 })
    }

    // ── Calculate amount ────────────────────────────────
    let finalAmount = amount_paise
    const outstation = is_outstation ?? ticket.is_outstation

    if (payment_type === 'visit_fee') {
      // Base: ₹2,542 + 18% GST = ₹3,000 (rounded)
      // Outstation: ₹2,542 + ₹1,500 boarding + 18% GST on 2,542 = ₹4,500 (rounded)
      finalAmount = outstation ? 450000 : 300000
      if (is_outstation !== undefined) {
        await supabase.from('tickets').update({ is_outstation }).eq('id', ticket_id)
      }
    }

    // ── Generate invoice number ─────────────────────────
    const year = new Date().getFullYear()
    const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true })
    const invoiceNum = `INV-${year}-${String((count ?? 0) + 1001).padStart(4, '0')}`
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })

    // ── Build line items ────────────────────────────────
    let items: { description: string; hsn: string; qty: number; unit: string; rate: number }[] = []
    const taxableBase = payment_type === 'visit_fee'
      ? (outstation ? 254200 : 254200)  // ₹2,542 (taxable)
      : Math.round((finalAmount / 1.18) / 100) * 100  // back-calculate taxable from total

    if (payment_type === 'visit_fee') {
      items = [
        { description: 'Site Visit & Diagnosis Charges', hsn: COMPANY.sac, qty: 1, unit: 'Service', rate: 2542 },
      ]
      if (outstation) {
        items.push({ description: 'Boarding & Lodging (Outstation)', hsn: '998552', qty: 1, unit: 'Service', rate: 1500 })
      }
    } else {
      // For spare parts invoice, fetch from site_visits
      const { data: visit } = await supabase
        .from('site_visits')
        .select('observed_issue')
        .eq('ticket_id', ticket_id)
        .single()

      const { data: spareParts } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('site_visit_id', (await supabase.from('site_visits').select('id').eq('ticket_id', ticket_id).single()).data?.id ?? '')
        .order('s_no')

      if (spareParts && spareParts.length > 0) {
        items = spareParts.map(p => ({
          description: p.article_name + (p.article_number ? ` (${p.article_number})` : ''),
          hsn: '73269099',  // UPVC/metal parts
          qty: p.quantity,
          unit: 'Nos',
          rate: p.unit_price_paise ? p.unit_price_paise / 100 : 0,
        })).filter(item => item.rate > 0)
        // Add labour
        const labourPaise = finalAmount - spareParts.reduce((s, p) => s + (p.unit_price_paise ?? 0) * p.quantity, 0)
        if (labourPaise > 0) {
          items.push({ description: 'Labour Charges — ' + (visit?.observed_issue ?? 'UPVC Repair'), hsn: COMPANY.sac, qty: 1, unit: 'Service', rate: Math.round(labourPaise / 1.18 / 100) })
        }
      } else {
        // Fallback if no spare parts recorded
        items = [{ description: `Repair Service — ${ticket.complaint_description.substring(0, 50)}`, hsn: COMPANY.sac, qty: 1, unit: 'Service', rate: taxableBase / 100 }]
      }
    }

    // ── Generate PDF ────────────────────────────────────
    const pdfBytes = await generateInvoicePDF({
      invoiceNumber: invoiceNum,
      invoiceDate,
      ticketNumber:  ticket.ticket_number,
      clientName:    ticket.client_name,
      clientAddress: ticket.site_address,
      clientMobile:  ticket.client_mobile,
      items,
      isOutstation:  outstation,
      paymentStatus: 'unpaid',
    })

    // ── Upload PDF to Supabase Storage ─────────────────
    const pdfPath = `invoices/${ticket.ticket_number}-${payment_type}-${invoiceNum}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('invoices')
      .upload(pdfPath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true })

    let pdfUrl: string | null = null
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(pdfPath)
      pdfUrl = publicUrl
    }

    // ── Create payment record ────────────────────────────
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        ticket_id,
        payment_type,
        amount_paise: finalAmount,
        invoice_number: invoiceNum,
        invoice_pdf_url: pdfUrl,
      })
      .select('id, token, amount_paise, invoice_number, invoice_pdf_url')
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

    return NextResponse.json({
      success:         true,
      payment_id:      payment.id,
      token:           payment.token,
      amount_paise:    payment.amount_paise,
      pay_url:         payUrl,
      invoice_number:  payment.invoice_number,
      invoice_pdf_url: payment.invoice_pdf_url,
      new_status:      nextStatus,
    })
  } catch (e) {
    console.error('POST /api/admin/invoices error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
