import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin manually marks a visit complete (used before supervisor dashboard is live)
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ticket_id } = await request.json()
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: ticket } = await supabase
      .from('tickets').select('status').eq('id', ticket_id).single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (ticket.status !== 'scheduled') {
      return NextResponse.json({ error: 'Ticket must be scheduled' }, { status: 409 })
    }

    await supabase.from('tickets').update({ status: 'visited' }).eq('id', ticket_id)

    // TODO Phase 6: Notify admin to raise parts invoice

    return NextResponse.json({ success: true, new_status: 'visited' })
  } catch (e) {
    console.error('POST /api/admin/mark-visited error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
