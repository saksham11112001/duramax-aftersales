import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import FeedbackClient from './FeedbackClient'

interface Props { params: { token: string } }

export default async function FeedbackPage({ params }: Props) {
  const { token } = await params
  const supabase  = createAdminClient()

  const { data: fb } = await supabase
    .from('feedback')
    .select('*, tickets(ticket_number, client_name, site_address)')
    .eq('token', token)
    .single()

  if (!fb) return notFound()

  const ticket = fb.tickets as any

  if (fb.token_used) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🙏</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-sm text-gray-500">Your feedback has already been submitted.</p>
        </div>
      </div>
    )
  }

  return (
    <FeedbackClient
      token={token}
      ticketNumber={ticket?.ticket_number ?? ''}
      clientName={ticket?.client_name ?? ''}
      siteAddress={ticket?.site_address ?? ''}
    />
  )
}
