import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, mobile, role, is_active, created_at')
    .in('role', ['supervisor', 'installer'])
    .order('role').order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { full_name, email, mobile, role } = await request.json()
  if (!full_name?.trim() || !email?.trim() || !mobile?.trim() || !role) {
    return NextResponse.json({ error: 'full_name, email, mobile and role are required' }, { status: 400 })
  }
  if (!['supervisor', 'installer'].includes(role)) {
    return NextResponse.json({ error: 'Role must be supervisor or installer' }, { status: 400 })
  }

  const supabase  = createAdminClient()
  const tempPw    = 'Duromax@' + Math.floor(100000 + Math.random() * 900000)
  const mobileNum = mobile.replace(/\D/g, '')
  const phoneE164 = mobileNum.length === 10 ? '+91' + mobileNum : undefined

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: tempPw,
    email_confirm: true,
    ...(phoneE164 ? { phone: phoneE164, phone_confirm: true } : {}),
    user_metadata: { full_name: full_name.trim(), mobile: mobile.trim(), role },
  })

  if (authErr) {
    if (authErr.message.includes('already been registered')) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  await supabase.from('profiles').upsert({
    id: authUser.user.id, full_name: full_name.trim(),
    mobile: mobile.trim(), role, is_active: true,
  }, { onConflict: 'id' })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const loginUrl = appUrl + '/supervisor/verify'

  return NextResponse.json({
    success: true, staff_id: authUser.user.id,
    email, temp_password: tempPw, login_url: loginUrl,
    message: `${full_name} onboarded successfully.`,
  }, { status: 201 })
}
