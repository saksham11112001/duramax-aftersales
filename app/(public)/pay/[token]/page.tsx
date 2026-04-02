import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import PaymentClient from './PaymentClient'

interface Props { params: { token: string } }

export default async function PayPage({ params }: Props) {
  const { token } = await params
  const supabase  = createAdminClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, tickets(ticket_number, client_name, client_mobile, site_address, complaint_description)')
    .eq('token', token)
    .single()

  if (!payment) return notFound()

  // Check expiry
  if (new Date(payment.token_expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Payment Link Expired</h1>
          <p className="text-sm text-gray-500">This payment link has expired. Please contact Duromax to get a new link sent to your WhatsApp.</p>
        </div>
      </div>
    )
  }

  // Already paid
  if (payment.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Already Paid</h1>
          <p className="text-sm text-gray-500 mb-4">This invoice has already been paid. Thank you!</p>
          <div className="text-xs text-gray-400">
            {(payment.tickets as any)?.ticket_number} — ₹{(payment.amount_paise / 100).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    )
  }

  const ticket = payment.tickets as any

  return (
    <PaymentClient
      token={token}
      paymentId={payment.id}
      amountPaise={payment.amount_paise}
      paymentType={payment.payment_type}
      ticketNumber={ticket?.ticket_number ?? ''}
      clientName={ticket?.client_name ?? ''}
      clientMobile={ticket?.client_mobile ?? ''}
      siteAddress={ticket?.site_address ?? ''}
      razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ''}
    />
  )
}
