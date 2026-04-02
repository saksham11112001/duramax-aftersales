import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: visits } = await supabase
    .from('supervisor_allocations')
    .select(`
      *,
      tickets (
        id, ticket_number, client_name, client_mobile,
        site_address, complaint_description, status
      )
    `)
    .eq('supervisor_id', user.id)
    .order('visit_date', { ascending: true })

  return NextResponse.json({ visits: visits ?? [] })
}
