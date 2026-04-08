import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInvoicePDF } from '@/lib/invoice-generator'

// Called internally after Razorpay webhook confirms payment
// Regenerates the PDF with a PAID stamp and updates storage
export async function POST(request: NextRequest) {
  try {
    const { payment_id } = await request.json()
    const supabase = createAdminClient()

    const { data: payment } = await supabase
      .from('payments')
      .select('*, tickets(ticket_number, client_name, site_address, client_mobile, complaint_description)')
      .eq('id', payment_id)
      .single()

    if (!payment || payment.status !== 'paid') {
      return NextResponse.json({ error: 'Payment not found or not paid' }, { status: 404 })
    }

    const ticket = payment.tickets as {
      ticket_number: string; client_name: string; site_address: string;
      client_mobile: string; complaint_description: string
    }

    const pdfBytes = await generateInvoicePDF({
      invoiceNumber:  payment.invoice_number ?? 'INV-XXXX',
      invoiceDate:    new Date(payment.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      ticketNumber:   ticket.ticket_number,
      clientName:     ticket.client_name,
      clientAddress:  ticket.site_address,
      clientMobile:   ticket.client_mobile,
      items: [{ description: payment.payment_type === 'visit_fee' ? 'Site Visit & Diagnosis Charges' : `Repair Service — ${ticket.complaint_description.substring(0,50)}`, hsn: '998714', qty: 1, unit: 'Service', rate: Math.round(payment.amount_paise / 1.18 / 100) }],
      isOutstation: false,
      paymentStatus: 'paid',
      paymentDate:   payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN') : undefined,
      paymentMode:   'Razorpay',
      transactionId: payment.razorpay_payment_id ?? undefined,
    })

    const pdfPath = `invoices/${ticket.ticket_number}-${payment.payment_type}-paid.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('invoices')
      .upload(pdfPath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true })

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(pdfPath)
      await supabase.from('payments').update({ invoice_pdf_url: publicUrl }).eq('id', payment_id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('mark-paid PDF error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
