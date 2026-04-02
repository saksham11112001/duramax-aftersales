import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/tickets/track?ticket=DM-2026-0001&mobile=9876543210
// Verifies mobile matches the ticket then returns full ticket details.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticket_number    = searchParams.get('ticket')?.trim().toUpperCase()
  const mobile           = searchParams.get('mobile')?.trim()

  if (!ticket_number || !mobile) {
    return NextResponse.json({ error: 'ticket and mobile are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      supervisor_allocations (
        id, visit_date, time_slot, allocated_at, sla_deadline,
        profiles ( full_name, mobile )
      ),
      site_visits ( id, visit_date, client_complaint, observed_issue, supervisor_signed, client_signed, submitted_at ),
      payments ( id, payment_type, amount_paise, status, paid_at, token_expires_at ),
      feedback ( overall_rating, supervisor_rating, quality_rating, timeliness_rating, comment, submitted_at )
    `)
    .eq('ticket_number', ticket_number)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Verify mobile — normalise to last 10 digits for comparison
  const norm = (s: string) => s.replace(/\D/g, '').slice(-10)
  if (norm(mobile) !== norm(ticket.client_mobile)) {
    return NextResponse.json({ error: 'Mobile number does not match this ticket' }, { status: 403 })
  }

  return NextResponse.json({ ticket })
}
