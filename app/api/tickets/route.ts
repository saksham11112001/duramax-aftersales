import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_name, client_mobile, site_address, complaint_description,
            brand_installed, duromax_installation, preferred_slot, is_outstation } = body

    if (!client_name || !client_mobile || !site_address || !complaint_description) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        client_name:           client_name.trim(),
        client_mobile:         client_mobile.trim(),
        site_address:          site_address.trim(),
        complaint_description: complaint_description.trim(),
        brand_installed:       brand_installed || null,
        duromax_installation:  duromax_installation ?? null,
        preferred_slot:        preferred_slot || 'morning',
        is_outstation:         is_outstation ?? false,
        status:                'new',
      })
      .select('ticket_number, id, client_name, client_mobile')
      .single()

    if (error || !data) {
      console.error('Ticket insert error:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    await sendNotification('ticket_created', {
      ticketId:     data.id,
      ticketNumber: data.ticket_number,
      clientName:   data.client_name,
      clientMobile: data.client_mobile,
    })

    // Return both ticket_number (for display) and id (for photo upload)
    return NextResponse.json({ ticket_number: data.ticket_number, ticket_id: data.id }, { status: 201 })
  } catch (e) {
    console.error('POST /api/tickets error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
