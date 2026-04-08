import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sla_settings')
    .select('*')
    .order('stage_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { settings } = await request.json()
  // settings = [{ stage_key, hours }, ...]

  if (!Array.isArray(settings)) {
    return NextResponse.json({ error: 'settings must be an array' }, { status: 400 })
  }

  const supabase = createAdminClient()

  for (const s of settings) {
    await supabase
      .from('sla_settings')
      .update({ hours: Math.max(1, parseInt(s.hours) || 48), updated_at: new Date().toISOString() })
      .eq('stage_key', s.stage_key)
  }

  return NextResponse.json({ success: true })
}
