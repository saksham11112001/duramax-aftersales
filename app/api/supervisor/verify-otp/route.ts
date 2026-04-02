import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { mobile, otp } = await request.json()
  if (!mobile || !otp) return NextResponse.json({ error: 'mobile and otp required' }, { status: 400 })

  const phone    = '+91' + mobile.replace(/\D/g, '').slice(-10)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type:  'sms',
  })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 401 })
  }

  // Ensure this phone number belongs to a supervisor in our profiles table
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, full_name, is_active')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    // Auto-create profile for phone-auth users if missing
    await admin.from('profiles').insert({
      id:        data.user.id,
      full_name: 'Supervisor',
      mobile:    mobile,
      role:      'supervisor',
    })
  } else if (profile.role !== 'supervisor') {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'This number is not registered as a supervisor.' }, { status: 403 })
  } else if (!profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'This supervisor account is inactive.' }, { status: 403 })
  }

  return NextResponse.json({ success: true, name: profile?.full_name ?? 'Supervisor' })
}
