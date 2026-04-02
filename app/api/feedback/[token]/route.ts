import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = await params
  const supabase  = createAdminClient()

  const { data: fb } = await supabase
    .from('feedback')
    .select('*, tickets(ticket_number, client_name, site_address)')
    .eq('token', token)
    .single()

  if (!fb) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (fb.token_used) return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 })

  return NextResponse.json({ feedback: fb })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = await params
  const supabase  = createAdminClient()

  const { data: fb } = await supabase
    .from('feedback')
    .select('id, token_used, ticket_id')
    .eq('token', token)
    .single()

  if (!fb)         return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (fb.token_used) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })

  const { overall_rating, supervisor_rating, quality_rating, timeliness_rating, comment } = await request.json()

  await supabase
    .from('feedback')
    .update({
      overall_rating,
      supervisor_rating,
      quality_rating,
      timeliness_rating,
      comment:      comment ?? null,
      token_used:   true,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', fb.id)

  return NextResponse.json({ success: true })
}
